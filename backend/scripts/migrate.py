import os
import re
import sys
from pathlib import Path

import psycopg2
from dotenv import load_dotenv

load_dotenv()

MIGRATIONS_DIR = Path(__file__).resolve().parent.parent / "migrations"


def get_connection():
    return psycopg2.connect(
        host=os.environ["SUPABASE_DB_HOST"],
        port=os.environ["SUPABASE_DB_PORT"],
        dbname=os.environ["SUPABASE_DB_NAME"],
        user=os.environ["SUPABASE_DB_USER"],
        password=os.environ["SUPABASE_DB_PASSWORD"],
    )


def load_migration_files():
    files = sorted(
        f for f in MIGRATIONS_DIR.glob("[0-9][0-9][0-9]_*.sql")
    )
    return files


def extract_section(sql_text, section):
    pattern = rf"--\s*{section}\s*\n(.*?)(?=\n--\s*UP|\n--\s*DOWN|\Z)"
    match = re.search(pattern, sql_text, re.IGNORECASE | re.DOTALL)
    return match.group(1).strip() if match else ""


def run_up():
    files = load_migration_files()
    conn = get_connection()
    try:
        with conn:
            with conn.cursor() as cur:
                for f in files:
                    sql = extract_section(f.read_text(), "UP")
                    print(f"[UP] {f.name}")
                    cur.execute(sql)
        print("마이그레이션 완료: 테이블 전체 생성")
    finally:
        conn.close()


def run_down():
    files = load_migration_files()
    conn = get_connection()
    try:
        with conn:
            with conn.cursor() as cur:
                for f in reversed(files):
                    sql = extract_section(f.read_text(), "DOWN")
                    print(f"[DOWN] {f.name}")
                    cur.execute(sql)
        print("마이그레이션 완료: 테이블 전체 삭제")
    finally:
        conn.close()


if __name__ == "__main__":
    if len(sys.argv) != 2 or sys.argv[1] not in ("up", "down"):
        print("사용법: python scripts/migrate.py [up|down]")
        sys.exit(1)

    if sys.argv[1] == "up":
        run_up()
    else:
        run_down()
