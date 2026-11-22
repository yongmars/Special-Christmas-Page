import characters from "@/content/characters.json";
import { publicPath } from "@/lib/public-path";
import type { Who } from "@/lib/types";

export function Character({ who }: { who: Who }) {
  const character = characters[who];
  return (
    <img className="character" src={publicPath(character.image)} alt={character.name} />
  );
}
