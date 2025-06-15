import CryptoJS from 'crypto-js';

const algorithms = {
  AES: CryptoJS.AES,
  DES: CryptoJS.DES,
  TripleDES: CryptoJS.TripleDES,
  Rabbit: CryptoJS.Rabbit,
  RC4: CryptoJS.RC4,
  RC4Drop: CryptoJS.RC4Drop,
};

type Algorithm = keyof typeof algorithms;

export const encrypt = (text: string, key: string, algorithm: Algorithm): string => {
  if (!algorithms[algorithm]) {
    throw new Error('Invalid algorithm');
  }
  return algorithms[algorithm].encrypt(text, key).toString();
};

export const decrypt = (ciphertext: string, key: string, algorithm: Algorithm): string => {
  if (!algorithms[algorithm]) {
    throw new Error('Invalid algorithm');
  }
  const bytes = algorithms[algorithm].decrypt(ciphertext, key);
  try {
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedText) {
      throw new Error("Decryption failed. Check your key or algorithm.");
    }
    return decryptedText;
  } catch (e) {
    throw new Error("Decryption failed. The data may be corrupted or the key is incorrect.");
  }
};

const bufferToHex = (buffer: ArrayBuffer): string => {
  return [...new Uint8Array(buffer)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

export type HashAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-512' | 'MD5';

export const hash = async (text: string, algorithm: HashAlgorithm): Promise<string> => {
  if (algorithm === 'MD5') {
    return CryptoJS.MD5(text).toString(CryptoJS.enc.Hex);
  }
  
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  return bufferToHex(hashBuffer);
};
