// 404 + centralized error formatter. Must be mounted AFTER all routes.
import ApiError from '../utils/ApiError.js';

const isProd = process.env.NODE_ENV === 'production';

export const notFound = (req, _res, next) => {
  next(ApiError.notFound(`Not Found — ${req.method} ${req.originalUrl}`));
};

/**
 * PostgREST / Postgres errors arrive as `{ code, message, details, hint }`.
 * `message` contains table and column names, so it must never reach a public
 * response body in production — translate the codes we can act on and 500 the
 * rest behind a generic message (the full error still goes to the server log).
 */
function fromPostgREST(err) {
  switch (err.code) {
    case '23505': // unique_violation
      return ApiError.conflict('That record already exists.', { field: err.column || undefined });
    case '23503': // foreign_key_violation
      return ApiError.badRequest('Referenced record does not exist.');
    case '23502': // not_null_violation
      return ApiError.badRequest('A required field is missing.');
    case '23514': // check_violation
      return ApiError.badRequest('One or more values are outside the allowed range.');
    case '22P02': // invalid_text_representation (bad uuid, bad int…)
      return ApiError.badRequest('Invalid identifier format.');
    case '42501': // insufficient_privilege — RLS/grants were revoked for this role
      return ApiError.unavailable('Store data is not reachable with the current key. Check that the API is using the service_role key.');
    default:
      return null;
  }
}

const PG_ERROR_CODE = /^[0-4]\d{4}$/;

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  let error = err;

  // Malformed / oversized JSON body comes straight from body-parser as a 4xx-ish
  // TypeError; map it to a clean 400 instead of a leaky 500.
  if (err?.type === 'entity.parse.failed') error = ApiError.badRequest('Request body is not valid JSON.');
  if (err?.type === 'entity.too.large') error = ApiError.badRequest('Request body is too large.');

  // PostgREST errors: always mapped, but in dev keep the raw message too (it is
  // the fastest way to spot a missing column or an unapplied migration).
  if (PG_ERROR_CODE.test(String(err?.code || ''))) {
    const mapped = fromPostgREST(err) || ApiError.internal('Store data request failed.');
    error = isProd
      ? mapped
      : Object.assign(mapped, { message: `${mapped.message} (${err.code}: ${err.message})` });
  }

  const statusCode = error.statusCode || error.status || (error.name === 'ValidationError' ? 400 : 500);
  const exposeMessage = statusCode < 500 || !isProd;
  const message = exposeMessage ? error.message || 'Request failed' : 'Internal Server Error';

  if (statusCode >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl} → ${statusCode}: ${error.message}`);
    if (!isProd && error.stack) console.error(error.stack.split('\n').slice(1, 6).join('\n'));
  } else if (!isProd) {
    console.warn(`[warn] ${req.method} ${req.originalUrl} → ${statusCode}: ${error.message}`);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(error.details ? { details: error.details } : {}),
    ...(!isProd && statusCode >= 500 && error.stack ? { stack: error.stack } : {}),
  });
};

export default { notFound, errorHandler };
