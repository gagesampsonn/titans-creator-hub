import { createReadStream, existsSync } from "node:fs";
import http from "node:http";
import { extname, join, normalize } from "node:path";

import { expect, test } from "@playwright/test";

const root = normalize(join(import.meta.dirname, ".."));
let server;
let origin;

const catalog = {
  courses: [
    {
      id: "cors_course",
      title: "Full Course",
      tagline: "Build your TikTok Shop business",
      order: 1,
      chapters: [
        {
          id: "chap_start",
          title: "Getting started",
          order: 1,
          lessons: [
            { id: "lesn_mux", title: "Welcome to Titans", type: "video", order: 1, durationSeconds: 125, completed: false },
            { id: "lesn_text", title: "Set your foundation", type: "text", order: 2, durationSeconds: null, completed: false },
          ],
        },
      ],
    },
    {
      id: "cors_resources",
      title: "Titans Resources",
      tagline: null,
      order: 2,
      chapters: [
        {
          id: "chap_resources",
          title: "Creator resources",
          order: 1,
          lessons: [
            { id: "lesn_pdf", title: "Creator checklist", type: "pdf", order: 1, durationSeconds: null, completed: true },
          ],
        },
      ],
    },
  ],
  totalLessons: 3,
  completedLessons: 1,
  csrfToken: "test.csrf",
};

const details = {
  lesn_mux: {
    id: "lesn_mux",
    title: "Welcome to Titans",
    type: "video",
    content: "Start here. This lesson explains how to use the Titans course and take action each week.",
    media: { kind: "mux", playbackId: "signed-playback-id", playbackToken: "token", thumbnailToken: null, storyboardToken: null },
    attachments: [],
  },
  lesn_text: {
    id: "lesn_text",
    title: "Set your foundation",
    type: "text",
    content: "## Your first steps\n\n- Pick a product\n- Study strong videos\n- Publish consistently",
    media: { kind: "none" },
    attachments: [],
  },
  lesn_pdf: {
    id: "lesn_pdf",
    title: "Creator checklist",
    type: "pdf",
    content: "Use this checklist before publishing your next video.",
    media: { kind: "pdf", filename: "creator-checklist.pdf", url: "https://media.whop.com/checklist.pdf" },
    attachments: [],
  },
};

test.beforeAll(async () => {
  server = http.createServer((request, response) => {
    const pathname = new URL(request.url, "http://localhost").pathname;
    const relative = pathname.endsWith("/") ? `${pathname}index.html` : pathname;
    const file = normalize(join(root, relative.replace(/^\//, "")));
    if (!file.startsWith(root) || !existsSync(file)) {
      response.writeHead(404).end("Not found");
      return;
    }
    const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".png": "image/png" };
    response.setHeader("Content-Type", types[extname(file)] ?? "application/octet-stream");
    createReadStream(file).pipe(response);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});

test.afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test.beforeEach(async ({ page }) => {
  await page.route("https://cdn.jsdelivr.net/**", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: "customElements.define('mux-player', class extends HTMLElement {});",
    }),
  );
  await page.route("**/course-api/**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (pathname === "/course-api/catalog") {
      await route.fulfill({ json: { data: catalog } });
      return;
    }
    const detail = pathname.match(/^\/course-api\/lessons\/(lesn_[a-z]+)$/);
    if (detail && details[detail[1]]) {
      await route.fulfill({ json: { data: details[detail[1]] } });
      return;
    }
    if (request.method() === "POST") {
      await route.fulfill({ json: { data: { completed: true, started: true } } });
      return;
    }
    await route.fulfill({ status: 404, json: { error: { code: "not_found", message: "Not found" } } });
  });
});

test("desktop course navigation and completion", async ({ page }) => {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") errors.push(message.text());
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${origin}/exclusive/course/`);
  await expect(page.getByRole("heading", { name: "Welcome to Titans" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Welcome to Titans/ })).toHaveAttribute("aria-current", "true");
  await expect(page.locator("mux-player")).toBeVisible();
  await page.getByRole("button", { name: "Mark complete" }).click();
  await expect(page.getByRole("button", { name: /Completed/ }).last()).toBeDisabled();
  await expect(page.getByText("2 of 3 lessons complete")).toBeVisible();
  await page.getByRole("button", { name: /Next/ }).click();
  await expect(page.getByRole("heading", { name: "Set your foundation" })).toBeVisible();
  await expect(page.locator("[data-media-shell]")).toBeHidden();
  await page.screenshot({ path: "C:/Users/gages/course-preview-desktop.png", fullPage: true });
  expect(errors).toEqual([]);
});

test("mobile lesson browser stacks and collapses", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/exclusive/course/`);
  await expect(page.getByRole("heading", { name: "Welcome to Titans" })).toBeVisible();
  const toggle = page.getByRole("button", { name: "Browse lessons" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("button", { name: "Titans Resources" }).click();
  await expect(page.getByRole("heading", { name: "Creator checklist" })).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await page.screenshot({ path: "C:/Users/gages/course-preview-mobile.png", fullPage: true });
});
