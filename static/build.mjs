import { build } from "esbuild";
import { mkdir, cp, readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
const repo = process.env.GITHUB_REPOSITORY?.split("/")[1] || "Special-Christmas-Page";
const mount = "/" + repo;
const out = "dist-pages";
await mkdir(out, { recursive: true });
const entries = (await readdir("content/days")).filter(f => /^\d\d\.json$/.test(f)).sort();
const days = await Promise.all(entries.map(async f => JSON.parse(await readFile("content/days/"+f,"utf8"))));
const games = JSON.parse(await readFile("content/games.json","utf8"));
const result = await build({
  entryPoints: { site: "static/entry.tsx" }, outdir: out, entryNames: "[name]-[hash]", metafile:true,
  bundle: true, minify: true, jsx: "automatic", target: "es2020",
  alias: { "@/lib/navigation": path.resolve("static/navigation.tsx") },
  define: { "process.env.NODE_ENV": '"production"', "process.env.NEXT_PUBLIC_PAGES_MOUNT": JSON.stringify(mount) },
});
const files = Object.keys(result.metafile.outputs).map(f => path.basename(f));
const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ノクトとルクスのクリスマス2026</title><meta name="description" content="毎日の贈りものと季節のミニゲームを楽しむクリスマスのお部屋"><link rel="icon" href="${mount}/images/christmas/star.svg"><link rel="stylesheet" href="${mount}/${files.find(f=>f.endsWith(".css"))}"><script defer src="${mount}/${files.find(f=>f.endsWith(".js"))}"></script></head><body><div id="site">クリスマスのお部屋を読み込み中…</div><noscript>JavaScriptを有効にしてお楽しみください。</noscript></body></html>`;
const routes = ["","calendar","games",...days.map(d=>"calendar/"+d.day),...games.map(g=>g.href.slice(1))];
for(const route of routes) {
 const dir=path.join(out,route);await mkdir(dir,{recursive:true});await writeFile(path.join(dir,"index.html"),html);
}
await cp("public",out,{recursive:true});
await cp("assets/christmas",out+"/art",{recursive:true});
await writeFile(out+"/catalog.json",JSON.stringify(days));
await writeFile(out+"/.nojekyll","");
console.log(routes.length+" 画面を "+out+" に出力しました。");
