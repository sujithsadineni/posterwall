import { cn } from "@/lib/utils";

// Mark + wordmark. The mark is the same drawing as public/favicon.svg.
export function Logo({ className, showName = true }: { className?: string; showName?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 64 64" className="size-9 shrink-0" aria-hidden="true">
        <rect width="64" height="64" rx="14" fill="#1E1B4B" />
        <rect x="7" y="17" width="20" height="29" rx="3" fill="#FB7185" transform="rotate(-10 17 31.5)" />
        <rect x="37" y="17" width="20" height="29" rx="3" fill="#818CF8" transform="rotate(10 47 31.5)" />
        <rect x="20" y="11" width="24" height="35" rx="3.5" fill="#F59E0B" />
        <rect x="20" y="40" width="24" height="6" fill="#D97706" />
        <path d="M29 21.5v11l9-5.5z" fill="#FFFFFF" />
        <rect x="12" y="52" width="40" height="3" rx="1.5" fill="#4338CA" />
      </svg>
      {showName ? (
        <span className="font-heading text-xl font-semibold tracking-tight">
          Poster<span className="text-primary">Wall</span>
        </span>
      ) : (
        <span className="sr-only">PosterWall</span>
      )}
    </span>
  );
}
