export function formatPartRanges(partNumbers: number[]): string {
  const sorted = [...partNumbers].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let end = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    if (current === end + 1) {
      end = current;
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      start = current;
      end = current;
    }
  }
  if (sorted.length > 0) {
    ranges.push(start === end ? `${start}` : `${start}-${end}`);
  }
  return ranges.join(",");
}
