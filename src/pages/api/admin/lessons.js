// pages/api/admin/lessons.js
import jwt from "jsonwebtoken";
import pool from "@/integrations/sql/connectDb";

const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET || "your-secret-key-change-this";

export default async function handler(req, res) {
  // Check admin access
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

  // GET: Fetch all lessons
  if (req.method === "GET") {
    try {
      const token = req.cookies?.token;
      await checkAdmin(token);

      const [lessons] = await pool.execute(
        "SELECT * FROM lessons ORDER BY order_index"
      );

      return res.status(200).json({
        success: true,
        lessons,
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

      console.error("Get lessons error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // POST: Create new lesson
  if (req.method === "POST") {
    try {
      const token = req.cookies?.token;
      await checkAdmin(token);

      const { title, description, difficulty, xp_reward, order_index } = req.body;

      if (!title || !xp_reward || order_index === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const [result] = await pool.execute(
        `INSERT INTO lessons (title, description, difficulty, xp_reward, order_index, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [title, description || null, difficulty || "beginner", xp_reward, order_index]
      );

      // Get the inserted lesson
      const [lessons] = await pool.execute(
        "SELECT * FROM lessons WHERE id = ?",
        [result.insertId]
      );

      return res.status(201).json({
        success: true,
        message: "Lesson created successfully",
        lesson: lessons[0],
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

      console.error("Create lesson error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // PUT: Update lesson
  if (req.method === "PUT") {
    try {
      const token = req.cookies?.token;
      await checkAdmin(token);

      const { id, title, description, difficulty, xp_reward, order_index } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Lesson ID is required" });
      }

      await pool.execute(
        `UPDATE lessons 
         SET title = ?, description = ?, difficulty = ?, xp_reward = ?, order_index = ?
         WHERE id = ?`,
        [title, description || null, difficulty || "beginner", xp_reward, order_index, id]
      );

      return res.status(200).json({
        success: true,
        message: "Lesson updated successfully",
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

      console.error("Update lesson error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // DELETE: Delete lesson
  if (req.method === "DELETE") {
    try {
      const token = req.cookies?.token;
      await checkAdmin(token);

      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Lesson ID is required" });
      }

      await pool.execute("DELETE FROM lessons WHERE id = ?", [id]);

      return res.status(200).json({
        success: true,
        message: "Lesson deleted successfully",
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

      console.error("Delete lesson error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}