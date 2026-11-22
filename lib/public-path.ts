export const mount = process.env.NEXT_PUBLIC_PAGES_MOUNT || "";
export function publicPath(path: string) {
  return path.startsWith("/") ? mount + path : path;
}
