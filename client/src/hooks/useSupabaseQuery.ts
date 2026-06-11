import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';

/**
 * Generic hook for Supabase queries with React Query caching.
 * Replaces tRPC queries with direct Supabase client calls.
 */
export function useSupabaseQuery<T>(
  key: string[],
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options?: { enabled?: boolean; refetchInterval?: number }
) {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await queryFn();
      if (error) throw error;
      return data as T;
    },
    ...options,
  });
}

/**
 * Generic hook for Supabase mutations with cache invalidation.
 */
export function useSupabaseMutation<TInput, TOutput = any>(
  mutationFn: (input: TInput) => Promise<{ data: TOutput | null; error: any }>,
  invalidateKeys?: string[][]
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TInput) => {
      const { data, error } = await mutationFn(input);
      if (error) throw error;
      return data as TOutput;
    },
    onSuccess: () => {
      if (invalidateKeys) {
        invalidateKeys.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
      }
    },
  });
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Blob
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) throw error;

  // Get public URL for public buckets
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * Get signed URL for private buckets (vault)
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}
