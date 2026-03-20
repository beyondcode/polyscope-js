import { describe, expect, it } from "vitest";
import {
  ApiError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  ServerOfflineError,
  ServerTimeoutError,
  ValidationError,
} from "../src/errors.js";

describe("ApiError.fromResponse", () => {
  it("maps 401 to AuthenticationError", () => {
    const err = ApiError.fromResponse(401, {
      message: "bad token",
    });
    expect(err).toBeInstanceOf(AuthenticationError);
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe("bad token");
  });

  it("maps 403 to ForbiddenError", () => {
    const err = ApiError.fromResponse(403, null);
    expect(err).toBeInstanceOf(ForbiddenError);
  });

  it("maps 404 to NotFoundError", () => {
    const err = ApiError.fromResponse(404, null);
    expect(err).toBeInstanceOf(NotFoundError);
  });

  it("maps 422 to ValidationError with errors field", () => {
    const err = ApiError.fromResponse(422, {
      message: "invalid",
      errors: { name: ["required"] },
    });
    expect(err).toBeInstanceOf(ValidationError);
    if (err instanceof ValidationError) {
      expect(err.errors).toEqual({ name: ["required"] });
    }
  });

  it("maps 429 to RateLimitError", () => {
    const err = ApiError.fromResponse(429, null);
    expect(err).toBeInstanceOf(RateLimitError);
  });

  it("maps 503 to ServerOfflineError", () => {
    const err = ApiError.fromResponse(503, null);
    expect(err).toBeInstanceOf(ServerOfflineError);
  });

  it("maps server_offline error code to ServerOfflineError", () => {
    const err = ApiError.fromResponse(418, {
      error: { code: "server_offline", message: "down" },
    });
    expect(err).toBeInstanceOf(ServerOfflineError);
  });

  it("maps 504 to ServerTimeoutError", () => {
    const err = ApiError.fromResponse(504, null);
    expect(err).toBeInstanceOf(ServerTimeoutError);
  });

  it("maps server_timeout error code to ServerTimeoutError", () => {
    const err = ApiError.fromResponse(418, {
      error: { code: "server_timeout", message: "slow" },
    });
    expect(err).toBeInstanceOf(ServerTimeoutError);
  });

  it("uses nested error.message when top-level message missing", () => {
    const err = ApiError.fromResponse(500, {
      error: { code: "x", message: "from nested" },
    });
    expect(err).toBeInstanceOf(ApiError);
    expect(err.message).toBe("from nested");
    expect(err.errorCode).toBe("x");
  });

  it("falls back to generic message for unknown status", () => {
    const err = ApiError.fromResponse(500, null);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.message).toBe("API request failed with status 500");
  });
});
