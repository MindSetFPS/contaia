import os
import sqlite3
from pathlib import Path

DATABASE_PATH = Path(__file__).resolve().parents[2] / "data" / "contaia.db"


def get_connection() -> sqlite3.Connection:
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DATABASE_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS accountants (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            email           TEXT UNIQUE NOT NULL,
            password_hash   TEXT NOT NULL,
            name            TEXT NOT NULL,
            created_at      TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS clients (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            accountant_id   INTEGER NOT NULL REFERENCES accountants(id),
            name            TEXT NOT NULL,
            rfc             TEXT,
            industry        TEXT
        );

        CREATE TABLE IF NOT EXISTS periods (
            id              TEXT PRIMARY KEY,
            year            INTEGER NOT NULL,
            month           INTEGER NOT NULL,
            label           TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sales (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            accountant_id   INTEGER NOT NULL REFERENCES accountants(id),
            client_id       INTEGER NOT NULL REFERENCES clients(id),
            period_id       TEXT NOT NULL REFERENCES periods(id),
            fecha           TEXT NOT NULL,
            cliente_nombre  TEXT NOT NULL,
            producto        TEXT NOT NULL,
            cantidad        REAL DEFAULT 1,
            precio_unitario REAL,
            monto_neto      REAL NOT NULL,
            iva             REAL DEFAULT 0,
            monto_total     REAL NOT NULL
        );

        CREATE TABLE IF NOT EXISTS expenses (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            accountant_id   INTEGER NOT NULL REFERENCES accountants(id),
            client_id       INTEGER NOT NULL REFERENCES clients(id),
            period_id       TEXT NOT NULL REFERENCES periods(id),
            fecha           TEXT NOT NULL,
            categoria       TEXT NOT NULL,
            descripcion     TEXT,
            monto           REAL NOT NULL,
            iva             REAL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS payroll (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            accountant_id   INTEGER NOT NULL REFERENCES accountants(id),
            client_id       INTEGER NOT NULL REFERENCES clients(id),
            period_id       TEXT NOT NULL REFERENCES periods(id),
            empleado        TEXT NOT NULL,
            puesto          TEXT,
            salario_bruto   REAL NOT NULL,
            deducciones     REAL DEFAULT 0,
            salario_neto    REAL NOT NULL,
            isr             REAL DEFAULT 0,
            imss            REAL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS products (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            accountant_id   INTEGER NOT NULL REFERENCES accountants(id),
            client_id       INTEGER NOT NULL REFERENCES clients(id),
            period_id       TEXT NOT NULL REFERENCES periods(id),
            nombre          TEXT NOT NULL,
            categoria       TEXT,
            precio_unitario REAL,
            costo_unitario  REAL
        );

        CREATE TABLE IF NOT EXISTS insights (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            accountant_id   INTEGER NOT NULL REFERENCES accountants(id),
            client_id       INTEGER NOT NULL REFERENCES clients(id),
            question        TEXT NOT NULL,
            answer_text     TEXT NOT NULL,
            chart_config    TEXT,
            is_refreshable  INTEGER DEFAULT 0,
            created_at      TEXT DEFAULT (datetime('now')),
            last_period_id  TEXT NOT NULL REFERENCES periods(id)
        );

        CREATE TABLE IF NOT EXISTS uploads (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            accountant_id   INTEGER NOT NULL REFERENCES accountants(id),
            client_id       INTEGER NOT NULL REFERENCES clients(id),
            filename        TEXT NOT NULL,
            table_type      TEXT NOT NULL,
            period_id       TEXT NOT NULL REFERENCES periods(id),
            rows_processed  INTEGER DEFAULT 0,
            rows_skipped    INTEGER DEFAULT 0,
            created_at      TEXT DEFAULT (datetime('now'))
        );
    """)
    conn.commit()
    conn.close()
