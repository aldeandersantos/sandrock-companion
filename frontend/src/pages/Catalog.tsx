import { useSearchParams } from 'react-router-dom';
import {
  Boxes,
  Cookie,
  Fish,
  Gem,
  Gift,
  Hammer,
  Package,
  Pickaxe,
  RotateCcw,
  Shirt,
  SlidersHorizontal,
  Store,
  Sword,
  Users,
  Utensils,
} from 'lucide-react';
import { queryString, useApi } from '../lib/api';
import { useDebounce, useFavorites } from '../lib/storage';
import type { Item, ItemCategory, Named, Page } from '../lib/types';
import {
  Empty,
  EntityCard,
  ErrorState,
  Loading,
  PageTitle,
  Pagination,
} from '../components/ui';
import { SearchBox } from '../components/SearchBox';

const descriptions = {
  items: [
    'Seu inventário de descobertas',
    'Explore materiais, componentes e ferramentas para sua próxima criação.',
  ],
  npcs: [
    'Gente que faz Sandrock',
    'Aniversários, amizades e os presentes que fazem a diferença.',
  ],
  machines: [
    'O coração da oficina',
    'Conheça as máquinas e descubra o que cada uma pode fabricar.',
  ],
  shops: [
    'Encontre o que falta',
    'Explore lojas, seus estoques e onde encontrá-las.',
  ],
};

const categoryIcons = {
  Presentes: Gift,
  Consumíveis: Cookie,
  Ferramentas: Pickaxe,
  Armas: Sword,
  Vestuário: Shirt,
  Acessórios: Gem,
  Materiais: Boxes,
  Ingredientes: Utensils,
  Peixes: Fish,
  Mobiliário: Package,
  Relíquias: Gem,
  Armazenamento: Package,
  Missões: Package,
  'Estações de criação': Hammer,
  'Outros itens': Boxes,
} as const;

export function Catalog({
  kind,
  crafting = false,
}: {
  kind: keyof typeof descriptions;
  crafting?: boolean;
}) {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const debounced = useDebounce(q);
  const { favorites, isFavorite } = useFavorites();
  const pageSize = kind === 'npcs' ? 48 : 24;
  const favorite = favorites
    .filter((entry) => entry.kind === kind)
    .map((entry) => entry.slug)
    .join(',');
  const result = useApi<Page<Named & Partial<Item>>>(
    `/${kind}?${queryString({
      q: debounced,
      category,
      page,
      page_size: pageSize,
      favorite: kind === 'items' || kind === 'npcs' ? favorite : undefined,
    })}`,
  );
  const categories = useApi<ItemCategory[]>(
    '/item-categories',
    kind === 'items',
  );
  const change = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };
  const clear = () => setParams({}, { replace: true });
  const Icon =
    kind === 'items'
      ? crafting
        ? Hammer
        : Boxes
      : kind === 'npcs'
        ? Users
        : kind === 'shops'
          ? Store
          : Hammer;
  const searchPlaceholder =
    kind === 'items'
      ? 'Ex.: Minério de cobre, picareta, mobília…'
      : kind === 'npcs'
        ? 'Ex.: Amirah, Owen, Qi…'
        : kind === 'shops'
          ? 'Ex.: loja, comércio…'
          : 'Ex.: Forno industrial…';
  const resultLabel =
    kind === 'items'
      ? 'itens'
      : kind === 'npcs'
        ? 'personagens'
        : kind === 'machines'
          ? 'máquinas'
          : 'lojas';

  return (
    <>
      <PageTitle
        title={crafting ? 'Planejador de oficina' : descriptions[kind][0]}
        description={
          crafting
            ? 'Escolha um item e veja receita, árvore de criação e materiais totais.'
            : descriptions[kind][1]
        }
        icon={Icon}
        eyebrow={crafting ? 'PROJETOS E RECEITAS' : 'GUIA DE SANDROCK'}
      />
      <div className="catalog-workspace">
        <aside className="catalog-sidebar">
          <div className="filter-heading">
            <span className="filter-icon">
              <SlidersHorizontal size={18} />
            </span>
            <div>
              <h2>Filtros</h2>
              <p>Refine sua busca</p>
            </div>
          </div>
          <SearchBox
            value={q}
            onChange={(v) => change('q', v)}
            placeholder={searchPlaceholder}
          />
          {kind === 'items' && (
            <div className="filter-group">
              <span className="filter-label">Tipo de item</span>
              <div className="filter-chips" aria-label="Categorias">
                <button
                  className={!category ? 'active' : ''}
                  onClick={() => change('category', '')}
                >
                  <Boxes size={16} /> Todos os itens
                </button>
                {categories.data?.map((c) => (
                  <button
                    key={c.name}
                    className={category === c.name ? 'active' : ''}
                    onClick={() => change('category', c.name)}
                  >
                    {c.name} <small>{c.count}</small>
                  </button>
                ))}
              </div>
            </div>
          )}
          <button
            className="clear-filters"
            onClick={clear}
            disabled={!q && !category}
          >
            <RotateCcw size={15} /> Limpar filtros
          </button>
          <div className="filter-tip">
            <Hammer size={17} />
            <p>
              Abra um item para calcular a quantidade total de materiais de um
              projeto.
            </p>
          </div>
        </aside>
        <section className="catalog-results" aria-live="polite">
          <div className="results-toolbar">
            <div>
              <span className="eyebrow">CATÁLOGO</span>
              <strong>
                {result.data?.total ?? '…'} {resultLabel}
              </strong>
            </div>
            {(q || category) && (
              <span className="active-filter">
                {category || `Busca: “${q}”`}
              </span>
            )}
          </div>
          {result.isLoading ? (
            <Loading />
          ) : result.error ? (
            <ErrorState
              error={result.error}
              retry={() => void result.refetch()}
            />
          ) : result.data?.results.length ? (
            <>
              {kind === 'items' && !q && !category && categories.data && (
                <section
                  className="category-browser"
                  aria-label="Categorias de itens"
                >
                  <div className="category-browser-heading">
                    <h2>Explore por categoria</h2>
                    <p>
                      Escolha um grupo para encontrar os itens com mais rapidez.
                    </p>
                  </div>
                  <div className="category-browser-grid">
                    {categories.data.map(({ name, count }) => {
                      const CategoryIcon =
                        categoryIcons[name as keyof typeof categoryIcons] ||
                        Boxes;
                      return (
                        <button
                          key={name}
                          onClick={() => change('category', name)}
                        >
                          <CategoryIcon size={21} aria-hidden="true" />
                          <span>{name}</span>
                          <small>{count} itens</small>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}
              <div className="card-grid catalog-grid">
                {[...result.data.results]
                  .sort(
                    (a, b) =>
                      Number(isFavorite(b.slug, kind as 'items' | 'npcs')) -
                      Number(isFavorite(a.slug, kind as 'items' | 'npcs')),
                  )
                  .map((entity) => (
                    <EntityCard
                      key={entity.id}
                      entity={entity}
                      kind={kind}
                      label={entity.category}
                    />
                  ))}
              </div>
              <Pagination
                page={page}
                total={result.data.total}
                size={pageSize}
                setPage={(v) => change('page', String(v))}
              />
            </>
          ) : (
            <Empty
              title="Nenhuma descoberta encontrada"
              text="Ajuste os filtros ou tente outro termo."
            />
          )}
        </section>
      </div>
    </>
  );
}
