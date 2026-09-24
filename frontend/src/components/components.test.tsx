import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SearchBox } from './SearchBox';
import { CraftTree } from './CraftTree';
import { EntityCard, ErrorState } from './ui';
import { ApiError } from '../lib/api';
import type { CraftNode, Item } from '../lib/types';

const item: Item = {
  id: 1,
  name: 'Bronze Bar',
  slug: 'bronze-bar',
  category: 'Componente',
  description: '',
  image_url: null,
  sell_price: 12,
};

test('search field exposes input and clear actions', () => {
  const change = vi.fn();
  render(<SearchBox value="Bronze" onChange={change} />);
  fireEvent.change(screen.getByRole('searchbox'), {
    target: { value: 'Copper' },
  });
  expect(change).toHaveBeenCalledWith('Copper');
  fireEvent.click(screen.getByRole('button', { name: 'Limpar busca' }));
  expect(change).toHaveBeenCalledWith('');
});

test('craft tree renders clickable nested ingredients and scaled quantities', () => {
  const child = { ...item, id: 2, name: 'Copper Ore', slug: 'copper-ore' };
  const node: CraftNode = {
    item,
    quantity: 5,
    machine: 'Furnace',
    batches: 5,
    produced_quantity: 5,
    recipe_id: 1,
    ingredients: [
      {
        item: child,
        quantity: 15,
        machine: null,
        batches: 0,
        produced_quantity: 0,
        recipe_id: null,
        ingredients: [],
      },
    ],
  };
  render(
    <MemoryRouter>
      <CraftTree node={node} />
    </MemoryRouter>,
  );
  expect(screen.getByRole('link', { name: 'Copper Ore' })).toHaveAttribute(
    'href',
    '/items/copper-ore',
  );
  expect(screen.getByText('×15')).toBeInTheDocument();
});

test('card opens the correct detail route', () => {
  render(
    <MemoryRouter>
      <EntityCard entity={item} label="Componente" />
    </MemoryRouter>,
  );
  expect(screen.getByRole('link')).toHaveAttribute('href', '/items/bronze-bar');
});

test('API failure has an accessible retry button', () => {
  const retry = vi.fn();
  render(
    <MemoryRouter>
      <ErrorState error={new ApiError(503, 'API indisponível')} retry={retry} />
    </MemoryRouter>,
  );
  expect(screen.getByRole('alert')).toHaveTextContent('API indisponível');
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  expect(retry).toHaveBeenCalledOnce();
});
