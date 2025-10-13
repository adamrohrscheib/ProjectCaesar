type AnyRecord = Record<string, unknown>;

const counters: Record<string, number> = {};

export function startApiLog(name: string, details?: AnyRecord) {
  const count = (counters[name] = (counters[name] ?? 0) + 1);
  const id = `${name}#${count}`;
  const start = Date.now();
  try {
    // Keep logs concise and structured
    console.log(`[API] ${id} start`, details ?? {});
  } catch {}
  return {
    end: (outcome: 'ok' | 'error', extra?: AnyRecord) => {
      const durationMs = Date.now() - start;
      try {
        console.log(`[API] ${id} ${outcome} ${durationMs}ms`, extra ?? {});
      } catch {}
    },
  };
}

export async function withApiLogging<T>(
  name: string,
  details: AnyRecord | undefined,
  fn: () => Promise<T>
): Promise<T> {
  const log = startApiLog(name, details);
  try {
    const result = await fn();
    log.end('ok');
    return result;
  } catch (err) {
    log.end('error', { error: (err as Error)?.message });
    throw err;
  }
}


