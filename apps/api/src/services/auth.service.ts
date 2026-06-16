import passport from 'passport';
import { Strategy as OpenIDConnectStrategy } from 'passport-openidconnect';
import prisma from '../services/prisma';
import { env, isProduction } from '../config/env';

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const isAllowedCinEmail = (email: string) => {
  return normalizeEmail(email).endsWith(`@${env.allowedEmailDomain.toLowerCase()}`);
};

const getProfileEmail = (profile: any) => {
  const email = profile?.emails?.[0]?.value || profile?._json?.email;

  if (typeof email !== 'string' || !email.trim()) {
    throw new Error('O SSO do CIn não retornou um email válido.');
  }

  return normalizeEmail(email);
};

const getProfileName = (profile: any, email: string) => {
  return profile?.displayName || profile?._json?.name || email.split('@')[0];
};

const requiredSsoVariables = [
  env.cinSsoClientId,
  env.cinSsoClientSecret,
  env.cinSsoIssuer,
  env.cinSsoAuthorizationUrl,
  env.cinSsoTokenUrl,
  env.cinSsoUserInfoUrl,
  env.cinSsoCallbackUrl,
];

export const isCinSsoConfigured = requiredSsoVariables.every((value) => Boolean(value));

if (isProduction && !isCinSsoConfigured) {
  throw new Error('CIn SSO is not configured. Set CIN_SSO_* environment variables before starting production.');
}

if (isCinSsoConfigured) {
  passport.use(
    'cin-sso',
    new OpenIDConnectStrategy(
      {
        issuer: env.cinSsoIssuer,
        authorizationURL: env.cinSsoAuthorizationUrl,
        tokenURL: env.cinSsoTokenUrl,
        userInfoURL: env.cinSsoUserInfoUrl,
        clientID: env.cinSsoClientId,
        clientSecret: env.cinSsoClientSecret,
        callbackURL: env.cinSsoCallbackUrl,
        scope: ['openid', 'profile', 'email'],
      },
      async (issuer: string, profile: any, done: any) => {
        try {
          const email = getProfileEmail(profile);
          const name = getProfileName(profile, email);

          if (!isAllowedCinEmail(email)) {
            return done(null, false, {
              message: `Acesso restrito a estudantes com email @${env.allowedEmailDomain}.`,
            });
          }

          const user = await prisma.user.upsert({
            where: { email },
            update: { name },
            create: {
              email,
              name,
              role: 'STUDENT',
            },
          });

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
}

export default passport;
