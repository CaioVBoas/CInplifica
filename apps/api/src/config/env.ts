import dotenv from 'dotenv';

dotenv.config();

const getEnv = (name: string, fallback = '') => process.env[name] || fallback;

const parseIntegerEnv = (name: string, fallback: number) => {
  const rawValue = process.env[name];
  if (!rawValue) return fallback;

  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const env = {
  nodeEnv: getEnv('NODE_ENV', 'development'),
  port: getEnv('PORT', '3011'),
  frontendUrl: getEnv('FRONTEND_URL', 'http://localhost:5175'),
  jwtSecret: getEnv('JWT_SECRET'),
  databaseUrl: getEnv('DATABASE_URL'),
  googleClientId: getEnv('GOOGLE_CLIENT_ID'),
  googleClientSecret: getEnv('GOOGLE_CLIENT_SECRET'),
  googleCallbackUrl: getEnv('GOOGLE_CALLBACK_URL', 'http://localhost:3011/api/auth/callback'),
  allowedEmailDomain: getEnv('ALLOWED_EMAIL_DOMAIN', 'cin.ufpe.br'),
  uploadRoot: getEnv('UPLOAD_ROOT', 'uploads'),
  maxUploadBytes: parseIntegerEnv('MAX_UPLOAD_BYTES', 5 * 1024 * 1024),
};

export const isProduction = env.nodeEnv === 'production';

export const requireEnv = (name: keyof typeof env) => {
  const value = env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const productionRequiredEnv: (keyof typeof env)[] = [
  'databaseUrl',
  'frontendUrl',
  'jwtSecret',
  'googleClientId',
  'googleClientSecret',
  'googleCallbackUrl',
];

if (isProduction) {
  for (const name of productionRequiredEnv) {
    requireEnv(name);
  }

  if (env.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must have at least 32 characters in production.');
  }
}
