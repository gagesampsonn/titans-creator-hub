"""One-time, root-only additive image schema provisioning. Never emits secrets.

Run with the committed auth release directory as its only argument. Existing
roles/configuration cause a safe stop; re-running must not rotate credentials.
"""
import json
import os
from pathlib import Path
import re
import secrets
import subprocess
import sys
from urllib.parse import quote


def main():
    if os.geteuid() != 0:
        raise RuntimeError('root_required')
    release = Path(sys.argv[1]).resolve(strict=True)
    if release.parent != Path('/opt/titans-whop-auth/releases'):
        raise RuntimeError('invalid_release')
    schema = (release / 'image-schema.sql').read_text()
    env_path = Path('/opt/titans-whop-auth/whop-auth.env')
    original = env_path.read_text()
    if re.search(r'^TITANS_(IMAGE_DATABASE_URL|IMAGES_ENABLED|IMAGE_SALES_APPROVED)=', original, re.M):
        raise RuntimeError('image_configuration_already_exists')
    if not re.search(r'^OPENAI_API_KEY=.+', original, re.M):
        raise RuntimeError('provider_key_missing')
    inspected = subprocess.run(['docker', 'inspect', 'titans-postgres'], capture_output=True, text=True, check=True)
    db_env = dict(item.split('=', 1) for item in json.loads(inspected.stdout)[0]['Config']['Env'] if '=' in item)
    admin = db_env.get('POSTGRES_USER', 'postgres')
    database = db_env.get('POSTGRES_DB', admin)
    if not re.fullmatch(r'[A-Za-z0-9_]+', admin) or not re.fullmatch(r'[A-Za-z0-9_]+', database):
        raise RuntimeError('unexpected_database_name')

    def sql(statement):
        result = subprocess.run(['docker', 'exec', '-i', 'titans-postgres', 'psql', '-X', '-A', '-t',
                                 '-v', 'ON_ERROR_STOP=1', '-U', admin, '-d', database],
                                input=statement, text=True, capture_output=True)
        if result.returncode:
            raise RuntimeError('database_operation_failed')
        return result.stdout.strip()

    role = 'titans_images_runtime'
    if sql(f"SELECT count(*) FROM pg_roles WHERE rolname='{role}'") != '0':
        raise RuntimeError('runtime_role_already_exists')
    if sql("SELECT count(*) FROM pg_namespace WHERE nspname='titans_images'") != '0':
        raise RuntimeError('image_schema_already_exists')
    password = secrets.token_hex(32)
    # DDL and least-privilege validation share a transaction. A failed validation
    # rolls back the new role/schema without altering existing application data.
    statement = f"""BEGIN;
    CREATE ROLE {role} LOGIN PASSWORD '{password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION CONNECTION LIMIT 8;
    {schema}
    REVOKE ALL ON SCHEMA titans_images FROM PUBLIC;
    GRANT CONNECT ON DATABASE "{database}" TO {role};
    GRANT USAGE ON SCHEMA titans_images TO {role};
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA titans_images TO {role};
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA titans_images TO {role};
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema','titans_images')
        AND (has_table_privilege('{role}', quote_ident(schemaname)||'.'||quote_ident(tablename), 'SELECT')
          OR has_table_privilege('{role}', quote_ident(schemaname)||'.'||quote_ident(tablename), 'INSERT,UPDATE,DELETE'))) THEN
        RAISE EXCEPTION 'runtime role has access outside image schema';
      END IF;
      IF has_schema_privilege('{role}', 'titans_images', 'CREATE') THEN
        RAISE EXCEPTION 'runtime must not own schema';
      END IF;
    END $$;
    COMMIT;"""
    # Backup is root-only, outside every web root, and contains the prior env.
    backup = env_path.with_name('whop-auth.env.before-images')
    with backup.open('x') as output:
        os.chmod(backup, 0o600)
        output.write(original)
        output.flush()
        os.fsync(output.fileno())
    dsn = f'postgresql://{role}:{password}@127.0.0.1:5432/{quote(database, safe="")}'
    updated = original.rstrip('\n') + '\n' + '\n'.join([
        'TITANS_IMAGE_DATABASE_URL=' + dsn,
        'TITANS_IMAGES_ENABLED=true',
        'TITANS_IMAGE_SALES_APPROVED=false',
    ]) + '\n'
    temporary = env_path.with_name('whop-auth.env.images-next')
    with temporary.open('x') as output:
        os.chmod(temporary, 0o600)
        output.write(updated)
        output.flush()
        os.fsync(output.fileno())
    # Persist the only copy of the runtime password BEFORE database COMMIT.
    # Leave this root-only recovery file intact if provisioning fails.
    directory_fd = os.open(env_path.parent, os.O_RDONLY | os.O_DIRECTORY)
    try:
        os.fsync(directory_fd)
        sql(statement)
        os.replace(temporary, env_path)
        os.fsync(directory_fd)
    finally:
        os.close(directory_fd)
    print('Private image schema and restricted runtime role provisioned. Generation and credit sales remain paused.')


if __name__ == '__main__':
    try:
        main()
    except Exception:
        print('Image provisioning stopped safely. Inspect state privately before retrying; no credentials emitted.', file=sys.stderr)
        sys.exit(1)
