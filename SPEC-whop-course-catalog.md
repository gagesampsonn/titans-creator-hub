# Spec: Whop Course Catalog

## Objective

Mirror the approved Whop courses inside Titans without copying course data into
the repository. Chapters, titles, order, lesson types, content, PDFs, embeds,
and signed Whop-hosted video playback data are read server-side from Whop.

## Tech Stack

- Node.js 22 built-in `fetch`
- Whop REST API v1 with `courses:read`
- Plain JSON same-origin API
- Whop-hosted Mux media plus existing YouTube and Loom embeds

## Commands

```bash
node --test whop-auth/course.test.mjs
node --test whop-auth/auth.test.mjs whop-auth/course.test.mjs
node scripts/validate-launch-site.mjs
```

## Project Structure

```text
whop-auth/server.mjs       Whop client, catalog normalization, HTTP handlers
whop-auth/course.test.mjs  Contract and filtering tests
exclusive/course/index.html Catalog consumer
```

## Code Style

```js
function publicLessonSummary(lesson, completedLessonIds) {
  return {
    id: lesson.id,
    title: lesson.title,
    type: lesson.lesson_type,
    order: lesson.order,
    completed: completedLessonIds.has(lesson.id),
  };
}
```

- Convert Whop responses into a small first-party response contract.
- Do not pass arbitrary upstream fields through to the browser.
- Preserve Whop ordering and filter non-visible content.

## Interface Contract

### `GET /course-api/catalog`

Returns `200 application/json`:

```json
{
  "data": {
    "courses": [
      {
        "id": "cors_...",
        "title": "FULL COURSE",
        "chapters": [
          {
            "id": "chap_...",
            "title": "Chapter 1",
            "lessons": [
              {
                "id": "lesn_...",
                "title": "Lesson title",
                "type": "multi",
                "durationSeconds": 600,
                "completed": false
              }
            ]
          }
        ]
      }
    ],
    "csrfToken": "signed-short-lived-value"
  }
}
```

Only the three allowlisted course IDs in the capability map are returned.
Lesson playback tokens and full lesson bodies are excluded from this response.

### `GET /course-api/lessons/{lessonId}`

Returns the full visible lesson only after verifying that its ID belongs to an
allowlisted course. The response uses one of these media forms:

- `mux`: signed playback ID plus Whop-issued video, thumbnail, and storyboard
  tokens when available.
- `youtube`: validated YouTube video ID.
- `loom`: validated Loom share ID.
- `pdf`: Whop media URL and filename.
- `none`: text-only lesson.

The server returns a limited Markdown text body and safe attachment metadata.
Raw HTML is never inserted into the page.

### Errors

- `400 invalid_request`: malformed course or lesson ID.
- `401 authentication_required`: missing or invalid Titans session.
- `403 exclusive_access_required`: user lacks Titans Exclusive.
- `404 lesson_not_found`: unknown, hidden, or non-allowlisted lesson.
- `502 course_provider_error`: Whop returned an invalid response.
- `503 course_provider_unavailable`: Whop timed out or was unavailable.

All successful and error responses use `Cache-Control: no-store`.

## Testing Strategy

- Contract-test all supported lesson media variants: Whop-hosted Mux, YouTube,
  Loom, PDF, and text.
- Verify hidden courses and lessons are filtered.
- Verify a valid but non-allowlisted Whop lesson ID returns `404`.
- Verify signed playback data never appears in the catalog response.
- Verify Whop failures produce stable, non-secret error envelopes.

## Boundaries

- Always: call Whop from the server, pin the course allowlist, use timeouts,
  validate response shapes, and return no-store responses.
- Ask first: adding or removing allowlisted courses, enabling quizzes, or adding
  another media provider.
- Never: put the Whop API key in browser code, expose hidden lessons, cache
  signed media tokens publicly, or render upstream HTML unsanitized.

## Success Criteria

- The website shows all 53 currently visible lessons in their Whop chapter and
  course order.
- Whop title, chapter, lesson, video, text, and PDF changes appear on the next
  server fetch without a website deployment.
- All current media types are playable or readable without navigating to Whop.

## Open Questions

- None. All three current visible courses are included for Titans Exclusive.
