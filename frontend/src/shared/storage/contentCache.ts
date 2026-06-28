import AsyncStorage from "@react-native-async-storage/async-storage";

const CONTENT_CACHE_PREFIX = "wordle:content-cache:v1:";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type ContentCacheEntry<T> = {
  cachedAt: string;
  data: T;
};

export async function cacheGameContent<T>(gameId: string, data: T): Promise<void> {
  const entry: ContentCacheEntry<T> = { cachedAt: new Date().toISOString(), data };
  await AsyncStorage.setItem(CONTENT_CACHE_PREFIX + gameId, JSON.stringify(entry));
}

export async function getCachedGameContent<T>(gameId: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(CONTENT_CACHE_PREFIX + gameId);
    if (!raw) return null;
    const entry = JSON.parse(raw) as ContentCacheEntry<T>;
    const age = Date.now() - new Date(entry.cachedAt).getTime();
    if (age > CACHE_TTL_MS) return null;
    return entry.data;
  } catch {
    return null;
  }
}
