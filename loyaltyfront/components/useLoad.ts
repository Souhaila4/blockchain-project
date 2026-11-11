"use client";

import { useCallback, useEffect, useState } from "react";

type Result<T> = { source: () => Promise<T>; data: T | null; error: string | null };

/**
 * Runs `load` and keeps its result. `load` must be stable (module function or `useCallback`):
 * a new function means new inputs, so the old result is hidden until the new one arrives.
 * `reload` fetches again but keeps showing the previous data meanwhile.
 */
export function useLoad<T>(load: () => Promise<T>) {
  const [result, setResult] = useState<Result<T> | null>(null);
  const [reloads, setReloads] = useState(0);

  useEffect(() => {
    let active = true;

    load()
      .then((data) => {
        if (active) setResult({ source: load, data, error: null });
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        const message = loadError instanceof Error ? loadError.message : "Could not load data.";
        setResult({ source: load, data: null, error: message });
      });

    return () => {
      active = false;
    };
  }, [load, reloads]);

  const reload = useCallback(() => setReloads((count) => count + 1), []);
  const current = result?.source === load ? result : null;

  return {
    data: current?.data ?? null,
    error: current?.error ?? null,
    loading: current === null,
    reload,
  };
}
