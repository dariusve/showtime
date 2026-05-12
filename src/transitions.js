export function getTransition(value) {
  const transition = String(value || "fade").toLowerCase();
  return ["fade", "slide", "zoom", "none"].includes(transition) ? transition : "fade";
}

export function getCssTime(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;

  const time = String(value).trim();
  if (/^\d+(\.\d+)?m?s$/.test(time)) return time;
  if (/^\d+(\.\d+)?$/.test(time)) return `${time}ms`;
  return fallback;
}

export function getTransitionEasing(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;

  const easing = String(value).trim();
  const named = {
    linear: "linear",
    ease: "ease",
    "ease-in": "ease-in",
    "ease-out": "ease-out",
    "ease-in-out": "ease-in-out",
    smooth: "cubic-bezier(0.2, 0.78, 0.2, 1)",
    snappy: "cubic-bezier(0.16, 1, 0.3, 1)",
  };

  if (named[easing]) return named[easing];
  if (/^cubic-bezier\([^)]+\)$/.test(easing)) return easing;
  return fallback;
}

export function formatCssUrl(value) {
  const url = String(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"');
  return `url("${url}")`;
}
