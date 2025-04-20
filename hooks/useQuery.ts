import {
  useQuery as useReactQuery,
  UseQueryOptions,
} from '@tanstack/react-query';

export function useQuery<TData>(
  key: string | string[],
  fetchFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, Error, TData>, 'queryKey' | 'queryFn'>
) {
  const queryKey = Array.isArray(key) ? key : [key];

  return useReactQuery({
    queryKey,
    queryFn: fetchFn,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}
