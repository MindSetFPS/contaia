.PHONY: setup dev dev-backend dev-frontend build serve docker docker-build seed lint test clean

VENV = backend/.venv
PYTHON = $(VENV)/bin/python
UVICORN = $(VENV)/bin/uvicorn
NPM = npm

# --------------- Setup ---------------

setup: .env $(VENV) frontend/node_modules

.env:
	cp .env.example .env
	@echo "⚠️  Edit .env with your OPENROUTER_API_KEY and JWT_SECRET"

$(VENV):
	python3 -m venv $(VENV)
	$(VENV)/bin/pip install --upgrade pip
	$(VENV)/bin/pip install -r backend/requirements.txt

frontend/node_modules:
	cd frontend && $(NPM) install

# --------------- Development ---------------

dev-backend:
	$(UVICORN) app.main:app --reload --port 8000 --app-dir backend

dev-frontend:
	cd frontend && $(NPM) run dev

# --------------- Build ---------------

build-frontend:
	cd frontend && $(NPM) run build

build: build-frontend

# --------------- Serve (one command) ---------------

serve: build
	$(UVICORN) app.main:app --host 0.0.0.0 --port 8000 --app-dir backend

# --------------- Docker ---------------

docker-build:
	docker build -t contaia .

docker: docker-build
	docker compose up

# --------------- Seed ---------------

seed:
	$(PYTHON) backend/scripts/seed_data.py

# --------------- Lint ---------------

lint:
	$(VENV)/bin/ruff check backend/
	cd frontend && npx prettier --check .

# --------------- Test ---------------

test:
	$(VENV)/bin/python -m pytest backend/tests/ -v

# --------------- Clean ---------------

clean:
	rm -rf $(VENV)
	rm -rf frontend/node_modules
	rm -rf frontend/dist
	rm -f backend/data/*.db*
