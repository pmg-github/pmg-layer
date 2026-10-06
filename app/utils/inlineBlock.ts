/** Immutable path updates retain unknown fields and legacy image/link representations. */
export function setBlockValue(
  source: any,
  path: (string | number)[],
  value: any,
): any {
  if (!path.length) return value;
  const [key, ...rest] = path;
  const copy = Array.isArray(source) ? [...source] : { ...source };
  copy[key] = setBlockValue(source?.[key], rest, value);
  return copy;
}

export function findBlockPath(
  source: any,
  target: object,
  path: (string | number)[] = [],
): (string | number)[] | undefined {
  if (source === target) return path;
  if (!source || typeof source !== 'object') return;
  for (const key of Object.keys(source)) {
    const found = findBlockPath(source[key], target, [
      ...path,
      Array.isArray(source) ? Number(key) : key,
    ]);
    if (found) return found;
  }
}
