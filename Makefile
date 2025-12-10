.PHONY: help up down logs logs-backend shell migrate seed build clean

help:
@echo "Available commands:"
@echo "  make up           - Start all services"
@echo "  make down         - Stop all services"
@echo "  make logs         - View logs from all services"
@echo "  make logs-backend - View backend logs only"
@echo "  make shell        - Open shell in backend container"
@echo "  make migrate      - Run Prisma migrations"
@echo "  make seed         - Seed database"
@echo "  make build        - Build Docker image"
@echo "  make clean        - Stop services and remove volumes (WARNING: deletes data)"

up:
docker-compose up -d
@echo "✅ Services started. Check status: docker-compose ps"

down:
docker-compose down

logs:
docker-compose logs -f

logs-backend:
docker-compose logs -f backend

shell:
docker-compose exec backend /bin/sh

migrate:
docker-compose exec backend npm run prisma:migrate

seed:
docker-compose exec backend npm run prisma:seed

build:
docker-compose build --no-cache

clean:
docker-compose down -v
@echo "⚠️  All data deleted"
