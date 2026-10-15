import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isSupabaseConnected, requireSupabase } from '../config/supabase.js';
import ApiError from '../utils/ApiError.js';
import { sniffImageMime, buildStoredFilename } from '../middleware/upload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'tonto-uploads';

// Only used when Supabase Storage is not configured. Absolute, module-relative
// path: `path.resolve('backend/uploads')` resolved against whatever directory
// the process was started from, which is how `backend/backend/uploads/` came to
// exist when the API was launched from the repo root.
export const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

/**
 * POST /api/uploads (admin, multipart field `image`)
 *
 * multer holds the bytes in memory (see middleware/upload.js), so there is no
 * temp file to leak or to forget to delete. The declared MIME is re-checked
 * against the file's magic bytes before anything is stored: the previous version
 * accepted any `image/*`, including SVG, and reused the client's extension —
 * an uploaded `.html` would then execute against the API origin when opened.
 */
export const uploadImage = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file?.buffer?.length) return next(ApiError.badRequest('No image file provided.'));

    const sniffed = sniffImageMime(file.buffer);
    if (!sniffed) {
      return next(ApiError.badRequest('That file is not a JPEG, PNG, WEBP, AVIF or GIF image.'));
    }

    const filename = buildStoredFilename(sniffed);
    const size = file.buffer.length;

    if (isSupabaseConnected()) {
      try {
        const sb = requireSupabase();
        const { error: uploadError } = await sb.storage
          .from(BUCKET)
          .upload(filename, file.buffer, { contentType: sniffed, upsert: false });
        if (!uploadError) {
          const { data: publicUrl } = sb.storage.from(BUCKET).getPublicUrl(filename);
          if (publicUrl?.publicUrl) {
            return res.status(201).json({ success: true, url: publicUrl.publicUrl, filename, mimetype: sniffed, size });
          }
        }
        console.warn('[upload] Supabase Storage rejected the file, falling back to local disk:', uploadError?.message);
      } catch {
        // Bucket missing / storage disabled — fall through to local disk.
      }
    }

    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOADS_DIR, filename), file.buffer);
    // served by server.js at /uploads (express.static + immutable cache)
    res.status(201).json({ success: true, url: `/uploads/${filename}`, filename, mimetype: sniffed, size });
  } catch (err) {
    next(err);
  }
};

export default { uploadImage, UPLOADS_DIR };
