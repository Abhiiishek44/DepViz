export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, cause?: unknown) {
    super('VALIDATION_ERROR', message, cause);
  }
}

export class AIProviderError extends AppError {
  constructor(message: string, cause?: unknown) {
    super('AI_PROVIDER_ERROR', message, cause);
  }
}

export class TransformError extends AppError {
  constructor(message: string, cause?: unknown) {
    super('TRANSFORM_ERROR', message, cause);
  }
}
