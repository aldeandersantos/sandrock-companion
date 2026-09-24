export interface Named {
  id: number;
  name: string;
  slug: string;
  description: string;
}
export interface Item extends Named {
  category: string;
  image_url: string | null;
  sell_price: number | null;
}
export interface NPC extends Named {
  birthday_season: string | null;
  birthday_day: number | null;
  romanceable: boolean;
  image_url: string | null;
}
export interface Machine extends Named {
  level: number;
}
export interface Shop extends Named {
  location: Named | null;
}
export interface Recipe {
  id: number;
  slug: string;
  result_item: Item;
  result_quantity: number;
  machine: Machine;
  description: string;
  ingredients: { item: Item; quantity: number }[];
}
export type Preference = 'LOVED' | 'LIKED' | 'NEUTRAL' | 'DISLIKED' | 'HATED';
export interface Gift {
  id: number;
  npc: NPC;
  item: Item;
  preference: Preference;
  relationship_points: number;
}
export interface Page<T> {
  results: T[];
  total: number;
  page: number;
  page_size: number;
}
export interface ItemCategory {
  name: string;
  count: number;
}
export interface SearchResults {
  items: Item[];
  npcs: NPC[];
  machines: Machine[];
  shops: Shop[];
}
export interface CraftNode {
  item: Item;
  quantity: number;
  machine: string | null;
  recipe_id: number | null;
  batches: number;
  produced_quantity: number;
  ingredients: CraftNode[];
}
export interface ShopItem {
  item: Item;
  shop: Shop;
  price: number;
  notes: string;
}
export interface Sources {
  sources: {
    source_type: string;
    location: Named | null;
    description: string;
  }[];
  shops: ShopItem[];
}
export const preferences: Record<Preference, string> = {
  LOVED: 'Ama',
  LIKED: 'Gosta',
  NEUTRAL: 'Neutro',
  DISLIKED: 'Não gosta',
  HATED: 'Odeia',
};
export const seasons: Record<string, string> = {
  Spring: 'Primavera',
  Summer: 'Verão',
  Autumn: 'Outono',
  Winter: 'Inverno',
};
