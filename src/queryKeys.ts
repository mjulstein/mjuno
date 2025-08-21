// Centralized React Query keys
export const queryKeys = {
  pantry: {
    entries: (pid: string, key: string) => ['pantry', 'entries', pid, key] as const,
    nameDb: (pid: string) => ['pantry', 'nameDb', pid] as const,
  },
} as const;

export type QueryKeys = typeof queryKeys;
