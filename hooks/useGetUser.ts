import { useQuery } from '@tanstack/react-query';
import { fetchUserById } from '@/lib/ddb';
import type { User } from '@/app/interfaces';

export function useGetUser(userId: string) {
  return useQuery<User | null>({
    queryKey: ['user', userId],
    queryFn: () => fetchUserById(userId as string),
    enabled: !!userId,
    staleTime: 60_000,
  });
}
