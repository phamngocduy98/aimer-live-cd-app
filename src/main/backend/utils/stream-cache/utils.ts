export function ensureDefined(value: unknown, name: string): void {
  if (!value) {
    throw new Error(`${name} expected`);
  }
}

export function assign<T, U>(target: T, source: U): T & U {
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      target[key as unknown as keyof T] = source[key as keyof U] as any;
    }
  }
  return target as T & U;
}
