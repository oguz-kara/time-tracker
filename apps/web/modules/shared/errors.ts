/**
 * Base Error class for all domain errors
 * All custom errors must extend this class
 */
export class BaseError extends Error {
  code: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = this.constructor.name;
    this.code = code || this.constructor.name.replace(/Error$/, '').toUpperCase();
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication & Authorization Errors
 */
export class NotAuthorizedError extends BaseError {
  constructor(message: string = 'You are not authorized to perform this action') {
    super(message, 'NOT_AUTHORIZED');
  }
}

export class NotAuthenticatedError extends BaseError {
  constructor(message: string = 'You must be logged in to perform this action') {
    super(message, 'NOT_AUTHENTICATED');
  }
}

export class ForbiddenError extends BaseError {
  constructor(message: string = 'You do not have permission to perform this action') {
    super(message, 'FORBIDDEN');
  }
}

/**
 * Resource Errors
 */
export class NotFoundError extends BaseError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND');
  }
}

export class AlreadyExistsError extends BaseError {
  constructor(resource: string = 'Resource') {
    super(`${resource} already exists`, 'ALREADY_EXISTS');
  }
}

/**
 * Validation Errors
 */
export class ValidationError extends BaseError {
  constructor(message: string = 'Validation failed') {
    super(message, 'VALIDATION_ERROR');
  }
}

/**
 * Billing Errors
 */
export class NotEnoughCreditsError extends BaseError {
  constructor(message: string = 'You do not have enough credits to perform this action') {
    super(message, 'NOT_ENOUGH_CREDITS');
  }
}

export class SubscriptionRequiredError extends BaseError {
  constructor(message: string = 'This feature requires an active subscription') {
    super(message, 'SUBSCRIPTION_REQUIRED');
  }
}

export class PaymentFailedError extends BaseError {
  constructor(message: string = 'Payment failed. Please try again or update your payment method') {
    super(message, 'PAYMENT_FAILED');
  }
}

/**
 * Rate Limiting Errors
 */
export class RateLimitError extends BaseError {
  constructor(message: string = 'Rate limit exceeded. Please try again later') {
    super(message, 'RATE_LIMIT_EXCEEDED');
  }
}

/**
 * Email Errors
 */
export class EmailSendError extends BaseError {
  constructor(message: string = 'Failed to send email') {
    super(message, 'EMAIL_SEND_ERROR');
  }
}

/**
 * Storage Errors
 */
export class FileTooLargeError extends BaseError {
  constructor(maxSize: number) {
    super(`File size exceeds the maximum allowed size of ${maxSize} bytes`, 'FILE_TOO_LARGE');
  }
}

export class InvalidFileTypeError extends BaseError {
  constructor(allowedTypes: string[]) {
    super(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`, 'INVALID_FILE_TYPE');
  }
}

export class FileUploadError extends BaseError {
  constructor(message: string = 'Failed to upload file') {
    super(message, 'FILE_UPLOAD_ERROR');
  }
}

export class FileDeleteError extends BaseError {
  constructor(message: string = 'Failed to delete file') {
    super(message, 'FILE_DELETE_ERROR');
  }
}

/**
 * AI Errors
 */
export class AIProviderError extends BaseError {
  constructor(message: string = 'AI provider error occurred', options?: { cause?: unknown }) {
    super(message, 'AI_PROVIDER_ERROR');
    if (options?.cause) {
      this.cause = options.cause;
    }
  }
}

/**
 * Generic Server Errors
 */
export class InternalServerError extends BaseError {
  constructor(message: string = 'An internal server error occurred') {
    super(message, 'INTERNAL_SERVER_ERROR');
  }
}

/**
 * Time Tracking Errors
 */
export class AlreadyRunningError extends BaseError {
  runningEntryId: string;
  constructor(runningEntryId: string) {
    super('A timer is already running', 'ALREADY_RUNNING');
    this.runningEntryId = runningEntryId;
  }
}

export class NoRunningTimerError extends BaseError {
  constructor() {
    super('No timer is currently running', 'NO_RUNNING_TIMER');
  }
}

export class OverlapError extends BaseError {
  constructor(message: string = 'Time entry overlaps with an existing entry') {
    super(message, 'OVERLAP');
  }
}

export class InvalidTimeRangeError extends BaseError {
  constructor(message: string = 'stop must be after start') {
    super(message, 'INVALID_TIME_RANGE');
  }
}
