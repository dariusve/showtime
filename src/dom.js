const selectors = {
  slideEl: "#slide",
  stageEl: ".stage",
  notesEl: "#notes",
  progressEl: "#progress",
  deckInput: "#deck-input",
  loadButton: "#load-deck",
  previousButton: "#prev",
  nextButton: "#next",
  notesButton: "#notes-toggle",
  thumbsButton: "#thumbs-toggle",
  themeButton: "#theme-toggle",
  fullscreenButton: "#fullscreen",
  thumbnailTrayEl: "#thumbnail-tray",
  thumbnailsEl: "#thumbnails",
  thumbnailsScrollLeftButton: "#thumbs-scroll-left",
  thumbnailsScrollRightButton: "#thumbs-scroll-right",
};

export function getDom(root = document) {
  return Object.fromEntries(
    Object.entries(selectors).map(([name, selector]) => [name, queryRequired(root, selector)])
  );
}

function queryRequired(root, selector) {
  const element = root.querySelector(selector);
  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }
  return element;
}
