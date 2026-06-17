import { Router } from 'express';
import passport, { isAllowedCinEmail, isGoogleSsoConfigured } from '../services/auth.service';
import { generateToken } from '../middleware/auth.middleware';
import { env, isProduction } from '../config/env';
import prisma from '../services/prisma';
import auditLogService from '../services/audit-log.service';

const router = Router();

const googleLoginOptions = {
  scope: ['profile', 'email'],
  prompt: 'select_account',
  hd: env.allowedEmailDomain,
};

// Initiate SSO Login
router.get('/login', (req, res, next) => {
  if (!isGoogleSsoConfigured) {
    return res.status(503).json({
      error: 'Google SSO is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
    });
  }

  return passport.authenticate('google', googleLoginOptions)(req, res, next);
});

// Mock Login for Development
router.get('/mock-login', async (req, res) => {
  if (isProduction) {
    return res.status(403).json({ error: 'Mock login not allowed in production' });
  }

  const requestedEmail = typeof req.query.email === 'string'
    ? req.query.email.trim().toLowerCase()
    : 'test@cin.ufpe.br';

  if (!isAllowedCinEmail(requestedEmail)) {
    return res.status(403).json({ error: `Mock user must use @${env.allowedEmailDomain}.` });
  }

  const existingUser = await prisma.user.findUnique({ where: { email: requestedEmail } });
  const fallbackName = requestedEmail === 'test@cin.ufpe.br'
    ? 'User Teste'
    : requestedEmail.split('@')[0].replace(/[._-]+/g, ' ');

  const user = await prisma.user.upsert({
    where: { email: requestedEmail },
    update: { status: 'ACTIVE', suspendedAt: null },
    create: {
      email: requestedEmail,
      name: fallbackName,
      role: 'STUDENT',
      status: 'ACTIVE',
    },
  });

  const token = generateToken(user);
  await auditLogService.create({
    action: 'LOGIN_MOCK',
    entityType: 'User',
    entityId: user.id,
    actorId: user.id,
    metadata: existingUser ? { seeded: true } : { seeded: false },
  });
  res.json({ token, user });
});

// SSO Callback
router.get(
  '/callback',
  (req, res, next) => {
    if (!isGoogleSsoConfigured) {
      return res.status(503).json({
        error: 'Google SSO is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
      });
    }

    return passport.authenticate('google', {
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
