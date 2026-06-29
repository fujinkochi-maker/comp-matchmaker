const MAP_POOL = ["Mirage", "Dust", "Inferno", "Cache", "Nuke", "Overpass", "Train"] as const;

export type MapName = (typeof MAP_POOL)[number];

export { MAP_POOL };

const mapImages: Record<string, string> = {};

export function getMapImage(name: string | null | undefined): string | null {
  if (!name) return null;
  return mapImages[name] ?? null;
}
