(() => {
  "use strict";

  const elements = {
    progress: document.querySelector("[data-progress]"),
    progressLabel: document.querySelector("[data-progress-label]"),
    coursePicker: document.querySelector("[data-course-picker]"),
    chapterList: document.querySelector("[data-chapter-list]"),
    navToggle: document.querySelector("[data-nav-toggle]"),
    navContent: document.querySelector("[data-nav-content]"),
    loading: document.querySelector("[data-loading-state]"),
    error: document.querySelector("[data-error-state]"),
    errorMessage: document.querySelector("[data-error-message]"),
    retry: document.querySelector("[data-retry]"),
    content: document.querySelector("[data-lesson-content]"),
    path: document.querySelector("[data-lesson-path]"),
    title: document.querySelector("[data-lesson-title]"),
    media: document.querySelector("[data-media-shell]"),
    copy: document.querySelector("[data-lesson-copy]"),
    attachments: document.querySelector("[data-attachments]"),
    attachmentList: document.querySelector("[data-attachment-list]"),
    previous: document.querySelector("[data-previous]"),
    complete: document.querySelector("[data-complete]"),
    next: document.querySelector("[data-next]"),
    announcer: document.querySelector("[data-announcer]"),
  };

  const state = {
    catalog: null,
    csrfToken: "",
    courseId: "",
    lessonId: "",
    lessons: [],
    loadingLesson: false,
  };

  class ApiError extends Error {
    constructor(status, code, message) {
      super(message);
      this.status = status;
      this.code = code;
    }
  }

  async function api(path, options = {}) {
    const response = await fetch(path, {
      credentials: "same-origin",
      ...options,
      headers: { Accept: "application/json", ...options.headers },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new ApiError(
        response.status,
        payload?.error?.code ?? "request_failed",
        payload?.error?.message ?? "Please try again in a moment.",
      );
    }
    return payload.data;
  }

  function showLoading() {
    elements.loading.hidden = false;
    elements.error.hidden = true;
    elements.content.hidden = true;
  }

  function showError(error) {
    elements.loading.hidden = true;
    elements.content.hidden = true;
    elements.error.hidden = false;
    if (error?.status === 401) {
      elements.errorMessage.textContent = "Your session ended. Sign in with Whop again to continue.";
      elements.retry.textContent = "Sign in again";
    } else if (error?.status === 403) {
      elements.errorMessage.textContent = "An active Titans Exclusive membership is required to open this course.";
      elements.retry.textContent = "View Titans Exclusive";
    } else {
      elements.errorMessage.textContent = error?.message || "Please try again in a moment.";
      elements.retry.textContent = "Try again";
    }
  }

  function formatDuration(seconds) {
    if (!Number.isFinite(seconds) || seconds <= 0) return "";
    const minutes = Math.max(1, Math.round(seconds / 60));
    return `${minutes} min`;
  }

  function flattenLessons(catalog) {
    return catalog.courses.flatMap((course) =>
      course.chapters.flatMap((chapter) =>
        chapter.lessons.map((lesson) => ({ ...lesson, course, chapter })),
      ),
    );
  }

  function updateProgress() {
    const completed = state.lessons.filter((lesson) => lesson.completed).length;
    const total = state.lessons.length;
    elements.progress.max = Math.max(total, 1);
    elements.progress.value = completed;
    elements.progress.textContent = `${total ? Math.round((completed / total) * 100) : 0}%`;
    elements.progressLabel.textContent = `${completed} of ${total} lessons complete`;
  }

  function setLocation(courseId, lessonId, replace = false) {
    const url = new URL(location.href);
    url.searchParams.set("course", courseId);
    url.searchParams.set("lesson", lessonId);
    history[replace ? "replaceState" : "pushState"]({}, "", url);
  }

  function lessonFromUrl() {
    const params = new URLSearchParams(location.search);
    const lessonId = params.get("lesson");
    return state.lessons.find((lesson) => lesson.id === lessonId) ?? null;
  }

  function selectedCourse() {
    return state.catalog.courses.find((course) => course.id === state.courseId);
  }

  function renderCoursePicker() {
    elements.coursePicker.replaceChildren();
    for (const course of state.catalog.courses) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "course-choice";
      button.textContent = course.title;
      button.setAttribute("aria-pressed", String(course.id === state.courseId));
      button.addEventListener("click", () => {
        const first = state.lessons.find(
          (lesson) => lesson.course.id === course.id && !lesson.completed,
        ) ?? state.lessons.find((lesson) => lesson.course.id === course.id);
        if (first) selectLesson(first.id);
      });
      elements.coursePicker.append(button);
    }
  }

  function renderChapters() {
    elements.chapterList.replaceChildren();
    const course = selectedCourse();
    if (!course) return;
    for (const chapter of course.chapters) {
      const details = document.createElement("details");
      details.className = "chapter";
      details.open = chapter.lessons.some((lesson) => lesson.id === state.lessonId);

      const summary = document.createElement("summary");
      summary.textContent = chapter.title;
      details.append(summary);

      const list = document.createElement("ol");
      list.className = "lesson-list";
      for (const lesson of chapter.lessons) {
        const item = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.className = `lesson-button${lesson.completed ? " is-complete" : ""}`;
        button.setAttribute("aria-current", String(lesson.id === state.lessonId));

        const status = document.createElement("span");
        status.className = "lesson-status";
        status.setAttribute("aria-label", lesson.completed ? "Completed" : "Not completed");
        status.textContent = lesson.completed ? "✓" : "";
        const name = document.createElement("span");
        name.className = "lesson-name";
        name.textContent = lesson.title;
        const duration = document.createElement("span");
        duration.className = "lesson-duration";
        duration.textContent = formatDuration(lesson.durationSeconds);
        button.append(status, name, duration);
        button.addEventListener("click", () => selectLesson(lesson.id));
        item.append(button);
        list.append(item);
      }
      details.append(list);
      elements.chapterList.append(details);
    }
  }

  function appendInlineText(parent, value) {
    const linkPattern = /\[([^\]]+)]\((https:\/\/[^\s)]+|mailto:[^\s)]+)\)/g;
    let cursor = 0;
    for (const match of value.matchAll(linkPattern)) {
      parent.append(document.createTextNode(value.slice(cursor, match.index)));
      const anchor = document.createElement("a");
      anchor.href = match[2];
      anchor.textContent = match[1];
      if (match[2].startsWith("https://")) {
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
      }
      parent.append(anchor);
      cursor = match.index + match[0].length;
    }
    parent.append(document.createTextNode(value.slice(cursor)));
  }

  function renderMarkdown(markdown) {
    const fragment = document.createDocumentFragment();
    const lines = String(markdown || "").replaceAll("\r", "").split("\n");
    let list = null;
    let listType = "";

    function closeList() { list = null; listType = ""; }

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) { closeList(); continue; }
      const heading = line.match(/^(#{2,4})\s+(.+)$/);
      if (heading) {
        closeList();
        const node = document.createElement(heading[1].length === 2 ? "h3" : "h4");
        appendInlineText(node, heading[2]);
        fragment.append(node);
        continue;
      }
      const unordered = line.match(/^[-*]\s+(.+)$/);
      const ordered = line.match(/^\d+[.)]\s+(.+)$/);
      if (unordered || ordered) {
        const type = ordered ? "ol" : "ul";
        if (!list || listType !== type) {
          list = document.createElement(type);
          listType = type;
          fragment.append(list);
        }
        const item = document.createElement("li");
        appendInlineText(item, (ordered || unordered)[1]);
        list.append(item);
        continue;
      }
      closeList();
      const paragraph = document.createElement("p");
      appendInlineText(paragraph, line);
      fragment.append(paragraph);
    }
    return fragment;
  }

  function renderMedia(media, title) {
    elements.media.replaceChildren();
    elements.media.hidden = media.kind === "none";
    if (media.kind === "mux") {
      const player = document.createElement("mux-player");
      player.setAttribute("playback-id", media.playbackId);
      player.setAttribute("metadata-video-title", title);
      player.setAttribute("accent-color", "#f15b3a");
      player.setAttribute("preload", "metadata");
      player.tokens = {
        playback: media.playbackToken || undefined,
        thumbnail: media.thumbnailToken || undefined,
        storyboard: media.storyboardToken || undefined,
      };
      elements.media.append(player);
      return;
    }
    if (media.kind === "youtube" || media.kind === "loom") {
      const iframe = document.createElement("iframe");
      iframe.title = title;
      iframe.loading = "eager";
      iframe.allow = "accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen";
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.src = media.kind === "youtube"
        ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(media.id)}`
        : `https://www.loom.com/embed/${encodeURIComponent(media.id)}`;
      elements.media.append(iframe);
      return;
    }
    if (media.kind === "pdf") {
      const iframe = document.createElement("iframe");
      iframe.className = "pdf-viewer";
      iframe.title = media.filename;
      iframe.loading = "eager";
      iframe.src = media.url;
      const fallback = document.createElement("p");
      fallback.className = "pdf-fallback";
      const link = document.createElement("a");
      link.href = media.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = `Open ${media.filename} in a new tab`;
      fallback.append(link);
      elements.media.append(iframe, fallback);
      return;
    }
  }

  function renderAttachments(attachments) {
    elements.attachmentList.replaceChildren();
    elements.attachments.hidden = attachments.length === 0;
    for (const attachment of attachments) {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = attachment.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = attachment.filename;
      item.append(link);
      elements.attachmentList.append(item);
    }
  }

  function renderLesson(lesson) {
    const current = state.lessons.find((item) => item.id === state.lessonId);
    if (!current) return;
    elements.path.textContent = `${current.course.title} / ${current.chapter.title}`;
    elements.title.textContent = lesson.title;
    renderMedia(lesson.media, lesson.title);
    elements.copy.replaceChildren(renderMarkdown(lesson.content));
    elements.copy.hidden = !lesson.content;
    renderAttachments(lesson.attachments);

    const index = state.lessons.findIndex((item) => item.id === state.lessonId);
    elements.previous.disabled = index <= 0;
    elements.next.disabled = index >= state.lessons.length - 1;
    elements.complete.disabled = current.completed;
    elements.complete.classList.toggle("is-complete", current.completed);
    elements.complete.textContent = current.completed ? "Completed ✓" : "Mark complete";
    elements.loading.hidden = true;
    elements.error.hidden = true;
    elements.content.hidden = false;
  }

  async function recordStart(lessonId) {
    try {
      await api(`/course-api/lessons/${encodeURIComponent(lessonId)}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": state.csrfToken,
        },
        body: "{}",
      });
    } catch {
      // Opening a lesson should still work if the optional start marker fails.
    }
  }

  async function selectLesson(lessonId, options = {}) {
    if (state.loadingLesson && lessonId === state.lessonId) return;
    const selected = state.lessons.find((lesson) => lesson.id === lessonId);
    if (!selected) return;
    state.lessonId = selected.id;
    state.courseId = selected.course.id;
    renderCoursePicker();
    renderChapters();
    if (!options.fromHistory) setLocation(state.courseId, state.lessonId, options.replace);
    showLoading();
    state.loadingLesson = true;
    try {
      const lesson = await api(`/course-api/lessons/${encodeURIComponent(lessonId)}`);
      if (state.lessonId !== lessonId) return;
      renderLesson(lesson);
      recordStart(lessonId);
      if (matchMedia("(max-width: 900px)").matches) {
        elements.navContent.classList.remove("is-open");
        elements.navToggle.setAttribute("aria-expanded", "false");
      }
    } catch (error) {
      if (state.lessonId === lessonId) showError(error);
    } finally {
      state.loadingLesson = false;
    }
  }

  async function loadCatalog() {
    showLoading();
    try {
      state.catalog = await api("/course-api/catalog");
      state.csrfToken = state.catalog.csrfToken;
      state.lessons = flattenLessons(state.catalog);
      if (!state.lessons.length) throw new Error("No lessons are available yet.");
      updateProgress();
      const requested = lessonFromUrl();
      const first = requested ?? state.lessons.find((lesson) => !lesson.completed) ?? state.lessons[0];
      await selectLesson(first.id, { replace: !requested });
    } catch (error) {
      showError(error);
    }
  }

  async function completeCurrentLesson() {
    const current = state.lessons.find((lesson) => lesson.id === state.lessonId);
    if (!current || current.completed) return;
    elements.complete.disabled = true;
    elements.complete.textContent = "Saving...";
    try {
      await api(`/course-api/lessons/${encodeURIComponent(current.id)}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": state.csrfToken,
        },
        body: "{}",
      });
      current.completed = true;
      updateProgress();
      renderChapters();
      elements.complete.classList.add("is-complete");
      elements.complete.textContent = "Completed ✓";
      elements.announcer.textContent = `${current.title} marked complete.`;
    } catch (error) {
      elements.complete.disabled = false;
      elements.complete.textContent = "Mark complete";
      elements.announcer.textContent = error.message;
    }
  }

  function moveLesson(offset) {
    const index = state.lessons.findIndex((lesson) => lesson.id === state.lessonId);
    const target = state.lessons[index + offset];
    if (target) selectLesson(target.id);
  }

  elements.navToggle.addEventListener("click", () => {
    const expanded = elements.navToggle.getAttribute("aria-expanded") === "true";
    elements.navToggle.setAttribute("aria-expanded", String(!expanded));
    elements.navContent.classList.toggle("is-open", !expanded);
  });
  elements.retry.addEventListener("click", () => {
    if (elements.retry.textContent === "Sign in again") {
      location.href = "/auth/whop/login?next=%2Fexclusive%2Fcourse%2F";
      return;
    }
    if (elements.retry.textContent === "View Titans Exclusive") {
      location.href = "/exclusive/#checkout";
      return;
    }
    loadCatalog();
  });
  elements.previous.addEventListener("click", () => moveLesson(-1));
  elements.next.addEventListener("click", () => moveLesson(1));
  elements.complete.addEventListener("click", completeCurrentLesson);
  addEventListener("popstate", () => {
    const lesson = lessonFromUrl();
    if (lesson && lesson.id !== state.lessonId) selectLesson(lesson.id, { fromHistory: true });
  });

  loadCatalog();
})();
