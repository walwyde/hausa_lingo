// pages/api/admin/stats.js
import jwt from "jsonwebtoken";
import pool from "@/integrations/sql/connectDb";

const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET || "your-secret-key-change-this";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    // Check if user is admin
    const [adminRoles] = await pool.execute(
      `SELECT * FROM user_roles 
       WHERE user_id = ? AND role = 'admin'`,
      [userId]
    );

    if (adminRoles.length === 0) {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Get stats
    const [
      [usersResult],
      [lessonsResult],
      [questionsResult],
      [achievementsResult]
    ] = await Promise.all([
      pool.execute("SELECT COUNT(*) as count FROM profiles"),
      pool.execute("SELECT COUNT(*) as count FROM lessons"),
      pool.execute("SELECT COUNT(*) as count FROM questions"),
      pool.execute("SELECT COUNT(*) as count FROM achievements")
    ]);

    const stats = {
      totalUsers: usersResult[0]?.count || 0,
      totalLessons: lessonsResult[0]?.count || 0,
      totalQuestions: questionsResult[0]?.count || 0,
      totalAchievements: achievementsResult[0]?.count || 0,
    };

    return res.status(200).json({
      success: true,
      stats,
    });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: "Invalid token" });
    }

    console.error("Admin stats error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}