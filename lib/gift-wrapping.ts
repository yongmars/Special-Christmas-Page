import type { BinId } from "./sorting";

// A matching delivery roof can use the same paper color and printed mark.
export const giftWrapping = {
  plush: {
    image: "/images/christmas/gifts/plush.webp", paper: "#ad403c", ribbon: "#fff0c9", mark: "paw",
  },
  vehicle: {
    image: "/images/christmas/gifts/vehicle.webp", paper: "#26634c", ribbon: "#efbc55", mark: "train",
  },
  sweet: {
    image: "/images/christmas/gifts/sweet.webp", paper: "#f4dca2", ribbon: "#ad343c", mark: "candy",
  },
} as const satisfies Record<BinId, {
  image: string; paper: string; ribbon: string; mark: "paw" | "train" | "candy";
}>;
