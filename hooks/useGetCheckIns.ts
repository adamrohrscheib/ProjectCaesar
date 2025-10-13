import { useQuery } from '@tanstack/react-query';
import { fetchCheckInsByUserId } from '@/lib/ddb';
import type { CheckIn } from '@/app/interfaces';

export function useGetCheckIns(userId: string) {
  return useQuery<CheckIn[]>({
    queryKey: ['checkins', userId],
    queryFn: () => fetchCheckInsByUserId(userId as string),
    enabled: !!userId,
    staleTime: 30_000,
  });
}
