import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useQuery } from "@apollo/client/react";
import { Button } from "@/components/ui/button";
import { LanguageFilter } from "@/components/LanguageFilter";
import { PostCard, PostCardSkeleton } from "@/components/PostCard";
import { UserAvatar } from "@/components/UserAvatar";
import { FEED } from "@/graphql/operations";
import { useMe } from "@/hooks/useMe";
import { useTitle } from "@/hooks/useTitle";
import { LANGUAGES, languageFromSlug } from "@/lib/languages";

const PAGE = 8; // two rows of four on a wide screen

export function Feed() {
  useTitle();
  const { me } = useMe();
  const [params, setParams] = useSearchParams();
  const language = languageFromSlug(params.get("lang"));
  const { data, loading, error, fetchMore } = useQuery(FEED, { variables: { first: PAGE, language } });
  const [more, setMore] = useState(false);
  const feed = data?.feed;

  const setLanguage = (value?: string) => {
    const slug = LANGUAGES.find((l) => l.value === value)?.slug;
    setParams(slug ? { lang: slug } : {}, { replace: true });
  };
  const loadMore = async () => {
    setMore(true);
    await fetchMore({ variables: { first: PAGE, language, after: feed?.nextCursor } }).finally(() =>
      setMore(false),
    );
  };

  return (
    <div className="grid gap-6">
      <h1 className="sr-only">Movie posters</h1>
      {me ? (
        <Link
          to="/write"
          className="flex items-center gap-3 rounded-2xl border bg-card p-4 text-muted-foreground shadow-xs transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <UserAvatar username={me.username} />
          <span>What did you watch, {me.username}?</span>
        </Link>
      ) : (
        <section className="rounded-2xl border bg-gradient-to-br from-primary/15 via-card to-star/10 p-6 sm:p-8">
          <h2 className="text-2xl font-semibold tracking-tight text-balance">
            Pin the movies you love to the wall
          </h2>
          <p className="mt-1 max-w-prose text-muted-foreground">
            English, UK, Hindi, Telugu and Tamil films. Post a poster, rate it, and talk about it.
          </p>
          <Button asChild className="mt-4">
            <Link to="/signup">Join PosterWall</Link>
          </Button>
        </section>
      )}

      <LanguageFilter value={language} onChange={setLanguage} />

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-destructive"
        >
          Couldn't load the wall. Is the API running?
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
        {loading && !feed && Array.from({ length: 4 }, (_, i) => <PostCardSkeleton key={i} />)}
        {feed?.nodes.map((post, i) => (
          <PostCard key={post.id} post={post} eager={i < 4} />
        ))}
      </div>
      {feed?.nodes.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">
          No movies here yet. Be the first to post one.
        </p>
      )}
      {feed?.nextCursor && (
        <Button variant="outline" className="mx-auto" onClick={loadMore} disabled={more}>
          {more ? "Loading…" : "Load more"}
        </Button>
      )}
    </div>
  );
}
