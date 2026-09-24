import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Boxes,
  Clock3,
  Gift,
  Hammer,
  Leaf,
  Pickaxe,
  Sparkles,
  Star,
  Store,
  Users,
} from 'lucide-react';
import { Landscape } from '../components/Landscape';
import { SearchBox } from '../components/SearchBox';
import {
  EntityCard,
  ErrorState,
  Loading,
  SectionTitle,
} from '../components/ui';
import { SearchResultsView } from './SearchPage';
import { useApi } from '../lib/api';
import { readRecent, useFavorites } from '../lib/storage';
import type { Item, NPC, Page } from '../lib/types';

const categories = [
  {
    to: '/items',
    name: 'Itens',
    detail: 'Cada descoberta conta',
    Icon: Boxes,
    color: 'rust',
  },
  {
    to: '/npcs',
    name: 'NPCs',
    detail: 'Conheça a vizinhança',
    Icon: Users,
    color: 'sage',
  },
  {
    to: '/craft',
    name: 'Criação',
    detail: 'Da ideia à criação',
    Icon: Hammer,
    color: 'gold',
  },
  {
    to: '/gifts',
    name: 'Presentes',
    detail: 'Cultive boas amizades',
    Icon: Gift,
    color: 'rose',
  },
  {
    to: '/machines',
    name: 'Máquinas',
    detail: 'Equipe sua oficina',
    Icon: Pickaxe,
    color: 'blue',
  },
  {
    to: '/shops',
    name: 'Lojas',
    detail: 'Encontre o que falta',
    Icon: Store,
    color: 'purple',
  },
];
export function Home() {
  const [query, setQuery] = useState('');
  const [recent] = useState(readRecent);
  const { favorites, isFavorite } = useFavorites();
  const items = useApi<Page<Item>>('/items?page_size=6');
  const npcs = useApi<Page<NPC>>('/npcs?page_size=3');
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-tag">
            <Leaf size={14} /> SEU GUIA DE BOLSO EM SANDROCK
          </span>
          <h1>
            Grandes aventuras.
            <br />
            <em>Pequenas descobertas.</em>
          </h1>
          <p>
            Encontre a receita certa, o presente perfeito e tudo
            <br className="desktop-break" /> que você precisa para construir sua
            história.
          </p>
          <span className="hero-footnote">
            <Sparkles size={15} /> Um companheiro para cada novo dia.
          </span>
        </div>
        <Landscape />
      </section>
      <section className="home-search">
        <label className="search-label">O que você está procurando?</label>
        <SearchBox value={query} onChange={setQuery} />
        <div className="suggestions">
          <span>Experimente:</span>
          {['Picareta de Bronze', 'Amirah', 'Forno'].map((value) => (
            <button key={value} onClick={() => setQuery(value)}>
              {value}
              <ArrowRight size={12} />
            </button>
          ))}
        </div>
      </section>
      {query ? (
        <SearchResultsView query={query} />
      ) : (
        <>
          <section className="content-section explore-section">
            <SectionTitle
              title="Uma cidade de possibilidades"
              subtitle="Tudo o que importa, a poucos toques de distância."
            />
            <div className="category-grid">
              {categories.map(({ to, name, detail, Icon, color }) => (
                <Link key={to} to={to} className="category-card">
                  <span className={`category-icon ${color}`}>
                    <Icon size={25} strokeWidth={1.7} />
                  </span>
                  <div>
                    <h3>{name}</h3>
                    <p>{detail}</p>
                  </div>
                  <ArrowRight size={16} />
                </Link>
              ))}
            </div>
          </section>
          {recent.length > 0 && (
            <section className="content-section">
              <SectionTitle
                title="Continue de onde parou"
                subtitle="Suas últimas descobertas ficam por aqui."
              />
              <div className="recent-list">
                {recent.map((r) => (
                  <Link key={r.kind + r.slug} to={`/${r.kind}/${r.slug}`}>
                    <Clock3 size={16} />
                    {r.name}
                    <ArrowRight size={14} />
                  </Link>
                ))}
              </div>
            </section>
          )}
          {favorites.length > 0 && (
            <section className="content-section favorites-section">
              <SectionTitle
                title="Seus favoritos"
                subtitle="Personagens e itens marcados para encontrar primeiro."
              />
              <div className="recent-list">
                {favorites.map((favorite) => (
                  <Link
                    key={favorite.kind + favorite.slug}
                    to={`/${favorite.kind}/${favorite.slug}`}
                  >
                    <Star size={16} />
                    {favorite.name}
                    <ArrowRight size={14} />
                  </Link>
                ))}
              </div>
            </section>
          )}
          <section className="content-section">
            <SectionTitle
              title="Da sua próxima criação"
              subtitle="Materiais e ferramentas para colocar a mão na massa."
              to="/items"
            />
            {items.isLoading ? (
              <Loading />
            ) : items.error ? (
              <ErrorState
                error={items.error}
                retry={() => void items.refetch()}
              />
            ) : (
              <div className="card-grid">
                {[...(items.data?.results || [])]
                  .sort(
                    (a, b) =>
                      Number(isFavorite(b.slug, 'items')) -
                      Number(isFavorite(a.slug, 'items')),
                  )
                  .map((item) => (
                    <EntityCard
                      key={item.id}
                      entity={item}
                      label={item.category}
                    />
                  ))}
              </div>
            )}
          </section>
          <section className="craft-banner">
            <span className="banner-icon">
              <BookOpen size={31} strokeWidth={1.5} />
            </span>
            <div>
              <span className="eyebrow">MENOS CONTAS, MAIS CRIAÇÕES</span>
              <h2>Cada projeto começa com um plano.</h2>
              <p>
                Explore receitas e descubra todos os materiais de que precisa.
              </p>
            </div>
            <Link className="button" to="/craft">
              Planejar uma criação
              <ArrowRight size={17} />
            </Link>
          </section>
          <section className="content-section">
            <SectionTitle
              title="Gente que faz Sandrock"
              subtitle="Um bom presente pode ser o começo de uma grande amizade."
              to="/npcs"
              action="Conhecer todos"
            />
            {npcs.isLoading ? (
              <Loading />
            ) : npcs.error ? (
              <ErrorState
                error={npcs.error}
                retry={() => void npcs.refetch()}
              />
            ) : (
              <div className="card-grid npc-grid">
                {[...(npcs.data?.results || [])]
                  .sort(
                    (a, b) =>
                      Number(isFavorite(b.slug, 'npcs')) -
                      Number(isFavorite(a.slug, 'npcs')),
                  )
                  .map((npc) => (
                    <EntityCard key={npc.id} entity={npc} kind="npcs" />
                  ))}
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
