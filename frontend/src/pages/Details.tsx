import { Link, useParams } from 'react-router-dom';
import { Cake, Heart, MapPin } from 'lucide-react';
import { useApi } from '../lib/api';
import { useRemember } from '../lib/storage';
import type {
  Gift,
  Machine,
  NPC,
  Preference,
  Recipe,
  Shop,
  ShopItem,
} from '../lib/types';
import { preferences, seasons } from '../lib/types';
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

export function GiftRows({
  gifts,
  showNPC = false,
}: {
  gifts: Gift[];
  showNPC?: boolean;
}) {
  return (
    <div className="gift-rows">
      {gifts.map((gift) => (
        <div className="gift-row" key={gift.id}>
          <Link className="gift-item" to={`/items/${gift.item.slug}`}>
            <ItemArt
              name={gift.item.name}
              slug={gift.item.slug}
              image={gift.item.image_url}
            />
            <span>
              {gift.item.name}
              {showNPC && <small>{preferences[gift.preference]}</small>}
            </span>
          </Link>
          {showNPC && (
            <Link className="gift-npc" to={`/npcs/${gift.npc.slug}`}>
              {gift.npc.name}
            </Link>
          )}
          <strong
            className={gift.relationship_points >= 0 ? 'positive' : 'negative'}
          >
            {gift.relationship_points > 0 ? '+' : ''}
            {gift.relationship_points}
            <small>pontos</small>
          </strong>
        </div>
      ))}
    </div>
  );
}
export function NPCPage() {
  const { slug } = useParams();
  const npc = useApi<NPC>(`/npcs/${slug}`);
  const gifts = useApi<Gift[]>(`/npcs/${slug}/gifts`);
  useRemember(npc.data, 'npcs');
  if (npc.isLoading) return <Loading />;
  if (npc.error) return <ErrorState error={npc.error} />;
  if (!npc.data) return null;
  const data = npc.data;
  return (
    <>
      <Back to="/npcs" text="Todos os moradores" />
      <header className="detail-hero">
        <ItemArt
          kind="npcs"
          slug={data.slug}
          name={data.name}
          image={data.image_url}
          large
        />
        <div>
          <span className="eyebrow">MORADOR DE SANDROCK</span>
          <h1>{data.name}</h1>
          <p>{data.description}</p>
          <div className="metadata">
            {data.birthday_day && data.birthday_season && (
              <span>
                <Cake size={17} />
                {data.birthday_day} de {seasons[data.birthday_season]}
              </span>
            )}
            {data.romanceable && (
              <span>
                <Heart size={17} />
                Romance disponível
              </span>
            )}
          </div>
          <FavoriteButton entity={data} kind="npcs" />
        </div>
      </header>
      <SectionTitle
        title="Um presente, uma nova amizade"
        subtitle="Explore as preferências e os pontos de relacionamento."
        to={`/gifts?npc=${slug}`}
        action="Filtrar presentes"
      />
      {gifts.isLoading ? (
        <Loading />
      ) : gifts.error ? (
        <ErrorState error={gifts.error} />
      ) : (
        <div className="gift-sections">
          {(Object.keys(preferences) as Preference[]).map((preference) => (
            <section className="panel" key={preference}>
              <h2 className={`preference-heading ${preference.toLowerCase()}`}>
                {preferences[preference]}
              </h2>
              {gifts.data?.some((g) => g.preference === preference) ? (
                <GiftRows
                  gifts={gifts.data.filter((g) => g.preference === preference)}
                />
              ) : (
                <p className="muted">
                  Nenhum presente cadastrado nesta preferência.
                </p>
              )}
            </section>
          ))}
        </div>
      )}
    </>
  );
}
export function MachinePage() {
  const { slug } = useParams();
  const machine = useApi<Machine>(`/machines/${slug}`);
  const recipes = useApi<Recipe[]>(`/machines/${slug}/recipes`);
  if (machine.isLoading) return <Loading />;
  if (machine.error) return <ErrorState error={machine.error} />;
  if (!machine.data) return null;
  return (
    <>
      <Back to="/machines" text="Todas as máquinas" />
      <header className="detail-hero">
        <ItemArt kind="machines" slug={slug!} name={machine.data.name} large />
        <div>
          <span className="pill">Nível {machine.data.level}</span>
          <h1>{machine.data.name}</h1>
          <p>{machine.data.description}</p>
        </div>
      </header>
      <SectionTitle title="O que fabricar aqui" />
      {recipes.isLoading ? (
        <Loading />
      ) : recipes.error ? (
        <ErrorState error={recipes.error} />
      ) : recipes.data?.length ? (
        <div className="card-grid">
          {recipes.data.map((r) => (
            <EntityCard
              key={r.id}
              entity={r.result_item}
              label={`Produz ×${r.result_quantity}`}
            />
          ))}
        </div>
      ) : (
        <Empty title="Nenhuma receita cadastrada" />
      )}
    </>
  );
}
export function ShopPage() {
  const { slug } = useParams();
  const shop = useApi<Shop>(`/shops/${slug}`);
  const inventory = useApi<ShopItem[]>(`/shops/${slug}/inventory`);
  if (shop.isLoading) return <Loading />;
  if (shop.error) return <ErrorState error={shop.error} />;
  if (!shop.data) return null;
  return (
    <>
      <Back to="/shops" text="Todas as lojas" />
      <header className="page-heading">
        <span className="eyebrow">VALE UMA VISITA</span>
        <h1>{shop.data.name}</h1>
        <p>{shop.data.description}</p>
        {shop.data.location && (
          <span className="metadata">
            <MapPin size={17} />
            {shop.data.location.name}
          </span>
        )}
      </header>
      <SectionTitle title="Na prateleira" />
      {inventory.isLoading ? (
        <Loading />
      ) : inventory.error ? (
        <ErrorState error={inventory.error} />
      ) : inventory.data?.length ? (
        <div className="card-grid">
          {inventory.data.map((entry) => (
            <EntityCard
              key={entry.item.id}
              entity={entry.item}
              label={`${entry.price} Gols · ${entry.notes}`}
            />
          ))}
        </div>
      ) : (
        <Empty title="Nenhum item cadastrado nesta loja" />
      )}
    </>
  );
}
