import { useQuery } from '@tanstack/react-query';
import { fetchFollowingByFollowerId, fetchFollowingByUserId } from '@/lib/ddb';
import type { Following } from '@/app/interfaces';

export function useGetFollowing(userId: string) {
  return useQuery<Following[]>({
    queryKey: ['following', userId],
    queryFn: () => fetchFollowingByUserId(userId as string),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export function useGetFollowingByFollower(followerId: string) {
  return useQuery<Following[]>({
    queryKey: ['followingByFollower', followerId],
    queryFn: () => fetchFollowingByFollowerId(followerId as string),
    enabled: !!followerId,
    staleTime: 60_000,
  });
}
