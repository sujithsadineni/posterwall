import { z } from "zod";

// Mirrors api/src/auth/validate.ts and the post rules in api/src/graphql/posts.ts.
// The API still checks everything; these just answer instantly in the form.
export const signUpSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "At least 3 characters")
    .max(30, "At most 30 characters")
    .regex(/^[A-Za-z0-9_]+$/, "Letters, numbers and _ only"),
  email: z.email("Enter a valid email").max(254),
  password: z.string().min(8, "At least 8 characters").max(72, "At most 72 characters"),
});

export const logInSchema = z.object({
  username: z.string().trim().min(1, "Enter your username"),
  password: z.string().min(1, "Enter your password"),
});

const thisYear = new Date().getFullYear();
// form values are strings (inputs and radios); the page converts them for the API
export const postSchema = z.object({
  movieTitle: z.string().trim().min(1, "Which movie?").max(120, "At most 120 characters"),
  releaseYear: z
    .string()
    .trim()
    .refine((v) => v === "" || (/^\d{4}$/.test(v) && +v >= 1888 && +v <= thisYear + 5), "A year like 2022"),
  language: z.enum(["ENGLISH", "UK", "HINDI", "TELUGU", "TAMIL"], { error: "Pick a language" }),
  rating: z.enum(["", "1", "2", "3", "4", "5"]),
  posterPath: z.string().nullable(),
  title: z.string().trim().min(1, "Give it a headline").max(120, "At most 120 characters"),
  body: z.string().trim().min(1, "Write your review").max(5000, "At most 5,000 characters"),
});

export const commentSchema = z.object({
  body: z.string().trim().min(1, "Write something").max(1000, "At most 1,000 characters"),
});
