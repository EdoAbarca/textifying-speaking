.PHONY: help build up down start stop restart logs clean test test-backend test-frontend install install-backend install-frontend dev-backend dev-frontend shell-backend shell-frontend shell-transcription db-shell

# Default target
help:
	@echo "Textifying Speaking - Makefile Commands"
	@echo "========================================"
	@echo ""
	@echo "Docker Commands:"
	@echo "  make build          - Build all Docker containers"
	@echo "  make up             - Start all services"
	@echo "  make down           - Stop and remove all containers"
	@echo "  make start          - Start existing containers"
	@echo "  make stop           - Stop running containers"
	@echo "  make restart        - Restart all services"
	@echo "  make logs           - View logs from all services"
	@echo "  make logs-backend   - View backend logs"
	@echo "  make logs-frontend  - View frontend logs"
	@echo "  make logs-transcription - View transcription service logs"
	@echo "  make logs-mongodb   - View MongoDB logs"
	@echo "  make clean          - Stop containers and remove volumes"
	@echo ""
	@echo "Development Commands:"
	@echo "  make install        - Install all dependencies (requires Node.js)"
	@echo "  make install-backend - Install backend dependencies"
	@echo "  make install-frontend - Install frontend dependencies"
	@echo "  make dev-backend    - Run backend in development mode"
	@echo "  make dev-frontend   - Run frontend in development mode"
	@echo ""
	@echo "Testing Commands:"
	@echo "  make test           - Run all tests"
	@echo "  make test-backend   - Run backend tests"
	@echo "  make test-backend-e2e - Run backend E2E tests"
	@echo "  make test-backend-cov - Run backend tests with coverage"
	@echo ""
	@echo "Shell Access:"
	@echo "  make shell-backend  - Access backend container shell"
	@echo "  make shell-frontend - Access frontend container shell"
	@echo "  make shell-transcription - Access transcription service shell"
	@echo "  make db-shell       - Access MongoDB shell"
	@echo ""
	@echo "Health Check:"
	@echo "  make health         - Check if all services are running"

# Docker commands
build:
	@echo "Building Docker containers..."
	docker compose build

up:
	@echo "Starting all services..."
	docker compose up -d
	@echo "Services started! Access:"
	@echo "  Frontend:       http://localhost:5173"
	@echo "  Backend:        http://localhost:3001"
	@echo "  Transcription:  http://localhost:5000"
	@echo "  MongoDB:        mongodb://localhost:27017"

down:
	@echo "Stopping all services..."
	docker compose down

start:
	@echo "Starting existing containers..."
	docker compose start

stop:
	@echo "Stopping containers..."
	docker compose stop

restart:
	@echo "Restarting all services..."
	docker compose restart

logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend

logs-frontend:
	docker compose logs -f frontend

logs-transcription:
	docker compose logs -f transcription

logs-mongodb:
	docker compose logs -f mongodb

clean:
	@echo "Stopping containers and removing volumes..."
	docker compose down -v
	@echo "Cleaned up!"

# Development commands (local, without Docker)
install: install-backend install-frontend
	@echo "All dependencies installed!"

install-backend:
	@echo "Installing backend dependencies..."
	cd ts-back && npm install

install-frontend:
	@echo "Installing frontend dependencies..."
	cd ts-front && npm install

dev-backend:
	@echo "Starting backend in development mode..."
	cd ts-back && npm run start:dev

dev-frontend:
	@echo "Starting frontend in development mode..."
	cd ts-front && npm run dev

# Testing commands
test: test-backend
	@echo "All tests completed!"

test-backend:
	@echo "Running backend unit tests..."
	cd ts-back && npm test

test-backend-e2e:
	@echo "Running backend E2E tests..."
	cd ts-back && JWT_SECRET=test-secret-key npm run test:e2e

test-backend-cov:
	@echo "Running backend tests with coverage..."
	cd ts-back && npm run test:cov

# Shell access
shell-backend:
	docker exec -it ts-backend sh

shell-frontend:
	docker exec -it ts-frontend sh

shell-transcription:
	docker exec -it ts-transcription sh

db-shell:
	docker exec -it ts-mongodb mongosh textifying-speaking

# Health check
health:
	@echo "Checking service health..."
	@echo -n "Frontend (http://localhost:5173): "
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 && echo " ✓" || echo " ✗"
	@echo -n "Backend (http://localhost:3001): "
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 && echo " ✓" || echo " ✗"
	@echo -n "Transcription (http://localhost:5000/health): "
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health && echo " ✓" || echo " ✗"
	@echo -n "MongoDB (localhost:27017): "
	@docker exec ts-mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1 && echo " ✓" || echo " ✗"

# Quick start (build and run)
quickstart: build up
	@echo "Quick start complete!"
	@echo "Waiting for services to be ready..."
	@sleep 5
	@make health
