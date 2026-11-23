import http from "node:http";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import path from "node:path";

export async function servePages() {
  const mount = "/" + (process.env.GITHUB_REPOSITORY?.split("/")[1] || "Special-Christmas-Page");
  const root = path.resolve("dist-pages");
  const types = { ".html": "text/html", ".json": "application/json", ".js": "text/javascript",
    ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp" };
  const server = http.createServer(async (req, res) => {
    try {
      const pathname = new URL(req.url, "http://localhost").pathname;
      if (!pathname.startsWith(mount + "/")) throw Error();
      let file = path.resolve(root, "." + pathname.slice(mount.length));
      if (file !== root && !file.startsWith(root + path.sep)) throw Error();
      if (!path.extname(file)) file = path.join(file, "index.html");
      const body = await readFile(file);
      res.writeHead(200, { "Content-Type": types[path.extname(file)] ?? "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = "http://127.0.0.1:" + server.address().port + mount;
  return { base, server };
}
