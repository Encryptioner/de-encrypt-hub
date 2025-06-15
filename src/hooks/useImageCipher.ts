
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
    toast.info('Processing image... This may take a moment.');

    // Using setTimeout to allow UI to update before heavy processing
    setTimeout(() => {
        try {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (!ctx) {
                    toast.error('Could not get canvas context.');
                    setIsProcessing(false);
                    return;
                }
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                const newImageData = processImage(imageData, key, algorithm, mode);
                
                ctx.putImageData(newImageData, 0, 0);
                setProcessedImage(canvas.toDataURL('image/png'));
                toast.success(`Image ${mode === 'encrypt' ? 'encrypted' : 'decrypted'} successfully!`);
                setIsProcessing(false);
            };
            img.onerror = () => {
                toast.error('Failed to load image for processing.');
                setIsProcessing(false);
            }
            img.src = originalImage;
        } catch (error: any) {
            toast.error(error.message || `Image ${mode}ion failed.`);
            setIsProcessing(false);
        }
    }, 100);
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
  }

  return {
    originalImage,
    processedImage,
    key, setKey,
    algorithm, setAlgorithm,
    isProcessing,
    handleImageUpload,
    handleProcess,
    handleDownload,
    handleReset,
  };
}
