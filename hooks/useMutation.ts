import {
  useMutation as useReactMutation,
  UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';

interface ExtendedMutationOptions<TData, TVariables>
  extends Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'> {
  invalidateQueries?: readonly unknown[];
}

export function useMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: ExtendedMutationOptions<TData, TVariables>
) {
  const queryClient = useQueryClient();

  return useReactMutation({
    mutationFn,
    onSuccess: (data, variables, context) => {
      options?.onSuccess?.(data, variables, context);

      // Invalidate queries if needed based on affected data
      if (options?.invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: options.invalidateQueries });
      }
    },
    ...options,
  });
}
