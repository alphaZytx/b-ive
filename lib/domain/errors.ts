export class DomainError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code = "DOMAIN_ERROR", status = 400) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string) {
    super(message, "NOT_FOUND", 404);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
  }
}

export class InsufficientCreditsError extends DomainError {
  constructor(message: string) {
    super(message, "INSUFFICIENT_CREDITS", 409);
  }
}
