"""Pages-only immutable release. No backend, secrets, or Caddy changes."""
import hashlib
import os
from pathlib import Path
import re
import subprocess
import sys
import tarfile
import urllib.request

BASE = Path('/srv/titans-marketing')
PREVIOUS = BASE / 'releases/20260909-8cf19aa'
AUTH = Path('/opt/titans-whop-auth/releases/20260908-62962ca')
FILES = {'index.html', 'ai/index.html', 'exclusive/index.html',
         'assets/ai-landing.css', 'assets/home-landing.css',
         'assets/exclusive-landing.css', 'assets/titans-logo-light.png',
         'assets/ai-promotion-preview.js', 'assets/ai-promotion-preview.css'}


def stream_digest(stream):
    # The Contabo host uses Python 3.10 (file_digest was added in 3.11).
    checksum = hashlib.sha256()
    for chunk in iter(lambda: stream.read(1024 * 1024), b''):
        checksum.update(chunk)
    return checksum.hexdigest()


def digest(path):
    with path.open('rb') as stream:
        return stream_digest(stream)


def guard(condition, code):
    if not condition:
        raise RuntimeError(code)


def health():
    with urllib.request.urlopen('http://127.0.0.1:8091/auth/whop/healthz', timeout=10) as response:
        guard(response.status == 200, 'auth_unhealthy')


def switch(target, suffix):
    temporary = BASE / ('current.landing-' + suffix)
    os.symlink(target, temporary)
    os.replace(temporary, BASE / 'current')


def main():
    action, commit, archive_hash = sys.argv[1:]
    guard(action in ('prepare', 'activate'), 'invalid_action')
    guard(re.fullmatch('[a-f0-9]{7}', commit), 'invalid_commit')
    guard(re.fullmatch('[a-f0-9]{64}', archive_hash), 'invalid_hash')
    guard((BASE / 'current').resolve() == PREVIOUS, 'static_release_changed')
    guard(Path('/opt/titans-whop-auth/current').resolve() == AUTH, 'auth_release_changed')
    archive = Path('/tmp/titans-landing-' + commit + '.tar')
    guard(digest(archive) == archive_hash, 'archive_hash_mismatch')
    release = BASE / 'releases' / ('20260909-' + commit)
    health()
    with tarfile.open(archive) as bundle:
        members = [member for member in bundle.getmembers() if not member.isdir()]
        guard(len(members) == len(FILES) and {m.name for m in members} == FILES, 'unexpected_payload')
        guard(all(m.isfile() for m in members), 'unsafe_payload')
        if action == 'prepare':
            guard(not release.exists(), 'release_exists')
            subprocess.run(['cp', '-a', '--reflink=auto', str(PREVIOUS), str(release)], check=True)
            for member in members:
                target = release / member.name
                guard(not target.is_symlink() and target.parent.resolve().is_relative_to(release), 'unsafe_target')
                with bundle.extractfile(member) as source:
                    target.write_bytes(source.read())
                target.chmod(0o644)
        guard(release.is_dir() and not release.is_symlink(), 'release_not_prepared')
        for member in members:
            with bundle.extractfile(member) as source:
                expected = stream_digest(source)
            guard(digest(release / member.name) == expected, 'payload_mismatch')
        for old in PREVIOUS.rglob('*'):
            relative = old.relative_to(PREVIOUS)
            new = release / relative
            if old.is_symlink():
                guard(new.is_symlink() and os.readlink(old) == os.readlink(new), 'symlink_changed')
            elif old.is_file() and relative.as_posix() not in FILES:
                guard(not new.is_symlink() and digest(old) == digest(new), 'unrelated_file_changed')
    if action == 'prepare':
        print('Nine public files staged and verified; unrelated files unchanged; live pointer unchanged.')
        return
    switch(release, commit)
    try:
        health()
        for name in ['index.html', 'ai/index.html', 'exclusive/index.html']:
            url = 'https://titansagency.co/' + name
            with urllib.request.urlopen(url, timeout=20) as response:
                guard(hashlib.sha256(response.read()).hexdigest() == digest(release / name), 'live_content_mismatch')
    except Exception:
        switch(PREVIOUS, commit + '-rollback')
        raise
    print('Activated ' + str(release) + '; live HTML hashes verified; backend unchanged.')


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        code = str(error) if type(error) is RuntimeError and re.fullmatch('[a-z_]+', str(error)) else 'deployment_failed'
        print(code + '; no secrets emitted.', file=sys.stderr)
        sys.exit(1)
