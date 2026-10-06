import { findBlockPath, setBlockValue } from '../utils/inlineBlock';
import { watch } from 'vue';

export function useInlineBlock(
  props: Record<string, any>,
  emit: (event: any, ...args: any[]) => void,
) {
  const pending = new Map<string | number, any>();
  watch(
    () => ({ ...props }),
    () => pending.clear(),
    { flush: 'sync' },
  );
  const root = (key: string | number) =>
    pending.has(key) ? pending.get(key) : props[key];
  function update(path: (string | number)[], value: any) {
    if (!props.editable || !path.length) return;
    const [key, ...rest] = path;
    // Facades passed by list controls must never escape into saved page data.
    const snapshot = (input: any): any =>
      Array.isArray(input)
        ? Array.from(input, snapshot)
        : input && typeof input === 'object'
          ? Object.fromEntries(
              Object.entries(input).map(([key, child]) => [
                key,
                snapshot(child),
              ]),
            )
          : input;
    const next = setBlockValue(root(key), rest, snapshot(value));
    pending.set(key, next);
    emit(`update:${key}`, next);
    emit('update:props', { [key]: next });
  }
  function setField(target: any, key: string | number, value: any) {
    const path = findBlockPath(props, target);
    if (path) update([...path, key], value);
  }
  // Contextual settings use a writable facade, never mutate incoming props.
  function proxy(path: (string | number)[] = []): any {
    const read = () =>
      path.length
        ? path.slice(1).reduce((value, key) => value?.[key], root(path[0]))
        : props;
    return new Proxy(Array.isArray(read()) ? [] : {}, {
      get(_target, key) {
        const value = read()?.[key as any];
        if (typeof key === 'symbol') return value;
        if (
          Array.isArray(read()) &&
          [
            'push',
            'splice',
            'pop',
            'shift',
            'unshift',
            'reverse',
            'sort',
          ].includes(key)
        ) {
          return (...args: any[]) => {
            const copy = [...read()];
            const result = (copy as any)[key](...args);
            update(path, copy);
            return result;
          };
        }
        return value && typeof value === 'object'
          ? proxy([...path, key])
          : value;
      },
      set(_target, key, value) {
        update([...path, String(key)], value);
        return true;
      },
      ownKeys() {
        return Reflect.ownKeys(read() || {});
      },
      getOwnPropertyDescriptor(_target, key) {
        if (key === 'length' && Array.isArray(read()))
          return {
            value: read().length,
            writable: true,
            enumerable: false,
            configurable: false,
          };
        return { enumerable: true, configurable: true };
      },
    });
  }
  return { setField, update, model: proxy() };
}
