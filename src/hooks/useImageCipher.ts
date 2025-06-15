import { useState } from 'react';
import { toast } from 'sonner';
import { processImage, ImageAlgorithm } from '@/lib/imageEncryption';
import { type VisualizationStep } from '@/hooks/useCipher';

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
  const [showSteps, setShowSteps] = useState(false);
  const [visualizationSteps, setVisualizationSteps] = useState<VisualizationStep[]>([]);

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
      setVisualizationSteps([]);
    };
    reader.readAsDataURL(file);
    toast.success(`Image "${file.name}" loaded.`);
  };

  const runSlowProcess = async () => {
    if (!originalImage || !key) return;

    setIsProcessing(true);
    setProgress(0);
    setProcessedImage(null);
    setVisualizationSteps([]);

    const steps = [
      {
        title: `1. Load Image & Key`,
        explanation: `The original image and the secret key are loaded. The key, "${key.substring(0, 10)}...", will be used to generate a predictable, yet random-looking, sequence of operations. This makes the process reversible only with the exact same key.`,
      },
      {
        title: `2. Pixel Processing Loop (${mode === 'encrypt' ? 'Scrambling' : 'Unscrambling'})`,
        explanation: `The algorithm iterates through the image's pixels. For each pixel, the secret key is used to calculate how to change its color and/or position. The image below will update periodically to show this process.`,
      },
      {
        title: `3. Finalize Output`,
        explanation: `After processing all pixels, the final image is constructed. The result is a visually ${mode}ed image that is unrecognizable without reversing the process with the correct key.`,
      }
    ];

    const initialSteps: VisualizationStep[] = steps.map(s => ({ ...s, data: '', status: 'pending', dataType: 'image' }));
    setVisualizationSteps(initialSteps);

    try {
      const img = new Image();
      const imgLoadPromise = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image for processing.'));
      });
      img.src = originalImage;
      await imgLoadPromise;

      // Step 1: Load Image & Key
      await new Promise(res => setTimeout(res, 100));
      setVisualizationSteps(prev => prev.map((s, i) => i === 0 ? { ...s, status: 'processing' } : s));
      await new Promise(res => setTimeout(res, 800));
      setVisualizationSteps(prev => prev.map((s, i) => i === 0 ? { ...s, status: 'done', data: originalImage } : s));

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('Could not get canvas context.');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Step 2: Pixel Processing
      await new Promise(res => setTimeout(res, 100));
      setVisualizationSteps(prev => prev.map((s, i) => i === 1 ? { ...s, status: 'processing', data: originalImage } : s));

      const onProgressCallback = async (p: number, intermediateData: ImageData) => {
        setProgress(p);
        // Update visualization periodically, not on every single pixel, to avoid perf issues
        if (p > 0 && p < 100 && p % 5 === 0) {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = intermediateData.width;
          tempCanvas.height = intermediateData.height;
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx) {
            tempCtx.putImageData(intermediateData, 0, 0);
            const dataUrl = tempCanvas.toDataURL('image/png');
            setVisualizationSteps(prev => prev.map((s, i) => i === 1 ? { ...s, data: dataUrl } : s));
          }
        }
      };

      const finalImageData = await processImage(imageData, key, algorithm, mode, onProgressCallback);
      ctx.putImageData(finalImageData, 0, 0);
      const finalImage = canvas.toDataURL('image/png');
      setProcessedImage(finalImage);
      setProgress(100);

      await new Promise(res => setTimeout(res, 800));
      setVisualizationSteps(prev => prev.map((s, i) => i === 1 ? { ...s, status: 'done', data: finalImage } : s));

      // Step 3: Finalizing
      await new Promise(res => setTimeout(res, 100));
      setVisualizationSteps(prev => prev.map((s, i) => i === 2 ? { ...s, status: 'processing' } : s));
      await new Promise(res => setTimeout(res, 800));
      setVisualizationSteps(prev => prev.map((s, i) => i === 2 ? { ...s, status: 'done', data: finalImage } : s));

      toast.success(`Image ${mode}ion visualization complete!`);
    } catch (error: any) {
      toast.error(error.message || `Image ${mode}ion failed.`);
      setProcessedImage(null);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
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

    if (showSteps) {
      runSlowProcess();
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
    setVisualizationSteps([]);
  }

  return {
    originalImage,
    processedImage,
    key, setKey,
    algorithm, setAlgorithm,
    isProcessing,
    progress,
    showSteps, setShowSteps,
    visualizationSteps,
    handleImageUpload,
    handleProcess,
    handleDownload,
    handleReset,
  };
}
