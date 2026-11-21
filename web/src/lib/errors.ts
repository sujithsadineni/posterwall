import { CombinedGraphQLErrors } from "@apollo/client/errors";

// The API's error shape: extensions.code, plus extensions.fields for form errors.
export function apiError(err: unknown): { code?: string; message: string; fields: Record<string, string> } {
  if (CombinedGraphQLErrors.is(err)) {
    const first = err.errors[0];
    const ext = (first?.extensions ?? {}) as { code?: string; fields?: Record<string, string> };
    return { code: ext.code, message: first?.message ?? "Something went wrong", fields: ext.fields ?? {} };
  }
  return { message: "Can't reach the server. Try again.", fields: {} };
}
