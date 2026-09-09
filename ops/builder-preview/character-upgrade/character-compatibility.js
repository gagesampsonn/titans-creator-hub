(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TITANS_CHARACTER_COMPATIBILITY = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const roleConflictPatterns = {
    collegeStudent: /\b(?:construction|trade workwear|work pants|double-knee|utility pants|cargo (?:pants|trousers)|safety-toe|steel-toe|tool belt|hard hat|carpenter pants|work boots)\b/i
  };

  const skinDepthGroups = {
    "very-fair": "light",
    fair: "light",
    light: "light",
    "light-medium": "light",
    medium: "medium",
    "medium-tan": "medium",
    tan: "medium",
    "deep-tan-brown": "deep",
    "deep-brown": "deep",
    "very-deep-brown": "deep"
  };

  function presentation(entry) {
    return entry?.tags?.presentation?.[0] || "neutral";
  }

  function hasRoleConflict(entry, context) {
    if (entry?.category !== "outfit" || context?.ignoreProfession) return false;
    const pattern = roleConflictPatterns[context?.profession];
    return Boolean(pattern && pattern.test(entry.fragment || ""));
  }

  function isEntryCompatible(entry, context) {
    const tags = entry?.tags || {};
    if (tags.ageMin && context.age < tags.ageMin) return false;
    if (tags.ageMax && context.age > tags.ageMax) return false;
    if (tags.genders?.length && !tags.genders.includes(context.gender)) return false;

    if (entry?.category === "outfit") {
      const entryPresentation = presentation(entry);
      if (context.gender === "male" && entryPresentation === "feminine") return false;
      if (context.gender === "female" && entryPresentation === "masculine") return false;

      if (!context.ignoreProfession) {
        if (!tags.professions?.length || !tags.professions.includes(context.profession)) return false;
        if (hasRoleConflict(entry, context)) return false;
      }

      if (context.styleFamily && !tags.styleFamily?.includes(context.styleFamily)) return false;
    }

    return true;
  }

  function traitGroup(entry) {
    if (entry?.category !== "skin") return "";
    return skinDepthGroups[entry.tags?.depth?.[0]] || "";
  }

  function preferFreshTraitGroups(entries, category, recentGroups = []) {
    if (category !== "skin" || !recentGroups.length) return entries;
    const blocked = new Set(recentGroups.slice(0, 2));
    const fresh = entries.filter((entry) => {
      const group = traitGroup(entry);
      return !group || !blocked.has(group);
    });
    return fresh.length ? fresh : entries;
  }

  return {
    hasRoleConflict,
    isEntryCompatible,
    preferFreshTraitGroups,
    traitGroup
  };
});
