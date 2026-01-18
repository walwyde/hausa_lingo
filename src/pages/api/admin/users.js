// pages/api/admin/users.js
import jwt from "jsonwebtoken";
import pool from "@/integrations/sql/connectDb";

const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET || "your-secret-key-change-this";

export default async function handler(req, res) {
  const checkAdmin = async (token) => {
    if (!token) throw new Error("No token");
    const decoded = jwt.verify(token, JWT_SECRET);
    const [adminRoles] = await pool.execute(
      `SELECT * FROM user_roles 
       WHERE user_id = ? AND role = 'admin'`,
      [decoded.userId]
    );
    if (adminRoles.length === 0) throw new Error("Not admin");
    return decoded.userId;
  };

  // GET: Fetch all users with roles
  if (req.method === "GET") {
    try {
      const token = req.cookies?.token;
      await checkAdmin(token);

      const [users] = await pool.execute(
        `SELECT 
          p.*,
          u.email,
          ur.role
         FROM profiles p
         JOIN users u ON p.id = u.id
         LEFT JOIN user_roles ur ON p.id = ur.user_id
         ORDER BY p.created_at DESC`
      );

      return res.status(200).json({
        success: true,
        users,
      });

    } catch (error) {
      if (error.message === "No token") {
        return res.status(401).json({ error: "Unauthorized" });
      }
      if (error.message === "Not admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ error: "Invalid token" });
      }

      console.error("Get users error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // POST: Toggle admin role
  if (req.method === "POST") {
    try {
      const token = req.cookies?.token;
      await checkAdmin(token);

      const { userId, action } = req.body;

      if (!userId || !action) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (action === "grant") {
        // Check if already admin
        const [existingRole] = await pool.execute(
          `SELECT * FROM user_roles 
           WHERE user_id = ? AND role = 'admin'`,
          [userId]
        );

        if (existingRole.length === 0) {
          await pool.execute(
            `INSERT INTO user_roles (user_id, role, created_at)
             VALUES (?, 'admin', NOW())`,
            [userId]
          );
        }

        return res.status(200).json({
          success: true,
          message: "Admin role granted",
        });

      } else if (action === "revoke") {
        await pool.execute(
          `DELETE FROM user_roles 
           WHERE user_id = ? AND role = 'admin'`,
          [userId]
        );

        return res.status(200).json({
          success: true,
          message: "Admin role revoked",
        });
      } else {
        return res.status(400).json({ error: "Invalid action" });
      }

    } catch (error) {
      if (error.message === "No token") {
        return res.status(401).json({ error: "Unauthorized" });
      }
      if (error.message === "Not admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ error: "Invalid token" });
      }

      console.error("Toggle admin error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}