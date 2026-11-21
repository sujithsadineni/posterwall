import { Heart } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMutation } from "@apollo/client/react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { TOGGLE_LIKE } from "@/graphql/operations";
import { useMe } from "@/hooks/useMe";
import { cn } from "@/lib/utils";

type Props = { postId: string; likeCount: number; likedByMe: boolean };

// Optimistic: the heart and count change at once; Apollo rolls back if the server says no.
export function LikeButton({ postId, likeCount, likedByMe }: Props) {
  const { me } = useMe();
  const navigate = useNavigate();
  const location = useLocation();
  const [toggle] = useMutation(TOGGLE_LIKE);

  const onClick = () => {
    if (!me) return navigate(`/login?next=${encodeURIComponent(location.pathname)}`);
    toggle({
      variables: { postId },
      optimisticResponse: {
        __typename: "Mutation",
        toggleLike: {
          __typename: "Post",
          id: postId,
          likedByMe: !likedByMe,
          likeCount: likeCount + (likedByMe ? -1 : 1),
        },
      },
    }).catch(() => toast.error("Couldn't save your like. Try again."));
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={likedByMe}
      aria-label={`Like, ${likeCount} ${likeCount === 1 ? "like" : "likes"}`}
      className={cn(
        "group inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors",
        "hover:bg-like/10 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        likedByMe ? "text-like" : "text-muted-foreground hover:text-like",
      )}
    >
      <motion.span
        key={String(likedByMe)}
        initial={{ scale: likedByMe ? 0.6 : 1 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 15 }}
      >
        <Heart className={cn("size-[18px]", likedByMe && "fill-current")} />
      </motion.span>
      <span className="relative inline-block min-w-[1ch] tabular-nums">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={likeCount}
            className="inline-block"
            initial={{ y: likedByMe ? 8 : -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: likedByMe ? -8 : 8, opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {likeCount}
          </motion.span>
        </AnimatePresence>
      </span>
    </button>
  );
}
