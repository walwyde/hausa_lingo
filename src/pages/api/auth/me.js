import jwt from 'jsonwebtoken'
import pool from '@/integrations/sql/connectDb'

const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET

export default async function handler(req, res) {
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' })

  try {
    const token =
      req.cookies?.token ||
      req.headers.authorization?.replace('Bearer ', '')

    if (!token)
      return res.json({ user: null })

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET)

    // Fetch user data
    const [users] = await pool.execute(
      `SELECT u.id, u.email, u.username, p.display_name, p.avatar_url,
              p.total_xp, p.current_streak, p.longest_streak,
              ur.role as user_role
       FROM users u
       LEFT JOIN profiles p ON u.id = p.id
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       WHERE u.id = ?`,
      [decoded.userId]
    )

    if (!users.length)
      return res.json({ user: null })

    return res.json({ user: users[0] })

  } catch (err) {
    // Invalid token → clear cookie
    res.setHeader(
      'Set-Cookie',
      'token=; HttpOnly; Path=/; Max-Age=0'
    )

    return res.json({ user: null })
  }
}
