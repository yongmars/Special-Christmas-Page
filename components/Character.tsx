import characters from "@/content/characters.json";
import type { Who } from "@/lib/types";

export function Character({ who }: { who: Who }) {
  const character = characters[who];
  return (
    <img className="character" src={character.image} alt={character.name} />
  );
}
