import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db.ts";
import { LANGUAGES, comments, likes, posts, users } from "../db/schema.ts";
import { badInput, forbidden, fromZod, notFound, unauthenticated } from "./errors.ts";
import type { Context } from "./context.ts";
import type { CommentRow } from "./loaders.ts";
import { posterExists, removePoster } from "../uploads.ts";

type PostRow = typeof posts.$inferSelect;

const id = z.uuid("Not a valid id");
// GraphQL's ENGLISH ↔ the database's 'english': Apollo converts both ways using this map
const LANG = { ENGLISH: "english", UK: "uk", HINDI: "hindi", TELUGU: "telugu", TAMIL: "tamil" } as const;
const postInput = z.object({
  movieTitle: z.string().trim().min(1, "Which movie?").max(120, "At most 120 characters"),
  releaseYear: z
    .number()
    .int()
    .min(1888, "Films start in 1888")
    .max(2100, "That year is too far ahead")
    .nullish(),
  language: z.enum(LANGUAGES), // already the database value by the time a resolver runs
  rating: z.number().int().min(1, "1 to 5 stars").max(5, "1 to 5 stars").nullish(),
  posterPath: z
    .string()
    .nullish()
    .refine((p) => !p || posterExists(p), "Upload the poster again"),
  title: z.string().trim().min(1, "Give it a title").max(120, "At most 120 characters"),
  body: z.string().trim().min(1, "Write something").max(5000, "At most 5,000 characters"),
});
const toRow = ({ releaseYear, rating, posterPath, ...rest }: z.infer<typeof postInput>) => ({
  ...rest,
  releaseYear: releaseYear ?? null,
  rating: rating ?? null,
  posterPath: posterPath ?? null,
});
const commentBody = z.string().trim().min(1, "Write something").max(1000, "At most 1,000 characters");

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const r = schema.safeParse(value);
  if (!r.success) throw fromZod(r.error);
  return r.data;
}
const parseId = (value: unknown) => {
  const r = id.safeParse(value);
  if (!r.success) throw badInput("Not a valid id");
  return r.data;
};
const needUser = (ctx: Context) => {
  if (!ctx.userId) throw unauthenticated();
  return ctx.userId;
};

async function ownPost(ctx: Context, rawId: unknown) {
  const userId = needUser(ctx);
  const [post] = await db
    .select()
    .from(posts)
    .where(eq(posts.id, parseId(rawId)));
  if (!post) throw notFound("Post");
  if (post.authorId !== userId) throw forbidden();
  return post;
}

// Cursor = the last row's exact (created_at, id). created_at is kept as Postgres text so microseconds
// survive (a JS Date would round to milliseconds and skip or repeat posts).
const encodeCursor = (ts: string, postId: string) =>
  Buffer.from(JSON.stringify([ts, postId])).toString("base64url");
function decodeCursor(cursor: string): [string, string] {
  try {
    const [ts, postId] = JSON.parse(Buffer.from(cursor, "base64url").toString());
    if (typeof ts !== "string" || Number.isNaN(Date.parse(ts)) || !id.safeParse(postId).success) throw 0;
    return [ts, postId];
  } catch {
    throw badInput("Bad cursor");
  }
}

export const postResolvers = {
  Query: {
    async feed(
      _: unknown,
      args: { first?: number | null; after?: string | null; language?: (typeof LANGUAGES)[number] | null },
    ) {
      const first = args.first ?? 10;
      if (!Number.isInteger(first) || first < 1 || first > 50) throw badInput("first must be 1–50");
      const after = args.after ? decodeCursor(args.after) : null;
      const rows = await db
        .select({ post: posts, ts: sql<string>`${posts.createdAt}::text` })
        .from(posts)
        .where(
          and(
            args.language ? eq(posts.language, args.language) : undefined,
            after
              ? sql`(${posts.createdAt}, ${posts.id}) < (${after[0]}::timestamptz, ${after[1]}::uuid)`
              : undefined,
          ),
        )
        .orderBy(desc(posts.createdAt), desc(posts.id))
        .limit(first + 1); // one extra tells us whether there's another page
      const page = rows.slice(0, first);
      const last = page.at(-1);
      return {
        nodes: page.map((r) => r.post),
        nextCursor: rows.length > first && last ? encodeCursor(last.ts, last.post.id) : null,
      };
    },
    async post(_: unknown, args: { id: string }) {
      const [post] = await db
        .select()
        .from(posts)
        .where(eq(posts.id, parseId(args.id)));
      return post ?? null;
    },
    async user(_: unknown, args: { username: string }) {
      const [user] = await db
        .select({ id: users.id, username: users.username, createdAt: users.createdAt })
        .from(users)
        .where(sql`lower(${users.username}) = lower(${args.username})`);
      return user ?? null;
    },
  },

  Mutation: {
    async createPost(_: unknown, args: { input: unknown }, ctx: Context) {
      const authorId = needUser(ctx);
      const input = parse(postInput, args.input);
      const [post] = await db
        .insert(posts)
        .values({ ...toRow(input), authorId })
        .returning();
      return post;
    },
    async updatePost(_: unknown, args: { id: string; input: unknown }, ctx: Context) {
      const post = await ownPost(ctx, args.id);
      const input = parse(postInput, args.input);
      const [updated] = await db
        .update(posts)
        .set({ ...toRow(input), updatedAt: new Date() })
        .where(eq(posts.id, post.id))
        .returning();
      if (post.posterPath !== updated.posterPath) await removePoster(post.posterPath);
      return updated;
    },
    async deletePost(_: unknown, args: { id: string }, ctx: Context) {
      const post = await ownPost(ctx, args.id);
      await db.delete(posts).where(eq(posts.id, post.id)); // comments + likes cascade in the database
      await removePoster(post.posterPath);
      return true;
    },
    async toggleLike(_: unknown, args: { postId: string }, ctx: Context) {
      const userId = needUser(ctx);
      const postId = parseId(args.postId);
      const [post] = await db.select().from(posts).where(eq(posts.id, postId));
      if (!post) throw notFound("Post");
      // remove my like if it's there, else add it; the (post, user) primary key makes a double like impossible
      const removed = await db
        .delete(likes)
        .where(and(eq(likes.postId, postId), eq(likes.userId, userId)))
        .returning();
      if (removed.length === 0) await db.insert(likes).values({ postId, userId }).onConflictDoNothing();
      return post;
    },
    async addComment(_: unknown, args: { postId: string; body: unknown }, ctx: Context) {
      const authorId = needUser(ctx);
      const postId = parseId(args.postId);
      const r = commentBody.safeParse(args.body);
      if (!r.success) throw badInput(r.error.issues[0].message, { body: r.error.issues[0].message });
      const [post] = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, postId));
      if (!post) throw notFound("Post");
      const [comment] = await db.insert(comments).values({ postId, authorId, body: r.data }).returning();
      return comment;
    },
    async deleteComment(_: unknown, args: { id: string }, ctx: Context) {
      const userId = needUser(ctx);
      const [comment] = await db
        .select()
        .from(comments)
        .where(eq(comments.id, parseId(args.id)));
      if (!comment) throw notFound("Comment");
      if (comment.authorId !== userId) throw forbidden();
      await db.delete(comments).where(eq(comments.id, comment.id));
      return true;
    },
  },

  Language: LANG,
  Post: {
    posterUrl: (p: PostRow) => (p.posterPath ? `/uploads/${p.posterPath}` : null),
    author: (p: PostRow, _: unknown, ctx: Context) => ctx.loaders.user.load(p.authorId),
    likeCount: (p: PostRow, _: unknown, ctx: Context) => ctx.loaders.likeCount.load(p.id),
    commentCount: (p: PostRow, _: unknown, ctx: Context) => ctx.loaders.commentCount.load(p.id),
    likedByMe: (p: PostRow, _: unknown, ctx: Context) => ctx.loaders.likedByMe.load(p.id),
    comments: (p: PostRow, _: unknown, ctx: Context) => ctx.loaders.comments.load(p.id),
  },
  Comment: {
    author: (c: CommentRow, _: unknown, ctx: Context) => ctx.loaders.user.load(c.authorId),
  },
  User: {
    posts: (u: { id: string }) =>
      db
        .select()
        .from(posts)
        .where(eq(posts.authorId, u.id))
        .orderBy(desc(posts.createdAt), desc(posts.id))
        .limit(50),
  },
};
