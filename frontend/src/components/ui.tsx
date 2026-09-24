import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Box,
  ChevronLeft,
  ChevronRight,
  Flame,
  Hammer,
  Mountain,
  PackageOpen,
  Pickaxe,
  Sprout,
  Star,
  UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Named } from '../lib/types';
import type { ApiError } from '../lib/api';
import { useFavorites } from '../lib/storage';

function thumbnailUrl(image: string, large: boolean) {
  const [path, query] = image.split('?', 2);
  if (
    !path.includes('static.wikia.nocookie.net/') ||
    !path.includes('/revision/')
  ) {
    return image;
  }
  const width = large ? 320 : 96;
  const thumbnail = path.replace(
    /\/revision\/latest(?:\/scale-to-width-down\/\d+)?$/,
    `/revision/latest/scale-to-width-down/${width}`,
  );
  return query ? `${thumbnail}?${query}` : thumbnail;
}

export function ItemArt({
  slug,
  name,
  image,
  kind = 'items',
  large = false,
}: {
  slug: string;
  name: string;
  image?: string | null;
  kind?: string;
  large?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const Icon =
    kind === 'npcs'
      ? UserRound
      : kind === 'machines'
        ? slug === 'furnace'
          ? Flame
          : Hammer
        : slug.includes('pickhammer')
          ? Pickaxe
          : slug.includes('ore')
            ? Mountain
            : slug.includes('wood')
              ? Sprout
              : Box;
  return (
    <span className={`item-art art-${slug} ${large ? 'large' : ''}`}>
      {image && !failed ? (
        <img
          src={thumbnailUrl(image, large)}
          alt={name}
          loading="lazy"
          decoding="async"
          width={large ? 320 : 96}
          height={large ? 320 : 96}
          onError={() => setFailed(true)}
        />
      ) : (
        <Icon aria-hidden="true" strokeWidth={1.4} />
      )}
    </span>
  );
}
export function SectionTitle({
  title,
  subtitle,
  to,
  action = 'Ver todos',
}: {
  title: string;
  subtitle?: string;
  to?: string;
  action?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {to && (
        <Link className="text-link" to={to}>
          {action}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
export function EntityCard({
  entity,
  kind = 'items',
  label,
}: {
  entity: Named & { image_url?: string | null };
  kind?: string;
  label?: string;
}) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favoritable = kind === 'items' || kind === 'npcs';
  const favorite = favoritable && isFavorite(entity.slug, kind);
  return (
    <div className="entity-card group">
      <Link className="entity-card-link" to={`/${kind}/${entity.slug}`}>
        <ItemArt
          slug={entity.slug}
          name={entity.name}
          image={entity.image_url}
          kind={kind}
        />
        <div>
          <span className="eyebrow">
            {label ||
              (kind === 'npcs' ? 'Morador de Sandrock' : 'Descubra mais')}
          </span>
          <h3>{entity.name}</h3>
        </div>
        <ChevronRight className="card-arrow" size={18} />
      </Link>
      {favoritable && (
        <button
          className={`favorite-button ${favorite ? 'active' : ''}`}
          type="button"
          aria-label={
            favorite
              ? `Remover ${entity.name} dos favoritos`
              : `Adicionar ${entity.name} aos favoritos`
          }
          aria-pressed={favorite}
          onClick={() => toggleFavorite(entity, kind)}
        >
          <Star size={16} fill={favorite ? 'currentColor' : 'none'} />
        </button>
      )}
    </div>
  );
}

export function FavoriteButton({
  entity,
  kind,
}: {
  entity: Named;
  kind: 'items' | 'npcs';
}) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(entity.slug, kind);
  return (
    <button
      className={`favorite-button detail-favorite ${favorite ? 'active' : ''}`}
      type="button"
      aria-label={
        favorite
          ? `Remover ${entity.name} dos favoritos`
          : `Adicionar ${entity.name} aos favoritos`
      }
      aria-pressed={favorite}
      onClick={() => toggleFavorite(entity, kind)}
    >
      <Star size={17} fill={favorite ? 'currentColor' : 'none'} />
      {favorite ? 'Favorito' : 'Favoritar'}
    </button>
  );
}
export function Loading() {
  return (
    <div className="skeleton-grid" role="status" aria-label="Carregando">
      <span className="sr-only">Carregando…</span>
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="skeleton" />
      ))}
    </div>
  );
}
export function ErrorState({
  error,
  retry,
}: {
  error: ApiError | Error;
  retry?: () => void;
}) {
  return (
    <div className="empty error" role="alert">
      <AlertCircle size={30} />
      <h2>
        {'status' in error && error.status === 404
          ? 'Não encontramos esta página'
          : 'Uma pausa na aventura'}
      </h2>
      <p>{error.message}</p>
      {retry && (
        <button className="button secondary" onClick={retry}>
          Tentar novamente
        </button>
      )}
      <Link to="/" className="text-link">
        Voltar ao início <ArrowRight size={16} />
      </Link>
    </div>
  );
}
export function Empty({
  title = 'Nada por aqui ainda',
  text = 'Experimente outra busca ou volte mais tarde.',
}: {
  title?: string;
  text?: string;
}) {
  return (
    <div className="empty">
      <PackageOpen size={32} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
export function Back({
  to = '/',
  text = 'Voltar ao início',
}: {
  to?: string;
  text?: string;
}) {
  return (
    <Link className="back-link" to={to}>
      <ArrowLeft size={16} />
      {text}
    </Link>
  );
}
export function PageTitle({
  eyebrow,
  title,
  description,
  icon: Icon,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  icon?: LucideIcon;
}) {
  return (
    <header className="page-heading">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1>
        {Icon && <Icon size={30} />}
        {title}
      </h1>
      <p>{description}</p>
    </header>
  );
}
export function Pagination({
  page,
  total,
  size,
  setPage,
}: {
  page: number;
  total: number;
  size: number;
  setPage: (page: number) => void;
}) {
  if (total <= size) return null;
  return (
    <nav className="pagination" aria-label="Paginação">
      <button
        aria-label="Página anterior"
        disabled={page <= 1}
        onClick={() => setPage(page - 1)}
      >
        <ChevronLeft size={18} />
      </button>
      <span>
        Página {page} de {Math.ceil(total / size)}
      </span>
      <button
        aria-label="Próxima página"
        disabled={page * size >= total}
        onClick={() => setPage(page + 1)}
      >
        <ChevronRight size={18} />
      </button>
    </nav>
  );
}
