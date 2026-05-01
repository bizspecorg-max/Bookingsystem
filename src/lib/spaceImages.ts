import space1 from "@/assets/space-1.jpg";
import space2 from "@/assets/space-2.jpg";
import space3 from "@/assets/space-3.jpg";
import space4 from "@/assets/space-4.jpg";
import space5 from "@/assets/space-5.jpg";
import space6 from "@/assets/space-6.jpg";

// Map space names to local images as fallback
const imageMap: Record<string, string> = {
  "The Greenhouse Studio": space1,
  "Skyline Loft": space2,
  "The Workshop": space3,
  "Zen Garden Room": space4,
  "The Gallery": space5,
  "Coastal Studio": space6,
};

const fallbackImages = [space1, space2, space3, space4, space5, space6];

export function getSpaceImage(name: string, imageUrl: string | null, index: number): string {
  if (imageUrl) return imageUrl;
  return imageMap[name] || fallbackImages[index % fallbackImages.length];
}
