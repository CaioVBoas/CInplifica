import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { isAllowedCinEmail } from '../services/auth.service';
import prisma from '../services/prisma';

const JWT_SECRET = env.jwtSecret;

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    status?: string;
  };
}

export const generateToken = (user: any) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture ?? null,
      role: user.role,
      status: user.status,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2) {
    return res.status(401).json({ error: 'Token error' });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ error: 'Token malformatted' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (!decoded?.email || !isAllowedCinEmail(decoded.email)) {
      return res.status(403).json({ error: `Acesso restrito a estudantes com email @${env.allowedEmailDomain}.` });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, role: true, status: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Token invalid' });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ error: 'Usuário suspenso.' });
    }

    (req as any).user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalid' });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = (req as any).user?.role;

    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Acesso não autorizado.' });
    }

    return next();
  };
};
