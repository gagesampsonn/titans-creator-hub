import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
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
const searchable = (html) =>
  html.replaceAll("&amp;", "&").replace(/\s+/g, " ").toLowerCase();
const load = (relativePath) => {
  const absolutePath = resolve(root, relativePath);
  if (!existsSync(absolutePath)) {
    failures.push(`Missing required file: ${relativePath}`);
    return "";
  }
  return readFileSync(absolutePath, "utf8");
};
const sha256 = (relativePath) => {
  const absolutePath = resolve(root, relativePath);
  if (!existsSync(absolutePath)) {
    failures.push(`Missing required file: ${relativePath}`);
    return "";
  }
  return createHash("sha256")
    .update(readFileSync(absolutePath))
    .digest("hex")
    .toUpperCase();
};

const home = load("index.html");
for (const route of ["/titans/", "/ai/"]) {
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
const productSectionEnd = home.indexOf("</section>", productSectionPosition);
const productSection = home.slice(productSectionPosition, productSectionEnd);
const ecosystemCardCount = [
  ...productSection.matchAll(/class="[^"]*ecosystem-card(?:\s|\")/g),
].length;
if (ecosystemCardCount !== 2) {
  failures.push(
    `Homepage must show exactly two ecosystem cards; found ${ecosystemCardCount}`,
  );
}
for (const forbiddenHomepageOffer of [
  "product-choice",
  "$15",
  "$29.99",
  "$50",
]) {
  if (productSection.includes(forbiddenHomepageOffer)) {
    failures.push(
      `Homepage ecosystem section still contains pricing-card content: ${forbiddenHomepageOffer}`,
    );
  }
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
if (!home.includes('href="/results/"')) {
  failures.push(
    "Homepage Results link does not point to the first-party Wall of Wins",
  );
}
if (!home.includes('aria-expanded="false"'))
  failures.push("Homepage is missing an accessible mobile navigation toggle");

for (const testimonyVideo of [
  "/assets/testimonials/creator-testimony-1.mp4",
  "/assets/testimonials/creator-testimony-2.mp4",
]) {
  if (!home.includes(`src="${testimonyVideo}"`)) {
    failures.push(`Homepage does not include testimony video: ${testimonyVideo}`);
  }
  load(testimonyVideo.slice(1));
}

const titans = load("titans/index.html");
for (const route of ["/weekly/", "/exclusive/"]) {
  if (titans && !titans.includes(`href="${route}`)) {
    failures.push(`Titans comparison page does not link to ${route}`);
  }
}
for (const requiredPlanCopy of ["$15", "$50", "Titans Weekly", "Titans Exclusive"]) {
  if (titans && !titans.includes(requiredPlanCopy)) {
    failures.push(`Titans comparison page is missing: ${requiredPlanCopy}`);
  }
}

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

const aiVideo = load("assets/ai/titans-ai-results.mp4");
if (ai) {
  const proofPosition = ai.indexOf('id="ai-results"');
  const checkoutPosition = ai.indexOf('id="checkout"');
  if (proofPosition < 0 || proofPosition > checkoutPosition) {
    failures.push("AI result video is not public before checkout");
  }
  for (const requiredVideoMarkup of [
    'src="/assets/ai/titans-ai-results.mp4"',
    "controls",
    "playsinline",
    'preload="metadata"',
  ]) {
    if (!ai.includes(requiredVideoMarkup)) {
      failures.push(`AI result video is missing: ${requiredVideoMarkup}`);
    }
  }
  for (const requiredAiCopy of [
    "Create high-quality, realistic AI videos for TikTok Shop",
    "Full step-by-step guide",
    "does not include subscriptions or credits for third-party AI software",
  ]) {
    if (!searchable(ai).includes(requiredAiCopy.toLowerCase())) {
      failures.push(
        `AI page is missing required product copy: ${requiredAiCopy}`,
      );
    }
  }
}
if (!aiVideo) failures.push("AI result video is missing");

const exclusive = load(offers.exclusive.file);
for (const requiredExclusiveBenefit of [
  "Free Product Samples",
  "Paid Brand Retainer Opportunities",
  "Increased Commission Opportunities",
  "Titans AI Prompting Tool",
  "Coaching & Creator Support",
  "Private Discord Community",
]) {
  if (
    exclusive &&
    !searchable(exclusive).includes(requiredExclusiveBenefit.toLowerCase())
  ) {
    failures.push(
      `Exclusive page is missing required benefit: ${requiredExclusiveBenefit}`,
    );
  }
}

const resultsUrl = "/results/";
for (const relativePath of [
  "index.html",
  "titans/index.html",
  ...Object.values(offers).map((offer) => offer.file),
  "brands/index.html",
]) {
  const html = load(relativePath);
  if (!html.includes(`href="${resultsUrl}"`)) {
    failures.push(`${relativePath} does not link Results to the Wall of Wins`);
  }
  if (html.includes("wins.85.239.242.45.nip.io")) {
    failures.push(`${relativePath} still exposes the IP-based Wall of Wins URL`);
  }
  if (html.includes('href="/#wins"') || html.includes('href="/#story"')) {
    failures.push(`${relativePath} still links to removed homepage sections`);
  }
}

for (const file of [
  "brands/index.html",
  "checkout/complete/index.html",
  "assets/commerce.js",
]) {
  load(file);
}
const commerceCss = load("assets/commerce.css");

const applePayAssociation = load(
  ".well-known/apple-developer-merchantid-domain-association",
);
if (applePayAssociation && applePayAssociation.trim().length < 100) {
  failures.push("Apple Pay domain-association file appears incomplete");
}

const sitemap = load("sitemap.xml");
if (!sitemap.includes("https://titansagency.co/results/")) {
  failures.push("Sitemap does not include the first-party Results page");
}
if (!sitemap.includes("https://titansagency.co/titans/")) {
  failures.push("Sitemap does not include the Titans comparison page");
}

const localFiles = [
  "index.html",
  "titans/index.html",
  ...Object.values(offers).map((offer) => offer.file),
  "brands/index.html",
];
const serverRoutedPaths = new Set(["/auth/whop/login", "/results/"]);
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

for (const relativePath of localFiles) {
  const html = load(relativePath);
  if (html.includes('href="/sign-in')) {
    failures.push(
      `${relativePath} still links to the disconnected legacy sign-in`,
    );
  }
  if (!html.includes('href="/auth/whop/login')) {
    failures.push(`${relativePath} does not link sign-in to Whop OAuth`);
  }
}

const promptBuilder = load("prompt/index.html");
const generatorBuilder = load("generator/index.html");
if (promptBuilder && generatorBuilder && promptBuilder !== generatorBuilder) {
  failures.push("Prompt and generator routes do not serve the same current builder");
}

const transformationAssets = {
  "assets/hero-example/hero-motion.mp4":
    "6C222C8BA829992AB454BDD514A3791207C9737D369144DCFBFE3910B303A160",
  "assets/hero-example/hero-motion.jpg":
    "B2FF58F1E9321FC7A1369E7399769ACC9622850DA469A73147A3FE7389509A59",
  "assets/hero-example/hero-character.png":
    "CBF8178D596D5E77413991881318DCE4CEF1682839E9FE3B81A955C4DE8CE571",
  "assets/hero-example/hero-result.mp4":
    "E6E1A9760A665A864A9623CFDFDF31BAE758254FC3C15CB589B21EA7E62A0F83",
  "assets/hero-example/hero-result.jpg":
    "C32785A00014EFE5996C944167AE025A24D751AF67B9CB9CB813B5BC77DF1681",
};

for (const [asset, expectedHash] of Object.entries(transformationAssets)) {
  const actualHash = sha256(asset);
  if (actualHash && actualHash !== expectedHash) {
    failures.push(`AI transformation asset does not match Gage Prompter: ${asset}`);
  }
}

if (ai) {
  for (const preservedConversionCopy of [
    "Create realistic AI videos for TikTok Shop.",
    "Get the AI Prompt Builder",
    "See how it works",
    "Buy AI Content",
  ]) {
    if (!ai.includes(preservedConversionCopy)) {
      failures.push(`AI redesign removed conversion content: ${preservedConversionCopy}`);
    }
  }
  for (const requiredShowcaseMarkup of [
    'class="ai-transformation-showcase"',
    'class="ai-showcase-flow"',
    'class="ai-showcase-step ai-showcase-record"',
    'class="ai-showcase-step ai-showcase-prompts"',
    'class="ai-showcase-step ai-showcase-finish"',
    "Record a video",
    "Build image + video prompts",
    "Plug in. Get your AI video.",
    'src="/assets/hero-example/hero-motion.mp4"',
    'poster="/assets/hero-example/hero-motion.jpg"',
    'src="/assets/hero-example/hero-character.png"',
    'src="/assets/hero-example/hero-result.mp4"',
    'poster="/assets/hero-example/hero-result.jpg"',
    'data-showcase-video="source"',
    'data-showcase-video="result"',
  ]) {
    if (!ai.includes(requiredShowcaseMarkup)) {
      failures.push(`AI hero is missing transformation showcase markup: ${requiredShowcaseMarkup}`);
    }
  }
  for (const forbiddenShowcaseLabel of [
    "Motion Reference",
    "Character Image",
    "Final AI Video",
  ]) {
    if (ai.includes(forbiddenShowcaseLabel)) {
      failures.push(`AI page uses forbidden tutorial label: ${forbiddenShowcaseLabel}`);
    }
  }

  const showcaseStart = ai.indexOf('class="ai-transformation-showcase"');
  const copyStart = ai.indexOf('class="ai-hero-copy"');
  const copyEnd = ai.indexOf("</div>", copyStart);
  const priceStart = ai.indexOf('class="price-panel ai-hero-price"');
  if (!(copyEnd < showcaseStart && showcaseStart < priceStart)) {
    failures.push(
      "AI transformation showcase must sit directly after the hero copy and before pricing",
    );
  }
  const showcaseEnd = ai.indexOf("</figure>", showcaseStart);
  const showcase = ai.slice(showcaseStart, showcaseEnd);
  const showcaseVideos = [...showcase.matchAll(/<video[\s\S]*?<\/video>/g)].map(
    (match) => match[0],
  );
  if (showcaseVideos.length !== 2) {
    failures.push(
      `AI transformation showcase must contain exactly two videos; found ${showcaseVideos.length}`,
    );
  }
  for (const video of showcaseVideos) {
    for (const requiredVideoAttribute of [
      "muted",
      "loop",
      "playsinline",
      "poster=",
      "preload=",
    ]) {
      if (!video.includes(requiredVideoAttribute)) {
        failures.push(
          `AI transformation video is missing ${requiredVideoAttribute}`,
        );
      }
    }
    if (video.includes("controls")) {
      failures.push("AI transformation videos must not show native controls");
    }
  }
}

for (const requiredCompactShowcaseCss of [
  'grid-template-areas: "copy price" "showcase price";',
  "max-width: 46rem;",
  "border: 1px solid rgba(255, 255, 255, 0.14);",
]) {
  if (!commerceCss.includes(requiredCompactShowcaseCss)) {
    failures.push(
      `AI showcase is missing compact card styling: ${requiredCompactShowcaseCss}`,
    );
  }
}

for (const requiredBuilderSignature of [
  "Titans Higgsfield Helper",
  "Create Realistic AI TikTok Shop Videos",
  'id="tiktokForm"',
  'id="characterForm"',
  'id="imagePromptMode"',
  'id="professionSelect"',
  'id="promptForm"',
  'id="strictness"',
  "function buildCharacterPrompt",
  "function buildAvatarPrompt",
  "function buildPrompt",
  'const TIKTOK_API_BASE = "https://app.titansagency.co"',
]) {
  if (promptBuilder && !promptBuilder.includes(requiredBuilderSignature)) {
    failures.push(
      `Protected Prompt Builder is missing the current Gage Sampson behavior: ${requiredBuilderSignature}`,
    );
  }
}

for (const retiredBuilderSignature of [
  "Titans AI Prompt Builder",
  "cdn.tailwindcss.com",
  'id="generateBtn"',
]) {
  if (promptBuilder && promptBuilder.includes(retiredBuilderSignature)) {
    failures.push(
      `Protected Prompt Builder still contains the retired implementation: ${retiredBuilderSignature}`,
    );
  }
}

for (const match of promptBuilder.matchAll(
  /(?:src|poster)="(\/?assets\/[^"]+)"/g,
)) {
  if (match[1].startsWith("/")) {
    load(match[1].slice(1));
  } else {
    for (const route of ["prompt", "generator"]) {
      load(`${route}/${match[1]}`);
    }
  }
}

const authServer = load("whop-auth/server.mjs");
for (const requiredAccessResource of [
  "WHOP_AI_PRODUCT_ID",
  "WHOP_EXCLUSIVE_PRODUCT_ID",
]) {
  if (!authServer.includes(requiredAccessResource)) {
    failures.push(`Whop auth gateway is missing ${requiredAccessResource}`);
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
