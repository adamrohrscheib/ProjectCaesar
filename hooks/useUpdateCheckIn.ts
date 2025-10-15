import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateCheckIn } from '@/lib/ddb';

export type UpdateCheckInInput = {
  userId: string;
  time: number; // epoch seconds
  users?: string[];
  lineMinutes?: number;
  notes?: string;
};

export function useUpdateCheckIn() {
  const qc = useQueryClient();

  return useMutation<void, Error, UpdateCheckInInput>({
    mutationFn: (input) => updateCheckIn(input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['checkins', vars.userId] });
    },
    onMutate: (vars) => {
      console.log('[API] mutation start updateCheckIn', { userId: vars.userId, time: vars.time });
    },
    onSettled: (_data, error, vars) => {
      console.log('[API] mutation settled updateCheckIn', {
        userId: vars?.userId,
        time: vars?.time,
        error: error?.message,
      });
    },
  });
}


