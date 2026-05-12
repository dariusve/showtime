import assert from "node:assert/strict";
import test from "node:test";

import { applyDeckMeta, toggleTheme } from "../src/theme.js";

function createElementStub() {
  const properties = new Map();

  return {
    dataset: {},
    style: {
      getPropertyValue(name) {
        return properties.get(name) || "";
      },
      setProperty(name, value) {
        properties.set(name, value);
      },
    },
  };
}

test("applies deck metadata to state and CSS tokens", () => {
  const doc = { title: "" };
  const state = {};
  const root = createElementStub();
  const body = createElementStub();

  applyDeckMeta(
    {
      title: "Theme Demo",
      theme: "paper",
      accent: "#f3c969",
      transition: "zoom",
      transitionDuration: 900,
      transitionEasing: "smooth",
      transitionDelay: "120ms",
    },
    state,
    { document: doc, root, body }
  );

  assert.equal(doc.title, "Theme Demo");
  assert.equal(state.title, "Theme Demo");
  assert.equal(state.theme, "paper");
  assert.equal(state.transition, "zoom");
  assert.equal(state.transitionDuration, "900ms");
  assert.equal(state.transitionEasing, "cubic-bezier(0.2, 0.78, 0.2, 1)");
  assert.equal(state.transitionDelay, "120ms");
  assert.equal(body.dataset.theme, "paper");
  assert.equal(root.style.getPropertyValue("--accent"), "#f3c969");

});

test("requires state when applying deck metadata", () => {
  assert.throws(
    () => applyDeckMeta({ title: "Missing State" }),
    /applyDeckMeta requires a state object/
  );
});

test("toggles theme state and body dataset", () => {
  const state = { theme: "dark" };
  const body = createElementStub();

  toggleTheme(state, body);
  assert.equal(state.theme, "paper");
  assert.equal(body.dataset.theme, "paper");

  toggleTheme(state, body);
  assert.equal(state.theme, "dark");
  assert.equal(body.dataset.theme, "");
});
