import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Coins,
  Gift as GiftIcon,
  Hammer,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
} from 'lucide-react';
import { queryString, useApi } from '../lib/api';
import { useRemember } from '../lib/storage';
import type { CraftNode, Gift, Item, Recipe, Sources } from '../lib/types';
import { preferences } from '../lib/types';
import {
  Back,
  Empty,
  EntityCard,
  ErrorState,
  FavoriteButton,
  ItemArt,
  Loading,
  SectionTitle,
} from '../components/ui';
import { CraftTree } from '../components/CraftTree';

export function ItemPage() {
  const { slug } = useParams();
  return <ItemDetail key={slug} slug={slug!} />;
}
function ItemDetail({ slug }: { slug: string }) {
  const item = useApi<Item>(`/items/${slug}`);
  const recipes = useApi<Recipe[]>(`/items/${slug}/recipes`);
  const sources = useApi<Sources>(`/items/${slug}/sources`);
  const gifts = useApi<Gift[]>(`/items/${slug}/gifts`);
  const usedIn = useApi<Recipe[]>(`/items/${slug}/used-in`);
  const [quantity, setQuantity] = useState(1);
  const [recipeId, setRecipeId] = useState<number | undefined>();
  const query = queryString({ quantity, recipe_id: recipeId });
  const tree = useApi<CraftNode>(`/items/${slug}/craft-tree?${query}`);
  const materials = useApi<Record<string, number>>(
    `/items/${slug}/materials?${query}`,
  );
  useRemember(item.data, 'items');
  if (item.isLoading) return <Loading />;
  if (item.error)
    return <ErrorState error={item.error} retry={() => void item.refetch()} />;
  if (!item.data) return null;
  const data = item.data;
  const selected =
    recipes.data?.find((r) => r.id === recipeId) || recipes.data?.[0];
  const leaves = new Map<string, string>();
  const collect = (node: CraftNode) => {
    leaves.set(node.item.name, node.item.slug);
    node.ingredients.forEach(collect);
  };
  if (tree.data) collect(tree.data);
  return (
    <>
      <Back to="/items" text="Explorar itens" />
      <header className="detail-hero">
        <ItemArt slug={slug} name={data.name} image={data.image_url} large />
        <div>
          <span className="pill">{data.category}</span>
          <h1>{data.name}</h1>
          <p>{data.description}</p>
          {data.sell_price !== null && (
            <span className="price">
              <Coins size={16} />
              Venda: {data.sell_price} Gols
            </span>
          )}
          <FavoriteButton entity={data} kind="items" />
        </div>
      </header>
      <div className="detail-columns">
        <div>
          <section className="panel">
            <SectionTitle title="Como fabricar" />
            {recipes.isLoading ? (
              <Loading />
            ) : recipes.error ? (
              <ErrorState error={recipes.error} />
            ) : selected ? (
              <>
                {recipes.data!.length > 1 && (
                  <label className="field-label">
                    Receita
                    <select
                      value={selected.id}
                      onChange={(e) => setRecipeId(Number(e.target.value))}
                    >
                      {recipes.data!.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.machine.name} · {r.slug}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <Link
                  className="machine-label"
                  to={`/machines/${selected.machine.slug}`}
                >
                  <Hammer size={18} />
                  {selected.machine.name}
                  <span>Produz ×{selected.result_quantity}</span>
                </Link>
                <p className="muted small">{selected.description}</p>
                <div className="ingredient-list">
                  {selected.ingredients.map((i) => (
                    <Link key={i.item.id} to={`/items/${i.item.slug}`}>
                      <ItemArt
                        slug={i.item.slug}
                        name={i.item.name}
                        image={i.item.image_url}
                      />
                      <span>{i.item.name}</span>
                      <strong>×{i.quantity}</strong>
                      <span aria-hidden="true">›</span>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <Empty
                title="Sem receita cadastrada"
                text="Confira abaixo onde conseguir este recurso."
              />
            )}
          </section>
          <section className="panel">
            <SectionTitle
              title="Árvore de criação"
              subtitle="Do projeto aos materiais mais básicos."
            />
            <div className="quantity-control">
              <span>Quantidade desejada</span>
              <div>
                <button
                  aria-label="Diminuir quantidade"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity(quantity - 1)}
                >
                  <Minus size={16} />
                </button>
                <output aria-label="Quantidade">{quantity}</output>
                <button
                  aria-label="Aumentar quantidade"
                  disabled={quantity >= 10000}
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
            {tree.isLoading ? (
              <Loading />
            ) : tree.error ? (
              <ErrorState error={tree.error} />
            ) : (
              tree.data && <CraftTree node={tree.data} />
            )}
            <p className="muted small">
              Lotes inteiros. Receitas dos ingredientes usam a primeira opção
              cadastrada; sobras entre ramos não são reaproveitadas.
            </p>
          </section>
        </div>
        <aside>
          <section className="panel materials-panel">
            <SectionTitle
              title="Materiais totais"
              subtitle={`Para ${quantity} × ${data.name}`}
            />
            {materials.isLoading ? (
              <Loading />
            ) : materials.error ? (
              <ErrorState error={materials.error} />
            ) : (
              <ul className="material-list">
                {Object.entries(materials.data || {}).map(([name, count]) => (
                  <li key={name}>
                    <Link
                      className="material-link"
                      to={`/items/${leaves.get(name) || slug}`}
                    >
                      {name}
                    </Link>
                    <strong>{count}</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="panel">
            <SectionTitle title="Onde conseguir" />
            {sources.isLoading ? (
              <Loading />
            ) : sources.error ? (
              <ErrorState error={sources.error} />
            ) : (
              <>
                {sources.data?.sources.map((source, i) => (
                  <div className="source-row" key={i}>
                    <MapPin size={20} />
                    <div>
                      <strong>
                        {source.location?.name || 'Fonte cadastrada'}
                      </strong>
                      <p>{source.description}</p>
                    </div>
                  </div>
                ))}
                {sources.data?.shops.map((s) => (
                  <div className="source-row" key={s.shop.id}>
                    <ShoppingBag size={20} />
                    <div>
                      <Link to={`/shops/${s.shop.slug}`}>
                        {s.shop.name} · {s.price} Gols
                      </Link>
                      <p>{s.notes}</p>
                    </div>
                  </div>
                ))}
                {!sources.data?.sources.length &&
                  !sources.data?.shops.length && (
                    <p className="muted">Nenhuma fonte adicional cadastrada.</p>
                  )}
              </>
            )}
          </section>
          <section className="panel">
            <SectionTitle title="Presentes" />
            {gifts.isLoading ? (
              <Loading />
            ) : gifts.error ? (
              <ErrorState error={gifts.error} />
            ) : gifts.data?.length ? (
              gifts.data.map((g) => (
                <Link
                  className="gift-mini"
                  key={g.id}
                  to={`/npcs/${g.npc.slug}`}
                >
                  <GiftIcon size={18} />
                  <span>
                    {g.npc.name}
                    <small>{preferences[g.preference]}</small>
                  </span>
                  <strong
                    className={
                      g.relationship_points >= 0 ? 'positive' : 'negative'
                    }
                  >
                    {g.relationship_points > 0 ? '+' : ''}
                    {g.relationship_points}
                  </strong>
                </Link>
              ))
            ) : (
              <p className="muted">Nenhuma preferência cadastrada.</p>
            )}
          </section>
        </aside>
      </div>
      <section className="content-section">
        <SectionTitle title="Usado em" />
        {usedIn.isLoading ? (
          <Loading />
        ) : usedIn.error ? (
          <ErrorState error={usedIn.error} />
        ) : usedIn.data?.length ? (
          <div className="card-grid">
            {usedIn.data.map((r) => (
              <EntityCard
                key={r.id}
                entity={r.result_item}
                label={r.machine.name}
              />
            ))}
          </div>
        ) : (
          <p className="muted">
            Este item não aparece em outras receitas cadastradas.
          </p>
        )}
      </section>
    </>
  );
}
