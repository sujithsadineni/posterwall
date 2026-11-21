import { posterSvg } from "../../../api/src/db/poster-art.ts";
import { commentData, likeData, movies, people, slug } from "../../../api/src/db/seed-data.ts";

// The demo's "database": the same seed as the real one, kept in this browser's localStorage.
export type User = { id: string; username: string; email: string; passwordHash: string; createdAt: string };
export type Post = {
  id: string;
  authorId: string;
  movieTitle: string;
  releaseYear: number | null;
  language: string;
  rating: number | null;
  posterPath: string | null;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};
export type Comment = { id: string; postId: string; authorId: string; body: string; createdAt: string };
export type Like = { postId: string; userId: string };
export type Data = {
  users: User[];
  posts: Post[];
  comments: Comment[];
  likes: Like[];
  images: Record<string, string>;
  session: string | null;
};

const KEY = "posterwall-demo-v1";
const id = (kind: number, n: number) => `00000000-0000-4000-8${kind}00-${n.toString(16).padStart(12, "0")}`;
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

export async function sha256(text: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function seed(): Promise<Data> {
  const users = await Promise.all(
    people.map(async ([username, password], i) => ({
      id: id(1, i + 1),
      username,
      email: `${username}@example.com`,
      passwordHash: await sha256(password), // demo only; the real API uses scrypt with a salt
      createdAt: hoursAgo(24 * 30),
    })),
  );
  const userId = (name: string) => users.find((u) => u.username === name)!.id;
  const posts = movies.map(([author, movieTitle, releaseYear, language, rating, title, body, h], i) => ({
    id: id(2, i + 1),
    authorId: userId(author),
    movieTitle,
    releaseYear,
    language,
    rating,
    posterPath: `demo-${slug(movieTitle)}.svg`,
    title,
    body,
    createdAt: hoursAgo(h),
    updatedAt: hoursAgo(h),
  }));
  return {
    users,
    posts,
    comments: commentData.map(([i, author, body, h], n) => ({
      id: id(3, n + 1),
      postId: posts[i].id,
      authorId: userId(author),
      body,
      createdAt: hoursAgo(h),
    })),
    likes: likeData.flatMap(([i, who]) => who.map((u) => ({ postId: posts[i].id, userId: userId(u) }))),
    images: {},
    session: null,
  };
}

function load(): Data | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Data) : null;
  } catch {
    return null;
  }
}

let data: Data | null = null;
const ready = (async () => {
  data = load() ?? (await seed());
})();

export async function db(): Promise<Data> {
  await ready;
  return data!;
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage full or blocked: changes last until the tab closes */
  }
}

export async function reset() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing saved */
  }
  data = await seed();
}

// demo posters are drawn on the fly; uploaded ones are data URLs kept with the data
const svgCache = new Map<string, string>();
export function posterUrl(post: Post): string | null {
  if (!post.posterPath) return null;
  if (post.posterPath.startsWith("demo-")) {
    if (!svgCache.has(post.posterPath))
      svgCache.set(
        post.posterPath,
        `data:image/svg+xml;charset=utf-8,${encodeURIComponent(posterSvg(post.movieTitle, post.releaseYear, post.language))}`,
      );
    return svgCache.get(post.posterPath)!;
  }
  return data?.images[post.posterPath] ?? null;
}
