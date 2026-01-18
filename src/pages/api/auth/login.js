import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '@/integrations/sql/connectDb'

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { email, password } = req.body

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' })

    const [users] = await pool.execute(
      `SELECT u.id, u.email, u.password, p.username, p.display_name,
              ur.role as user_role
       FROM users u
       LEFT JOIN profiles p ON u.id = p.id
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       WHERE u.email = ?`,
      [email]
    )

    if (!users.length)
      return res.status(401).json({ error: 'Invalid credentials' })

    const user = users[0]

    const valid = await bcrypt.compare(password, user.password)
    if (!valid)
      return res.status(401).json({ error: 'Invalid credentials' })

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.user_role || 'user'
      },
      process.env.NEXT_PUBLIC_JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.setHeader(
      'Set-Cookie',
      `token=${token}; HttpOnly; Path=/; Max-Age=604800`
    )

    delete user.password

    return res.json({
      message: 'Login successful',
      user,
      token
    })

  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
}
