// Helper function to count Arabic letters in Quran text
// Only counts Arabic letters (Unicode range: 0600-06FF)
export function countArabicCharacters(text: string): number {
  let count = 0;
  for (const char of text) {
    const code = char.charCodeAt(0);
    // Arabic Unicode block: 0x0600 to 0x06FF
    // Excludes diacritics (tashkeel) which are in 0x064B-0x0652
    if (code >= 0x0621 && code <= 0x064a) {
      count++;
    }
  }
  return count;
}

interface Verse {
  id: number;
  verse_key: string;
  text_uthmani: string;
}

interface QuranApiResponse {
  verses: Verse[];
  pagination: {
    per_page: number;
    current_page: number;
    next_page: number | null;
    total_pages: number;
    total_records: number;
  };
}

// Fetch verses between two positions and calculate total character count
export async function calculateCharacterProgress(
  oldSurah: number,
  oldVerse: number,
  newSurah: number,
  newVerse: number
): Promise<number> {
  // If moving backward or same position, no progress
  if (newSurah < oldSurah || (newSurah === oldSurah && newVerse <= oldVerse)) {
    return 0;
  }

  let totalCharacters = 0;

  // Same surah: just fetch verses from old+1 to new
  if (oldSurah === newSurah) {
    const verses = await fetchVerseRange(oldSurah, oldVerse + 1, newVerse);
    for (const verse of verses) {
      totalCharacters += countArabicCharacters(verse.text_uthmani);
    }
    return totalCharacters;
  }

  // Different surahs: need to fetch across multiple surahs
  // 1. Remaining verses in old surah (from oldVerse+1 to end)
  const oldSurahVerses = await fetchVersesFromPosition(oldSurah, oldVerse + 1);
  for (const verse of oldSurahVerses) {
    totalCharacters += countArabicCharacters(verse.text_uthmani);
  }

  // 2. Complete surahs in between
  for (let surah = oldSurah + 1; surah < newSurah; surah++) {
    const surahVerses = await fetchAllVersesInSurah(surah);
    for (const verse of surahVerses) {
      totalCharacters += countArabicCharacters(verse.text_uthmani);
    }
  }

  // 3. Verses in new surah (from 1 to newVerse)
  const newSurahVerses = await fetchVerseRange(newSurah, 1, newVerse);
  for (const verse of newSurahVerses) {
    totalCharacters += countArabicCharacters(verse.text_uthmani);
  }

  return totalCharacters;
}

// Fetch a specific range of verses in a surah
async function fetchVerseRange(
  surah: number,
  fromVerse: number,
  toVerse: number
): Promise<Verse[]> {
  const verses: Verse[] = [];

  // Fetch all verses in the surah and filter
  const response = await fetch(
    `https://api.quran.com/api/v4/verses/by_chapter/${surah}?per_page=300&fields=text_uthmani`
  );
  const data: QuranApiResponse = await response.json();

  for (const verse of data.verses) {
    const verseNum = parseInt(verse.verse_key.split(':')[1]);
    if (verseNum >= fromVerse && verseNum <= toVerse) {
      verses.push(verse);
    }
  }

  return verses;
}

// Fetch all verses from a position to the end of surah
async function fetchVersesFromPosition(surah: number, fromVerse: number): Promise<Verse[]> {
  const response = await fetch(
    `https://api.quran.com/api/v4/verses/by_chapter/${surah}?per_page=300&fields=text_uthmani`
  );
  const data: QuranApiResponse = await response.json();

  return data.verses.filter((verse) => {
    const verseNum = parseInt(verse.verse_key.split(':')[1]);
    return verseNum >= fromVerse;
  });
}

// Fetch all verses in a surah
async function fetchAllVersesInSurah(surah: number): Promise<Verse[]> {
  const response = await fetch(
    `https://api.quran.com/api/v4/verses/by_chapter/${surah}?per_page=300&fields=text_uthmani`
  );
  const data: QuranApiResponse = await response.json();
  return data.verses;
}
