import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database import init_db, get_session


def seed(accounts: int = 3):
    init_db()
    print(f"Seeding {accounts} accounts...")
    print("Seed script — not yet implemented")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--accounts", type=int, default=3)
    args = parser.parse_args()
    seed(args.accounts)
