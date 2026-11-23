import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
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
  ".mp4": "video/mp4",
};

async function videoResponse(file: string, range: string | null, headers: Headers) {
  const { size } = await stat(file);
  headers.set("Accept-Ranges", "bytes");
  let start = 0;
  let end = size - 1;
  if (range !== null) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (match && match[1]) {
      start = Number(match[1]);
      if (match[2]) end = Math.min(end, Number(match[2]));
    } else if (match?.[2]) {
      start = Math.max(0, size - Number(match[2]));
    } else {
      start = size;
    }
    if (!Number.isSafeInteger(start) || start > end) {
      headers.set("Content-Range", `bytes */${size}`);
      return new Response(null, { status: 416, headers });
    }
    headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  }
  headers.set("Content-Length", String(end - start + 1));
  const stream = Readable.toWeb(createReadStream(file, { start, end }));
  return new Response(stream as ReadableStream<Uint8Array>, { status: range === null ? 200 : 206, headers });
}

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
  const filePath = path.join(process.cwd(), "assets", "christmas", day.padStart(2, "0"), file);
  const headers = new Headers({
    "Content-Type": type,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
  });
  try {
    if (type === "video/mp4") return await videoResponse(filePath, req.headers.get("range"), headers);
    return new Response(new Uint8Array(await readFile(filePath)), { headers });
  } catch {
    return miss();
  }
}
