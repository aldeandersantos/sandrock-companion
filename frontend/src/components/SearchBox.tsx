import { Search, X } from 'lucide-react';

export function SearchBox({
  value,
  onChange,
  placeholder = 'Busque itens, moradores, máquinas…',
  autoFocus = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="search-box">
      <Search aria-hidden="true" size={23} />
      <input
        type="search"
        aria-label="Pesquisar"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
      {value && (
        <button aria-label="Limpar busca" onClick={() => onChange('')}>
          <X size={18} />
        </button>
      )}
      <span className="search-hint">explore</span>
    </div>
  );
}
