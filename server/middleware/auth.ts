import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: string; role: string; email: string; name: string; impersonatedBy?: string };
}

function extractToken(req: Request): string | null {
  // 1. httpOnly cookie (preferred)
  const cookieToken = (req as any).cookies?.insurelead_access;
  if (cookieToken) return cookieToken;

  // 2. Authorization: Bearer <token> (backward compat for API clients)
  const header = req.header('Authorization');
  if (header?.startsWith('Bearer ')) {
    const t = header.slice(7);
    if (t) return t;
  }

  return null;
}

import { env } from '../config/env';

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const secret = env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'JWT_SECRET missing' });
  }

  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }
  try {
    const decoded = jwt.verify(token, secret) as {
      id: string;
      role: string;
      email: string;
      name: string;
      impersonatedBy?: string;
    };
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token is not valid' });
  }
}

export function adminOnly(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

export function leadgenOrAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin' && req.user?.role !== 'leadgen') {
    return res.status(403).json({ error: 'Lead Gen or Admin access required' });
  }
  next();
}
