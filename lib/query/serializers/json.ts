import { Group } from "@/lib/query/types";

// The raw query tree, pretty-printed. This is the canonical export format —
// what import reads back in — so it's just a faithful dump of the structure.
export function toJSON(tree: Group): string {
  return JSON.stringify(tree, null, 2);
}
