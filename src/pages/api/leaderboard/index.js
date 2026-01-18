// pages/api/leaderboard.js
import jwt from "jsonwebtoken";
import pool from "@/integrations/sql/connectDb";

const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET || "your-secret-key-change-this";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = req.cookies?.token;

    // Token is optional for leaderboard (public view)
    let currentUserId = null;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        currentUserId = decoded.userId;
      } catch (tokenError) {
        // Invalid token, but still show public leaderboard
        console.log("Invalid token for leaderboard, showing public view");
      }
    }

    // Fetch top 50 profiles by XP
    const [profilesData] = await pool.execute(
      `SELECT 
        p.id, 
        p.username, 
        p.display_name,
        p.total_xp, 
        p.current_streak,
        p.longest_streak,
        p.avatar_url,
        p.created_at
      FROM profiles p
      WHERE p.username IS NOT NULL
      ORDER BY p.total_xp DESC
      LIMIT 50`
    );

    // Rank the profiles
    const rankedData = profilesData.map((profile, index) => ({
      ...profile,
      rank: index + 1,
    }));

    // Find current user's entry if logged in
    let currentUser = null;
    if (currentUserId) {
      currentUser = rankedData.find((p) => p.id === currentUserId) || null;
      
      // If current user is not in top 50, fetch their position
      if (!currentUser) {
        const [userRankResult] = await pool.execute(
          `SELECT 
            p.*,
            (SELECT COUNT(*) + 1 
             FROM profiles p2 
             WHERE p2.total_xp > p.total_xp) as rank
          FROM profiles p
          WHERE p.id = ?`,
          [currentUserId]
        );
        
        if (userRankResult.length > 0) {
          currentUser = userRankResult[0];
        }
      }
    }

    return res.status(200).json({
      success: true,
      leaderboard: rankedData,
      currentUser: currentUser,
    });

  } catch (error) {
    console.error("Leaderboard fetch error:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}