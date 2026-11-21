import { Clapperboard } from "lucide-react";
import { cn } from "@/lib/utils";

// 2:3 poster, or a placeholder with the title when nobody uploaded one
export function Poster({
  url,
  movie,
  className,
  eager,
}: {
  url?: string | null;
  movie: string;
  className?: string;
  eager?: boolean;
}) {
  return url ? (
    <img
      src={url}
      alt={`Poster for ${movie}`}
      loading={eager ? "eager" : "lazy"}
      className={cn("aspect-[2/3] w-full bg-muted object-cover", className)}
    />
  ) : (
    <div
      role="img"
      aria-label={`No poster for ${movie}`}
      className={cn(
        "grid aspect-[2/3] w-full place-items-center bg-gradient-to-br from-primary/25 via-muted to-like/20 p-4 text-center",
        className,
      )}
    >
      <span className="grid justify-items-center gap-2 text-muted-foreground">
        <Clapperboard className="size-8" aria-hidden="true" />
        <span className="text-sm font-semibold text-balance">{movie}</span>
      </span>
    </div>
  );
}
