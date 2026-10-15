import crypto from 'node:crypto';
import multer from 'multer';
import ApiError from '../utils/ApiError.js';

/**
 * The single multipart config for the API.
 *
 * Two configs used to exist: this one (nothing imported it) and an inline copy
 * in routes/upload.routes.js. The live copy accepted `mimetype.startsWith('image/')`,
 * which includes `image/svg+xml` — an SVG can carry `<script>`, and the stored
 * filename was built from the client's `originalname`, so an upload called
 * `x.html` was written to disk as `x.html` and served back from /uploads with
 * stored-XSS as a result. Both are fixed here:
 *   - explicit MIME allowlist, no prefix matching,
 *   - magic-byte sniffing, because the MIME string comes from the browser,
 *   - filename generated server-side from a random hex + the *sniffed* extension,
 *   - memoryStorage, so a failed upload cannot leave a file on disk.
 */

const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};

// Signature -> declared MIME. Checked before the file is accepted.
const SIGNATURES = [
  { mime: 'image/jpeg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/png', test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { mime: 'image/gif', test: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 },
  {
    mime: 'image/webp',
    test: (b) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
  {
    mime: 'image/avif',
    test: (b) => b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70 && b[8] === 0x61 && b[9] === 0x76 && b[10] === 0x69,
  },
];

export function sniffImageMime(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  const hit = SIGNATURES.find((sig) => sig.test(buffer));
  return hit ? hit.mime : null;
}

const fileFilter = (_req, file, cb) => {
  const ext = ALLOWED[file.mimetype];
  if (!ext) {
    return cb(ApiError.badRequest(`Unsupported image type "${file.mimetype}". Allowed: ${Object.keys(ALLOWED).join(', ')}.`));
  }
  return cb(null, true);
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_BYTES, files: 5 },
});

/** Random, server-controlled name: never derived from the client's filename. */
export function buildStoredFilename(sniffedMime) {
  const ext = ALLOWED[sniffedMime] || 'img';
  return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
}

export const uploadSingle = (field = 'image') => upload.single(field);
export const uploadMultiple = (field = 'images', maxCount = 5) => upload.array(field, maxCount);
export const UPLOAD_MAX_BYTES = MAX_BYTES;
export { ALLOWED as ALLOWED_IMAGE_TYPES };

export default upload;
