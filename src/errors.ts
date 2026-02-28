import type { ApiErrorResponse } from "./types.js";

export class PolyscopeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PolyscopeError";
  }
}

export class MissingApiTokenError extends PolyscopeError {
  constructor() {
    super(
      "No Polyscope API token provided. Pass it to the constructor or set it in your settings file.",
    );
    this.name = "MissingApiTokenError";
  }
}

export class ApiError extends PolyscopeError {
  readonly statusCode: number;
  readonly errorCode: string | null;
  readonly responseBody: ApiErrorResponse | null;

  constructor(
    message: string,
    statusCode: number,
    responseBody: ApiErrorResponse | null = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errorCode = responseBody?.error?.code ?? null;
    this.responseBody = responseBody;
  }

  static fromResponse(
    statusCode: number,
    body: ApiErrorResponse | null,
  ): ApiError {
    const message =
      body?.message ?? body?.error?.message ?? `API request failed with status ${statusCode}`;
    const errorCode = body?.error?.code ?? null;

    if (statusCode === 401) {
      return new AuthenticationError(message, body);
    }

    if (statusCode === 403) {
      return new ForbiddenError(message, body);
    }

    if (statusCode === 404) {
      return new NotFoundError(message, body);
    }

    if (statusCode === 422) {
      return new ValidationError(message, body?.errors ?? {}, body);
    }

    if (statusCode === 429) {
      return new RateLimitError(message, body);
    }

    if (statusCode === 503 || errorCode === "server_offline") {
      return new ServerOfflineError(message, body);
    }

    if (statusCode === 504 || errorCode === "server_timeout") {
      return new ServerTimeoutError(message, body);
    }

    return new ApiError(message, statusCode, body);
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string, responseBody: ApiErrorResponse | null = null) {
    super(message, 401, responseBody);
    this.name = "AuthenticationError";
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string, responseBody: ApiErrorResponse | null = null) {
    super(message, 403, responseBody);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string, responseBody: ApiErrorResponse | null = null) {
    super(message, 404, responseBody);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends ApiError {
  readonly errors: Record<string, string[]>;

  constructor(
    message: string,
    errors: Record<string, string[]>,
    responseBody: ApiErrorResponse | null = null,
  ) {
    super(message, 422, responseBody);
    this.name = "ValidationError";
    this.errors = errors;
  }
}

export class RateLimitError extends ApiError {
  readonly rateLimitResetsAt: number | null;

  constructor(message: string, responseBody: ApiErrorResponse | null = null) {
    super(message, 429, responseBody);
    this.name = "RateLimitError";
    this.rateLimitResetsAt = null;
  }
}

export class ServerOfflineError extends ApiError {
  constructor(message: string, responseBody: ApiErrorResponse | null = null) {
    super(message, 503, responseBody);
    this.name = "ServerOfflineError";
  }
}

export class ServerTimeoutError extends ApiError {
  constructor(message: string, responseBody: ApiErrorResponse | null = null) {
    super(message, 504, responseBody);
    this.name = "ServerTimeoutError";
  }
}
