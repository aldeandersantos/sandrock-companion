import { useSearchParams } from 'react-router-dom';
import { Gift as GiftIcon } from 'lucide-react';
import { queryString, useApi } from '../lib/api';
import { useDebounce } from '../lib/storage';
import type { Gift, NPC, Page } from '../lib/types';
import { preferences } from '../lib/types';
import {
  Empty,
  ErrorState,
  Loading,
  PageTitle,
  Pagination,
} from '../components/ui';
import { SearchBox } from '../components/SearchBox';
import { GiftRows } from './Details';

export function GiftsPage() {
  const [params, setParams] = useSearchParams();
  const npc = params.get('npc') || '';
  const preference = params.get('preference') || '';
  const q = params.get('q') || '';
  const order = params.get('order') || 'desc';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const debounced = useDebounce(q);
  const npcs = useApi<Page<NPC>>('/npcs?page_size=100');
  const gifts = useApi<Page<Gift>>(
    `/gifts?${queryString({ npc, preference, q: debounced, order, page, page_size: 20 })}`,
  );
  const change = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };
  return (
    <>
      <PageTitle
        title="Pequenos gestos, grandes amizades"
        description="Encontre o presente certo para cada morador de Sandrock."
        eyebrow="GUIA DE PRESENTES"
        icon={GiftIcon}
      />
      <div className="panel">
        <div className="gift-filters">
          <label className="field-label">
            Para quem?
            <select value={npc} onChange={(e) => change('npc', e.target.value)}>
              <option value="">Todos os moradores</option>
              {npcs.data?.results.map((n) => (
                <option key={n.id} value={n.slug}>
                  {n.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Preferência
            <select
              value={preference}
              onChange={(e) => change('preference', e.target.value)}
            >
              <option value="">Todas as preferências</option>
              {Object.entries(preferences).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Ordenar por
            <select
              value={order}
              onChange={(e) => change('order', e.target.value)}
            >
              <option value="desc">Mais pontos primeiro</option>
              <option value="asc">Menos pontos primeiro</option>
            </select>
          </label>
        </div>
        <SearchBox
          value={q}
          onChange={(v) => change('q', v)}
          placeholder="Pesquisar um presente…"
        />
        {npcs.error && (
          <ErrorState error={npcs.error} retry={() => void npcs.refetch()} />
        )}
      </div>
      <div className="result-count">
        {gifts.data?.total ?? '…'} presente(s) encontrado(s)
      </div>
      {gifts.isLoading ? (
        <Loading />
      ) : gifts.error ? (
        <ErrorState error={gifts.error} retry={() => void gifts.refetch()} />
      ) : gifts.data?.results.length ? (
        <section className="panel">
          <GiftRows gifts={gifts.data.results} showNPC />
          <Pagination
            page={page}
            total={gifts.data.total}
            size={20}
            setPage={(v) => change('page', String(v))}
          />
        </section>
      ) : (
        <Empty
          title="Ainda sem presentes por aqui"
          text="Experimente outro morador, preferência ou nome de item."
        />
      )}
    </>
  );
}
