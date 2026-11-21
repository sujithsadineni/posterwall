import { z } from "zod";

// The same rules are mirrored in the web forms; the API is the one that's trusted.
export const username = z
  .string()
  .trim()
  .min(3, "At least 3 characters")
  .max(30, "At most 30 characters")
  .regex(/^[A-Za-z0-9_]+$/, "Letters, numbers and _ only");

export const signUpInput = z.object({
  username,
  email: z.email("Enter a valid email").max(254),
  // 72: the most a password hash input usually needs; stops megabyte "passwords"
  password: z.string().min(8, "At least 8 characters").max(72, "At most 72 characters"),
});

export const logInInput = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1).max(72),
});
