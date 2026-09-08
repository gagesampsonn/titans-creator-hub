"""Run image tests in an isolated PostgreSQL database, never production tables."""
import json
import os
from pathlib import Path
import re
import secrets
import subprocess
import sys
from urllib.parse import quote


def main():
    root = Path(sys.argv[1]).resolve()
    if not str(root).startswith('/tmp/titans-images-test-') or not (root / 'image-ledger.integration.mjs').is_file():
        raise RuntimeError('Invalid isolated test directory')
    info = json.loads(subprocess.check_output(['docker', 'inspect', 'titans-postgres']))[0]
    settings = dict(item.split('=', 1) for item in info['Config']['Env'] if '=' in item)
    admin = settings.get('POSTGRES_USER', 'postgres')
    database = settings.get('POSTGRES_DB', admin)
    name = 'titans_images_test_' + secrets.token_hex(8)
    if not re.fullmatch(r'titans_images_test_[a-f0-9]{16}', name):
        raise RuntimeError('Invalid test database target')
    password = secrets.token_hex(32)

    def sql(statement):
        result = subprocess.run(['docker', 'exec', '-i', 'titans-postgres', 'psql', '-X', '-v',
                                 'ON_ERROR_STOP=1', '-U', admin, '-d', database],
                                input=statement, text=True, capture_output=True)
        if result.returncode:
            raise RuntimeError('Isolated database administration failed; provider output suppressed')

    created_role = False
    created_db = False
    try:
        sql(f'CREATE ROLE "{name}" LOGIN PASSWORD \'{password}\' NOSUPERUSER NOCREATEDB NOCREATEROLE;')
        created_role = True
        sql(f'CREATE DATABASE "{name}" OWNER "{name}";')
        created_db = True
        env = dict(os.environ)
        env['TITANS_IMAGE_TEST_DATABASE_URL'] = f'postgresql://{name}:{quote(password)}@127.0.0.1:5432/{name}'
        result = subprocess.run(['node', '--test', 'image-ledger.integration.mjs'], cwd=root, env=env)
        return result.returncode
    finally:
        if created_db:
            sql(f'DROP DATABASE "{name}" WITH (FORCE);')
        if created_role:
            sql(f'DROP ROLE "{name}";')
        print('Removed only the isolated test database and its temporary login; production data unchanged.')


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception:
        print('Image database test setup failed. No credentials emitted.', file=sys.stderr)
        sys.exit(1)
