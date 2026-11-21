import DataLoader from "dataloader";
import { and, asc, count, eq, inArray } from "drizzle-orm";
import { db } from "../db.ts";
import { comments, likes, users } from "../db/schema.ts";

export type UserRow = { id: string; username: string; createdAt: Date };
export type CommentRow = { id: string; postId: string; authorId: string; body: string; createdAt: Date };

// Per-request batching: a feed page of 10 posts makes ONE query per field (authors, like counts,
// comment counts, my likes), not one per post. v1 counted with a subquery per post; plain GraphQL would be N+1.
export function createLoaders(viewerId: string | null) {
  const countBy = async (table: typeof likes | typeof comments, ids: readonly string[]) => {
    const rows = await db
      .select({ postId: table.postId, n: count() })
      .from(table)
      .where(inArray(table.postId, [...ids]))
      .groupBy(table.postId);
    const map = new Map(rows.map((r) => [r.postId, r.n]));
    return ids.map((id) => map.get(id) ?? 0);
  };

  return {
    user: new DataLoader<string, UserRow | null>(async (ids) => {
      const rows = await db
        .select({ id: users.id, username: users.username, createdAt: users.createdAt })
        .from(users)
        .where(inArray(users.id, [...ids]));
      const map = new Map(rows.map((r) => [r.id, r]));
      return ids.map((id) => map.get(id) ?? null);
    }),
    likeCount: new DataLoader<string, number>((ids) => countBy(likes, ids)),
    commentCount: new DataLoader<string, number>((ids) => countBy(comments, ids)),
    likedByMe: new DataLoader<string, boolean>(async (ids) => {
      if (!viewerId) return ids.map(() => false);
      const rows = await db
        .select({ postId: likes.postId })
        .from(likes)
        .where(and(eq(likes.userId, viewerId), inArray(likes.postId, [...ids])));
      const mine = new Set(rows.map((r) => r.postId));
      return ids.map((id) => mine.has(id));
    }),
    comments: new DataLoader<string, CommentRow[]>(async (ids) => {
      const rows = await db
        .select()
        .from(comments)
        .where(inArray(comments.postId, [...ids]))
        .orderBy(asc(comments.createdAt), asc(comments.id));
      return ids.map((id) => rows.filter((r) => r.postId === id));
    }),
  };
}
