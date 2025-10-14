import { useQuery } from '@tanstack/react-query';
import type { User } from '@/app/interfaces';
import { searchUsersByText } from '@/lib/ddb';

export function useSearchUsers(query: string) {
  const q = (query ?? '').trim();
  return useQuery<User[]>({
    queryKey: ['searchUsers', q],
    queryFn: () => searchUsersByText(q),
    enabled: q.length >= 2,
    staleTime: 30_000,
  });
}


