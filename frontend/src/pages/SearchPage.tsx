import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useApi } from '../lib/api';
import { useDebounce } from '../lib/storage';
import type { SearchResults } from '../lib/types';
import {
  Empty,
  EntityCard,
  ErrorState,
  Loading,
  PageTitle,
  SectionTitle,
} from '../components/ui';
import { SearchBox } from '../components/SearchBox';

export function SearchResultsView({ query }: { query: string }) {
  const debounced = useDebounce(query.trim());
  const result = useApi<SearchResults>(
    `/search?q=${encodeURIComponent(debounced)}`,
    Boolean(debounced),
  );
  if (!query.trim()) return null;
  if (!debounced || result.isLoading || query.trim() !== debounced)
    return <Loading />;
  if (result.error)
    return (
      <ErrorState error={result.error} retry={() => void result.refetch()} />
    );
  const labels: Record<keyof SearchResults, string> = {
    items: 'Itens',
    npcs: 'NPCs',
    machines: 'Máquinas',
    shops: 'Lojas',
  };
  if (!result.data || !Object.values(result.data).some((v) => v.length))
    return (
      <Empty
        title="Nenhuma descoberta por aqui"
        text={`Não encontramos resultados para “${query}”. Tente outro nome.`}
      />
    );
  return (
    <div aria-live="polite">
      {(Object.keys(labels) as (keyof SearchResults)[]).map(
        (kind) =>
          result.data![kind].length > 0 && (
            <section className="content-section" key={kind}>
              <SectionTitle
                title={labels[kind]}
                to={`/${kind}?q=${encodeURIComponent(debounced)}`}
                action="Explorar"
              />
              <div className="card-grid">
                {result.data![kind].map((entity) => (
                  <EntityCard key={entity.id} entity={entity} kind={kind} />
                ))}
              </div>
            </section>
          ),
      )}
    </div>
  );
}
export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || '';
  return (
    <>
      <PageTitle
        title="Encontre sua próxima descoberta"
        description="Itens, moradores, máquinas e lojas em um só lugar."
        icon={Search}
      />
      <SearchBox
        value={query}
        onChange={(q) => setParams(q ? { q } : {}, { replace: true })}
        autoFocus
      />
      <SearchResultsView query={query} />
      {!query && (
        <Empty
          title="O que você está procurando?"
          text="Comece com Bronze, Amirah ou Forno."
        />
      )}
    </>
  );
}
