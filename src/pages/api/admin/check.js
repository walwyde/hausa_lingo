// pages/api/admin/check.js
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

    const [adminRoles] = await pool.execute(
      `SELECT * FROM user_roles 
       WHERE user_id = ? AND role = 'admin'`,
      [userId]
    );

    if (adminRoles.length === 0) {
      return res.status(403).json({ error: "Not an admin" });
    }

    return res.status(200).json({
      success: true,
      isAdmin: true,
    });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: "Invalid token" });
    }

    console.error("Admin check error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}