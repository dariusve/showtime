import { getCssTime, getTransition, getTransitionEasing } from "./transitions.js";

const builtInThemes = {
  dark: {},
  paper: {},
};

const themeTokens = ["background", "surface", "text", "muted", "accent", "fontBody", "fontHeading"];

export function applyDeckMeta(meta, state, options = {}) {
  if (!state) {
    throw new Error("applyDeckMeta requires a state object");
  }

  const doc = options.document || globalThis.document;
  const root = options.root || doc?.documentElement;
  const body = options.body || doc?.body;

  state.title = meta.title || "Showtime";
  if (doc) {
    doc.title = state.title;
  }

  if (body && meta.theme && builtInThemes[meta.theme]) {
    state.theme = meta.theme;
    body.dataset.theme = meta.theme === "paper" ? "paper" : "";
  }

  state.transition = getTransition(meta.transition);
  state.transitionDuration = getCssTime(meta.transitionDuration, "700ms");
  state.transitionEasing = getTransitionEasing(meta.transitionEasing, "ease-out");
  state.transitionDelay = getCssTime(meta.transitionDelay, "0ms");

  for (const token of themeTokens) {
    if (!root || !meta[token]) continue;
    const cssName = token.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    root.style.setProperty(`--${cssName}`, meta[token]);
  }
}

export function toggleTheme(state, body = globalThis.document?.body) {
  state.theme = body.dataset.theme === "paper" ? "dark" : "paper";
  body.dataset.theme = state.theme === "paper" ? "paper" : "";
}
