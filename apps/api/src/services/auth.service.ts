import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from '../services/prisma';
import { env, isProduction } from '../config/env';

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const isAllowedCinEmail = (email: string) => {
  return normalizeEmail(email).endsWith(`@${env.allowedEmailDomain.toLowerCase()}`);
};

export const isGoogleSsoConfigured = Boolean(env.googleClientId && env.googleClientSecret);

if (isProduction && !isGoogleSsoConfigured) {
  throw new Error('Google SSO is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET before starting production.');
}

if (isGoogleSsoConfigured) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.googleClientId,
        clientSecret: env.googleClientSecret,
        callbackURL: env.googleCallbackUrl,
        scope: ['profile', 'email'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const emailEntry = profile.emails?.[0]?.value;
          if (!emailEntry) {
            return done(null, false, { message: 'O Google não retornou um email válido.' });
          }

          const email = normalizeEmail(emailEntry);

          if (!isAllowedCinEmail(email)) {
            return done(null, false, {
              message: `Acesso restrito a estudantes com email @${env.allowedEmailDomain}.`,
            });
          }

          const name = profile.displayName || email.split('@')[0];
          const picture = profile.photos?.[0]?.value ?? null;

          const user = await prisma.user.upsert({
            where: { email },
            update: { name, picture },
            create: {
              email,
              name,
              picture,
              role: 'STUDENT',
            },
          });

          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
}

export default passport;
