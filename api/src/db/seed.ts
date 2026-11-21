import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { db, pool } from "../db.ts";
import { comments, likes, posts, users } from "./schema.ts";
import { hashPassword } from "../auth/password.ts";
import { uploadDir } from "../uploads.ts";
import { posterSvg } from "./poster-art.ts";
import { commentData, likeData, movies, people, slug } from "./seed-data.ts";

// Demo data for local development. Wipes all four tables first, so never run it against real data.
// Real films, original opinions, and poster art drawn by poster-art.ts (no real posters).
if (process.env.NODE_ENV === "production") throw new Error("refusing to seed in production");

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000);

// poster files first (served from UPLOAD_DIR like uploads; .svg only ever comes from here)
for (const [, movie, year, language] of movies)
  await writeFile(join(uploadDir, `demo-${slug(movie)}.svg`), posterSvg(movie, year, language));

await db.transaction(async (tx) => {
  await tx.delete(likes);
  await tx.delete(comments);
  await tx.delete(posts);
  await tx.delete(users);

  const inserted = await tx
    .insert(users)
    .values(
      await Promise.all(
        people.map(async ([username, password]) => ({
          username,
          email: `${username}@example.com`,
          passwordHash: await hashPassword(password),
        })),
      ),
    )
    .returning({ id: users.id, username: users.username });
  const userId = Object.fromEntries(inserted.map((u) => [u.username, u.id]));

  const insertedPosts = await tx
    .insert(posts)
    .values(
      movies.map(([author, movieTitle, releaseYear, language, rating, title, body, h]) => ({
        authorId: userId[author],
        movieTitle,
        releaseYear,
        language,
        rating,
        posterPath: `demo-${slug(movieTitle)}.svg`,
        title,
        body,
        createdAt: hoursAgo(h),
        updatedAt: hoursAgo(h),
      })),
    )
    .returning({ id: posts.id });

  await tx.insert(comments).values(
    commentData.map(([i, author, body, h]) => ({
      postId: insertedPosts[i].id,
      authorId: userId[author],
      body,
      createdAt: hoursAgo(h),
    })),
  );
  await tx
    .insert(likes)
    .values(
      likeData.flatMap(([i, who]) => who.map((u) => ({ postId: insertedPosts[i].id, userId: userId[u] }))),
    );
});

console.log(
  `seeded ${people.length} users, ${movies.length} movie posts (with posters), ${commentData.length} comments, ${likeData.reduce((n, [, w]) => n + w.length, 0)} likes`,
);
await pool.end();
