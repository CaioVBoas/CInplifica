import passport from 'passport';
import { Strategy as OpenIDConnectStrategy } from 'passport-openidconnect';
import prisma from '../services/prisma';

// These should be in .env
const CIN_SSO_CLIENT_ID = process.env.CIN_SSO_CLIENT_ID || 'placeholder';
const CIN_SSO_CLIENT_SECRET = process.env.CIN_SSO_CLIENT_SECRET || 'placeholder';
const CIN_SSO_ISSUER = process.env.CIN_SSO_ISSUER || 'https://sso.cin.ufpe.br';
const CALLBACK_URL = process.env.CALLBACK_URL || 'http://localhost:3011/api/auth/callback';

passport.use(
  'cin-sso',
  new OpenIDConnectStrategy(
    {
      issuer: CIN_SSO_ISSUER,
      authorizationURL: `${CIN_SSO_ISSUER}/auth`,
      tokenURL: `${CIN_SSO_ISSUER}/token`,
      userInfoURL: `${CIN_SSO_ISSUER}/me`,
      clientID: CIN_SSO_CLIENT_ID,
      clientSecret: CIN_SSO_CLIENT_SECRET,
      callbackURL: CALLBACK_URL,
      scope: ['openid', 'profile', 'email'],
    },
    async (issuer: string, profile: any, done: any) => {
      try {
        const email = profile.emails[0].value;
        const name = profile.displayName;

        let user = await prisma.user.upsert({
          where: { email },
          update: { name },
          create: {
            email,
            name,
            role: 'STUDENT', // Default role, can be refined based on SSO claims
          },
        });

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

export default passport;
