import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Initials on a colour picked from the username, so each person keeps the same colour everywhere.
function hue(name: string) {
  let h = 0;
  for (const ch of name.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

export function UserAvatar({ username, className }: { username: string; className?: string }) {
  return (
    <Avatar className={cn("size-9", className)} aria-hidden="true">
      <AvatarFallback
        className="font-semibold text-white"
        style={{ backgroundColor: `hsl(${hue(username)} 55% 40%)` }}
      >
        {username.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
