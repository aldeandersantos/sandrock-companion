import { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import {
  Compass,
  Gift,
  Hammer,
  Home as HomeIcon,
  Map,
  Moon,
  Search,
  Sun,
  Users,
} from 'lucide-react';
import { initialTheme } from './lib/storage';
import { useApi } from './lib/api';
import { Home } from './pages/Home';
import { SearchPage } from './pages/SearchPage';
import { Catalog } from './pages/Catalog';
import { ItemPage } from './pages/ItemPage';
import { NPCPage, MachinePage, ShopPage } from './pages/Details';
import { GiftsPage } from './pages/GiftsPage';
import { Empty } from './components/ui';

const navigation = [
  { to: '/', name: 'Início', Icon: HomeIcon },
  { to: '/search', name: 'Buscar', Icon: Search },
  { to: '/craft', name: 'Oficina', Icon: Hammer },
  { to: '/gifts', name: 'Social', Icon: Gift },
  { to: '/npcs', name: 'NPCs', Icon: Users },
];

export default function App() {
  const [dark, setDark] = useState(initialTheme);
  const location = useLocation();
  const config = useApi<{
    demo_data: boolean;
    catalog: {
      items: number;
      recipes: number;
      source: string;
      translation: string;
    } | null;
  }>('/config');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem('sandrock:theme', dark ? 'dark' : 'light');
    } catch {
      /* A preference is useful, but never required. */
    }
  }, [dark]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="game-shell">
      <a className="skip-link" href="#main">
        Pular para conteúdo
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="brand" aria-label="Sandrock Companion início">
            <span className="brand-mark">
              <Compass size={31} strokeWidth={2.1} />
            </span>
            <span className="brand-copy">
              <strong>Sandrock</strong>
              <span className="brand-subtitle">COMPANHEIRO</span>
            </span>
          </Link>
          <nav className="desktop-nav" aria-label="Principal">
            {navigation.map(({ to, name, Icon }) => (
              <NavLink key={to} to={to} end={to === '/'}>
                <Icon size={19} strokeWidth={2.1} />
                <span>{name}</span>
              </NavLink>
            ))}
          </nav>
          <div className="header-status" aria-label="Painel do viajante">
            <Map size={18} aria-hidden="true" />
            <span>
              <b>Guia de Sandrock</b>
              <small>Oficina em andamento</small>
            </span>
          </div>
          <button
            className="theme-toggle"
            onClick={() => setDark(!dark)}
            aria-label={dark ? 'Ativar tema claro' : 'Ativar tema escuro'}
          >
            {dark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>
      <main id="main" className="main-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/items" element={<Catalog kind="items" />} />
          <Route path="/craft" element={<Catalog kind="items" crafting />} />
          <Route path="/items/:slug" element={<ItemPage />} />
          <Route path="/npcs" element={<Catalog kind="npcs" />} />
          <Route path="/npcs/:slug" element={<NPCPage />} />
          <Route path="/gifts" element={<GiftsPage />} />
          <Route path="/machines" element={<Catalog kind="machines" />} />
          <Route path="/machines/:slug" element={<MachinePage />} />
          <Route path="/shops" element={<Catalog kind="shops" />} />
          <Route path="/shops/:slug" element={<ShopPage />} />
          <Route
            path="*"
            element={
              <>
                <Empty
                  title="404 · Caminho não encontrado"
                  text="Essa trilha ainda não está no mapa."
                />
                <Link className="button" to="/">
                  Voltar ao início
                </Link>
              </>
            }
          />
        </Routes>
      </main>
      <footer className="site-footer">
        <span>
          <Compass size={16} /> Feito para acompanhar suas descobertas.
        </span>
        <p>Projeto de fã independente · Sem afiliação com a Pathea Games.</p>
        {config.data?.demo_data && (
          <p className="demo-note">
            Catálogo de demonstração. Receitas, preços e presentes são exemplos,
            não um guia oficial.
          </p>
        )}
        {config.data?.catalog && (
          <p className="catalog-note">
            Catálogo comunitário:{' '}
            {config.data.catalog.items.toLocaleString('pt-BR')} itens e{' '}
            {config.data.catalog.recipes.toLocaleString('pt-BR')} receitas.
            Tradução PT-BR em revisão.
          </p>
        )}
        <p>criado por Aldeander</p>
      </footer>
      <nav className="bottom-nav" aria-label="Navegação mobile">
        {navigation.map(({ to, name, Icon }) => (
          <NavLink key={to} to={to} end={to === '/'}>
            <Icon size={21} />
            <span>{name}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
