import type { AnchorHTMLAttributes } from "react";
type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean };
export function Link({ prefetch, ...props }: Props) {
  return <a {...props} />;
}
const router = { refresh() { window.dispatchEvent(new Event("refresh-season-date")); } };
export function useRouter() { return router; }
