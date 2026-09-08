(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TITANS_CHARACTER_SUMMARY = api;
})(typeof window !== "undefined" ? window : null, function () {
  const labels = {
    "dark-blonde": "Dark ash blonde",
    "warm-blonde": "Warm blonde",
    "dark-brown": "Dark brown",
    "medium-brown": "Medium brown",
    "salt-and-pepper": "Salt-and-pepper",
    "silver-gray": "Silver-gray",
    "blue-gray": "Blue-gray",
    "gray-green": "Gray-green",
    "deep-brown": "Deep brown",
    "warm-brown": "Warm brown",
    "medium-brown-eyes": "Medium brown",
    "dark-hazel": "Dark hazel",
    "very-fair": "Very fair",
    "light-medium": "Light-medium",
    "medium-tan": "Medium-tan",
    "deep-tan-brown": "Deep tan-brown",
    "very-deep-brown": "Very deep brown",
    "neutral-cool": "Neutral-cool",
    "neutral-golden": "Neutral-golden",
    "olive-neutral": "Olive-neutral",
    "warm-golden": "Warm golden",
    "red-golden": "Red-golden",
    "cool-neutral": "Cool-neutral"
  };

  const hairCuts = {
    taper: "Close-cropped coily taper",
    crop: "Short textured crop",
    crew: "Crew cut",
    bob: "Chin-length bob",
    "blunt-bob": "Jaw-length bob",
    layers: "Shoulder-length layers",
    shag: "Collarbone-length shag",
    "long-layers": "Long loose curls",
    long: "Long straight hair",
    afro: "Natural afro",
    "twist-out": "Shoulder-length twist-out",
    "box-braids": "Medium box braids",
    "low-bun": "Low bun",
    ponytail: "Ponytail",
    pixie: "Short pixie",
    "receding-crop": "Receding short crop",
    "thinning-crop": "Thinning short crop",
    horseshoe: "Mostly bald",
    "clean-shaved": "Clean-shaved head",
    "wispy-crop": "Fine wispy crop",
    buzz: "Sparse buzz cut",
    "layered-bob": "Fine layered bob"
  };

  const heightLabels = {
    short: "Short",
    "short-average": "Short-to-average height",
    average: "Average height",
    "above-average": "Above-average height",
    tall: "Tall"
  };

  const buildLabels = {
    slim: "Slim",
    "average-soft": "Average",
    "lean-athletic": "Lean athletic",
    muscular: "Muscular",
    soft: "Soft",
    curvy: "Curvy",
    stocky: "Stocky",
    heavyset: "Heavyset",
    wiry: "Wiry"
  };

  const faceShapeLabels = {
    heart: "Heart-shaped",
    pear: "Pear-shaped",
    triangle: "Triangular",
    triangular: "Triangular",
    "compact-oval": "Compact oval",
    "broad-oval": "Broad oval",
    "elongated-oval": "Elongated oval",
    "short-square": "Short square",
    "asymmetric-oval": "Asymmetric oval",
    "full-oblong": "Full oblong",
    "heart-oval": "Heart-oval"
  };

  const faceStructureLabels = {
    soft: "Soft features",
    full: "Full features",
    angular: "Angular features",
    tapered: "Tapered features",
    broad: "Broad features",
    narrow: "Narrow features",
    "bottom-heavy": "Full lower face",
    compact: "Compact features",
    delicate: "Delicate features"
  };

  const eyeShapeLabels = {
    almond: "Almond-shaped eyes",
    round: "Round eyes",
    "narrow-almond": "Narrow almond eyes",
    "deep-set": "Deep-set eyes",
    "prominent-round": "Prominent round eyes",
    "upturned-almond": "Upturned almond eyes",
    "downturned-oval": "Downturned oval eyes",
    tapered: "Tapered eyes",
    oval: "Oval eyes"
  };

  function firstTag(entry, key) {
    return entry && Array.isArray(entry.tags?.[key]) ? entry.tags[key][0] : "";
  }

  function label(value) {
    if (!value) return "";
    return labels[value] || value.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  }

  function sentenceCase(value) {
    const cleaned = value.trim().replace(/^(?:and\s+)?(?:a|an|the)\s+/i, "").replace(/[.;]+$/g, "");
    return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : "";
  }

  function summarizeOutfit(entry, fragment) {
    const manual = fragment.match(/^the exact user-specified requirement:\s*([^;]+)/i);
    if (manual) return sentenceCase(manual[1]);

    const parts = fragment.split(/,\s*(?:and\s+)?/).map(sentenceCase).filter(Boolean);
    const footwear = parts.find((part) => /\b(?:sneakers|shoes|boots|loafers|flats|pumps|clogs|sandals|runners|high-tops)\b/i.test(part));
    const chosen = [parts[0], parts[1], footwear || parts[2]].filter((part, index, values) => part && values.indexOf(part) === index);
    if (chosen.length) return chosen.join(" • ");
    const family = label(firstTag(entry, "styleFamily"));
    return family ? `${family} outfit` : "Coordinated outfit";
  }

  function summarize(category, entry, fragment = "") {
    if (category === "body") {
      const heightTag = firstTag(entry, "height");
      const buildTag = firstTag(entry, "build");
      const height = heightLabels[heightTag] || label(heightTag);
      const build = buildLabels[buildTag] || label(buildTag);
      return [height, build && `${build} build`].filter(Boolean).join(" • ") || "Natural adult build";
    }
    if (category === "face") {
      const shapeTag = firstTag(entry, "faceShape");
      const shape = faceShapeLabels[shapeTag] || label(shapeTag);
      const structureTag = firstTag(entry, "structure");
      const structure = faceStructureLabels[structureTag] || (structureTag ? `${label(structureTag)} features` : "");
      return [shape && `${shape} face`, structure].filter(Boolean).join(" • ") || "Natural facial features";
    }
    if (category === "hair") {
      const color = label(firstTag(entry, "color"));
      const cut = firstTag(entry, "cut");
      const style = hairCuts[cut] || label(cut) || label(firstTag(entry, "texture")) || "Natural hairstyle";
      return [color, style].filter(Boolean).join(" • ");
    }
    if (category === "eyes") {
      const color = label(firstTag(entry, "color"));
      const shapeTag = firstTag(entry, "shape");
      const shape = eyeShapeLabels[shapeTag] || (shapeTag ? `${label(shapeTag)} eyes` : "");
      return [color, shape].filter(Boolean).join(" • ") || "Natural eyes";
    }
    if (category === "skin") {
      const depth = label(firstTag(entry, "depth"));
      const undertone = label(firstTag(entry, "undertone"));
      return [depth, undertone && `${undertone} undertone`].filter(Boolean).join(" • ") || "Natural skin tone";
    }
    if (category === "outfit") return summarizeOutfit(entry, fragment);
    return sentenceCase(fragment.split(/[;,]/)[0]) || "Generated detail";
  }

  return { summarize };
});
