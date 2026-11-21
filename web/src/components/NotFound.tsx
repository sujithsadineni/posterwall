import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { useTitle } from "@/hooks/useTitle";

export function NotFound({ what = "Page" }: { what?: string }) {
  useTitle(`${what} not found`);
  return (
    <div className="py-20 text-center">
      <p className="text-5xl" aria-hidden="true">
        📌
      </p>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">{what} not found</h1>
      <p className="mt-2 text-muted-foreground">It may have been deleted, or the link is wrong.</p>
      <Button asChild className="mt-6">
        <Link to="/">Back to the board</Link>
      </Button>
    </div>
  );
}
