
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
