import { env } from "@/src/config/env";
import { ApiError, normalizeApiError } from "./api-error";

type ApiKind = "master" | "sat";
type Options = Omit<RequestInit, "body"> & {
  body?: unknown;
  authenticated?: boolean;
  timeoutMs?: number;
};
let sessionToken: string | null = null;
let unauthorizedHandler: (() => void | Promise<void>) | null = null;

export const sessionBridge = {
  setToken: (token: string | null) => {
    sessionToken = token;
  },
  onUnauthorized: (handler: () => void | Promise<void>) => {
    unauthorizedHandler = handler;
  },
};

function unwrap<T>(value: unknown): T {
  if (typeof value === "object" && value !== null && "data" in value)
    return (value as { data: T }).data;
  return value as T;
}

export async function request<T>(
  kind: ApiKind,
  path: string,
  options: Options = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 15000,
  );
  const headers = new Headers(options.headers);
  if (options.body !== undefined)
    headers.set("Content-Type", "application/json");
  if (kind === "sat" && options.authenticated !== false && sessionToken)
    headers.set("Authorization", `Bearer ${sessionToken}`);
  try {
    const response = await fetch(
      `${env.origin}${kind === "sat" ? env.satPrefix : env.masterPrefix}${path}`,
      {
        ...options,
        headers,
        signal: options.signal ?? controller.signal,
        body:
          options.body === undefined ? undefined : JSON.stringify(options.body),
      },
    );
    const text = await response.text();
    const body: unknown = text ? JSON.parse(text) : undefined;
    if (!response.ok) {
      if (
        response.status === 401 &&
        kind === "sat" &&
        options.authenticated !== false
      )
        await unauthorizedHandler?.();
      throw normalizeApiError(response.status, body);
    }
    return unwrap<T>(body);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === "AbortError")
      throw new ApiError(408, "The request timed out. Please try again.");
    throw new ApiError(
      0,
      "Unable to connect. Check your network and try again.",
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function requestBinary(path: string): Promise<Blob> {
  const headers = new Headers();
  if (sessionToken) headers.set("Authorization", `Bearer ${sessionToken}`);
  const response = await fetch(`${env.origin}${env.satPrefix}${path}`, {
    headers,
  });
  if (!response.ok)
    throw normalizeApiError(
      response.status,
      await response.json().catch(() => undefined),
    );
  return response.blob();
}

export async function requestMultipart<T>(
  path: string,
  formData: FormData,
  options: Omit<Options, "body"> = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 15000,
  );
  const headers = new Headers(options.headers);
  if (sessionToken) headers.set("Authorization", `Bearer ${sessionToken}`);
  try {
    const response = await fetch(`${env.origin}${env.satPrefix}${path}`, {
      ...options,
      method: "POST",
      headers,
      signal: options.signal ?? controller.signal,
      body: formData,
    });
    const text = await response.text();
    const body: unknown = text ? JSON.parse(text) : undefined;
    if (!response.ok) {
      if (response.status === 401 && options.authenticated !== false)
        await unauthorizedHandler?.();
      throw normalizeApiError(response.status, body);
    }
    return unwrap<T>(body);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === "AbortError")
      throw new ApiError(408, "The request timed out. Please try again.");
    throw new ApiError(
      0,
      "Unable to connect. Check your network and try again.",
    );
  } finally {
    clearTimeout(timeout);
  }
}
