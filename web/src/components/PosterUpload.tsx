import { useId, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadPoster } from "@/lib/transport";

const MAX = 3 * 1024 * 1024;

// Picks an image, uploads it straight away and hands back the stored path (see lib/transport).
export function PosterUpload({
  value,
  previewUrl,
  onChange,
}: {
  value: string | null;
  previewUrl?: string | null;
  onChange: (path: string | null) => void;
}) {
  const id = useId();
  const [preview, setPreview] = useState<string | null>(previewUrl ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (file?: File) => {
    if (!file) return;
    setError(null);
    if (file.size > MAX) return setError("Images up to 3 MB");
    setBusy(true);
    try {
      const { path, url } = await uploadPoster(file);
      setPreview(url);
      onChange(path);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium">Poster</span>
      <div className="flex items-start gap-4">
        <label
          htmlFor={id}
          className="relative grid aspect-[2/3] w-32 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-xl border-2 border-dashed bg-muted/50 text-muted-foreground transition-colors hover:border-primary/50 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            pick(e.dataTransfer.files[0]);
          }}
        >
          {preview && value ? (
            <img src={preview} alt="Poster preview" className="size-full object-cover" />
          ) : (
            <span className="grid justify-items-center gap-1 p-2 text-center text-xs">
              {busy ? (
                <Loader2 className="size-6 animate-spin" aria-hidden="true" />
              ) : (
                <ImagePlus className="size-6" aria-hidden="true" />
              )}
              {busy ? "Uploading…" : "Add a poster"}
            </span>
          )}
          <input
            id={id}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            aria-label="Poster image"
            aria-describedby={`${id}-help`}
            className="sr-only"
            onChange={(e) => {
              pick(e.target.files?.[0]);
              e.target.value = ""; // picking the same file again still triggers
            }}
          />
        </label>
        <div className="grid gap-2 text-sm">
          <p id={`${id}-help`} className="text-muted-foreground">
            PNG, JPEG or WebP, up to 3 MB. Tall images (2:3) look best.
          </p>
          {error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
          {value && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => onChange(null)}
            >
              <X /> Remove poster
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
