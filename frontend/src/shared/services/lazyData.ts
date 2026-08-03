export async function getWordsJson() {
  const wordsModule = await import("@data/words.json");
  return wordsModule.default || wordsModule;
}

export async function getAndazebiJson() {
  const andazebiModule = await import("@data/content/andazebi.json");
  return andazebiModule.default || andazebiModule;
}
