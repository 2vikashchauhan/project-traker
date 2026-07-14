export abstract class AppError extends Error {
  abstract statusCode: number;
  abstract errorType: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  statusCode = 400;
  errorType = "ValidationError";
  fieldErrors: { field: string; message: string }[];

  constructor(message: string, fieldErrors: { field: string; message: string }[] = []) {
    super(message);
    this.fieldErrors = fieldErrors;
  }
}

export class NotFoundError extends AppError {
  statusCode = 404;
  errorType = "NotFoundError";
  resourceType: string;

  constructor(resourceType: string, identifier?: string) {
    const message = identifier
      ? `${resourceType} with identifier '${identifier}' was not found`
      : `${resourceType} was not found`;
    super(message);
    this.resourceType = resourceType;
  }
}

export class ConflictError extends AppError {
  statusCode = 409;
  errorType = "ConflictError";

  constructor(message: string) {
    super(message);
  }
}

export class TransitionError extends AppError {
  statusCode = 400;
  errorType = "TransitionError";
  currentStatus: string;
  attemptedStatus: string;
  allowedTransitions: string[];

  constructor(
    currentStatus: string,
    attemptedStatus: string,
    allowedTransitions: string[]
  ) {
    const message = `Cannot transition from '${currentStatus}' to '${attemptedStatus}'. Allowed transitions: ${allowedTransitions.join(", ") || "none"}`;
    super(message);
    this.currentStatus = currentStatus;
    this.attemptedStatus = attemptedStatus;
    this.allowedTransitions = allowedTransitions;
  }
}
