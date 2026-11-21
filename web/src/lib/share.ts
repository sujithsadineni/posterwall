import { toast } from "sonner";

// The phone's share sheet when there is one, else copy the link.
export async function sharePost(title: string, url = location.href) {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title, url });
    } catch {
      /* closed the sheet */
    }
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  } catch {
    toast.error("Couldn't copy the link");
  }
}
