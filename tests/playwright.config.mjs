import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "course-ui.spec.mjs",
  fullyParallel: false,
  workers: 1,
  reporter: "line",
  use: {
    browserName: "chromium",
    headless: true,
    launchOptions: {
      executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    },
  },
});
