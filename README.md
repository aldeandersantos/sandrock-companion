# Sandrock Companion

Guia estático, mobile-first e em português para *My Time at Sandrock*. O projeto é um único frontend React servido por Nginx: não há API, banco de dados, login nem área administrativa.

O catálogo atual traz 3.296 itens, 628 receitas, 41 estações, 452 locais, 4.079 fontes de obtenção, 45 NPCs e 4.898 preferências de presente. Itens, receitas, árvores de criação, totais de materiais, filtros, busca, imagens, referências entre ingredientes, tema, histórico e favoritos funcionam inteiramente no navegador.

Os dados factuais foram extraídos de fontes comunitárias públicas do jogo, incluindo o [CSV de itens](https://mytimeatsandrock.fandom.com/wiki/Data:Items/csv) e os [módulos públicos de criação](https://mytimeatsandrock.fandom.com/wiki/Module:Craft). Não há afiliação com a Pathea Games.

## Executar localmente

É preciso apenas Docker Engine com Docker Compose v2. Não é necessário criar `.env`; a porta padrão já é `3011`.

```bash
docker compose up -d --build --wait
```

Abra [http://localhost:3011](http://localhost:3011). Para outra porta, crie um `.env` com, por exemplo, `HTTP_PORT=3012`.

```bash
docker compose down
```

O único container é `frontend`. Ele expõe a porta interna `80` e publica `3011` no host. O Nginx interno também faz fallback para `index.html`, portanto links diretos como `/items/item-11000005` funcionam.

## Dados e favoritos

Os arquivos-fonte ficam em [`data/`](data): `items.json`, `npcs.json`, `recipes.json`, `gifts.json`, `machines.json`, `locations.json` e `sources.json`. Durante o build, [`frontend/scripts/build-catalog.mjs`](frontend/scripts/build-catalog.mjs) os consolida em `/data/catalog.json`, servido como arquivo estático e validado pelo navegador a cada abertura.

Os favoritos, tema e histórico ficam somente no `localStorage` do navegador. Eles sobrevivem a reinícios e atualizações do container, mas não sincronizam entre navegadores ou dispositivos.

Para alterar o catálogo no futuro, edite os JSONs em `data/` e reconstrua:

```bash
docker compose up -d --build
```

## Desenvolvimento e validação

Com Node 22 no host:

```bash
cd frontend
npm ci
npm run dev
```

O comando de desenvolvimento gera o catálogo automaticamente. As verificações isoladas por Docker são:

```bash
make test
```

Ele executa Vitest, ESLint e o build estático. Os testes de navegador usam a aplicação já publicada:

```bash
docker run --rm --add-host host.docker.internal:host-gateway \
  -e E2E_BASE_URL=http://host.docker.internal:3011 \
  -v "$PWD/frontend:/work" -w /work \
  mcr.microsoft.com/playwright:v1.56.1-noble \
  bash -lc 'npx playwright test'
```

## VPS com Nginx já existente

A porta `3011` não conflita com o Nginx da configuração fornecida: ela só conflitaria se outro processo já tivesse publicado `3011` no host. Como esse Nginx usa `80` e `443`, o site pode funcionar diretamente em `http://IP-DA-VPS:3011` depois de liberar a porta no firewall.

Para publicar por domínio com HTTPS, a melhor opção é manter o Nginx existente como proxy reverso e não publicar `80` ou `443` neste projeto. O arquivo [deploy/nginx/sandrock-companion.conf](deploy/nginx/sandrock-companion.conf) é um bloco pronto para acrescentar ao mesmo conjunto que contém `altcode.conf`.

Como o Nginx existente também está em Docker, os dois containers precisam compartilhar uma rede externa. Descubra a rede que ele usa na VPS:

```bash
docker network ls
```

Depois, suba o Companion ligado a ela, substituindo o nome pelo resultado correto:

```bash
PROXY_NETWORK=sistema_default \
docker compose -f docker-compose.yml -f docker-compose.vps.yml up -d --build --wait
```

O override cria o alias DNS `sandrock_companion`. No Nginx compartilhado, inclua o conteúdo de `deploy/nginx/sandrock-companion.conf`, troque todas as ocorrências de `sandrock.example.com` pelo domínio real e emita/use o certificado desse domínio no mesmo fluxo Certbot que já atende os outros sites. Por fim, valide e recarregue o Nginx existente:

```bash
nginx -t && nginx -s reload
```

Se o Nginx da VPS estiver instalado diretamente no host, em vez de um container, mantenha o Compose normal e use `proxy_pass http://127.0.0.1:3011;` no bloco `location /`. Nesse caso, restrinja a porta `3011` no firewall se ela só deve ser acessível pelo proxy.

## Hospedagem Apache em `/sandrock/`

Para publicar em `public_html/sandrock`, gere a build com os caminhos dessa subpasta:

```bash
cd frontend
npm ci
npm run build:sandrock
```

Envie o **conteúdo** de `frontend/dist/` para `public_html/sandrock/`, de modo que `index.html` fique diretamente nessa pasta. Inclua o arquivo oculto `.htaccess`: ele permite abrir diretamente links como `/sandrock/items/item-11000005`. O build inclui o catálogo em `data/catalog.json`. Não envie o `.env`.

Para publicar na raiz de um domínio, use `npm run build` e envie o conteúdo de `dist/` para a raiz desse domínio.

## Estrutura

```text
data/                         catálogo-fonte versionado
frontend/                     React, estilos, PWA e testes
frontend/scripts/             geração do catálogo estático
deploy/nginx/                 bloco para o proxy Nginx compartilhado
docker-compose.yml            um único container web
docker-compose.vps.yml        conexão opcional à rede do proxy
```
