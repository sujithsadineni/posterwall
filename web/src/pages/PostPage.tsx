import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { useMutation, useQuery } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import type { PostQuery } from "@/gql/graphql";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Field } from "@/components/Field";
import { LikeButton } from "@/components/LikeButton";
import { NotFound } from "@/components/NotFound";
import { PostCardSkeleton } from "@/components/PostCard";
import { Poster } from "@/components/Poster";
import { ShareButton } from "@/components/ShareButton";
import { Stars } from "@/components/Stars";
import { languageLabel } from "@/lib/languages";
import { UserAvatar } from "@/components/UserAvatar";
import { ADD_COMMENT, DELETE_COMMENT, DELETE_POST, POST } from "@/graphql/operations";
import { useMe } from "@/hooks/useMe";
import { useTitle } from "@/hooks/useTitle";
import { forgetLists } from "@/lib/apollo";
import { apiError } from "@/lib/errors";
import { fullDate, timeAgo } from "@/lib/time";
import { commentSchema } from "@/lib/validation";

export function PostPage() {
  const { id = "" } = useParams();
  const { me } = useMe();
  const navigate = useNavigate();
  const { data, loading, error } = useQuery(POST, { variables: { id } });
  const [deletePost] = useMutation(DELETE_POST);
  const post = data?.post;
  useTitle(post?.movieTitle);

  if (loading && !post) return <PostCardSkeleton />;
  if (error && apiError(error).code !== "BAD_USER_INPUT")
    return (
      <p role="alert" className="text-destructive">
        Couldn't load this post.
      </p>
    );
  if (!post) return <NotFound what="Post" />;

  const mine = me?.id === post.author.id;
  const edited = new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() > 1000;

  const onDelete = async () => {
    try {
      await deletePost({ variables: { id: post.id } });
      forgetLists();
      toast.success("Post deleted");
      navigate("/");
    } catch (e) {
      toast.error(apiError(e).message);
    }
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-8">
      <Link
        to="/"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Wall
      </Link>
      <article className="grid gap-6 md:grid-cols-[minmax(0,300px)_1fr] md:gap-10">
        <div className="mx-auto w-full max-w-[300px] md:sticky md:top-24 md:self-start">
          <Poster
            url={post.posterUrl}
            movie={post.movieTitle}
            eager
            className="rounded-2xl border shadow-lg"
          />
        </div>
        <div className="grid content-start gap-5">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {languageLabel(post.language)}
              {post.releaseYear ? ` · ${post.releaseYear}` : ""}
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              {post.movieTitle}
            </h1>
            {post.rating ? (
              <Stars rating={post.rating} className="mt-3 text-muted-foreground [&_svg]:size-5" />
            ) : null}
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-xs">
            <header className="flex items-center gap-3">
              <UserAvatar username={post.author.username} />
              <div className="text-sm leading-tight">
                <Link to={`/u/${post.author.username}`} className="font-semibold hover:underline">
                  {post.author.username}
                </Link>
                <p className="text-muted-foreground">
                  <time dateTime={post.createdAt} title={fullDate(post.createdAt)}>
                    {timeAgo(post.createdAt)}
                  </time>
                  {edited && <span title={`Edited ${fullDate(post.updatedAt)}`}> · edited</span>}
                </p>
              </div>
            </header>
            <h2 className="mt-4 text-xl font-semibold tracking-tight text-balance">{post.title}</h2>
            <p className="mt-2 whitespace-pre-line leading-relaxed">{post.body}</p>
            <footer className="mt-5 -ml-3 flex flex-wrap items-center gap-1">
              <LikeButton postId={post.id} likeCount={post.likeCount} likedByMe={post.likedByMe} />
              <ShareButton title={`${post.movieTitle}: ${post.title}`} />
              {mine && (
                <div className="ml-auto flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/p/${post.id}/edit`}>
                      <Pencil /> Edit
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Its poster, comments and likes go with it. This can't be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={onDelete}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </footer>
          </div>
          <Comments postId={post.id} comments={post.comments} />
        </div>
      </article>
    </div>
  );
}

type CommentItem = NonNullable<PostQuery["post"]>["comments"][number];

function Comments({ postId, comments }: { postId: string; comments: CommentItem[] }) {
  const { me } = useMe();
  const location = useLocation();
  const [addComment] = useMutation(ADD_COMMENT, { refetchQueries: ["Post"], awaitRefetchQueries: true });
  const [deleteComment] = useMutation(DELETE_COMMENT, {
    refetchQueries: ["Post"],
    awaitRefetchQueries: true,
  });
  const [busy, setBusy] = useState<string | null>(null);
  const form = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: { body: "" },
  });

  const onSubmit = form.handleSubmit(async ({ body }) => {
    try {
      await addComment({ variables: { postId, body } });
      form.reset();
      forgetLists();
    } catch (e) {
      form.setError("body", { message: apiError(e).message });
    }
  });

  const onDelete = async (id: string) => {
    setBusy(id);
    try {
      await deleteComment({ variables: { id } });
      forgetLists();
    } catch (e) {
      toast.error(apiError(e).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section id="comments" aria-labelledby="comments-title" className="grid gap-4">
      <h2 id="comments-title" className="text-lg font-semibold tracking-tight">
        Comments <span className="text-muted-foreground tabular-nums">({comments.length})</span>
      </h2>
      {me ? (
        <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border bg-card p-4" noValidate>
          <Field label="Add a comment" error={form.formState.errors.body?.message}>
            <Textarea rows={3} placeholder="Be kind." {...form.register("body")} />
          </Field>
          <Button type="submit" className="justify-self-end" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Posting…" : "Comment"}
          </Button>
        </form>
      ) : (
        <p className="rounded-2xl border border-dashed p-4 text-center text-sm">
          <Link
            to={`/login?next=${encodeURIComponent(location.pathname)}`}
            className="font-medium text-primary hover:underline"
          >
            Log in to comment
          </Link>
        </p>
      )}
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <ul className="grid gap-3">
          <AnimatePresence initial={false}>
            {comments.map((c) => (
              <motion.li
                key={c.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-3 rounded-2xl border bg-card p-4"
              >
                <UserAvatar username={c.author.username} className="size-8" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <Link to={`/u/${c.author.username}`} className="font-semibold hover:underline">
                      {c.author.username}
                    </Link>{" "}
                    <time
                      dateTime={c.createdAt}
                      title={fullDate(c.createdAt)}
                      className="text-muted-foreground"
                    >
                      · {timeAgo(c.createdAt)}
                    </time>
                  </p>
                  <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed">{c.body}</p>
                </div>
                {me?.id === c.author.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete comment"
                    disabled={busy === c.id}
                    onClick={() => onDelete(c.id)}
                  >
                    <X />
                  </Button>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}
