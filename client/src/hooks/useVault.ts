import { supabase } from '@/lib/supabase';
import { encryptFile, decryptFile, getVaultKey, setVaultKey, clearVaultKey, isVaultUnlocked } from '@/lib/vault-crypto';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';

export function useVault(tripId?: number) {
  const queryClient = useQueryClient();
  const [unlocked, setUnlocked] = useState(isVaultUnlocked());

  const documentsQuery = useQuery({
    queryKey: ['vault', tripId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('vault_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (tripId) {
        query = query.eq('trip_id', tripId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const unlock = useCallback((password: string) => {
    setVaultKey(password);
    setUnlocked(true);
  }, []);

  const lock = useCallback(() => {
    clearVaultKey();
    setUnlocked(false);
  }, []);

  const uploadDocument = useMutation({
    mutationFn: async (input: {
      file: File;
      title: string;
      documentType?: string;
      tripId?: number;
      expiryDate?: string;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const vaultKey = getVaultKey();
      if (!vaultKey) throw new Error('Vault ist gesperrt. Bitte zuerst entsperren.');

      // Encrypt the file client-side
      const { encryptedBlob, iv, salt } = await encryptFile(input.file, vaultKey);

      // Upload encrypted blob to Supabase Storage
      const timestamp = Date.now();
      const safeName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${user.id}/${timestamp}_${safeName}.enc`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('vault')
        .upload(storagePath, encryptedBlob, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Store metadata in DB (IV + salt stored as combined string)
      const { data: doc, error: dbError } = await supabase
        .from('vault_documents')
        .insert({
          user_id: user.id,
          trip_id: input.tripId ?? null,
          title: input.title,
          document_type: input.documentType ?? 'other',
          file_key: uploadData.path,
          mime_type: input.file.type,
          is_encrypted: true,
          encryption_iv: JSON.stringify({ iv, salt }),
          expiry_date: input.expiryDate ?? null,
          notes: input.notes ?? null,
        })
        .select()
        .single();

      if (dbError) throw dbError;
      return doc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault'] });
    },
  });

  const downloadDocument = useCallback(async (doc: {
    file_key: string | null;
    encryption_iv: string | null;
    mime_type: string | null;
    title: string;
  }) => {
    const vaultKey = getVaultKey();
    if (!vaultKey) throw new Error('Vault ist gesperrt');
    if (!doc.file_key || !doc.encryption_iv) throw new Error('Dokument-Metadaten fehlen');

    // Download encrypted blob from Supabase Storage
    const { data: blob, error } = await supabase.storage
      .from('vault')
      .download(doc.file_key);

    if (error || !blob) throw error ?? new Error('Download fehlgeschlagen');

    // Parse IV and salt
    const { iv, salt } = JSON.parse(doc.encryption_iv);

    // Decrypt client-side
    const decryptedBlob = await decryptFile(
      blob,
      vaultKey,
      iv,
      salt,
      doc.mime_type ?? 'application/octet-stream'
    );

    // Trigger download
    const url = URL.createObjectURL(decryptedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.title;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const deleteDocument = useMutation({
    mutationFn: async (doc: { id: number; file_key: string | null }) => {
      // Delete from storage
      if (doc.file_key) {
        await supabase.storage.from('vault').remove([doc.file_key]);
      }
      // Delete from DB
      const { error } = await supabase.from('vault_documents').delete().eq('id', doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault'] });
    },
  });

  return {
    documents: documentsQuery.data ?? [],
    isLoading: documentsQuery.isLoading,
    isUnlocked: unlocked,
    unlock,
    lock,
    uploadDocument,
    downloadDocument,
    deleteDocument,
    refetch: documentsQuery.refetch,
  };
}
