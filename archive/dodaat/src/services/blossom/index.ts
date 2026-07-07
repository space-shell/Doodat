import { finalizeEvent } from 'nostr-tools';
import * as FileSystem from 'expo-file-system/legacy';

const BLOSSOM_SERVER = 'https://blossom.dodaat.app';
const MAX_DURATION_SECONDS = 30;
const MAX_FILE_SIZE_BYTES = 1024 * 1024; // 1 MB safety cap

export interface BlossomUploadResult {
  url: string;
  hash: string;
  size: number;
  mimeType: string;
}

/**
 * Build a NIP-98 HTTP Auth event for Blossom authentication.
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function buildAuthEvent(
  url: string,
  method: string,
  privateKeyHex: string,
  fileHash?: string
) {
  const tags: string[][] = [
    ['u', url],
    ['method', method],
  ];
  if (fileHash) {
    tags.push(['payload', fileHash]);
  }
  const event = {
    kind: 27235,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content: 'Blossom upload',
  };
  return finalizeEvent(event, hexToBytes(privateKeyHex));
}

/**
 * Upload an audio file to the Blossom server using Nostr keypair auth.
 */
export async function uploadAudio(
  localUri: string,
  privateKeyHex: string,
  mimeType: 'audio/opus' | 'audio/aac' = 'audio/aac'
): Promise<BlossomUploadResult> {
  const uploadUrl = `${BLOSSOM_SERVER}/upload`;

  // Build auth event
  const authEvent = buildAuthEvent(uploadUrl, 'PUT', privateKeyHex);
  const authHeader = Buffer.from(JSON.stringify(authEvent)).toString('base64');

  // Use FileSystem to upload
  const response = await FileSystem.uploadAsync(uploadUrl, localUri, {
    httpMethod: 'PUT',
    headers: {
      Authorization: `Nostr ${authHeader}`,
      'Content-Type': mimeType,
    },
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
  });

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(`Blossom upload failed: ${response.status}`);
  }

  const result = JSON.parse(response.body);
  return {
    url: result.url,
    hash: result.sha256,
    size: result.size,
    mimeType,
  };
}

/**
 * Delete an audio file from the Blossom server (called after recipient hears it).
 */
export async function deleteAudio(
  fileHash: string,
  privateKeyHex: string
): Promise<void> {
  const deleteUrl = `${BLOSSOM_SERVER}/${fileHash}`;
  const authEvent = buildAuthEvent(deleteUrl, 'DELETE', privateKeyHex, fileHash);
  const authHeader = Buffer.from(JSON.stringify(authEvent)).toString('base64');

  const response = await fetch(deleteUrl, {
    method: 'DELETE',
    headers: {
      Authorization: `Nostr ${authHeader}`,
    },
  });

  if (!response.ok) {
    // Log but don't throw — best effort deletion
    console.warn(`Blossom delete failed for hash ${fileHash}: ${response.status}`);
  }
}
