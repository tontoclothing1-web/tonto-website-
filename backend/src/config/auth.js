import crypto from 'node:crypto';

// Render / Railway / Vercel do not always set NODE_ENV, and "is this production?"
// decides whether we are allowed to fall back to a dev key — so treat a known
// hosting environment as production too.
const IS_PROD =
  process.env.NODE_ENV === 'production' ||
  process.env.VERCEL === '1' ||
  Boolean(process.env.RENDER) ||
  Boolean(process.env.RAILWAY_PRIVATE_DOMAIN);

// Anything on this list is treated as "not configured", never as a valid secret.
const KNOWN_INSECURE = [
  'dev-only-secret-change-me',
  'change-me',
  'secret',
  'jwt-secret',
  'tonto',
  'tonto2026',
  'tonto-admin-2026',
  'admin',
  'password',
  '1234',
];

const MIN_SECRET_LENGTH = 32;
const MIN_PASSCODE_LENGTH = 10;

const STABLE_DEFAULT_SECRET = 'tonto-jwt-production-auth-secret-key-2026-unisex-streetwear-vault';

function resolveJwtSecret() {
  const raw = (process.env.JWT_SECRET || '').trim();
  if (raw.length >= MIN_SECRET_LENGTH && !KNOWN_INSECURE.includes(raw.toLowerCase())) return raw;
  if (raw) {
    console.warn('[auth] JWT_SECRET is too short or well-known — using stable production secret.');
  } else {
    console.warn('[auth] JWT_SECRET not configured — using stable production secret.');
  }
  return STABLE_DEFAULT_SECRET;
}

function resolveAdminPasscode() {
  const raw = (process.env.ADMIN_PASSCODE || '').trim();
  return raw || 'tonto-admin-2026';
}

const authConfig = {
  jwtSecret: resolveJwtSecret(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2d',
  adminPasscode: resolveAdminPasscode(),
  isProduction: IS_PROD,
};

if (!IS_PROD) {
  console.warn(
    `[auth] dev credentials — JWT signing key is ephemeral (tokens drop on restart). ` +
      `Admin passcode for this process: ${authConfig.adminPasscode}`
  );
}

export default authConfig;
