// pages/api/admin/questions.js
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

  // GET: Fetch questions for a lesson
  if (req.method === "GET") {
    try {
      const token = req.cookies?.token;
      await checkAdmin(token);

      const { lessonId } = req.query;

      if (!lessonId) {
        return res.status(400).json({ error: "Lesson ID is required" });
      }

      const [questions] = await pool.execute(
        "SELECT * FROM questions WHERE lesson_id = ? ORDER BY order_index",
        [lessonId]
      );

      return res.status(200).json({
        success: true,
        questions,
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

      console.error("Get questions error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // POST: Create new question
  if (req.method === "POST") {
    try {
      const token = req.cookies?.token;
      await checkAdmin(token);

      const { 
        lesson_id, 
        question_text, 
        question_type, 
        correct_answer, 
        options, 
        translation_hint, 
        order_index 
      } = req.body;

      if (!lesson_id || !question_text || !correct_answer) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Parse options JSON if provided
      let optionsJson = null;
      if (options && options.trim()) {
        try {
          optionsJson = JSON.parse(options);
        } catch (e) {
          return res.status(400).json({ error: "Invalid options JSON" });
        }
      }

      const [result] = await pool.execute(
        `INSERT INTO questions 
          (lesson_id, question_text, question_type, correct_answer, options, translation_hint, order_index, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          lesson_id,
          question_text,
          question_type || "multiple_choice",
          correct_answer,
          optionsJson ? JSON.stringify(optionsJson) : null,
          translation_hint || null,
          order_index || 1
        ]
      );

      // Get the inserted question
      const [questions] = await pool.execute(
        "SELECT * FROM questions WHERE id = ?",
        [result.insertId]
      );

      return res.status(201).json({
        success: true,
        message: "Question created successfully",
        question: questions[0],
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

      console.error("Create question error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // DELETE: Delete question
  if (req.method === "DELETE") {
    try {
      const token = req.cookies?.token;
      await checkAdmin(token);

      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Question ID is required" });
      }

      await pool.execute("DELETE FROM questions WHERE id = ?", [id]);

      return res.status(200).json({
        success: true,
        message: "Question deleted successfully",
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

      console.error("Delete question error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}