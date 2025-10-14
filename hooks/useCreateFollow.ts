import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFollow } from '@/lib/ddb';

type Input = { userId: string; followerId: string };

export function useCreateFollow() {
  const qc = useQueryClient();
  return useMutation<void, Error, Input>({
    mutationFn: (vars) => createFollow(vars),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['following', vars.userId] });
      qc.invalidateQueries({ queryKey: ['followingByFollower', vars.followerId] });
    },
  });
}


