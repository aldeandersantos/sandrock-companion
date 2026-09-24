# Validação

A aplicação é estática: o build gera `frontend/public/data/catalog.json` a partir dos JSONs em `data/`, e o navegador executa busca, filtros, receitas e cálculos de materiais localmente.

## Verificações

```bash
make test
docker compose up -d --build --wait
```

`make test` executa Vitest, ESLint e o build de produção em um container Node isolado. O segundo comando sobe apenas o container `frontend` e o verifica por health check HTTP.

Para validar os fluxos de navegador em uma aplicação já iniciada na porta 3011:

```bash
docker run --rm --add-host host.docker.internal:host-gateway \
  -e E2E_BASE_URL=http://host.docker.internal:3011 \
  -v "$PWD/frontend:/work" -w /work \
  mcr.microsoft.com/playwright:v1.56.1-noble \
  bash -lc 'npx playwright test'
```

Não há migrações, seed, API, PostgreSQL, backup de banco nem área administrativa nesta arquitetura.
