import { SchemaLink } from "@apollo/client/link/schema";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { GraphQLError, GraphQLScalarType } from "graphql";
import typeDefs from "../../../api/src/schema.graphql?raw";
import { signUpSchema } from "@/lib/validation";
import { db, posterUrl, reset, save, sha256, type Comment, type Post } from "./store";

// The GitHub Pages demo: the API's own schema, executed in the browser against the demo store.
// Same error codes and rules as api/src/graphql/*, so every page behaves as it does with the real server.
export const DEMO = true;

const err = (code: string, message: string, fields?: Record<string, string>) =>
  new GraphQLError(message, { extensions: { code, ...(fields && { fields }) } });
const needUser = (userId: string | null) => {
  if (!userId) throw err("UNAUTHENTICATED", "Log in first");
  return userId;
};
const LANG = { ENGLISH: "english", UK: "uk", HINDI: "hindi", TELUGU: "telugu", TAMIL: "tamil" };
const newId = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const byNewest = (a: Post, b: Post) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id);

type PostInput = {
  movieTitle: string;
  releaseYear?: number | null;
  language: string;
  rating?: number | null;
  posterPath?: string | null;
  title: string;
  body: string;
};
async function checkPost(input: PostInput) {
  const d = await db();
  const fields: Record<string, string> = {};
  const movieTitle = input.movieTitle.trim();
  const title = input.title.trim();
  const body = input.body.trim();
  if (!movieTitle) fields.movieTitle = "Which movie?";
  if (!title) fields.title = "Give it a title";
  if (!body) fields.body = "Write something";
  if (title.length > 120) fields.title = "At most 120 characters";
  if (input.rating != null && (input.rating < 1 || input.rating > 5)) fields.rating = "1 to 5 stars";
  if (input.releaseYear != null && (input.releaseYear < 1888 || input.releaseYear > 2100))
    fields.releaseYear = "A year like 2022";
  if (input.posterPath && !d.images[input.posterPath] && !input.posterPath.startsWith("demo-"))
    fields.posterPath = "Upload the poster again";
  if (Object.keys(fields).length) throw err("BAD_USER_INPUT", "Check the highlighted fields", fields);
  return {
    movieTitle,
    title,
    body,
    releaseYear: input.releaseYear ?? null,
    rating: input.rating ?? null,
    language: input.language,
    posterPath: input.posterPath ?? null,
  };
}

const resolvers = {
  DateTime: new GraphQLScalarType({ name: "DateTime", serialize: (v) => String(v) }),
  Language: LANG,
  Query: {
    health: () => ({ api: true, database: true }),
    me: async () => {
      const d = await db();
      return d.users.find((u) => u.id === d.session) ?? null;
    },
    feed: async (_: unknown, args: { first?: number; after?: string | null; language?: string | null }) => {
      const d = await db();
      const first = args.first ?? 10;
      let list = d.posts.filter((p) => !args.language || p.language === args.language).sort(byNewest);
      if (args.after) {
        const i = list.findIndex((p) => p.id === args.after);
        if (i < 0) throw err("BAD_USER_INPUT", "Bad cursor");
        list = list.slice(i + 1);
      }
      const nodes = list.slice(0, first);
      return { nodes, nextCursor: list.length > first ? nodes.at(-1)!.id : null };
    },
    post: async (_: unknown, { id }: { id: string }) => (await db()).posts.find((p) => p.id === id) ?? null,
    user: async (_: unknown, { username }: { username: string }) =>
      (await db()).users.find((u) => u.username.toLowerCase() === username.toLowerCase()) ?? null,
  },
  Mutation: {
    signUp: async (
      _: unknown,
      { input }: { input: { username: string; email: string; password: string } },
    ) => {
      const d = await db();
      const parsed = signUpSchema.safeParse(input);
      if (!parsed.success)
        throw err(
          "BAD_USER_INPUT",
          "Check the highlighted fields",
          Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])),
        );
      const { username, email, password } = parsed.data;
      if (d.users.some((u) => u.username.toLowerCase() === username.toLowerCase()))
        throw err("BAD_USER_INPUT", "That username is taken", { username: "That username is taken" });
      if (d.users.some((u) => u.email.toLowerCase() === email.toLowerCase()))
        throw err("BAD_USER_INPUT", "That email already has an account", {
          email: "That email already has an account",
        });
      const user = { id: newId(), username, email, passwordHash: await sha256(password), createdAt: now() };
      d.users.push(user);
      d.session = user.id;
      save();
      return user;
    },
    logIn: async (_: unknown, { input }: { input: { username: string; password: string } }) => {
      const d = await db();
      const user = d.users.find((u) => u.username.toLowerCase() === input.username.trim().toLowerCase());
      if (!user || user.passwordHash !== (await sha256(input.password)))
        throw err("UNAUTHENTICATED", "Wrong username or password");
      d.session = user.id;
      save();
      return user;
    },
    logOut: async () => {
      (await db()).session = null;
      save();
      return true;
    },
    createPost: async (_: unknown, { input }: { input: PostInput }) => {
      const d = await db();
      const authorId = needUser(d.session);
      const post: Post = {
        id: newId(),
        authorId,
        ...(await checkPost(input)),
        createdAt: now(),
        updatedAt: now(),
      };
      d.posts.push(post);
      save();
      return post;
    },
    updatePost: async (_: unknown, { id, input }: { id: string; input: PostInput }) => {
      const d = await db();
      const post = ownPost(d.posts, id, needUser(d.session));
      const next = await checkPost(input);
      if (post.posterPath && post.posterPath !== next.posterPath) delete d.images[post.posterPath];
      Object.assign(post, next, { updatedAt: now() });
      save();
      return post;
    },
    deletePost: async (_: unknown, { id }: { id: string }) => {
      const d = await db();
      const post = ownPost(d.posts, id, needUser(d.session));
      d.posts = d.posts.filter((p) => p.id !== id);
      d.comments = d.comments.filter((c) => c.postId !== id);
      d.likes = d.likes.filter((l) => l.postId !== id);
      if (post.posterPath) delete d.images[post.posterPath];
      save();
      return true;
    },
    toggleLike: async (_: unknown, { postId }: { postId: string }) => {
      const d = await db();
      const userId = needUser(d.session);
      const post = d.posts.find((p) => p.id === postId);
      if (!post) throw err("NOT_FOUND", "Post not found");
      const mine = d.likes.findIndex((l) => l.postId === postId && l.userId === userId);
      if (mine >= 0) d.likes.splice(mine, 1);
      else d.likes.push({ postId, userId });
      save();
      return post;
    },
    addComment: async (_: unknown, { postId, body }: { postId: string; body: string }) => {
      const d = await db();
      const authorId = needUser(d.session);
      if (!d.posts.some((p) => p.id === postId)) throw err("NOT_FOUND", "Post not found");
      const text = body.trim();
      if (!text) throw err("BAD_USER_INPUT", "Write something", { body: "Write something" });
      const comment: Comment = { id: newId(), postId, authorId, body: text, createdAt: now() };
      d.comments.push(comment);
      save();
      return comment;
    },
    deleteComment: async (_: unknown, { id }: { id: string }) => {
      const d = await db();
      const userId = needUser(d.session);
      const comment = d.comments.find((c) => c.id === id);
      if (!comment) throw err("NOT_FOUND", "Comment not found");
      if (comment.authorId !== userId) throw err("FORBIDDEN", "That isn't yours");
      d.comments = d.comments.filter((c) => c.id !== id);
      save();
      return true;
    },
  },
  Post: {
    author: async (p: Post) => (await db()).users.find((u) => u.id === p.authorId),
    likeCount: async (p: Post) => (await db()).likes.filter((l) => l.postId === p.id).length,
    likedByMe: async (p: Post) => {
      const d = await db();
      return d.likes.some((l) => l.postId === p.id && l.userId === d.session);
    },
    commentCount: async (p: Post) => (await db()).comments.filter((c) => c.postId === p.id).length,
    comments: async (p: Post) =>
      (await db()).comments
        .filter((c) => c.postId === p.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    posterUrl: (p: Post) => posterUrl(p),
  },
  Comment: { author: async (c: Comment) => (await db()).users.find((u) => u.id === c.authorId) },
  User: {
    posts: async (u: { id: string }) => (await db()).posts.filter((p) => p.authorId === u.id).sort(byNewest),
  },
};

function ownPost(posts: Post[], id: string, userId: string) {
  const post = posts.find((p) => p.id === id);
  if (!post) throw err("NOT_FOUND", "Post not found");
  if (post.authorId !== userId) throw err("FORBIDDEN", "That isn't yours");
  return post;
}

export const link = new SchemaLink({ schema: makeExecutableSchema({ typeDefs, resolvers }) });

// "Upload": the image is shrunk in the browser (max 600×900 JPEG) and kept with the demo data.
export async function uploadPoster(file: File): Promise<{ path: string; url: string }> {
  let bitmap: ImageBitmap;
  try {
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) throw 0;
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Use a PNG, JPEG or WebP image");
  }
  const scale = Math.min(1, 600 / bitmap.width, 900 / bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const url = canvas.toDataURL("image/jpeg", 0.82);
  const path = `demo-img-${newId()}`;
  (await db()).images[path] = url;
  save();
  return { path, url };
}

export async function resetDemo() {
  await reset();
}
