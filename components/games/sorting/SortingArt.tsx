import { publicPath } from "@/lib/public-path";
import type { SortingItemId } from "@/lib/sorting";

export const workshopPath = "/images/christmas/sorting/workshop.webp";

const itemFiles = {
  bear: "bear.webp",
  rabbit: "rabbit.webp",
  cat: "cat.webp",
  car: "car.webp",
  train: "train.webp",
  plane: "plane.webp",
  candy: "candy.webp",
  cookie: "cookie.webp",
  chocolate: "chocolate.webp",
} satisfies Record<SortingItemId, string>;

const itemDirectory = "/images/christmas/sorting/";
export const itemImagePaths = Object.values(itemFiles).map(file => itemDirectory + file);

export function ItemArt({ id }: { id: SortingItemId }) {
  return <img src={publicPath(itemDirectory + itemFiles[id])} width={384} height={384} alt="" draggable={false} />;
}
