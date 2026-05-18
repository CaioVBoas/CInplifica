import { Router } from 'express';
import passport from '../services/auth.service';
import { generateToken } from '../middleware/auth.middleware';

const router = Router();

// Initiate SSO Login
router.get('/login', passport.authenticate('cin-sso'));

// Mock Login for Development
router.get('/mock-login', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Mock login not allowed in production' });
  }

  // Create or get a test user
  const user = {
    id: 'test-user-id',
    email: 'test@cin.ufpe.br',
    name: 'User Teste',
    role: 'STUDENT',
  };

  const token = generateToken(user);
  res.json({ token, user });
});

// SSO Callback
router.get(
  '/callback',
  passport.authenticate('cin-sso', { session: false }),
  (req: any, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication failed' });
    }

    const token = generateToken(req.user);
    
    // Redirect to frontend with token or send it in the response
    // For SPA, redirecting with a query param or setting a cookie is common
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/success?token=${token}`);
  }
);

export default router;
