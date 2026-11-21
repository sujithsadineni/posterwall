import { MessageCircle } from "lucide-react";
import { Link } from "react-router";
import { motion } from "motion/react";
import type { PostCardFragment } from "@/gql/graphql";
import { LikeButton } from "@/components/LikeButton";
import { Poster } from "@/components/Poster";
import { ShareButton } from "@/components/ShareButton";
import { Stars } from "@/components/Stars";
import { UserAvatar } from "@/components/UserAvatar";
import { languageLabel } from "@/lib/languages";
import { timeAgo } from "@/lib/time";

// One poster on the wall: the poster with language and stars on it, then the movie, the take and who posted it.
export function PostCard({ post, eager }: { post: PostCardFragment; eager?: boolean }) {
  const href = `/p/${post.id}`;
  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-xs transition-shadow hover:shadow-lg"
    >
      {/* a second way in for mouse and touch; keyboard users get the title link (one tab stop per card) */}
      <Link to={href} tabIndex={-1} className="relative block overflow-hidden">
        <Poster
          url={post.posterUrl}
          movie={post.movieTitle}
          eager={eager}
          className="transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/75 to-transparent p-3 pt-10 text-white">
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold backdrop-blur">
            {languageLabel(post.language)}
          </span>
          {post.rating ? <Stars rating={post.rating} /> : null}
        </span>
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <h2 className="font-semibold leading-tight tracking-tight">
          <Link to={href} className="hover:text-primary focus-visible:text-primary">
            {post.movieTitle}
          </Link>
        </h2>
        <p className="text-xs text-muted-foreground">
          {languageLabel(post.language)}
          {post.releaseYear ? ` · ${post.releaseYear}` : ""}
        </p>
        <p className="line-clamp-2 text-sm text-muted-foreground">“{post.title}”</p>
        <p className="mt-auto flex items-center gap-2 pt-2 text-xs">
          <UserAvatar username={post.author.username} className="size-6 text-[10px]" />
          <Link to={`/u/${post.author.username}`} className="truncate font-medium hover:underline">
            {post.author.username}
          </Link>
          <span className="shrink-0 text-muted-foreground">· {timeAgo(post.createdAt)}</span>
        </p>
      </div>
      <footer className="flex items-center border-t px-1.5 py-1">
        <LikeButton postId={post.id} likeCount={post.likeCount} likedByMe={post.likedByMe} />
        <Link
          to={`${href}#comments`}
          aria-label={`${post.commentCount} ${post.commentCount === 1 ? "comment" : "comments"}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <MessageCircle className="size-[18px]" />
          <span className="tabular-nums">{post.commentCount}</span>
        </Link>
        <ShareButton
          title={`${post.movieTitle}: ${post.title}`}
          url={new URL(import.meta.env.BASE_URL + href.slice(1), location.origin).href}
          className="ml-auto"
        />
      </footer>
    </motion.article>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card" aria-hidden="true">
      <div className="aspect-[2/3] animate-pulse bg-muted" />
      <div className="grid gap-2 p-3.5">
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
