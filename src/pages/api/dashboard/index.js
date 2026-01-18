// pages/api/dashboard.js
import jwt from "jsonwebtoken";
import pool from "@/integrations/sql/connectDb";

const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get token from cookies or Authorization header
    const token =
      req.cookies?.token ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(200).json({ user: null });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    // Fetch user profile
    const [users] = await pool.execute(
      `SELECT u.id, u.username, u.email, p.display_name, p.avatar_url,
              p.total_xp, p.current_streak, p.longest_streak, p.last_activity_date
       FROM users u
       LEFT JOIN profiles p ON u.id = p.id
       WHERE u.id = ?`,
      [userId]
    );

    if (!users.length) return res.status(200).json({ user: null });
    const userProfile = users[0];

    // Fetch lessons
    const [lessons] = await pool.execute(
      `SELECT id, title, description, difficulty, xp_reward, order_index
       FROM lessons
       ORDER BY order_index ASC`
    );

    // Fetch completed lessons
    const [completed] = await pool.execute(
      `SELECT lesson_id
       FROM user_progress
       WHERE user_id = ? AND completed = TRUE`,
      [userId]
    );
    const completedLessons = completed.map((row) => row.lesson_id);

    // Fetch all achievements
    const [achievements] = await pool.execute(
      `SELECT id, name, description, icon, requirement_type, requirement_value
       FROM achievements`
    );

    // Fetch user's earned achievements
    const [userAchievements] = await pool.execute(
      `SELECT achievement_id, earned_at
       FROM user_achievements
       WHERE user_id = ?`,
      [userId]
    );

    // Check if user is admin
    const [roles] = await pool.execute(
      `SELECT role FROM user_roles WHERE user_id = ? AND role = 'admin'`,
      [userId]
    );
    const isAdmin = roles.length > 0;

    return res.status(200).json({
      user: userProfile,
      lessons,
      completedLessons,
      achievements,
      userAchievements,
      isAdmin,
    });
  } catch (err) {
    console.error("Dashboard API error:", err);
    return res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
}


// import jwt from 'jsonwebtoken';
// import pool from '@/integrations/sql/connectDb';

// const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET;

// export default async function handler(req, res) {
//   if (req.method !== 'GET') {
//     return res.status(405).json({ error: 'Method not allowed' });
//   }

//   try {
//     const token =
//       req.cookies.token ||
//       req.headers.authorization?.replace('Bearer ', '');

//     if (!token) return res.status(401).json({ error: 'Unauthorized' });

//     const decoded = jwt.verify(token, JWT_SECRET);
//     const userId = decoded.userId;

//     // Fetch user + profile + role
//     const [users] = await pool.execute(
//       `SELECT u.id, u.email, u.username, p.display_name, p.total_xp, 
//               p.current_streak, p.longest_streak, ur.role AS user_role
//        FROM users u
//        LEFT JOIN profiles p ON u.id = p.id
//        LEFT JOIN user_roles ur ON u.id = ur.user_id
//        WHERE u.id = ?`,
//       [userId]
//     );

//     if (!users.length) return res.status(404).json({ error: 'User not found' });
//     const user = users[0];

//     // Fetch lessons
//     const [lessons] = await pool.execute(
//       `SELECT id, title, description, difficulty, xp_reward, order_index
//        FROM lessons
//        ORDER BY order_index`
//     );

//     // Fetch completed lessons
//     const [completedLessons] = await pool.execute(
//       `SELECT lesson_id
//        FROM user_progress
//        WHERE user_id = ? AND completed = TRUE`,
//       [userId]
//     );

//     const completedSet = new Set(completedLessons.map((l) => l.lesson_id));

//     // Fetch achievements
//     const [achievements] = await pool.execute(
//       `SELECT id, name, description, icon, requirement_type, requirement_value
//        FROM achievements`
//     );

//     // Fetch user achievements
//     const [userAchievements] = await pool.execute(
//       `SELECT achievement_id, earned_at
//        FROM user_achievements
//        WHERE user_id = ?`,
//       [userId]
//     );

//     res.status(200).json({
//       user,
//       lessons,
//       completedLessons: Array.from(completedSet),
//       achievements,
//       userAchievements,
//       isAdmin: user.user_role === 'admin',
//     });
//   } catch (err) {
//     console.error('Dashboard API error:', err);
//     return res.status(500).json({ error: 'Server error' });
//   }
// }
