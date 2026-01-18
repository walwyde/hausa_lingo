import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import pool from '@/integrations/sql/connectDb';

const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let connection;

  try {
    const { username, email, password, display_name } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Username, email, and password are required',
      });
    }

    // Check if user already exists
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email=? OR username=?',
      [email, username]
    );

    if (existing.length) {
      return res.status(409).json({
        error: 'User with this email or username already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Start transaction
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Generate UUIDs for all tables
    const userId = uuidv4();
    const userRoleId = uuidv4();
    const userActivityId = uuidv4();

    // Insert into users
    await connection.execute(
      `INSERT INTO users (id, username, email, password)
       VALUES (?,?,?,?)`,
      [userId, username, email, hashedPassword]
    );

    // Insert into profiles
    await connection.execute(
      `INSERT INTO profiles
       (id, username, display_name, total_xp, current_streak, longest_streak)
       VALUES (?,?,?,0,0,0)`,
      [userId, username, display_name || username]
    );

    // Insert default role
    await connection.execute(
      `INSERT INTO user_roles (id, user_id, role)
       VALUES (?,?, 'user')`,
      [userRoleId, userId]
    );

    // Insert initial activity
    await connection.execute(
      `INSERT INTO user_activity
       (id, user_id, activity_date, xp_earned, lessons_completed)
       VALUES (?,?, CURDATE(), 0, 0)`,
      [userActivityId, userId]
    );

    await connection.commit();

    // Fetch the newly created user with profile and role
    const [users] = await pool.execute(
      `SELECT u.id, u.email, u.username, p.display_name, ur.role AS user_role
       FROM users u
       LEFT JOIN profiles p ON u.id = p.id
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       WHERE u.id = ?`,
      [userId]
    );

    const user = users[0];

    // Create JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.user_role,
      },
      process.env.NEXT_PUBLIC_JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Set cookie
    res.setHeader(
      'Set-Cookie',
      `token=${token}; HttpOnly; Path=/; Max-Age=3600; SameSite=Strict`
    );

    return res.status(201).json({
      message: 'Registration successful',
      user,
      token,
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
}
