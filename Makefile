COMPOSE = docker compose
TEST_COMPOSE = docker compose -f docker-compose.test.yml

.PHONY: up down build logs test lint catalog dev

up:
	$(COMPOSE) up -d --build --wait --remove-orphans

down:
	$(COMPOSE) down

build:
	$(COMPOSE) build

logs:
	$(COMPOSE) logs -f --tail=100

test:
	$(TEST_COMPOSE) run --build --rm frontend-test

lint:
	$(TEST_COMPOSE) run --build --rm frontend-test sh -c 'npm run catalog:build && npm run lint'

catalog:
	cd frontend && npm run catalog:build

dev:
	cd frontend && npm ci && npm run dev
