import characters from "@/content/characters.json";
import { publicPath } from "@/lib/public-path";
import type { Who } from "@/lib/types";

export function Character({ who, mirrored = false }: { who: Who; mirrored?: boolean }) {
  const character = characters[who];
  const image = mirrored ? character.mirroredImage : character.image;
  return (
    <img className="character" src={publicPath(image)} alt={character.name} />
  );
}
