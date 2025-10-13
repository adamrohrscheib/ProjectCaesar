import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCheckIn } from '@/lib/ddb';

type Input = {
  userId: string;
  location: string;
  time: number;
  users?: string[];
};

export function useCreateCheckIn() {
  const qc = useQueryClient();

  return useMutation<void, Error, Input>({
    mutationFn: (input) => createCheckIn(input),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['checkins', vars.userId] });
    },
    onMutate: (vars) => {
      console.log('[API] mutation start createCheckIn', { userId: vars.userId, location: vars.location });
    },
    onSettled: (_data, error, vars) => {
      console.log('[API] mutation settled createCheckIn', {
        userId: vars?.userId,
        error: error?.message,
      });
    },
  });
}


