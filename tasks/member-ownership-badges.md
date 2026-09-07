# Confirmed-access badges — September 7, 2026

Add a small green ring with a white check next to each My Titans access label.
The existing server-verified access flags control visibility. AI access included
with Exclusive also receives the check; locked/unverified products never do.
Status text remains available to assistive technology; the icon is decorative.

Verification: new behavior test failed before implementation and passed after.
Tests cover AI-only, Exclusive-bundled AI, Weekly, malformed access flags and API
failure. Browser checks at 320, 768, 1024 and 1440px show 24px icons without overflow.
The site uses browser JavaScript and Node built-ins with no dependency manifest or
lockfile at this installation boundary, so a package-manager audit does not apply.

Deployment is static-only, through GitHub to an immutable Contabo release. The
authentication release remains unchanged. Roll back the static current symlink
to `/srv/titans-marketing/releases/20260905-a228fe4` if verification fails.
Unrelated pending upgrade-preview changes are excluded.

Live verification caught returning browsers reusing the pre-badge script. The
library now versions its CSS and script URLs; a regression test covers this.
