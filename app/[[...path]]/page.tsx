import { notFound } from "next/navigation";
import { context, games, readDay } from "@/lib/catalog";
import { Site } from "@/components/Site";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const parts = (await params).path || [];
  const preview = parts[0] === "dev" && parts[1] === "preview";
  if (preview && process.env.NODE_ENV !== "development") notFound();
  const route = preview ? parts.slice(2) : parts;
  const ctx = await context(preview, (await searchParams).date);
  const [section, id] = route;
  const game = games.find((g) => g.href === "/" + route.join("/"));
  const day =
    section === "calendar" && id && /^([1-9]|1\d|2[0-5])$/.test(id)
      ? Number(id)
      : 0;
  if (
    route.length > 2 ||
    (section &&
      !(section === "calendar" && (!id || day)) &&
      !game &&
      !(section === "games" && !id))
  )
    notFound();
  const entry =
    day && ctx.doors[day - 1].available ? await readDay(day) : undefined;
  return (
    <Site
      ctx={ctx}
      section={section || "home"}
      day={day}
      entry={entry || undefined}
      game={game}
      games={games}
    />
  );
}
