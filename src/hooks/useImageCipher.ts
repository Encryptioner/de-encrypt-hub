
import { useState } from 'react';
import { toast } from 'sonner';
import { processImage, ImageAlgorithm } from '@/lib/imageEncryption';

interface UseImageCipherProps {
  mode: 'encrypt' | 'decrypt';
}

export function useImageCipher({ mode }: UseImageCipherProps) {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [key, setKey] = useState('');
  const [algorithm, setAlgorithm] = useState<ImageAlgorithm>('pixel-scramble');
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [progress, setProgress] = useState(0);

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file.');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
      setProcessedImage(null);
      setProgress(0);
    };
    reader.readAsDataURL(file);
    toast.success(`Image "${file.name}" loaded.`);
  };

  const handleProcess = async () => {
    if (!originalImage) {
      toast.error('Please upload an image first.');
      return;
    }
    if (!key) {
      toast.error('Secret key cannot be empty.');
      return;
    }
    setIsProcessing(true);
    setProgress(0);
    setProcessedImage(mode === 'encrypt' ? originalImage : null);
    toast.info(`Starting image ${mode}... This may take a moment.`);

    try {
        const img = new Image();
        
        const imgLoadPromise = new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Failed to load image for processing.'));
        });
        img.src = originalImage;
        await imgLoadPromise;
        
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
            throw new Error('Could not get canvas context.');
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const onProgressCallback = async (p: number, intermediateData: ImageData) => {
          setProgress(p);
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = intermediateData.width;
          tempCanvas.height = intermediateData.height;
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx) {
            tempCtx.putImageData(intermediateData, 0, 0);
            setProcessedImage(tempCanvas.toDataURL('image/png'));
          }
        };

        const finalImageData = await processImage(imageData, key, algorithm, mode, onProgressCallback);
        
        ctx.putImageData(finalImageData, 0, 0);
        setProcessedImage(canvas.toDataURL('image/png'));
        toast.success(`Image ${mode}ed successfully!`);

    } catch (error: any) {
        toast.error(error.message || `Image ${mode}ion failed.`);
        setProcessedImage(null);
    } finally {
        setIsProcessing(false);
        setProgress(0);
    }
  };

  const handleDownload = () => {
    if (!processedImage) {
        toast.error('No processed image to download.');
        return;
    }
    const a = document.createElement('a');
    a.href = processedImage;
    const originalName = fileName.substring(0, fileName.lastIndexOf('.') || fileName.length);
    a.download = `${mode === 'encrypt' ? 'encrypted' : 'decrypted'}-${originalName}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Download started.');
  };

  const handleReset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setKey('');
    setFileName('');
    setProgress(0);
  }

  return {
    originalImage,
    processedImage,
    key, setKey,
    algorithm, setAlgorithm,
    isProcessing,
    progress,
    handleImageUpload,
    handleProcess,
    handleDownload,
    handleReset,
  };
}
