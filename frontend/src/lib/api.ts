import { useQuery } from '@tanstack/react-query';
import type {
  CraftNode,
  Gift,
  Item,
  ItemCategory,
  Machine,
  NPC,
  Page,
  Recipe,
  SearchResults,
  Sources,
} from './types';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type RawNamed = { name: string; slug: string; description: string };
type RawItem = RawNamed & {
  category: string;
  image_url?: string | null;
  sell_price?: number | null;
};
type RawNPC = RawNamed & {
  birthday_season?: string | null;
  birthday_day?: number | null;
  romanceable?: boolean;
  image_url?: string | null;
};
type RawMachine = RawNamed & { level?: number };
type RawRecipe = {
  slug: string;
  result_item: string;
  result_quantity: number;
  machine: string;
  description: string;
  ingredients: { item: string; quantity: number }[];
};
type RawGift = {
  npc: string;
  item: string;
  preference: Gift['preference'];
  relationship_points: number;
};
type RawSource = {
  item: string;
  source_type: string;
  location?: string | null;
  description: string;
};
type RawCatalog = {
  manifest: { items: number; recipes: number; source: string; translation: string };
  items: RawItem[];
  npcs: RawNPC[];
  machines: RawMachine[];
  recipes: RawRecipe[];
  gifts: RawGift[];
  locations: RawNamed[];
  sources: RawSource[];
};

type Catalog = {
  manifest: RawCatalog['manifest'];
  items: Item[];
  npcs: NPC[];
  machines: Machine[];
  recipes: Recipe[];
  gifts: Gift[];
  sources: RawSource[];
  locations: Map<string, RawNamed & { id: number }>;
  itemsBySlug: Map<string, Item>;
  npcsBySlug: Map<string, NPC>;
  machinesBySlug: Map<string, Machine>;
};

let catalogPromise: Promise<Catalog> | undefined;

const categoryOrder = [
  'Presentes',
  'Consumíveis',
  'Ferramentas',
  'Armas',
  'Vestuário',
  'Acessórios',
  'Materiais',
  'Ingredientes',
  'Peixes',
  'Mobiliário',
  'Relíquias',
  'Armazenamento',
  'Missões',
  'Estações de criação',
  'Outros itens',
];

function indexBySlug<T extends { slug: string }>(rows: T[]) {
  return new Map(rows.map((row) => [row.slug, row]));
}

function notFound(): never {
  throw new ApiError(404, 'Registro não encontrado.');
}

function bySlug<T>(map: Map<string, T>, slug: string): T {
  const value = map.get(slug);
  if (!value) return notFound();
  return value;
}

function includesName(name: string, query: string) {
  return name
    .toLocaleLowerCase('pt-BR')
    .includes(query.trim().toLocaleLowerCase('pt-BR'));
}

function sortByName<T extends { id: number; name: string; slug: string }>(
  rows: T[],
  favorite = '',
) {
  const positions = new Map(
    favorite
      .split(',')
      .filter(Boolean)
      .map((slug, index) => [slug, index]),
  );
  return [...rows].sort((a, b) => {
    const aFavorite = positions.get(a.slug);
    const bFavorite = positions.get(b.slug);
    if (aFavorite !== undefined || bFavorite !== undefined) {
      if (aFavorite === undefined) return 1;
      if (bFavorite === undefined) return -1;
      return aFavorite - bFavorite;
    }
    return a.name.localeCompare(b.name, 'pt-BR') || a.id - b.id;
  });
}

function page<T>(rows: T[], params: URLSearchParams): Page<T> {
  const current = Math.max(1, Number(params.get('page')) || 1);
  const size = Math.min(
    100,
    Math.max(1, Number(params.get('page_size')) || 24),
  );
  return {
    results: rows.slice((current - 1) * size, current * size),
    total: rows.length,
    page: current,
    page_size: size,
  };
}

function recipeFor(catalog: Catalog, item: Item, requestedId?: number) {
  const recipes = catalog.recipes.filter(
    (recipe) => recipe.result_item.slug === item.slug,
  );
  if (requestedId !== undefined) {
    const selected = recipes.find((recipe) => recipe.id === requestedId);
    if (!selected)
      throw new ApiError(422, 'Esta receita não pertence ao item selecionado.');
    return selected;
  }
  return recipes[0];
}

function craftTree(
  catalog: Catalog,
  item: Item,
  quantity: number,
  recipeId?: number,
  path: string[] = [],
  nodes = { value: 0 },
): CraftNode {
  nodes.value += 1;
  if (path.includes(item.slug))
    throw new ApiError(409, `Ciclo de receitas detectado em ${item.name}.`);
  if (path.length >= 50 || nodes.value > 5000)
    throw new ApiError(
      422,
      'Árvore excede o limite de profundidade ou tamanho.',
    );
  const recipe = recipeFor(catalog, item, recipeId);
  if (!recipe)
    return {
      item,
      quantity,
      machine: null,
      recipe_id: null,
      batches: 0,
      produced_quantity: 0,
      ingredients: [],
    };
  if (!recipe.ingredients.length)
    throw new ApiError(409, `Receita de ${item.name} não possui ingredientes.`);
  const batches = Math.ceil(quantity / recipe.result_quantity);
  return {
    item,
    quantity,
    machine: recipe.machine.name,
    recipe_id: recipe.id,
    batches,
    produced_quantity: batches * recipe.result_quantity,
    ingredients: recipe.ingredients.map(
      ({ item: ingredient, quantity: count }) =>
        craftTree(
          catalog,
          ingredient,
          count * batches,
          undefined,
          [...path, item.slug],
          nodes,
        ),
    ),
  };
}

function materialTotals(tree: CraftNode) {
  const totals = new Map<string, number>();
  const visit = (node: CraftNode) => {
    if (!node.ingredients.length)
      totals.set(
        node.item.name,
        (totals.get(node.item.name) || 0) + node.quantity,
      );
    node.ingredients.forEach(visit);
  };
  visit(tree);
  return Object.fromEntries(
    [...totals.entries()].sort(([a], [b]) => a.localeCompare(b, 'pt-BR')),
  );
}

async function loadCatalog(): Promise<Catalog> {
  if (!catalogPromise) {
    catalogPromise = fetch(`${import.meta.env.BASE_URL}data/catalog.json`, {
      headers: { Accept: 'application/json' },
    })
      .then(async (response) => {
        if (!response.ok)
          throw new ApiError(
            response.status,
            'Não foi possível carregar o catálogo.',
          );
        return response.json() as Promise<RawCatalog>;
      })
      .then((raw) => {
        const items = raw.items.map((item, index) => ({
          ...item,
          id: index + 1,
          image_url: item.image_url || null,
          sell_price: item.sell_price ?? null,
        }));
        const npcs = raw.npcs.map((npc, index) => ({
          ...npc,
          id: index + 1,
          birthday_season: npc.birthday_season || null,
          birthday_day: npc.birthday_day || null,
          romanceable: Boolean(npc.romanceable),
          image_url: npc.image_url || null,
        }));
        const machines = raw.machines.map((machine, index) => ({
          ...machine,
          id: index + 1,
          level: machine.level || 1,
        }));
        const locations = new Map(
          raw.locations.map((location, index) => [
            location.slug,
            { ...location, id: index + 1 },
          ]),
        );
        const itemsBySlug = indexBySlug(items);
        const npcsBySlug = indexBySlug(npcs);
        const machinesBySlug = indexBySlug(machines);
        const recipes = raw.recipes.map((recipe, index) => ({
          id: index + 1,
          slug: recipe.slug,
          result_item: bySlug(itemsBySlug, recipe.result_item),
          result_quantity: recipe.result_quantity,
          machine: bySlug(machinesBySlug, recipe.machine),
          description: recipe.description,
          ingredients: recipe.ingredients.map((ingredient) => ({
            item: bySlug(itemsBySlug, ingredient.item),
            quantity: ingredient.quantity,
          })),
        }));
        const gifts = raw.gifts.map((gift, index) => ({
          id: index + 1,
          npc: bySlug(npcsBySlug, gift.npc),
          item: bySlug(itemsBySlug, gift.item),
          preference: gift.preference,
          relationship_points: gift.relationship_points,
        }));
        return {
          manifest: raw.manifest,
          items,
          npcs,
          machines,
          recipes,
          gifts,
          sources: raw.sources,
          locations,
          itemsBySlug,
          npcsBySlug,
          machinesBySlug,
        };
      });
  }
  return catalogPromise;
}

async function resolve(path: string): Promise<unknown> {
  const [pathname, search = ''] = path.split('?');
  const params = new URLSearchParams(search);
  const catalog = await loadCatalog();
  const parts = pathname.split('/').filter(Boolean);
  if (pathname === '/config') return { demo_data: false, catalog: catalog.manifest };
  if (pathname === '/item-categories') {
    const counts = new Map<string, number>();
    catalog.items.forEach((item) =>
      counts.set(item.category, (counts.get(item.category) || 0) + 1),
    );
    return [...counts.entries()]
      .sort(
        ([a], [b]) =>
          categoryOrder.indexOf(a) - categoryOrder.indexOf(b) ||
          a.localeCompare(b, 'pt-BR'),
      )
      .map(([name, count]) => ({ name, count }) satisfies ItemCategory);
  }
  if (pathname === '/categories')
    return [...new Set(catalog.items.map((item) => item.category))];
  if (pathname === '/items') {
    const q = params.get('q') || '';
    const category = params.get('category') || '';
    return page(
      sortByName(
        catalog.items.filter(
          (item) =>
            includesName(item.name, q) &&
            (!category || item.category === category),
        ),
        params.get('favorite') || '',
      ),
      params,
    );
  }
  if (pathname === '/npcs') {
    const q = params.get('q') || '';
    return page(
      sortByName(
        catalog.npcs.filter((npc) => includesName(npc.name, q)),
        params.get('favorite') || '',
      ),
      params,
    );
  }
  if (pathname === '/machines') {
    const q = params.get('q') || '';
    return page(
      sortByName(
        catalog.machines.filter((machine) => includesName(machine.name, q)),
      ),
      params,
    );
  }
  if (pathname === '/shops') return page([], params);
  if (pathname === '/gifts') {
    const npc = params.get('npc') || '';
    const preference = params.get('preference') || '';
    const q = params.get('q') || '';
    const ordered = catalog.gifts
      .filter(
        (gift) =>
          (!npc || gift.npc.slug === npc) &&
          (!preference || gift.preference === preference) &&
          includesName(gift.item.name, q),
      )
      .sort(
        (a, b) =>
          (params.get('order') === 'asc'
            ? a.relationship_points - b.relationship_points
            : b.relationship_points - a.relationship_points) ||
          a.id - b.id,
      );
    return page(ordered, params);
  }
  if (pathname === '/search') {
    const q = params.get('q') || '';
    const results = <T extends { name: string; id: number; slug: string }>(
      rows: T[],
    ) =>
      sortByName(rows.filter((row) => includesName(row.name, q))).slice(0, 8);
    return {
      items: results(catalog.items),
      npcs: results(catalog.npcs),
      machines: results(catalog.machines),
      shops: [],
    } satisfies SearchResults;
  }
  if (parts[0] === 'items' && parts[1]) {
    const item = bySlug(catalog.itemsBySlug, parts[1]);
    if (parts.length === 2) return item;
    const recipes = catalog.recipes.filter(
      (recipe) => recipe.result_item.slug === item.slug,
    );
    if (parts[2] === 'recipes') return recipes;
    if (parts[2] === 'used-in')
      return catalog.recipes.filter((recipe) =>
        recipe.ingredients.some((ingredient) => ingredient.item.slug === item.slug),
      );
    if (parts[2] === 'gifts')
      return catalog.gifts.filter((gift) => gift.item.slug === item.slug);
    if (parts[2] === 'sources') {
      return {
        sources: catalog.sources
          .filter((source) => source.item === item.slug)
          .map((source) => ({
            source_type: source.source_type,
            location: source.location
              ? catalog.locations.get(source.location) || null
              : null,
            description: source.description,
          })),
        shops: [],
      } satisfies Sources;
    }
    if (parts[2] === 'craft-tree' || parts[2] === 'materials') {
      const quantity = Math.min(
        10000,
        Math.max(1, Number(params.get('quantity')) || 1),
      );
      const recipeId = params.has('recipe_id')
        ? Number(params.get('recipe_id'))
        : undefined;
      const tree = craftTree(catalog, item, quantity, recipeId);
      return parts[2] === 'materials' ? materialTotals(tree) : tree;
    }
  }
  if (parts[0] === 'npcs' && parts[1]) {
    const npc = bySlug(catalog.npcsBySlug, parts[1]);
    if (parts.length === 2) return npc;
    if (parts[2] === 'gifts') {
      const preference = params.get('preference');
      return catalog.gifts
        .filter(
          (gift) =>
            gift.npc.slug === npc.slug &&
            (!preference || gift.preference === preference),
        )
        .sort((a, b) => b.relationship_points - a.relationship_points || a.id - b.id);
    }
  }
  if (parts[0] === 'machines' && parts[1]) {
    const machine = bySlug(catalog.machinesBySlug, parts[1]);
    if (parts.length === 2) return machine;
    if (parts[2] === 'recipes')
      return catalog.recipes.filter(
        (recipe) => recipe.machine.slug === machine.slug,
      );
  }
  if (parts[0] === 'shops' && parts[1]) return notFound();
  if (parts[0] === 'locations' && parts[1])
    return bySlug(catalog.locations, parts[1]);
  return notFound();
}

export async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  if (signal?.aborted)
    throw new DOMException('The operation was aborted.', 'AbortError');
  try {
    return (await resolve(path)) as T;
  } catch (error) {
    if (
      error instanceof ApiError ||
      (error instanceof DOMException && error.name === 'AbortError')
    )
      throw error;
    throw new ApiError(0, 'Não foi possível carregar os dados do catálogo.');
  }
}

export function useApi<T>(path: string, enabled = true) {
  return useQuery<T, ApiError>({
    queryKey: ['catalog', path],
    queryFn: ({ signal }) => request<T>(path, signal),
    enabled,
    staleTime: Infinity,
    retry: false,
  });
}

export function queryString(
  values: Record<string, string | number | undefined>,
) {
  const query = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  return query.toString();
}
