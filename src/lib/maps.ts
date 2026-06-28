import officeImg from "@/assets/Office.png";
import stationImg from "@/assets/Station.png";
import workspaceImg from "@/assets/Workspace.png";
import bunkerImg from "@/assets/Bunker.png";
import blizzardsImg from "@/assets/Blizzards Keep.png";

const mapImages: Record<string, string> = {
  "Office": officeImg,
  "OJB Gas Station": stationImg,
  "Workspace": workspaceImg,
  "Bunker": bunkerImg,
  "OJB Bunker": bunkerImg,
  "Blizzards Keep": blizzardsImg,
};

export function getMapImage(name: string | null | undefined): string | null {
  if (!name) return null;
  return mapImages[name] ?? null;
}
