import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

import { env } from '../../src/lib/env'

const JWT_SECRET = env.JWT_SECRET

export interface AdminPayload {
  userId: string
  email: string
}

export function signToken(payload: AdminPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
}

export function verifyToken(token: string): AdminPayload {
  return jwt.verify(token, JWT_SECRET) as AdminPayload
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
