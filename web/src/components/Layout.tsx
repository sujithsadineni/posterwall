import { LogOut, PenLine, User } from "lucide-react";
import { useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { useApolloClient, useMutation } from "@apollo/client/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserAvatar } from "@/components/UserAvatar";
import { LOG_OUT } from "@/graphql/operations";
import { useMe } from "@/hooks/useMe";
import { DEMO, resetDemo } from "@/lib/transport";

// a new page starts at the top (or at its #anchor, e.g. a card's comment link → #comments)
function useScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView());
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
}

export function Layout() {
  useScrollToTop();
  const { me, loading } = useMe();
  const client = useApolloClient();
  const navigate = useNavigate();
  const [logOut] = useMutation(LOG_OUT);

  const onLogOut = async () => {
    await logOut();
    navigate("/");
    // drop "likedByMe" etc. that belonged to this person; queries the navigation cancels end up here
    await client.resetStore().catch(() => {});
    toast.success("Logged out");
  };

  return (
    <div className="min-h-dvh bg-muted/30">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4">
          <Link to="/" aria-label="PosterWall home" className="mr-auto rounded-md">
            <Logo className="[&>span:last-child]:max-[360px]:sr-only" />
          </Link>
          <ThemeToggle />
          {loading ? null : me ? (
            <>
              <Button asChild size="sm">
                <Link to="/write" aria-label="Post a movie">
                  <PenLine />
                  <span className="hidden sm:inline">Post a movie</span>
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    aria-label={`Account menu for ${me.username}`}
                  >
                    <UserAvatar username={me.username} className="size-8" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel className="font-normal text-muted-foreground">
                    @{me.username}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={`/u/${me.username}`}>
                      <User /> My movies
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={onLogOut}>
                    <LogOut /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </header>
      {DEMO && (
        <div className="border-b bg-star/15 text-sm">
          <p className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2">
            <span>
              <strong>Demo:</strong> everything runs in your browser, and your changes stay on this device.
              Log in as <code>demo</code> / <code>demo1234</code>.
            </span>
            <button
              type="button"
              className="font-medium text-primary underline underline-offset-2 hover:no-underline"
              onClick={async () => {
                await resetDemo?.();
                await client.resetStore().catch(() => {});
                navigate("/");
                toast.success("Demo reset");
              }}
            >
              Reset demo
            </button>
          </p>
        </div>
      )}
      <main id="main" className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-6xl px-4 pb-10 text-center text-xs text-muted-foreground">
        PosterWall · React, GraphQL and PostgreSQL · posters on the demo data are original art ·{" "}
        <a
          className="underline underline-offset-2 hover:text-foreground"
          href="https://github.com/sujithsadineni"
        >
          GitHub
        </a>
      </footer>
    </div>
  );
}
