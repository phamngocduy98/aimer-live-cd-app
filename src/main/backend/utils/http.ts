export function parseRange(range: string | undefined, maxSize: number) {
  let matches = range?.match(/bytes=(\d+)-(\d+)/);
  if (matches != null) {
    return {
      start: parseInt(matches[1]),
      end: parseInt(matches[2])
    };
  }
  matches = range?.match(/bytes=(\d+)-/);
  if (matches != null) {
    return {
      start: parseInt(matches[1]),
      end: maxSize - 1
    };
  }
  matches = range?.match(/bytes=-(\d+)/);
  if (matches != null) {
    return {
      start: maxSize - parseInt(matches[1]),
      end: maxSize - 1
    };
  }

  return {
    start: 0,
    end: maxSize - 1
  };
}
