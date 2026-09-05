const WHOP_API_URL = "https://api.whop.com/api/v1";
const CATALOG_CACHE_MS = 60_000;
const MAX_PAGES = 10;

export class CourseProviderError extends Error {
  constructor(code, status = 502) {
    super(code);
    this.name = "CourseProviderError";
    this.code = code;
    this.status = status;
  }
}

async function whopJson(fetchFn, url, options = {}) {
  let response;
  try {
    response = await fetchFn(url, {
      ...options,
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    throw new CourseProviderError("course_provider_unavailable", 503);
  }
  if (!response.ok) {
    throw new CourseProviderError(
      response.status >= 500
        ? "course_provider_unavailable"
        : "course_provider_error",
      response.status >= 500 ? 503 : 502,
    );
  }
  try {
    return await response.json();
  } catch {
    throw new CourseProviderError("course_provider_error", 502);
  }
}

function authorization(token) {
  return { Authorization: `Bearer ${token}` };
}

function safeText(value, fallback = "") {
  return typeof value === "string" ? value.slice(0, 100_000) : fallback;
}

function safeOrder(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function sortByOrder(items) {
  return items.sort((left, right) => left.order - right.order);
}

function normalizeFile(file) {
  if (!file || typeof file !== "object") return null;
  const url = safeWhopMediaUrl(file.url);
  if (!url) return null;
  return {
    filename: safeText(file.filename, "Download").slice(0, 240),
    url,
  };
}

function safeWhopMediaUrl(value) {
  if (typeof value !== "string" || value.length > 2_048) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (url.hostname !== "whop.com" && !url.hostname.endsWith(".whop.com")) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

function normalizeMedia(lesson) {
  const video = lesson.video_asset;
  if (
    video &&
    typeof video === "object" &&
    typeof video.signed_playback_id === "string" &&
    /^[A-Za-z0-9_-]+$/.test(video.signed_playback_id)
  ) {
    return {
      kind: "mux",
      playbackId: video.signed_playback_id,
      playbackToken: safeText(video.signed_video_playback_token) || null,
      thumbnailToken: safeText(video.signed_thumbnail_playback_token) || null,
      storyboardToken: safeText(video.signed_storyboard_playback_token) || null,
    };
  }

  if (
    lesson.embed_type === "youtube" &&
    typeof lesson.embed_id === "string" &&
    /^[A-Za-z0-9_-]{6,64}$/.test(lesson.embed_id)
  ) {
    return { kind: "youtube", id: lesson.embed_id };
  }

  if (
    lesson.embed_type === "loom" &&
    typeof lesson.embed_id === "string" &&
    /^[A-Za-z0-9_-]{6,128}$/.test(lesson.embed_id)
  ) {
    return { kind: "loom", id: lesson.embed_id };
  }

  const pdf = normalizeFile(lesson.main_pdf);
  return pdf ? { kind: "pdf", ...pdf } : { kind: "none" };
}

function normalizeAttachments(value) {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeFile).filter(Boolean).slice(0, 25);
}

function lessonSummary(nestedLesson, listedLesson, completedLessonIds) {
  const lesson = { ...nestedLesson, ...listedLesson };
  return {
    id: lesson.id,
    title: safeText(lesson.title, "Untitled lesson").slice(0, 120),
    type: safeText(lesson.lesson_type, "text").slice(0, 32),
    order: safeOrder(lesson.order),
    durationSeconds:
      Number.isFinite(Number(lesson.video_asset?.duration_seconds))
        ? Number(lesson.video_asset.duration_seconds)
        : null,
    completed: completedLessonIds.has(lesson.id),
  };
}

function pageCursor(pageInfo) {
  if (!pageInfo?.has_next_page) return null;
  return pageInfo.end_cursor ?? pageInfo.next_cursor ?? null;
}

async function listPages(fetchFn, path, token, params) {
  const output = [];
  let cursor = null;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = new URL(`${WHOP_API_URL}${path}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }
    if (cursor) url.searchParams.set("after", cursor);
    const payload = await whopJson(fetchFn, url, {
      headers: authorization(token),
    });
    if (!Array.isArray(payload?.data)) {
      throw new CourseProviderError("course_provider_error", 502);
    }
    output.push(...payload.data);
    cursor = pageCursor(payload.page_info);
    if (!cursor) return output;
  }
  throw new CourseProviderError("course_provider_error", 502);
}

export function createCourseService(config, { fetchFn = fetch } = {}) {
  let catalogCache = null;
  let companyIdCache = null;

  async function getCompanyId() {
    if (companyIdCache) return companyIdCache;
    const product = await whopJson(
      fetchFn,
      `${WHOP_API_URL}/products/${encodeURIComponent(config.exclusiveProductId)}`,
      { headers: authorization(config.whopApiKey) },
    );
    const companyId = product?.account?.id ?? product?.company?.id;
    if (!/^biz_[A-Za-z0-9_]+$/.test(companyId ?? "")) {
      throw new CourseProviderError("course_provider_error", 502);
    }
    companyIdCache = companyId;
    return companyId;
  }

  async function buildCatalog() {
    const courses = [];
    const lessonIds = new Set();
    for (const courseId of config.courseIds) {
      const [course, listedLessons] = await Promise.all([
        whopJson(
          fetchFn,
          `${WHOP_API_URL}/courses/${encodeURIComponent(courseId)}`,
          { headers: authorization(config.whopApiKey) },
        ),
        listPages(fetchFn, "/course_lessons", config.whopApiKey, {
          first: 100,
          course_id: courseId,
        }),
      ]);
      if (course?.id !== courseId || course.visibility !== "visible") continue;
      const visibleLessons = new Map(
        listedLessons
          .filter(
            (lesson) =>
              lesson?.visibility === "visible" &&
              /^lesn_[A-Za-z0-9_]+$/.test(lesson.id ?? ""),
          )
          .map((lesson) => [lesson.id, lesson]),
      );
      const chapters = [];
      for (const chapter of Array.isArray(course.chapters) ? course.chapters : []) {
        if (!/^chap_[A-Za-z0-9_]+$/.test(chapter?.id ?? "")) continue;
        const lessons = [];
        for (const nestedLesson of Array.isArray(chapter.lessons)
          ? chapter.lessons
          : []) {
          const listedLesson = visibleLessons.get(nestedLesson?.id);
          if (!listedLesson) continue;
          lessonIds.add(nestedLesson.id);
          lessons.push({ nestedLesson, listedLesson });
        }
        if (lessons.length) {
          chapters.push({
            id: chapter.id,
            title: safeText(chapter.title, "Chapter").slice(0, 120),
            order: safeOrder(chapter.order),
            lessons,
          });
        }
      }
      if (chapters.length) {
        courses.push({
          id: course.id,
          title: safeText(course.title, "Course").trim().slice(0, 120),
          tagline: safeText(course.tagline).slice(0, 280) || null,
          order: safeOrder(course.order),
          chapters,
        });
      }
    }
    return { courses: sortByOrder(courses), lessonIds };
  }

  async function baseCatalog() {
    if (catalogCache?.expiresAt > Date.now()) return catalogCache.value;
    const value = await buildCatalog();
    catalogCache = { value, expiresAt: Date.now() + CATALOG_CACHE_MS };
    return value;
  }

  async function memberToken(userId) {
    const payload = await whopJson(fetchFn, `${WHOP_API_URL}/access_tokens`, {
      method: "POST",
      headers: {
        ...authorization(config.whopApiKey),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        company_id: await getCompanyId(),
        user_id: userId,
        scoped_actions: ["courses:read", "course_analytics:read"],
      }),
    });
    const token = payload?.token ?? payload?.access_token;
    if (typeof token !== "string" || token.length < 8) {
      throw new CourseProviderError("course_provider_error", 502);
    }
    return token;
  }

  async function completedLessonIds(userId, allowedLessonIds, courseIds) {
    const token = await memberToken(userId);
    const interactions = (
      await Promise.all(
        courseIds.map((courseId) =>
          listPages(fetchFn, "/course_lesson_interactions", token, {
            first: 100,
            user_id: userId,
            course_id: courseId,
          }),
        ),
      )
    ).flat();
    return new Set(
      interactions
        .filter((interaction) => interaction?.completed === true)
        .map((interaction) => interaction?.lesson?.id ?? interaction?.lesson_id)
        .filter((lessonId) => allowedLessonIds.has(lessonId)),
    );
  }

  async function getCatalog(userId) {
    const catalog = await baseCatalog();
    const completed = await completedLessonIds(
      userId,
      catalog.lessonIds,
      catalog.courses.map((course) => course.id),
    );
    const courses = catalog.courses.map((course) => ({
      id: course.id,
      title: course.title,
      tagline: course.tagline,
      order: course.order,
      chapters: sortByOrder(
        course.chapters.map((chapter) => ({
          id: chapter.id,
          title: chapter.title,
          order: chapter.order,
          lessons: sortByOrder(
            chapter.lessons.map(({ nestedLesson, listedLesson }) =>
              lessonSummary(nestedLesson, listedLesson, completed),
            ),
          ),
        })),
      ),
    }));
    return {
      courses,
      totalLessons: catalog.lessonIds.size,
      completedLessons: completed.size,
    };
  }

  async function assertAllowedLesson(lessonId) {
    if (!/^lesn_[A-Za-z0-9_]+$/.test(lessonId ?? "")) return false;
    return (await baseCatalog()).lessonIds.has(lessonId);
  }

  async function getLesson(lessonId) {
    if (!(await assertAllowedLesson(lessonId))) return null;
    const lesson = await whopJson(
      fetchFn,
      `${WHOP_API_URL}/course_lessons/${encodeURIComponent(lessonId)}`,
      { headers: authorization(config.whopApiKey) },
    );
    if (lesson?.id !== lessonId || lesson.visibility !== "visible") return null;
    return {
      id: lesson.id,
      title: safeText(lesson.title, "Untitled lesson").slice(0, 120),
      type: safeText(lesson.lesson_type, "text").slice(0, 32),
      content: typeof lesson.content === "string" ? lesson.content.slice(0, 100_000) : null,
      media: normalizeMedia(lesson),
      attachments: normalizeAttachments(lesson.attachments),
    };
  }

  async function updateProgress(userId, lessonId, action) {
    if (!(await assertAllowedLesson(lessonId))) return null;
    const suffix = action === "complete" ? "mark_as_completed" : "start";
    await whopJson(
      fetchFn,
      `${WHOP_API_URL}/course_lessons/${encodeURIComponent(lessonId)}/${suffix}`,
      {
        method: "POST",
        headers: authorization(await memberToken(userId)),
      },
    );
    return true;
  }

  return { getCatalog, getLesson, updateProgress };
}
