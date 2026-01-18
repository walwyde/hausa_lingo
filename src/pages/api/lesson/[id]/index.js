// pages/api/lesson/[id].js
import pool from "@/integrations/sql/connectDb"; // your MySQL pool
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const lessonId = req.query.id;

    // 1️⃣ Get user from token
    const token =
      req.cookies.token ||
      (req.headers.authorization && req.headers.authorization.replace("Bearer ", ""));
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    // 2️⃣ Fetch lesson info
    const [lessonRows] = await pool.execute(
      "SELECT id, title, description, difficulty, order_index, xp_reward, created_at FROM lessons WHERE id = ?",
      [lessonId]
    );
    if (!lessonRows.length) return res.status(404).json({ error: "Lesson not found" });
    const lesson = lessonRows[0];

    // 3️⃣ Fetch lesson questions
    const [questionRows] = await pool.execute(
      "SELECT id, lesson_id, question_text, question_type, correct_answer, options, translation_hint, order_index FROM questions WHERE lesson_id = ? ORDER BY order_index ASC",
      [lessonId]
    );

    // const questions = questionRows.map((q) => ({
    //   ...q,
    //   options: q.options ? JSON.parse(q.options) : undefined, // ensure options are parsed
    // }));

    const questions = questionRows.map((q) => {
  let parsedOptions;
  
  if (!q.options) {
    parsedOptions = undefined;
  } else if (Array.isArray(q.options)) {
    // Already an array (MySQL JSON type)
    parsedOptions = q.options;
  } else if (typeof q.options === 'string') {
    // String - need to parse
    const trimmed = q.options.trim();
    
    if (trimmed.startsWith('[')) {
      // Looks like JSON array
      try {
        parsedOptions = JSON.parse(trimmed);
      } catch (e) {
        console.error(`Failed to parse options for question ${q.id}:`, trimmed);
        parsedOptions = [];
      }
    } else {
      // Plain comma-separated string
      parsedOptions = trimmed.split(',').map(opt => opt.trim());
    }
  } else {
    parsedOptions = q.options;
  }
  
  return {
    ...q,
    options: parsedOptions,
  };
});

    // 4️⃣ Fetch user progress for this lesson
    const [progressRows] = await pool.execute(
      "SELECT completed, score FROM user_progress WHERE user_id = ? AND lesson_id = ?",
      [userId, lessonId]
    );
    const progress = progressRows[0] || null;

    return res.status(200).json({
      lesson,
      questions,
      progress,
    });
  } catch (err) {
    console.error("Lesson API error:", err);
    return res.status(500).json({ error: "Failed to fetch lesson data" });
  }
}
