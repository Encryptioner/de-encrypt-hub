
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { hash, HashAlgorithm } from '@/lib/crypto';
import { type VisualizationStep } from '@/hooks/useCipher';
import { arrayBufferToBase64 } from '@/lib/utils';

export function useHash() {
  const [input, setInput] = useState('This is a test message.');
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>('SHA-256');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [animatedOutput, setAnimatedOutput] = useState('');
  const [showSteps, setShowSteps] = useState(false);
  const [visualizationSteps, setVisualizationSteps] = useState<VisualizationStep[]>([]);

  useEffect(() => {
    if (isProcessing && !showSteps) {
      const randomChars = 'abcdef0123456789';
      let length = 64; // Corresponds to SHA-256
      if (algorithm === 'SHA-512') length = 128;
      if (algorithm === 'SHA-1') length = 40;
      if (algorithm === 'MD5') length = 32;

      const interval = setInterval(() => {
        let result = '';
        for (let i = 0; i < length; i++) {
          result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
        }
        setAnimatedOutput(result);
      }, 50);

      return () => clearInterval(interval);
    }
  }, [isProcessing, algorithm, showSteps]);

  const runSlowHash = async () => {
    setIsProcessing(true);
    setOutput('');
    setVisualizationSteps([]);

    const steps = [
        { title: '1. Prepare & Pad Input Data', explanation: `The input text is first converted into a standard binary format (UTF-8). Then, it's "padded" with extra bits to ensure the total length is a multiple of the algorithm's required block size (e.g., 512 bits for SHA-256).` },
        { title: '2. Process Data in Chunks', explanation: `The algorithm processes the padded data in fixed-size chunks. It uses a complex "compression function" that mixes and transforms the data in a series of rounds. The output of processing one chunk is used as the input for the next, creating an irreversible chain.` },
        { title: '3. Generate Final Hash', explanation: `After the final chunk is processed, the result is the fixed-size hash value, or "digest". This is a unique fingerprint of the original data. This process is one-way and cannot be reversed to get the original text.` },
    ];
    
    const initialSteps: VisualizationStep[] = steps.map(s => ({ ...s, data: '', status: 'pending' }));
    
    setVisualizationSteps(initialSteps);

    for (let i = 0; i < initialSteps.length; i++) {
        await new Promise(res => setTimeout(res, 100));
        setVisualizationSteps(prev => prev.map((s, idx) => (idx === i ? { ...s, status: 'processing', data: '...' } : s)));
        await new Promise(res => setTimeout(res, 800));

        let stepData = '';
        if (i === 0) {
            stepData = `Input: "${input.substring(0, 48)}${input.length > 48 ? '...' : ''}"`;
        } else if (i === 1) {
            const blockSize = (algorithm === 'SHA-512') ? '1024-bit' : '512-bit';
            stepData = `Simulating processing of data in ${blockSize} chunks...`;
        } else {
            const finalResult = await hash(input, algorithm);
            stepData = finalResult;
            setOutput(finalResult);
        }
        
        setVisualizationSteps(prev => prev.map((s, idx) => (idx === i ? { ...s, status: 'done', data: stepData } : s)));
    }

    setIsProcessing(false);
    toast.success("Hashing visualization complete!");
  };

  const handleHash = async () => {
    if (!input) {
      toast.error('Input cannot be empty.');
      return;
    }

    if (showSteps) {
        await runSlowHash();
        return;
    }

    setIsProcessing(true);
    setOutput('');
    try {
      await new Promise(res => setTimeout(res, 500));
      const result = await hash(input, algorithm);
      setOutput(result);
      toast.success('Hashed successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Hashing failed.');
      setOutput('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (!output) {
      toast.error('Nothing to copy.');
      return;
    }
    navigator.clipboard.writeText(output);
    toast.success('Result copied to clipboard!');
  };

  return {
    input, setInput,
    algorithm, setAlgorithm,
    output,
    isProcessing,
    animatedOutput,
    showSteps, setShowSteps,
    visualizationSteps,
    handleHash,
    handleCopy,
  };
}
