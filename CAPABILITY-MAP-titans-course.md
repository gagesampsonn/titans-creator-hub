# Capability Map: Titans Course

## Scope

Expose the existing Whop course library at `/exclusive/course/` for active Titans
Exclusive members. Whop remains the source of truth for course content,
protected media, and lesson progress.

| Module id | Responsibility | Depends on |
| --- | --- | --- |
| `exclusive-access` | Reuse the existing Whop OAuth session and allow only active Titans Exclusive members | Existing Whop authentication gateway |
| `whop-course-catalog` | Read the approved Whop courses, chapters, lessons, lesson content, and protected media metadata | `exclusive-access` |
| `whop-course-progress` | Read, start, and complete lessons for the signed-in Whop member without storing a second progress database | `exclusive-access`, `whop-course-catalog` |
| `course-player-ui` | Present the course library, lesson player, chapter navigation, and progress controls at `/exclusive/course/` | `whop-course-catalog`, `whop-course-progress` |

Build order: `exclusive-access` -> `whop-course-catalog` ->
`whop-course-progress` -> `course-player-ui`.

## Approved content set

The current Whop account exposes three visible courses to Titans Exclusive:

1. `FULL COURSE` - 6 chapters, 41 lessons
2. `AI Content` - 1 chapter, 2 lessons
3. `Titans Resources` - 4 chapters, 10 lessons

The library currently contains Whop-hosted Mux videos, Loom videos, YouTube
videos, text content, and PDF lessons. Hidden or newly created courses are not
published automatically; production uses an explicit course-ID allowlist.

## Initiative boundaries

- The existing homepage, pricing, and Prompt Builder remain unchanged. The
  public `/exclusive/` sales page receives one member-course entry point.
- Titans Weekly and standalone AI Content do not unlock
  `/exclusive/course/`.
- The website does not edit Whop courses or upload course media.
- Whop API credentials and signed playback tokens remain server-side or are
  returned only to a currently authorized member with no-store responses.
