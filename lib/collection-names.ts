const DEFAULT_COLLECTION_NAME_PATTERN = /^Collection (\d+)$/;

export function suggestDefaultCollectionName(existingNames: string[]): string {
  const usedNumbers = new Set<number>();
  for (const name of existingNames) {
    const match = DEFAULT_COLLECTION_NAME_PATTERN.exec(name.trim());
    if (match) {
      usedNumbers.add(Number.parseInt(match[1]!, 10));
    }
  }
  let n = 1;
  while (usedNumbers.has(n)) {
    n += 1;
  }
  return `Collection ${n}`;
}
