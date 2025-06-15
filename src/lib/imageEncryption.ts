
export type ImageAlgorithm = 'pixel-scramble' | 'color-scramble' | 'xor-cipher';

// Simple seeded pseudo-random number generator (mulberry32)
function seededRandom(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

// Create a seed from a string key
function createSeed(key: string): number {
  let seed = 0;
  for (let i = 0; i < key.length; i++) {
    seed = (seed << 5) - seed + key.charCodeAt(i);
    seed |= 0; // Convert to 32bit integer
  }
  return seed;
}

// Fisher-Yates shuffle for an array of indices
function shuffleIndices(count: number, rand: () => number): number[] {
  const array = Array.from({ length: count }, (_, i) => i);
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// The main processing function
export const processImage = (
    imageData: ImageData, 
    key: string, 
    algorithm: ImageAlgorithm, 
    mode: 'encrypt' | 'decrypt'
): ImageData => {
  const { data, width, height } = imageData;
  const newImageData = new Uint8ClampedArray(data);
  const seed = createSeed(key);
  const rand = seededRandom(seed);
  const pixelCount = width * height;

  switch (algorithm) {
    case 'pixel-scramble': {
      const shuffledIndices = shuffleIndices(pixelCount, rand);
      
      for (let i = 0; i < pixelCount; i++) {
        const fromIndex = mode === 'encrypt' ? i : shuffledIndices[i];
        const toIndex = mode === 'encrypt' ? shuffledIndices[i] : i;
        
        const fromPixel = fromIndex * 4;
        const toPixel = toIndex * 4;

        newImageData[toPixel] = data[fromPixel];
        newImageData[toPixel + 1] = data[fromPixel + 1];
        newImageData[toPixel + 2] = data[fromPixel + 2];
        newImageData[toPixel + 3] = data[fromPixel + 3];
      }
      break;
    }
    case 'color-scramble': {
      const permutation = shuffleIndices(3, rand);
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const original = [r, g, b];
        
        if (mode === 'encrypt') {
          newImageData[i] = original[permutation[0]];
          newImageData[i + 1] = original[permutation[1]];
          newImageData[i + 2] = original[permutation[2]];
        } else {
          const decrypted = [0, 0, 0];
          decrypted[permutation[0]] = original[0];
          decrypted[permutation[1]] = original[1];
          decrypted[permutation[2]] = original[2];
          newImageData[i] = decrypted[0];
          newImageData[i + 1] = decrypted[1];
          newImageData[i + 2] = decrypted[2];
        }
      }
      break;
    }
    case 'xor-cipher': {
      // XOR is its own inverse, so encrypt and decrypt are the same.
      for (let i = 0; i < data.length; i += 4) {
        const keyByteR = Math.floor(rand() * 256);
        const keyByteG = Math.floor(rand() * 256);
        const keyByteB = Math.floor(rand() * 256);

        newImageData[i] = data[i] ^ keyByteR;
        newImageData[i + 1] = data[i + 1] ^ keyByteG;
        newImageData[i + 2] = data[i + 2] ^ keyByteB;
      }
      break;
    }
    default:
      throw new Error('Unsupported image algorithm');
  }

  return new ImageData(newImageData, width, height);
};
