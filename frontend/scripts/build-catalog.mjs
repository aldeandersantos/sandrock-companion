/* global console, process */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const frontend = resolve(here, '..');
const input = resolve(process.env.CATALOG_DATA_DIR || resolve(frontend, '..', 'data'));
const output = resolve(frontend, 'public', 'data', 'catalog.json');

const files = [
  'catalog-manifest.json',
  'items.json',
  'npcs.json',
  'machines.json',
  'recipes.json',
  'gifts.json',
  'locations.json',
  'sources.json',
];

const catalog = Object.fromEntries(
  await Promise.all(
    files.map(async (file) => [
      file.replace('.json', '').replace('catalog-manifest', 'manifest'),
      JSON.parse(await readFile(resolve(input, file), 'utf8')),
    ]),
  ),
);

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(catalog)}\n`);
console.log(`Catálogo estático criado em ${output}`);
