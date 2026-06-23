.PHONY: setup dev dev-db dev-backend dev-frontend build serve docker docker-build seed lint test clean

VENV = backend/.venv
PYTHON = $(VENV)/bin/python
UVICORN = $(VENV)/bin/uvicorn
NPM = npm

# --------------- Setup ---------------

setup: .env $(VENV) frontend/node_modules

.env:
	cp .env.example .env
	@echo "⚠️  Edit .env with your OPENROUTER_API_KEY and JWT_SECRET"

$(VENV): backend/requirements.txt
	python3 -m venv $(VENV)
	$(VENV)/bin/pip install --upgrade pip
	$(VENV)/bin/pip install -r backend/requirements.txt
	touch $(VENV)

frontend/node_modules:
	cd frontend && $(NPM) install

# --------------- Development ---------------

dev-db:
	docker compose -f docker-compose.dev.yml up -d

dev: $(VENV) dev-db seed
	npx concurrently \
		"$(UVICORN) app.main:app --reload --port 8000 --app-dir backend" \
		"cd frontend && $(NPM) run dev"

dev-backend: $(VENV)
	$(UVICORN) app.main:app --reload --port 8000 --app-dir backend

dev-frontend:
	cd frontend && $(NPM) run dev

# --------------- Build ---------------

build-frontend:
	cd frontend && $(NPM) run build

build: build-frontend

# --------------- Serve (one command) ---------------

serve: $(VENV) build
	$(UVICORN) app.main:app --host 0.0.0.0 --port 8000 --app-dir backend

# --------------- Docker ---------------

docker-build:
	docker build -t contaia .

docker: docker-build
	docker compose up

# --------------- Seed ---------------

seed: $(VENV)
	$(PYTHON) backend/scripts/seed_data.py

# --------------- Lint ---------------

lint: $(VENV)
	$(VENV)/bin/ruff check backend/
	cd frontend && npx prettier --check .

# --------------- Test ---------------

test: $(VENV)
	$(VENV)/bin/python -m pytest backend/tests/ -v

# --------------- Clean ---------------

clean:
	rm -rf $(VENV)
	rm -rf frontend/node_modules
	rm -rf frontend/dist
	# rm -f backend/data/*.db*  # No longer needed — using PostgreSQL
