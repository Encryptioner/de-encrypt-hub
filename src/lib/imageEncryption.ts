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

// Helper to allow UI to update during long operations
const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

// The main processing function
export const processImage = async (
    imageData: ImageData, 
    key: string, 
    algorithm: ImageAlgorithm, 
    mode: 'encrypt' | 'decrypt',
    onProgress?: (progress: number, data: ImageData) => Promise<void>
): Promise<ImageData> => {
  const { data, width, height } = imageData;
  const newImageDataArray = new Uint8ClampedArray(data);
  const seed = createSeed(key);
  const rand = seededRandom(seed);
  const pixelCount = width * height;

  // Function to report progress
  const reportProgress = async (processedPixels: number, currentData: Uint8ClampedArray) => {
    if (onProgress) {
        const progress = (processedPixels / pixelCount) * 100;
        const newImageData = new ImageData(new Uint8ClampedArray(currentData), width, height);
        await onProgress(progress, newImageData);
    }
  };

  switch (algorithm) {
    case 'pixel-scramble': {
      const shuffledIndices = shuffleIndices(pixelCount, rand);
      const tempPixelData = new Uint8ClampedArray(pixelCount * 4);
      // For decryption, we need the original image data to reconstruct from shuffled indices
      const sourceData = mode === 'decrypt' ? new Uint8ClampedArray(data) : data;
      const reportFrequency = Math.max(1, Math.floor(pixelCount / 100)); // ~100 updates

      for (let i = 0; i < pixelCount; i++) {
        const fromIndex = mode === 'encrypt' ? i : shuffledIndices[i];
        const toIndex = mode === 'encrypt' ? shuffledIndices[i] : i;
        
        const fromPixelOffset = fromIndex * 4;
        const toPixelOffset = toIndex * 4;

        tempPixelData[toPixelOffset] = sourceData[fromPixelOffset];
        tempPixelData[toPixelOffset + 1] = sourceData[fromPixelOffset + 1];
        tempPixelData[toPixelOffset + 2] = sourceData[fromPixelOffset + 2];
        tempPixelData[toPixelOffset + 3] = sourceData[fromPixelOffset + 3];

        if (i % reportFrequency === 0) {
            await reportProgress(i, tempPixelData);
            await yieldToMain(); // Give browser time to render
        }
      }
      Object.assign(newImageDataArray, tempPixelData);
      break;
    }
    case 'color-scramble': {
        const permutation = shuffleIndices(3, rand);
        const reportFrequency = Math.max(4, Math.floor(data.length / 4 / 100) * 4); // ~100 updates, aligned to pixels

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const original = [r, g, b];
            
            if (mode === 'encrypt') {
                newImageDataArray[i] = original[permutation[0]];
                newImageDataArray[i + 1] = original[permutation[1]];
                newImageDataArray[i + 2] = original[permutation[2]];
            } else {
                const decrypted = [0, 0, 0];
                decrypted[permutation[0]] = original[0];
                decrypted[permutation[1]] = original[1];
                decrypted[permutation[2]] = original[2];
                newImageDataArray[i] = decrypted[0];
                newImageDataArray[i + 1] = decrypted[1];
                newImageDataArray[i + 2] = decrypted[2];
            }

            if (i > 0 && (i % reportFrequency === 0)) {
                await reportProgress(i / 4, newImageDataArray);
                await yieldToMain();
            }
        }
        break;
    }
    case 'xor-cipher': {
      // XOR is its own inverse, so encrypt and decrypt are the same.
      const reportFrequency = Math.max(4, Math.floor(data.length / 4 / 100) * 4); // ~100 updates
      for (let i = 0; i < data.length; i += 4) {
        const keyByteR = Math.floor(rand() * 256);
        const keyByteG = Math.floor(rand() * 256);
        const keyByteB = Math.floor(rand() * 256);

        newImageDataArray[i] = data[i] ^ keyByteR;
        newImageDataArray[i + 1] = data[i + 1] ^ keyByteG;
        newImageDataArray[i + 2] = data[i + 2] ^ keyByteB;
        
        if (i > 0 && (i % reportFrequency === 0)) {
            await reportProgress(i / 4, newImageDataArray);
            await yieldToMain();
        }
      }
      break;
    }
    default:
      throw new Error('Unsupported image algorithm');
  }

  const finalImageData = new ImageData(newImageDataArray, width, height);
  if (onProgress) {
    await onProgress(100, finalImageData);
  }

  return finalImageData;
};
