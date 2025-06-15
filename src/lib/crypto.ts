
import AES from 'crypto-js/aes';
import DES from 'crypto-js/des';
import TripleDES from 'crypto-js/tripledes';
import Rabbit from 'crypto-js/rabbit';
import RC4 from 'crypto-js/rc4';
import Utf8 from 'crypto-js/enc-utf8';

const algorithms = {
  AES,
  DES,
  TripleDES,
  Rabbit,
  RC4,
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
    const decryptedText = bytes.toString(Utf8);
    if (!decryptedText) {
      throw new Error("Decryption failed. Check your key or algorithm.");
    }
    return decryptedText;
  } catch (e) {
    throw new Error("Decryption failed. The data may be corrupted or the key is incorrect.");
  }
};
