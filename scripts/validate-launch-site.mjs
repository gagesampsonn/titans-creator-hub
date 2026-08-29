import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

const offers = {
  exclusive: {
    file: "exclusive/index.html",
    planId: "plan_i0exA8Z5f3XOZ",
    price: "$50",
    cadence: "month",
  },
  weekly: {
    file: "weekly/index.html",
    planId: "plan_DrOCjHLteEqXB",
    price: "$15",
    cadence: "week",
  },
  ai: {
    file: "ai/index.html",
    planId: "plan_bJeNjIIJAtzSR",
    price: "$29.99",
    cadence: "one-time",
  },
};

const failures = [];
const load = (relativePath) => {
  const absolutePath = resolve(root, relativePath);
  if (!existsSync(absolutePath)) {
    failures.push(`Missing required file: ${relativePath}`);
    return "";
  }
  return readFileSync(absolutePath, "utf8");
};

const home = load("index.html");
for (const route of ["/exclusive/", "/weekly/", "/ai/"]) {
  if (!home.includes(`href="${route}`))
    failures.push(`Homepage does not link to ${route}`);
}
const productSectionPosition = home.indexOf('id="products"');
const mainPosition = home.indexOf('<main id="main-content">');
if (
  productSectionPosition < mainPosition ||
  productSectionPosition - mainPosition > 500
) {
  failures.push("Homepage does not lead immediately with the product selector");
}
for (const removedHomepageElement of [
  "Learn. Create. Earn on TikTok Shop.",
  "historical tracked GMV",
  'id="compare"',
  'id="wins"',
]) {
  if (home.includes(removedHomepageElement)) {
    failures.push(
      `Homepage still contains removed content: ${removedHomepageElement}`,
    );
  }
}
if (!home.includes('href="https://wins.85.239.242.45.nip.io/"')) {
  failures.push("Homepage Results link does not point to the Wall of Wins");
}
if (!home.includes('aria-expanded="false"'))
  failures.push("Homepage is missing an accessible mobile navigation toggle");

for (const [slug, offer] of Object.entries(offers)) {
  const html = load(offer.file);
  if (!html) continue;
  if (!html.includes("https://js.whop.com/static/checkout/loader.js")) {
    failures.push(`${slug} is missing the official Whop checkout loader`);
  }
  if (!html.includes(`data-whop-checkout-plan-id="${offer.planId}"`)) {
    failures.push(`${slug} is not wired to its verified Whop plan`);
  }
  const embeddedPlanIds = [
    ...html.matchAll(/data-whop-checkout-plan-id="(plan_[A-Za-z0-9]+)"/g),
  ].map((match) => match[1]);
  if (embeddedPlanIds.some((id) => id !== offer.planId)) {
    failures.push(`${slug} contains a checkout for another product`);
  }
  if (
    !html.includes(offer.price) ||
    !html.toLowerCase().includes(offer.cadence)
  ) {
    failures.push(`${slug} is missing its verified price or billing cadence`);
  }
  if (html.includes("WHOP_API_KEY"))
    failures.push(`${slug} exposes a server-side environment variable name`);
}

const weekly = load(offers.weekly.file);
if (weekly && !weekly.includes('data-ai-access="false"')) {
  failures.push("Weekly does not explicitly state that AI access is excluded");
}

const ai = load(offers.ai.file);
if (ai && !ai.includes('data-community-access="false"')) {
  failures.push(
    "AI does not explicitly state that community access is excluded",
  );
}

const resultsUrl = "https://wins.85.239.242.45.nip.io/";
for (const relativePath of [
  "index.html",
  ...Object.values(offers).map((offer) => offer.file),
  "brands/index.html",
]) {
  const html = load(relativePath);
  if (!html.includes(`href="${resultsUrl}"`)) {
    failures.push(`${relativePath} does not link Results to the Wall of Wins`);
  }
  if (html.includes('href="/#wins"') || html.includes('href="/#story"')) {
    failures.push(`${relativePath} still links to removed homepage sections`);
  }
}

for (const file of [
  "brands/index.html",
  "checkout/complete/index.html",
  "assets/commerce.css",
  "assets/commerce.js",
]) {
  load(file);
}

const localFiles = [
  "index.html",
  ...Object.values(offers).map((offer) => offer.file),
  "brands/index.html",
];
const serverRoutedPaths = new Set(["/sign-in"]);
for (const relativePath of localFiles) {
  const html = load(relativePath);
  if (!html) continue;
  for (const match of html.matchAll(
    /(?:href|src)="([^"#?]+)(?:[?#][^"]*)?"/g,
  )) {
    const target = match[1];
    if (
      /^(?:https?:|mailto:|tel:|data:|javascript:)/.test(target) ||
      target === "/" ||
      serverRoutedPaths.has(target)
    )
      continue;
    const resolvedTarget = target.startsWith("/")
      ? resolve(root, target.slice(1))
      : resolve(dirname(resolve(root, relativePath)), target);
    const candidate = target.endsWith("/")
      ? resolve(resolvedTarget, "index.html")
      : resolvedTarget;
    if (!existsSync(candidate))
      failures.push(
        `${relativePath} references missing local target: ${target}`,
      );
  }
}

if (failures.length) {
  console.error(`Launch validation failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  "Launch validation passed: routes, prices, plan isolation, checkout embeds, and local assets are correct.",
);
