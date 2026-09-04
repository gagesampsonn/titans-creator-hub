# Spec: Course Player UI

## Objective

Add a clean, responsive Titans course interface at `/exclusive/course/` that lets
Exclusive members switch courses, browse chapters, watch lessons, open PDF
resources, mark lessons complete, and move to the previous or next lesson.

## Tech Stack

- Semantic HTML, existing Titans CSS tokens, and dependency-free JavaScript
- Mux Player web component for Whop-hosted signed video
- Sandboxed YouTube and Loom embeds
- Same-origin `/course-api/*` JSON endpoints

## Commands

```bash
node scripts/validate-launch-site.mjs
node --test whop-auth/auth.test.mjs whop-auth/course.test.mjs
```

## Project Structure

```text
exclusive/course/index.html Course application markup, styles, and behavior
assets/commerce.css         Existing shared Titans design tokens
scripts/validate-launch-site.mjs Static route and security assertions
whop-auth/Caddyfile.routes  Protected page and API routing
```

## Code Style

```js
async function selectLesson(lessonId) {
  setLessonLoading(true);
  try {
    const lesson = await getJson(`/course-api/lessons/${lessonId}`);
    renderLesson(lesson.data);
  } finally {
    setLessonLoading(false);
  }
}
```

- Keep data fetching separate from DOM rendering.
- Use semantic buttons, headings, lists, progress elements, and status regions.
- Use sentence case, restrained borders/radii, and the existing dark/orange
  Titans visual language.

## User Experience

### Desktop

- A compact header links back to Titans, shows course progress, and allows
  sign-out.
- A left sidebar contains course names, expandable chapters, lesson titles,
  durations, and completion marks.
- The main column contains one lesson player or document, lesson text, and
  previous/complete/next controls.

### Mobile

- Course selection and chapters stack above the lesson.
- Chapters expand vertically; no horizontal overflow or off-screen controls.
- The player remains 16:9 and controls meet a 44px minimum target size.

### States

- Skeleton/loading state while the catalog or lesson loads.
- Clear empty, access-denied, provider-unavailable, and retry states.
- Current lesson and completed lessons are conveyed with text/icons, not color
  alone.
- The URL stores `course` and `lesson` query parameters so refresh and browser
  back/forward preserve location.

### Media

- Whop-hosted videos use the returned signed playback ID and separate playback,
  thumbnail, and storyboard tokens.
- YouTube and Loom use provider-specific embed URLs built from validated IDs.
- PDFs render in a contained viewer with a direct open/download link.
- Text content is rendered from a restricted Markdown subset without raw HTML.

## Testing Strategy

- DOM/unit coverage for catalog rendering, course switching, chapter toggles,
  lesson selection, progress updates, and error states.
- Browser verification at 320px, 768px, 1024px, and 1440px.
- Keyboard-only verification for every lesson and control.
- Confirm zero first-party console errors and no failed same-origin requests.
- Test Mux, Loom, YouTube, PDF, and text examples from the live catalog.

## Boundaries

- Always: preserve existing site structure, use real Whop content, keep the UI
  responsive and keyboard accessible, and release behind the server-side gate.
- Ask first: changing existing homepage sections, adding comments/community,
  quizzes, certificates, downloads beyond Whop-provided PDFs, or watch-time
  analytics.
- Never: add decorative fake metrics, expose signed media outside the protected
  lesson endpoint, autoplay with sound, or reintroduce legacy guest access.

## Success Criteria

- Exclusive members can complete the entire current library without returning
  to Whop.
- Previous/next navigation follows Whop order across chapter boundaries.
- Completion updates immediately and survives refresh.
- The page works on mobile and desktop with accessible keyboard controls.
- Existing homepage, pricing pages, Prompt Builder, navigation flow, and copy
  remain unchanged except for the added Course destination.

## Open Questions

- Add one `Open member course` entry point to the existing public
  `/exclusive/` page. No existing link is removed and no other page changes.
