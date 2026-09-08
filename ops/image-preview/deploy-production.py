"""Scoped immutable Contabo deployment; run only after GitHub push and tests.

prepare: validate archive and stage private auth plus selective static changes.
activate: switch auth/static symlinks and add the narrow private API proxy.
Rollback preserves image data and env; previous code simply leaves images off.
"""
import hashlib
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tarfile
import time
import urllib.request

STATIC = {'index.html', 'prompt/index.html', 'generator/index.html',
          'assets/image-builder.js', 'assets/image-builder.css', 'assets/image-builder-panel.html'}
OLD_AUTH = Path('/opt/titans-whop-auth/releases/20260907-49772c4')
OLD_STATIC = Path('/srv/titans-marketing/releases/20260908-638418c')


def run(args, cwd=None):
    result = subprocess.run(args, cwd=cwd, capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError('command_failed_' + Path(args[0]).name)


def switch(base, target, suffix):
    temporary = base / ('current.next-' + suffix)
    os.symlink(target, temporary)
    os.replace(temporary, base / 'current')


def health():
    for _ in range(20):
        try:
            with urllib.request.urlopen('http://127.0.0.1:8091/auth/whop/healthz', timeout=3) as response:
                if response.status == 200:
                    return
        except Exception:
            time.sleep(1)
    raise RuntimeError('auth_health_failed')


def main():
    if os.geteuid() != 0:
        raise RuntimeError('root_required')
    action, commit, expected_hash = sys.argv[1:4]
    if action not in ('prepare', 'activate') or not re.fullmatch('[a-f0-9]{7}', commit) or not re.fullmatch('[a-f0-9]{64}', expected_hash):
        raise RuntimeError('invalid_arguments')
    archive = Path('/tmp/titans-images-' + commit + '.tar')
    if hashlib.sha256(archive.read_bytes()).hexdigest() != expected_hash:
        raise RuntimeError('archive_hash_mismatch')
    auth = Path('/opt/titans-whop-auth/releases/20260908-' + commit)
    static = Path('/srv/titans-marketing/releases/20260908-' + commit)
    if (OLD_AUTH.parent.parent / 'current').resolve() != OLD_AUTH or (OLD_STATIC.parent.parent / 'current').resolve() != OLD_STATIC:
        raise RuntimeError('live_release_changed')
    if action == 'prepare':
        if auth.exists() or static.exists():
            raise RuntimeError('release_already_exists')
        with tarfile.open(archive) as bundle:
            members = bundle.getmembers()
            files = [m for m in members if not m.isdir()]
            if any(not m.isfile() or m.name.startswith('/') or '..' in Path(m.name).parts for m in files):
                raise RuntimeError('unsafe_archive')
            allowed = STATIC | {'ops/image-preview/provision-production.py', 'ops/image-preview/deploy-production.py'}
            if any(m.name not in allowed and not m.name.startswith('whop-auth/') for m in files):
                raise RuntimeError('unexpected_archive_member')
            if not STATIC.issubset({m.name for m in files}):
                raise RuntimeError('missing_static_payload')
            if any('node_modules' in Path(m.name).parts or Path(m.name).name.startswith('.env') for m in files):
                raise RuntimeError('unsafe_private_payload')
            auth.mkdir(mode=0o755)
            shutil.copytree(OLD_STATIC, static, symlinks=True)
            for member in files:
                if member.name.startswith('whop-auth/'):
                    target = auth / member.name.removeprefix('whop-auth/')
                elif member.name in STATIC:
                    target = static / member.name
                else:
                    continue
                target.parent.mkdir(parents=True, exist_ok=True)
                content = bundle.extractfile(member).read()
                # Do not follow any inherited symlink when replacing a static file.
                if target.is_symlink():
                    raise RuntimeError('unexpected_target_symlink')
                target.write_bytes(content)
                target.chmod(0o644)
                if hashlib.sha256(target.read_bytes()).digest() != hashlib.sha256(content).digest():
                    raise RuntimeError('payload_verification_failed')
            for old in OLD_STATIC.rglob('*'):
                relative = old.relative_to(OLD_STATIC)
                if old.is_file() and not old.is_symlink() and relative.as_posix() not in STATIC:
                    if hashlib.sha256(old.read_bytes()).digest() != hashlib.sha256((static / relative).read_bytes()).digest():
                        raise RuntimeError('unrelated_static_changed')
        run(['npm', 'ci', '--ignore-scripts', '--omit=dev', '--no-fund'], cwd=auth)
        run(['node', '--input-type=module', '-e', "import sharp from 'sharp'; await sharp({create:{width:1,height:1,channels:3,background:'white'}}).png().toBuffer(); console.log('Native image processing ready');"], cwd=auth)
        print('Immutable auth and static releases staged; dependency/native checks passed. Live pointers unchanged.')
        return

    if not (auth / 'image-runtime.mjs').is_file() or not (static / 'assets/image-builder.js').is_file():
        raise RuntimeError('release_not_prepared')
    caddy = Path('/etc/caddy/Caddyfile')
    previous_caddy = caddy.read_text()
    anchor = '\thandle /auth/whop/* {\n\t\treverse_proxy 127.0.0.1:8091\n\t}\n'
    if previous_caddy.count(anchor) != 1 or '/image-api/*' in previous_caddy:
        raise RuntimeError('unexpected_caddy_routes')
    updated = previous_caddy.replace(anchor, anchor + '\n\t# Whop-authenticated private image generation, balances and owner-only downloads.\n\thandle /image-api/* {\n\t\treverse_proxy 127.0.0.1:8091\n\t}\n')
    backup = Path('/etc/caddy/Caddyfile.before-images-' + commit)
    backup.write_text(previous_caddy)
    backup.chmod(0o600)
    stage = Path('/etc/caddy/Caddyfile.images-next-' + commit)
    stage.write_text(updated)
    stage.chmod(0o640)
    shutil.chown(stage, user='root', group='caddy')
    run(['caddy', 'validate', '--adapter', 'caddyfile', '--config', str(stage)])
    unit = Path('/etc/systemd/system/titans-whop-auth.service')
    unit_backup = unit.with_name(unit.name + '.before-images-' + commit)
    shutil.copy2(unit, unit_backup)
    switched_auth = switched_static = changed_caddy = False
    try:
        shutil.copy2(auth / 'titans-whop-auth.service', unit)
        run(['systemctl', 'daemon-reload'])
        switch(auth.parent.parent, auth, commit)
        switched_auth = True
        run(['systemctl', 'restart', 'titans-whop-auth'])
        health()
        # A configured runtime responds with 401, not feature-unavailable 404.
        try:
            urllib.request.urlopen('http://127.0.0.1:8091/image-api/state', timeout=10)
            raise RuntimeError('anonymous_image_access')
        except urllib.error.HTTPError as error:
            if error.code != 401:
                raise RuntimeError('image_runtime_unavailable')
        os.replace(stage, caddy)
        changed_caddy = True
        run(['systemctl', 'reload', 'caddy'])
        switch(static.parent.parent, static, commit)
        switched_static = True
        health()
        print('Auth API, protected image proxy and selective static release activated. Generation flag remains operator-controlled.')
    except Exception:
        if switched_static:
            switch(static.parent.parent, OLD_STATIC, commit + '-rollback')
        if changed_caddy:
            caddy.write_text(previous_caddy)
            caddy.chmod(0o640)
            shutil.chown(caddy, user='root', group='caddy')
            run(['systemctl', 'reload', 'caddy'])
        if switched_auth:
            switch(auth.parent.parent, OLD_AUTH, commit + '-rollback')
        shutil.copy2(unit_backup, unit)
        run(['systemctl', 'daemon-reload'])
        run(['systemctl', 'restart', 'titans-whop-auth'])
        raise


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        # Only explicit non-secret guard identifiers may leave this script.
        message = str(error) if type(error) is RuntimeError and re.fullmatch('[a-z_]+', str(error)) else 'deployment_failed'
        print(message + '; inspect privately before retrying.', file=sys.stderr)
        sys.exit(1)
