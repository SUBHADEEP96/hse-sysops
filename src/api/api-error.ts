export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fieldErrors?: FieldErrors,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function normalizeApiError(status: number, value: unknown): ApiError {
  if (typeof value !== "object" || value === null)
    return new ApiError(status, "The server returned an unexpected response.");
  const body = value as Record<string, unknown>;
  const message = [body.message, body.error, body.detail].find(
    (item) => typeof item === "string",
  );
  const fields =
    body.errors && typeof body.errors === "object"
      ? (body.errors as FieldErrors)
      : undefined;
  return new ApiError(
    status,
    typeof message === "string" ? message : "Request failed. Please try again.",
    fields,
  );
}
