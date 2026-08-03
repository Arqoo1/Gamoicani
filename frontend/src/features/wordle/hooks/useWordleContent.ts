import { useEffect, useState } from "react";

import { fetchGameContent } from "@/features/games/api/gamesApi";
import { cacheGameContent, getCachedGameContent } from "@/shared/storage/contentCache";
import { getWordsJson } from "@/shared/services/lazyData";

type WordsJson = {
  answers: string[];
  validWords: string[];
};

export function useWordleContent() {
  const [wordData, setWordData] = useState<WordsJson>({ answers: [], validWords: [] });
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let active = true;

    fetchGameContent<WordsJson>("wordle")
      .then((nextWordData) => {
        if (active && nextWordData.answers?.length && nextWordData.validWords?.length) {
          setWordData(nextWordData);
          cacheGameContent("wordle", nextWordData).catch(() => {});
        }
      })
      .catch(async () => {
        if (!active) return;
        setIsOffline(true);
        const cached = await getCachedGameContent<WordsJson>("wordle").catch(() => null);
        if (active && cached?.answers?.length && cached.validWords?.length) {
          setWordData(cached);
        } else if (active) {
          const fallback = await getWordsJson();
          setWordData(fallback as WordsJson);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return { isOffline, wordData };
}
