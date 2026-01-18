import jwt from "jsonwebtoken";
import pool from "@/integrations/sql/connectDb";

const JWT_SECRET =
  process.env.NEXT_PUBLIC_JWT_SECRET || "your-secret-key-change-this";

export default async function handler(req, res) {
  /* =======================
     GET OR CREATE PROFILE
  ======================= */
  if (req.method === "GET") {
    try {
      const token = req.cookies?.token;

      if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      console.log("Decoded token:", decoded);

      const userId = decoded.userId;

      /* First, check if user exists in users table */
      const [users] = await pool.execute(
        `SELECT * FROM users WHERE id = ?`,
        [userId]
      );

      if (!users.length) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = users[0];

      /* Check if profile exists */
      let [profiles] = await pool.execute(
        `SELECT p.*, u.email
         FROM profiles p
         JOIN users u ON p.id = u.id
         WHERE p.id = ?`,
        [userId]
      );

      let profile = profiles[0];

      /* If no profile exists, create one */
      if (!profiles.length) {
        console.log("Creating new profile for user:", userId);
        
        // Create default username from email if not available
        const defaultUsername = user.email.split('@')[0] || 'user';
        
        await pool.execute(
          `INSERT INTO profiles (
            id, 
            username, 
            display_name, 
            avatar_url, 
            total_xp, 
            current_streak, 
            longest_streak, 
            last_activity_date,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            userId,
            defaultUsername,
            null, // display_name - let user fill this
            null, // avatar_url - let user fill this
            0,    // total_xp
            0,    // current_streak
            0,    // longest_streak
            new Date().toISOString().split('T')[0] // last_activity_date
          ]
        );

        // Create user role (default: 'user')
        try {
          await pool.execute(
            `INSERT INTO user_roles (user_id, role, created_at)
             VALUES (?, 'user', NOW())`,
            [userId]
          );
        } catch (roleError) {
          console.log("User role might already exist, continuing...");
        }

        // Create initial user activity record
        try {
          await pool.execute(
            `INSERT INTO user_activity (user_id, activity_date, xp_earned, lessons_completed, created_at)
             VALUES (?, ?, 0, 0, NOW())`,
            [userId, new Date().toISOString().split('T')[0]]
          );
        } catch (activityError) {
          console.log("User activity record might already exist, continuing...");
        }

        // Fetch the newly created profile
        [profiles] = await pool.execute(
          `SELECT p.*, u.email
           FROM profiles p
           JOIN users u ON p.id = u.id
           WHERE p.id = ?`,
          [userId]
        );

        profile = profiles[0];
        
        // Ensure all profile fields exist
        if (profile) {
          profile = {
            ...profile,
            display_name: profile.display_name || null,
            avatar_url: profile.avatar_url || null,
            total_xp: profile.total_xp || 0,
            current_streak: profile.current_streak || 0,
            longest_streak: profile.longest_streak || 0,
            last_activity_date: profile.last_activity_date || new Date().toISOString().split('T')[0]
          };
        }
      }

      /* Stats */
      let lessons = [{ total: 0 }];
      let progress = [{ completed: 0 }];
      let achievements = [{ total: 0 }];
      let userAchievements = [{ earned: 0 }];
      let activity = [];
      let allAchievements = [];

      try {
        const [
          lessonsResult,
          progressResult,
          achievementsResult,
          userAchievementsResult,
          activityResult,
          allAchievementsResult
        ] = await Promise.all([
          pool.execute("SELECT COUNT(*) as total FROM lessons"),
          pool.execute(
            `SELECT COUNT(DISTINCT lesson_id) as completed
             FROM user_progress
             WHERE user_id = ? AND completed = 1`,
            [userId]
          ),
          pool.execute("SELECT COUNT(*) as total FROM achievements"),
          pool.execute(
            `SELECT COUNT(*) as earned
             FROM user_achievements
             WHERE user_id = ?`,
            [userId]
          ),
          pool.execute(
            `SELECT activity_date, xp_earned, lessons_completed
             FROM user_activity
             WHERE user_id = ?
             ORDER BY activity_date DESC
             LIMIT 7`,
            [userId]
          ),
          pool.execute(
            `SELECT a.*,
                    CASE 
                      WHEN ua.user_id IS NOT NULL THEN TRUE 
                      ELSE FALSE 
                    END as earned,
                    ua.earned_at
             FROM achievements a
             LEFT JOIN user_achievements ua
               ON a.id = ua.achievement_id
              AND ua.user_id = ?
             ORDER BY a.created_at`,
            [userId]
          )
        ]);

        lessons = lessonsResult[0];
        progress = progressResult[0];
        achievements = achievementsResult[0];
        userAchievements = userAchievementsResult[0];
        activity = activityResult[0];
        allAchievements = allAchievementsResult[0];
      } catch (statsError) {
        console.log("Some stats might not be available yet:", statsError);
        // Continue with default values
      }

      const stats = {
        totalLessons: lessons[0]?.total || 0,
        completedLessons: progress[0]?.completed || 0,
        achievementsEarned: userAchievements[0]?.earned || 0,
        totalAchievements: achievements[0]?.total || 0,
      };

      const activityData = activity
        .map((act) => ({
          date: new Date(act.activity_date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          xp: act.xp_earned || 0,
          lessons: act.lessons_completed || 0,
        }))
        .reverse();

      return res.status(200).json({
        success: true,
        profile: profile || {
          id: userId,
          username: user.email.split('@')[0] || 'user',
          display_name: null,
          avatar_url: null,
          total_xp: 0,
          current_streak: 0,
          longest_streak: 0,
          last_activity_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          email: user.email
        },
        stats,
        achievements: allAchievements || [],
        activity: activityData,
        isNewProfile: !profiles.length // Flag to indicate if profile was just created
      });

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        res.setHeader(
          "Set-Cookie",
          "token=; Path=/; Max-Age=0"
        );
        return res.status(401).json({ error: "Invalid token" });
      }

      console.error("Profile fetch error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  /* =======================
     UPDATE PROFILE
  ======================= */
  if (req.method === "PUT") {
    try {
      const token = req.cookies?.token;

      if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.userId;

      const { display_name, avatar_url } = req.body;

      // First check if profile exists
      const [existingProfiles] = await pool.execute(
        `SELECT * FROM profiles WHERE id = ?`,
        [userId]
      );

      if (!existingProfiles.length) {
        // Create profile if it doesn't exist
        const [userResult] = await pool.execute(
          `SELECT * FROM users WHERE id = ?`,
          [userId]
        );

        const user = userResult[0];
        const defaultUsername = user?.email?.split('@')[0] || 'user';

        await pool.execute(
          `INSERT INTO profiles (
            id, 
            username, 
            display_name, 
            avatar_url, 
            total_xp, 
            current_streak, 
            longest_streak, 
            last_activity_date,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, 0, 0, 0, ?, NOW(), NOW())`,
          [
            userId,
            defaultUsername,
            display_name || null,
            avatar_url || null,
            new Date().toISOString().split('T')[0]
          ]
        );
      } else {
        // Update existing profile
        await pool.execute(
          `UPDATE profiles
           SET display_name = ?, avatar_url = ?, updated_at = NOW()
           WHERE id = ?`,
          [display_name, avatar_url, userId]
        );
      }

      // Fetch the updated/created profile
      const [profiles] = await pool.execute(
        `SELECT p.*, u.email
         FROM profiles p
         JOIN users u ON p.id = u.id
         WHERE p.id = ?`,
        [userId]
      );

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        profile: profiles[0],
      });

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        res.setHeader(
          "Set-Cookie",
          "token=; Path=/; Max-Age=0"
        );
        return res.status(401).json({ error: "Invalid token" });
      }

      console.error("Profile update error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  /* =======================
     CREATE PROFILE (POST)
  ======================= */
  if (req.method === "POST") {
    try {
      const token = req.cookies?.token;

      if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.userId;

      const { display_name, avatar_url } = req.body;

      // Check if user exists
      const [users] = await pool.execute(
        `SELECT * FROM users WHERE id = ?`,
        [userId]
      );

      if (!users.length) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = users[0];

      // Check if profile already exists
      const [existingProfiles] = await pool.execute(
        `SELECT * FROM profiles WHERE id = ?`,
        [userId]
      );

      if (existingProfiles.length) {
        return res.status(409).json({ error: "Profile already exists" });
      }

      // Create profile with default values
      const defaultUsername = user.email.split('@')[0] || 'user';
      
      await pool.execute(
        `INSERT INTO profiles (
          id, 
          username, 
          display_name, 
          avatar_url, 
          total_xp, 
          current_streak, 
          longest_streak, 
          last_activity_date,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          userId,
          defaultUsername,
          display_name || null,
          avatar_url || null,
          0, // total_xp
          0, // current_streak
          0, // longest_streak
          new Date().toISOString().split('T')[0] // last_activity_date
        ]
      );

      // Create user role
      try {
        await pool.execute(
          `INSERT INTO user_roles (user_id, role, created_at)
           VALUES (?, 'user', NOW())`,
          [userId]
        );
      } catch (roleError) {
        console.log("User role might already exist");
      }

      // Fetch the created profile
      const [profiles] = await pool.execute(
        `SELECT p.*, u.email
         FROM profiles p
         JOIN users u ON p.id = u.id
         WHERE p.id = ?`,
        [userId]
      );

      return res.status(201).json({
        success: true,
        message: "Profile created successfully",
        profile: profiles[0],
      });

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        res.setHeader(
          "Set-Cookie",
          "token=; Path=/; Max-Age=0"
        );
        return res.status(401).json({ error: "Invalid token" });
      }

      console.error("Profile creation error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  /* =======================
     METHOD NOT ALLOWED
  ======================= */
  return res.status(405).json({
    error: `Method ${req.method} not allowed`,
  });
}