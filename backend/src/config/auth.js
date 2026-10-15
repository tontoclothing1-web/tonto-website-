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
  'admin',
  'password',
  '1234',
];

const MIN_SECRET_LENGTH = 32;
const MIN_PASSCODE_LENGTH = 10;

function resolveJwtSecret() {
  const raw = (process.env.JWT_SECRET || '').trim();
  if (raw.length >= MIN_SECRET_LENGTH && !KNOWN_INSECURE.includes(raw.toLowerCase())) return raw;
  if (IS_PROD) {
    throw new Error(
      `JWT_SECRET must be set to a unique random string of ${MIN_SECRET_LENGTH}+ characters ` +
        '(generate one with `node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"`). ' +
        'Refusing to start with a guessable signing key — anyone holding it can mint admin tokens.'
    );
  }
  if (raw) {
    console.warn(`[auth] JWT_SECRET is too short or a well-known default — ignoring it and using an ephemeral dev key.`);
  }
  return `dev-only-${crypto.randomBytes(24).toString('hex')}`;
}

function resolveAdminPasscode() {
  const raw = (process.env.ADMIN_PASSCODE || '').trim();
  const effective = raw || 'tonto-admin-2026';
  if (IS_PROD) {
    if (effective.length >= MIN_PASSCODE_LENGTH && !KNOWN_INSECURE.includes(effective.toLowerCase())) return effective;
    throw new Error(
      `ADMIN_PASSCODE must be set to a passphrase of ${MIN_PASSCODE_LENGTH}+ characters. ` +
        'Refusing to start with an insecure admin passcode.'
    );
  }
  return effective;
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
