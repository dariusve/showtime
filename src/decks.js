export async function fetchDeckMarkdown(path, baseUrl) {
  const deckUrl = resolveDeckUrl(path, baseUrl);
  const response = await fetch(deckUrl);

  if (!response.ok) {
    throw new Error(`Could not load ${path}`);
  }

  return response.text();
}

export function resolveDeckUrl(path, baseUrl) {
  return new URL(path, baseUrl);
}
