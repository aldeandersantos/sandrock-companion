import { expect, test } from '@playwright/test';

test('home, search, crafting and recent history', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(
    page.getByRole('heading', {
      name: 'Grandes aventuras. Pequenas descobertas.',
    }),
  ).toBeVisible();
  await expect(page.locator('.entity-card').first()).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/home-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole('searchbox').fill('picareta');
  await page.getByRole('link', { name: /Picareta de Bronze/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Picareta de Bronze', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.detail-hero img')).toHaveAttribute(
    'src',
    /scale-to-width-down\/320/,
  );
  await expect
    .poll(() =>
      page.locator('.detail-hero img').evaluate((image) => image.naturalWidth),
    )
    .toBeGreaterThan(0);
  await expect(page.locator('.material-list')).toContainText(
    'Minério de Cobre',
  );
  await expect(page.locator('.material-list')).toContainText('18');
  await page.getByRole('button', { name: 'Aumentar quantidade' }).click();
  await expect(page.locator('.material-list')).toContainText('36');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/crafting-${info.project.name}.png`,
    fullPage: true,
  });
  const bronzeBars = page
    .locator('.ingredient-list')
    .getByRole('link', { name: /Barras de Bronze/ });
  const bronzeBarsImage = bronzeBars.getByRole('img', {
    name: 'Barras de Bronze',
  });
  await expect(bronzeBarsImage).toHaveAttribute(
    'src',
    /scale-to-width-down\/96/,
  );
  await expect
    .poll(() => bronzeBarsImage.evaluate((image) => image.naturalWidth))
    .toBeGreaterThan(0);
  await bronzeBars.click();
  await expect(
    page.getByRole('heading', { name: 'Barras de Bronze', exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Sandrock Companion início' }).click();
  await expect(
    page.getByRole('heading', { name: 'Continue de onde parou' }),
  ).toBeVisible();
  await expect(page.locator('.recent-list')).toContainText('Barras de Bronze');
  expect(errors).toEqual([]);
});

test('recipe materials and stations lead to their own records', async ({
  page,
}) => {
  await page.goto('/items/item-11000059');
  await expect(
    page.getByRole('heading', { name: 'Machado de Alumínio', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.machine-label')).toContainText(
    'Advanced Worktable',
  );
  await expect(page.locator('.ingredient-list')).toContainText(
    'Liga de Magnésio e Alumínio',
  );
  await expect(page.getByText('Advanced Worktable').first()).toBeVisible();
  await page
    .locator('.ingredient-list')
    .getByRole('link', { name: /Liga de Magnésio e Alumínio/ })
    .click();
  await expect(
    page.getByRole('heading', {
      name: 'Liga de Magnésio e Alumínio',
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator('.machine-label')).toContainText(
    'Industrial Furnace',
  );
  await expect(page.locator('.ingredient-list')).toContainText(
    'Minério de Alumínio',
  );
});

test('gift filters, NPC and item links', async ({ page }) => {
  await page.goto('/gifts');
  await page.getByLabel('Para quem?').selectOption('npc-amirah');
  await page
    .getByRole('combobox', { name: 'Preferência', exact: true })
    .selectOption('LOVED');
  await expect(page.locator('.gift-row').first()).toBeVisible();
  await page.getByRole('link', { name: 'Amirah', exact: true }).first().click();
  await expect(
    page.getByRole('heading', { name: 'Amirah', exact: true }),
  ).toBeVisible();
  const firstGift = page.locator('.gift-item').first();
  const giftName = (await firstGift.innerText()).trim();
  await firstGift.click();
  await expect(
    page.getByRole('heading', { name: giftName, exact: true }),
  ).toBeVisible();
});

test('favorites are brought to the first catalog page', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'sandrock:favorites',
      JSON.stringify([{ name: 'Mi-an', slug: 'npc-mi-an', kind: 'npcs' }]),
    );
  });
  await page.goto('/npcs?page=1');
  await expect(page.locator('.entity-card').first()).toContainText('Mi-an');
  await expect(page.getByText('45 personagens')).toBeVisible();
});

test('item categories lead the catalog and fit the viewport', async ({
  page,
}) => {
  await page.goto('/items');
  await expect(
    page.getByRole('heading', { name: 'Explore por categoria' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Materiais 27 itens/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: /Materiais 27 itens/ }).click();
  await expect(page).toHaveURL(/category=Materiais/);
  await expect(
    page.locator('.catalog-grid .entity-card').first(),
  ).toBeVisible();
});

test('theme persists and navigation fits viewport', async ({ page }, info) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Ativar tema escuro' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveClass('dark');
  await page.screenshot({
    path: `test-results/dark-${info.project.name}.png`,
    fullPage: true,
  });
  if (info.project.name.startsWith('mobile')) {
    await expect(
      page.getByRole('navigation', { name: 'Navegação mobile' }),
    ).toBeVisible();
    await page
      .getByRole('navigation', { name: 'Navegação mobile' })
      .getByRole('link', { name: 'NPCs' })
      .click();
  } else {
    await page
      .getByRole('navigation', { name: 'Principal' })
      .getByRole('link', { name: 'NPCs' })
      .click();
  }
  await expect(
    page.getByRole('heading', { name: 'Gente que faz Sandrock' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('empty results, catalog failure and 404 have useful states', async ({
  page,
}) => {
  await page.goto('/search?q=does-not-exist');
  await expect(
    page.getByRole('heading', { name: 'Nenhuma descoberta por aqui' }),
  ).toBeVisible();
  await page.goto('/a-missing-page');
  await expect(
    page.getByRole('heading', { name: '404 · Caminho não encontrado' }),
  ).toBeVisible();
  await page.route('**/data/catalog.json', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: '{}',
    }),
  );
  await page.goto('/items');
  await expect(page.getByRole('alert')).toContainText('Não foi possível carregar o catálogo');
});
