import { Router } from 'express';
import passport, { isAllowedCinEmail, isCinSsoConfigured } from '../services/auth.service';
import { generateToken } from '../middleware/auth.middleware';
import { env, isProduction } from '../config/env';
import prisma from '../services/prisma';
import auditLogService from '../services/audit-log.service';

const router = Router();

// Initiate SSO Login
router.get('/login', (req, res, next) => {
  if (!isCinSsoConfigured) {
    return res.status(503).json({
      error: 'CIn SSO is not configured. Set CIN_SSO_* environment variables.',
    });
  }

  return passport.authenticate('cin-sso')(req, res, next);
});

// Mock Login for Development
router.get('/mock-login', async (req, res) => {
  if (isProduction) {
    return res.status(403).json({ error: 'Mock login not allowed in production' });
  }

  const user = await prisma.user.upsert({
    where: { email: 'test@cin.ufpe.br' },
    update: { name: 'User Teste', role: 'STUDENT', status: 'ACTIVE' },
    create: {
      email: 'test@cin.ufpe.br',
      name: 'User Teste',
      role: 'STUDENT',
      status: 'ACTIVE',
    },
  });

  if (!isAllowedCinEmail(user.email)) {
    return res.status(403).json({ error: `Mock user must use @${env.allowedEmailDomain}.` });
  }

  const token = generateToken(user);
  await auditLogService.create({
    action: 'LOGIN_MOCK',
    entityType: 'User',
    entityId: user.id,
    actorId: user.id,
  });
  res.json({ token, user });
});

// SSO Callback
router.get(
  '/callback',
  (req, res, next) => {
    if (!isCinSsoConfigured) {
      return res.status(503).json({
        error: 'CIn SSO is not configured. Set CIN_SSO_* environment variables.',
      });
    }

    return passport.authenticate('cin-sso', {
      failureRedirect: `${env.frontendUrl}/auth/success?error=unauthorized_domain`,
      session: false,
    })(req, res, next);
  },
  async (req: any, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication failed' });
    }

    const token = generateToken(req.user);
    await auditLogService.create({
      action: 'LOGIN',
      entityType: 'User',
      entityId: req.user.id,
      actorId: req.user.id,
    });
    res.redirect(`${env.frontendUrl}/auth/success?token=${token}`);
  }
);

export default router;
