"use client";

import { useCallback, useState } from "react";

/** Tracks one form action: pending flag, error text, and success text. */
export function useAction(describeError: (error: unknown) => string) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fail = useCallback((message: string) => {
    setError(message);
    setSuccess(null);
  }, []);

  /** Runs `task`. Returns true when it finished without an error. */
  const run = useCallback(
    async (task: () => Promise<void>, successMessage: string | null = null) => {
      setPending(true);
      setError(null);
      setSuccess(null);

      try {
        await task();
        setSuccess(successMessage);
        return true;
      } catch (taskError) {
        setError(describeError(taskError));
        return false;
      } finally {
        setPending(false);
      }
    },
    [describeError],
  );

  return { pending, error, success, run, fail };
}
