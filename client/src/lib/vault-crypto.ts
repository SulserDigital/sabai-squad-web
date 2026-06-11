/**
 * Vault Client-Side Encryption (AES-256-GCM)
 * 
 * Dokumente werden im Browser verschlüsselt bevor sie in Supabase Storage
 * hochgeladen werden. Der Entschlüsselungs-Key bleibt beim User.
 * Backend/Betreiber kann Vault-Inhalte NICHT lesen.
 * 
 * Algorithmus: AES-256-GCM (Web Crypto API)
 * Key-Derivation: PBKDF2 (100'000 Iterationen, SHA-256)
 * 
 * Ablauf:
 * 1. User gibt Vault-Passwort ein (einmal pro Session)
 * 2. PBKDF2 leitet AES-256 Key ab
 * 3. Jede Datei bekommt eine eigene IV (12 Bytes)
 * 4. Verschlüsselter Blob + IV werden in Supabase Storage gespeichert
 * 5. IV wird in der DB (vault_documents.encryption_iv) gespeichert
 */

const PBKDF2_ITERATIONS = 100_000;
const KEY_LENGTH = 256; // AES-256
const IV_LENGTH = 12; // 96 bits for GCM
const SALT_LENGTH = 16;

/**
 * Derive an AES-256-GCM key from a user password using PBKDF2.
 */
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate a random salt for key derivation.
 * Stored alongside the encrypted data.
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Generate a random IV for AES-GCM encryption.
 */
export function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Encrypt a file/blob client-side before uploading to Supabase Storage.
 * Returns: { encryptedBlob, iv, salt }
 */
export async function encryptFile(
  file: File | Blob,
  password: string
): Promise<{ encryptedBlob: Blob; iv: string; salt: string }> {
  const salt = generateSalt();
  const iv = generateIV();
  const key = await deriveKey(password, salt);

  const fileBuffer = await file.arrayBuffer();
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    fileBuffer
  );

  const encryptedBlob = new Blob([encryptedBuffer], { type: 'application/octet-stream' });

  return {
    encryptedBlob,
    iv: arrayBufferToBase64(iv),
    salt: arrayBufferToBase64(salt),
  };
}

/**
 * Decrypt a file downloaded from Supabase Storage.
 * Requires the user's password and the stored IV/salt.
 */
export async function decryptFile(
  encryptedBlob: Blob,
  password: string,
  ivBase64: string,
  saltBase64: string,
  mimeType: string = 'application/octet-stream'
): Promise<Blob> {
  const iv = base64ToArrayBuffer(ivBase64);
  const salt = base64ToArrayBuffer(saltBase64);
  const key = await deriveKey(password, new Uint8Array(salt));

  const encryptedBuffer = await encryptedBlob.arrayBuffer();
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    encryptedBuffer
  );

  return new Blob([decryptedBuffer], { type: mimeType });
}

/**
 * Verify that a password can decrypt a test payload.
 * Used to validate the vault password before operations.
 */
export async function verifyPassword(
  password: string,
  testEncrypted: ArrayBuffer,
  ivBase64: string,
  saltBase64: string
): Promise<boolean> {
  try {
    const iv = base64ToArrayBuffer(ivBase64);
    const salt = base64ToArrayBuffer(saltBase64);
    const key = await deriveKey(password, new Uint8Array(salt));

    await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      key,
      testEncrypted
    );
    return true;
  } catch {
    return false;
  }
}

// --- Utility functions ---

function arrayBufferToBase64(buffer: Uint8Array | ArrayBuffer): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Store the vault key in session storage (cleared on tab close).
 * NEVER stored in localStorage or sent to the server.
 */
export function setVaultKey(password: string): void {
  sessionStorage.setItem('__vault_key', password);
}

export function getVaultKey(): string | null {
  return sessionStorage.getItem('__vault_key');
}

export function clearVaultKey(): void {
  sessionStorage.removeItem('__vault_key');
}

export function isVaultUnlocked(): boolean {
  return !!getVaultKey();
}
