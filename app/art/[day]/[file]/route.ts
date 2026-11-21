import { readFile } from "node:fs/promises";
import path from "node:path";
import { artFiles, readDay, release } from "@/lib/catalog";
import { tokyoDate, validDate } from "@/lib/season";
export const dynamic = "force-dynamic";
const mime: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
};
export async function GET(
  req: Request,
  { params }: { params: Promise<{ day: string; file: string }> },
) {
  const { day, file } = await params;
  const miss = () =>
    new Response(null, {
      status: 404,
      headers: { "Cache-Control": "private, no-store" },
    });
  if (!/^([1-9]|1\d|2[0-5])$/.test(day) || /[\\/]/.test(file)) return miss();
  const date = new URL(req.url).searchParams.get("preview");
  const preview = process.env.NODE_ENV === "development" && validDate(date);
  const entry = await readDay(Number(day));
  if (
    (preview ? date! : tokyoDate(Date.now())) < release(entry) ||
    !artFiles(entry, preview).includes(file)
  )
    return miss();
  const type = mime[path.extname(file).toLowerCase()];
  if (!type) return miss();
  try {
    const bytes = await readFile(
      path.join(
        process.cwd(),
        "assets",
        "christmas",
        day.padStart(2, "0"),
        file,
      ),
    );
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy":
          "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      },
    });
  } catch {
    return miss();
  }
}
