import { useParams } from "react-router";
import { useQuery } from "@apollo/client/react";
import { NotFound } from "@/components/NotFound";
import { PostCard, PostCardSkeleton } from "@/components/PostCard";
import { UserAvatar } from "@/components/UserAvatar";
import { USER } from "@/graphql/operations";
import { useTitle } from "@/hooks/useTitle";

export function Profile() {
  const { username = "" } = useParams();
  const { data, loading } = useQuery(USER, { variables: { username } });
  const user = data?.user;
  useTitle(user?.username);

  if (loading && !user) return <PostCardSkeleton />;
  if (!user) return <NotFound what="Person" />;

  const joined = new Date(user.createdAt).toLocaleDateString("en", { month: "long", year: "numeric" });
  return (
    <div className="grid gap-6">
      <section className="flex items-center gap-4 rounded-2xl border bg-card p-6 shadow-xs">
        <UserAvatar username={user.username} className="size-16 text-xl" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{user.username}</h1>
          <p className="text-sm text-muted-foreground">
            Joined {joined} · {user.posts.length} {user.posts.length === 1 ? "movie" : "movies"}
          </p>
        </div>
      </section>
      {user.posts.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">No movies posted yet.</p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
        {user.posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
