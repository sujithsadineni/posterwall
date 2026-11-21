import { GraphQLError } from "graphql";
import type { ZodError } from "zod";

// One place for the error shapes the web app understands (extensions.code, and fields for forms).
export const badInput = (message: string, fields?: Record<string, string>) =>
  new GraphQLError(message, { extensions: { code: "BAD_USER_INPUT", ...(fields && { fields }) } });

export const unauthenticated = (message = "Log in first") =>
  new GraphQLError(message, { extensions: { code: "UNAUTHENTICATED" } });
export const forbidden = (message = "That isn't yours") =>
  new GraphQLError(message, { extensions: { code: "FORBIDDEN" } });
export const notFound = (what: string) =>
  new GraphQLError(`${what} not found`, { extensions: { code: "NOT_FOUND" } });

// zod errors → { field: first message }, for the forms
export function fromZod(err: ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of err.issues) fields[String(issue.path[0] ?? "form")] ??= issue.message;
  return badInput("Check the highlighted fields", fields);
}
