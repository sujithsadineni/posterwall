import { Share2 } from "lucide-react";
import { sharePost } from "@/lib/share";
import { cn } from "@/lib/utils";

export function ShareButton({ title, url, className }: { title: string; url?: string; className?: string }) {
  return (
    <button
      type="button"
      aria-label="Share"
      title="Share"
      onClick={() => sharePost(title, url)}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
    >
      <Share2 className="size-[18px]" />
    </button>
  );
}
