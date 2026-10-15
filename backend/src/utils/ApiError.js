class ApiError extends Error {
  constructor(statusCode = 500, message = 'Internal Server Error', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    // Optional machine-readable extras (field name, duplicate key…) — only ever
    // attached deliberately, never copied from a raw driver error.
    if (details) this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(msg = 'Bad request', details) {
    return new ApiError(400, msg, details);
  }

  static unauthorized(msg = 'Unauthorized') {
    return new ApiError(401, msg);
  }

  static forbidden(msg = 'Forbidden') {
    return new ApiError(403, msg);
  }

  static notFound(msg = 'Not found') {
    return new ApiError(404, msg);
  }

  static conflict(msg = 'Conflict', details) {
    return new ApiError(409, msg, details);
  }

  static unavailable(msg = 'Service unavailable') {
    return new ApiError(503, msg);
  }

  static internal(msg = 'Internal Server Error') {
    return new ApiError(500, msg);
  }
}

export default ApiError;
