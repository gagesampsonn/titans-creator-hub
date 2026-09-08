# Character Builder release — September 8, 2026

## Scope

Publish the user's latest supplied character package into both existing protected
builder routes. Add 1,063 reusable traits, per-category reroll and lock controls,
short display summaries and a collapsed full prompt. Preserve the exact opening
"A picture is taken of a:" and all full realism details when copying.

The production payload is limited to:

- prompt/index.html
- generator/index.html
- prompt/character-library.js
- prompt/character-summary.js
- prompt/character-controls.css

Existing navigation, downloader and multi-image video flows remain intact.
The homepage, checkout, affiliate system, auth service and database are unchanged.
No mock UI, direct OpenAI endpoint, credit grant or paid credit sale is enabled.
The separate image-generation implementation remains unfinished and local.

## Verification before release

- Full Node test suite passes; launch validator and whitespace check pass.
- Eight focused character tests pass, including both protected routes and full
  prompt retention. Independent review found no required changes and exercised
  160 age/gender rerolls plus complete-prompt clipboard writes.
- Real browser: collapsed/expanded prompt state and ARIA state agree; locks
  survive rerolls. Desktop console has no errors. Responsive iframe viewports
  at 320, 768, 1024 and 1440 pixels visually checked; controls are at least 44px
  high. The existing signed-in live builder is accessible before the switch.

## Deployment and rollback

Commit and push through GitHub first. Extract only the five committed payload
files into a new immutable release copied from the current production directory.
Compare hashes against the committed artifact and verify every other file is
unchanged before atomically replacing /srv/titans-marketing/current.

Previous release: /srv/titans-marketing/releases/20260908-49108e2.
Rollback: atomically repoint current to that exact directory. No migration or
auth restart is involved, and all customer records remain intact. Roll back for
new builder JavaScript failures, missing dependencies, auth regression or broken
existing tools. Verify signed-in prompt/reroll, anonymous auth gate, health and
unchanged public-page hashes immediately after switching.
