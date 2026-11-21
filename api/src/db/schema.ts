import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const LANGUAGES = ["english", "uk", "hindi", "telugu", "tamil"] as const;
export const language = pgEnum("language", LANGUAGES);

export const users = pgTable(
  "users",
  {
    id: uuid().primaryKey().defaultRandom(),
    username: varchar({ length: 30 }).notNull(),
    email: varchar({ length: 254 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: createdAt(),
  },
  // case-insensitive: "Demo" and "demo" are the same person (v1 allowed both)
  (t) => [
    uniqueIndex("users_username_lower").on(sql`lower(${t.username})`),
    uniqueIndex("users_email_lower").on(sql`lower(${t.email})`),
  ],
);

export const posts = pgTable(
  "posts",
  {
    id: uuid().primaryKey().defaultRandom(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // the movie the post is about
    movieTitle: varchar("movie_title", { length: 120 }).notNull(),
    releaseYear: smallint("release_year"),
    language: language().notNull(),
    rating: smallint(), // 1–5 stars, optional
    posterPath: text("poster_path"), // file name in UPLOAD_DIR, served at /uploads/<name>
    // the post itself
    title: varchar({ length: 120 }).notNull(),
    body: text().notNull(),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // feed: newest first, paged by (created_at, id), optionally within one language; profile: one author's posts
    index("posts_feed").on(t.createdAt.desc(), t.id.desc()),
    index("posts_language_feed").on(t.language, t.createdAt.desc(), t.id.desc()),
    index("posts_author").on(t.authorId),
    // the database refuses impossible values even if a bug in the API let one through
    check("posts_rating_1_to_5", sql`${t.rating} between 1 and 5`),
    check("posts_release_year", sql`${t.releaseYear} between 1888 and 2100`),
  ],
);

export const comments = pgTable(
  "comments",
  {
    id: uuid().primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text().notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("comments_post").on(t.postId, t.createdAt)],
);

export const likes = pgTable(
  "likes",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  // one like per person per post, enforced by the database
  (t) => [primaryKey({ columns: [t.postId, t.userId] }), index("likes_user").on(t.userId)],
);
