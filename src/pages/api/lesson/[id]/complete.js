// pages/api/lesson/[id]/complete.js

import jwt from "jsonwebtoken";
import pool from "@/integrations/sql/connectDb";

const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id: lessonId } = req.query;

  try {
    // 1️⃣ Get token
    const token =
      req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const { score } = req.body; // ✅ Pages Router uses req.body

    if (!lessonId) {
      return res.status(400).json({ error: "Lesson ID required" });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    /* -------------------------------
       1️⃣ UPSERT user_progress
    --------------------------------*/
    await connection.execute(
      `
      INSERT INTO user_progress 
        (user_id, lesson_id, completed, score, completed_at)
      VALUES (?, ?, TRUE, ?, NOW())
      ON DUPLICATE KEY UPDATE 
        score = VALUES(score),
        completed_at = NOW()
      `,
      [userId, lessonId, score]
    );

    /* -------------------------------
       2️⃣ GET lesson XP
    --------------------------------*/
    const [lessonRows] = await connection.execute(
      `SELECT xp_reward FROM lessons WHERE id = ?`,
      [lessonId]
    );

    const xpReward = lessonRows[0]?.xp_reward || 0;

    /* -------------------------------
       3️⃣ UPDATE profiles XP
    --------------------------------*/
    await connection.execute(
      `
      UPDATE profiles
      SET total_xp = total_xp + ?
      WHERE id = ?
      `,
      [xpReward, userId]
    );

    /* -------------------------------
       4️⃣ UPDATE daily activity
    --------------------------------*/
    const today = new Date().toISOString().split("T")[0];

await connection.execute(
`
INSERT INTO user_activity 
(id, user_id, activity_date, xp_earned, lessons_completed)
VALUES (UUID(), ?, ?, ?, 1)
ON DUPLICATE KEY UPDATE
  xp_earned = xp_earned + VALUES(xp_earned),
  lessons_completed = lessons_completed + 1
`,
[userId, today, xpReward]
);


    /* -------------------------------
       5️⃣ UPDATE STREAK
    --------------------------------*/
    const [streakRow] = await connection.execute(
      `
      SELECT current_streak, last_activity_date
      FROM profiles
      WHERE id = ?
      `,
      [userId]
    );

    let currentStreak = streakRow[0]?.current_streak || 0;
    const lastDate = streakRow[0]?.last_activity_date;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (lastDate === yesterdayStr) {
      currentStreak += 1;
    } else if (lastDate !== today) {
      currentStreak = 1;
    }

    await connection.execute(
      `
      UPDATE profiles 
      SET current_streak = ?, last_activity_date = ?
      WHERE id = ?
      `,
      [currentStreak, today, userId]
    );

    /* -------------------------------
       6️⃣ ACHIEVEMENTS
    --------------------------------*/
    const [achievements] = await connection.execute(
      `SELECT id, requirement_type, requirement_value FROM achievements`
    );

    const [progress] = await connection.execute(
      `
      SELECT 
        COUNT(*) as lessons_completed,
        SUM(CASE WHEN score = 100 THEN 1 ELSE 0 END) as perfect_scores
      FROM user_progress
      WHERE user_id = ? AND completed = TRUE
      `,
      [userId]
    );

    const [profile] = await connection.execute(
      `
      SELECT total_xp, current_streak 
      FROM profiles 
      WHERE id = ?
      `,
      [userId]
    );

    for (const ach of achievements) {
      let earned = false;

      switch (ach.requirement_type) {
        case "lessons_completed":
          earned = progress[0].lessons_completed >= ach.requirement_value;
          break;
        case "perfect_scores":
          earned = progress[0].perfect_scores >= ach.requirement_value;
          break;
        case "streak_days":
          earned = profile[0].current_streak >= ach.requirement_value;
          break;
        case "total_xp":
          earned = profile[0].total_xp >= ach.requirement_value;
          break;
      }

      if (earned) {
        await connection.execute(
          `
          INSERT INTO user_achievements 
            (id, user_id, achievement_id, earned_at)
          VALUES (UUID(), ?, ?, NOW())
          ON DUPLICATE KEY UPDATE earned_at = earned_at
          `,
          [userId, ach.id]
        );
      }
    }

    await connection.commit();
    connection.release();

    return res.status(200).json({
      message: "Lesson completed successfully",
      xpEarned: xpReward,
      currentStreak
    });

  } catch (error) {
    console.error("Lesson completion error:", error);
    return res.status(500).json({ error: "Failed to complete lesson" });
  }
}
