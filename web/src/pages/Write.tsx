import { useEffect } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { useMutation, useQuery } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Star } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChoiceGroup } from "@/components/ChoiceGroup";
import { Field } from "@/components/Field";
import { NotFound } from "@/components/NotFound";
import { PosterUpload } from "@/components/PosterUpload";
import type { Language } from "@/gql/graphql";
import { CREATE_POST, POST, UPDATE_POST } from "@/graphql/operations";
import { useMe } from "@/hooks/useMe";
import { useTitle } from "@/hooks/useTitle";
import { forgetLists } from "@/lib/apollo";
import { apiError } from "@/lib/errors";
import { LANGUAGES } from "@/lib/languages";
import { postSchema } from "@/lib/validation";

type Values = z.input<typeof postSchema>;
const EMPTY: Values = {
  movieTitle: "",
  releaseYear: "",
  language: "" as Language,
  rating: "",
  posterPath: null,
  title: "",
  body: "",
};
const RATINGS = (["1", "2", "3", "4", "5"] as const).map((n) => ({
  value: n,
  label: `${n} ${n === "1" ? "star" : "stars"}`,
  content: (
    <span className="inline-flex items-center gap-1">
      {n} <Star className="size-3.5 fill-current" aria-hidden="true" />
    </span>
  ),
}));

// /write (new post) and /p/:id/edit (author only)
export function Write() {
  const { id } = useParams();
  const editing = Boolean(id);
  useTitle(editing ? "Edit post" : "Post a movie");
  const { me, loading: meLoading } = useMe();
  const navigate = useNavigate();
  const existing = useQuery(POST, { variables: { id: id ?? "" }, skip: !editing });
  const [createPost] = useMutation(CREATE_POST);
  const [updatePost] = useMutation(UPDATE_POST);
  const form = useForm<Values>({ resolver: zodResolver(postSchema), defaultValues: EMPTY });
  const post = existing.data?.post;
  const title = useWatch({ control: form.control, name: "title" });
  const errors = form.formState.errors;

  useEffect(() => {
    if (post)
      form.reset({
        movieTitle: post.movieTitle,
        releaseYear: post.releaseYear ? String(post.releaseYear) : "",
        language: post.language,
        rating: post.rating ? (String(post.rating) as Values["rating"]) : "",
        posterPath: post.posterUrl?.replace(/^\/uploads\//, "") ?? null,
        title: post.title,
        body: post.body,
      });
  }, [post, form]);

  if (meLoading || (editing && existing.loading)) return null;
  if (!me)
    return (
      <Navigate to={`/login?next=${encodeURIComponent(editing ? `/p/${id}/edit` : "/write")}`} replace />
    );
  if (editing && (!post || post.author.id !== me.id)) return <NotFound what="Post" />;

  const onSubmit = form.handleSubmit(async (v) => {
    const input = {
      movieTitle: v.movieTitle,
      releaseYear: v.releaseYear ? Number(v.releaseYear) : null,
      language: v.language as Language,
      rating: v.rating ? Number(v.rating) : null,
      posterPath: v.posterPath,
      title: v.title,
      body: v.body,
    };
    try {
      const saved = editing
        ? (await updatePost({ variables: { id: id!, input } })).data?.updatePost
        : (await createPost({ variables: { input } })).data?.createPost;
      forgetLists();
      toast.success(editing ? "Saved" : "Pinned to the wall");
      navigate(`/p/${saved!.id}`);
    } catch (e) {
      const err = apiError(e);
      for (const [field, message] of Object.entries(err.fields))
        form.setError(field as keyof Values, { message });
      if (!Object.keys(err.fields).length) toast.error(err.message);
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="mx-auto grid max-w-2xl gap-6 rounded-2xl border bg-card p-6 shadow-xs"
    >
      <h1 className="text-2xl font-semibold tracking-tight">{editing ? "Edit post" : "Post a movie"}</h1>

      <Controller
        control={form.control}
        name="posterPath"
        render={({ field }) => (
          <PosterUpload value={field.value} previewUrl={post?.posterUrl} onChange={field.onChange} />
        )}
      />

      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <Field label="Movie" error={errors.movieTitle?.message}>
          <Input autoFocus maxLength={140} placeholder="e.g. RRR" {...form.register("movieTitle")} />
        </Field>
        <Field label="Year" error={errors.releaseYear?.message}>
          <Input inputMode="numeric" maxLength={4} placeholder="2022" {...form.register("releaseYear")} />
        </Field>
      </div>

      <Controller
        control={form.control}
        name="language"
        render={({ field }) => (
          <ChoiceGroup
            legend="Language"
            name="language"
            options={LANGUAGES.map((l) => ({ value: l.value, label: l.label }))}
            value={field.value}
            onChange={field.onChange}
            error={errors.language?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name="rating"
        render={({ field }) => (
          <ChoiceGroup
            legend="Your rating (optional)"
            name="rating"
            options={
              [{ value: "" as const, label: "No rating" }, ...RATINGS] as {
                value: Values["rating"];
                label: string;
                content?: React.ReactNode;
              }[]
            }
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />

      <Field label="Headline" error={errors.title?.message} hint={`${title.length}/120`}>
        <Input maxLength={140} placeholder="Your take in one line" {...form.register("title")} />
      </Field>
      <Field label="Your review" error={errors.body?.message}>
        <Textarea
          rows={8}
          className="min-h-40"
          placeholder="No spoilers, please."
          {...form.register("body")}
        />
      </Field>

      <div className="flex justify-end gap-2">
        <Button asChild variant="ghost">
          <Link to={editing ? `/p/${id}` : "/"}>Cancel</Link>
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving…" : editing ? "Save" : "Publish"}
        </Button>
      </div>
    </form>
  );
}
