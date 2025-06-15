import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { encrypt, decrypt, type Algorithm } from '@/lib/crypto';
import content from '@/config/content.json';

export interface VisualizationStep {
  title: string;
  explanation: string;
  data: string;
  status: 'pending' | 'processing' | 'done';
  dataType?: 'image' | 'text';
}

export type { Algorithm };

interface UseCipherProps {
  mode: 'encrypt' | 'decrypt';
}

export function useCipher({ mode }: UseCipherProps) {
  const [inputType, setInputType] = useState<'text' | 'file'>('text');
  const [input, setInput] = useState(mode === 'encrypt' ? 'This is a test message.' : 'Enter your ciphertext here...');
  const [file, setFile] = useState<File | null>(null);
  const [key, setKey] = useState('');
  const [algorithm, setAlgorithm] = useState<Algorithm>('AES');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [visualizationSteps, setVisualizationSteps] = useState<VisualizationStep[]>([]);

  const handleInputTypeChange = (newInputType: 'text' | 'file') => {
    setInputType(newInputType);
    setInput('');
    setFile(null);
    setOutput('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (typeof content === 'string') {
          setInput(content);
          toast.success(`File "${selectedFile.name}" loaded.`);
        } else {
          toast.error("Failed to read file as text.");
        }
      };
      reader.onerror = () => toast.error("Error reading file.");
      reader.readAsText(selectedFile);
      setOutput('');
    }
  };

  const handleDownload = () => {
    if (!output) {
      toast.error('Nothing to download.');
      return;
    }

    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const filename = mode === 'encrypt' ? 'encrypted.txt' : 'decrypted.txt';

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Download started.');
  };

  const handleSwap = () => {
    if (!output) {
      toast.error('Nothing to use as input.');
      return;
    }
    setInput(output);
    setOutput('');
  };

  const handleCopy = () => {
    if (!output) {
      toast.error('Nothing to copy.');
      return;
    }
    navigator.clipboard.writeText(output);
    toast.success('Result copied to clipboard!');
  };

  const runSlowEncrypt = async () => {
    if (!input || !key) {
      toast.error('Input and key cannot be empty.');
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);
    setOutput('');
    setVisualizationSteps([]);

    if (algorithm === 'AES') {
      const steps = content.algorithms.find(a => a.value === 'AES')?.visualizationSteps;
      if (!steps) {
        toast.error('Visualization steps not found for AES.');
        setIsProcessing(false);
        return;
      }
      
      const initialSteps: VisualizationStep[] = steps.map(s => ({ ...s, data: '', status: 'pending' }));
      setVisualizationSteps(initialSteps);
      
      try {
        for (let i = 0; i < initialSteps.length; i++) {
          await new Promise(res => setTimeout(res, 200));
          setVisualizationSteps(prev => prev.map((s, idx) => (idx === i ? { ...s, status: 'processing', data: '...' } : s)));
          await new Promise(res => setTimeout(res, 1000));

          let stepData = '';
          if (i === 0) {
            stepData = `Input: "${input.substring(0, 48)}${input.length > 48 ? '...' : ''}"`;
          } else if (i === 1) {
            stepData = `Key: "${key.substring(0, 16)}${key.length > 16 ? '...' : ''}"`;
          } else {
            const finalResult = encrypt(input, key, algorithm);
            stepData = finalResult;
            setOutput(finalResult);
          }
          
          setVisualizationSteps(prev => prev.map((s, idx) => (idx === i ? { ...s, status: 'done', data: stepData } : s)));
        }
        toast.success('AES encryption complete!');
      } catch (e: any) {
        toast.error(e.message || 'Encryption failed.');
        setVisualizationSteps(prev => prev.map(s => s.status === 'processing' ? {...s, status: 'done', data: 'Error!'} : s));
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Generic visualization for other algorithms
      const algoName = content.algorithms.find(a => a.value === algorithm)?.name || algorithm;
      const steps: VisualizationStep[] = [
        { title: '1. Prepare Data', explanation: `The input text and secret key are prepared for the ${algoName} algorithm.`, data: '', status: 'pending' },
        { title: `2. Process with ${algoName} Cipher`, explanation: `The ${algoName} cipher processes the data using the secret key in a series of transformations.`, data: '', status: 'pending' },
        { title: '3. Generate Ciphertext', explanation: 'The final output is the encrypted ciphertext.', data: '', status: 'pending' },
      ];
      setVisualizationSteps(steps);
      
      try {
        await new Promise(res => setTimeout(res, 100));
        setVisualizationSteps(prev => prev.map((s, idx) => (idx === 0 ? { ...s, status: 'processing', data: `Input: "${input.substring(0, 48)}..."` } : s)));
        await new Promise(res => setTimeout(res, 800));
        setVisualizationSteps(prev => prev.map((s, idx) => (idx === 0 ? { ...s, status: 'done' } : s)));
        
        await new Promise(res => setTimeout(res, 100));
        setVisualizationSteps(prev => prev.map((s, idx) => (idx === 1 ? { ...s, status: 'processing', data: 'Processing...' } : s)));
        await new Promise(res => setTimeout(res, 800));
        setVisualizationSteps(prev => prev.map((s, idx) => (idx === 1 ? { ...s, status: 'done' } : s)));

        await new Promise(res => setTimeout(res, 100));
        setVisualizationSteps(prev => prev.map((s, idx) => (idx === 2 ? { ...s, status: 'processing' } : s)));
        const finalResult = encrypt(input, key, algorithm);
        await new Promise(res => setTimeout(res, 800));
        setVisualizationSteps(prev => prev.map((s, idx) => (idx === 2 ? { ...s, status: 'done', data: finalResult } : s)));
        setOutput(finalResult);
        
        toast.success(`${algoName} encryption complete!`);
      } catch (e: any) {
        toast.error(e.message || 'Encryption failed.');
        setVisualizationSteps(prev => prev.map(s => s.status === 'processing' ? {...s, status: 'done', data: 'Error!'} : s));
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const runSlowDecrypt = async () => {
    if (!input || !key) {
      toast.error('Input and key cannot be empty.');
      setIsProcessing(false);
      return;
    }
    
    setIsProcessing(true);
    setOutput('');
    setVisualizationSteps([]);

    if (algorithm === 'AES') {
      const steps = content.algorithms.find(a => a.value === 'AES')?.visualizationStepsDecryption;
      if (!steps) {
        toast.error('Decryption visualization steps not found for AES.');
        setIsProcessing(false);
        return;
      }
      
      const initialSteps: VisualizationStep[] = steps.map(s => ({ ...s, data: '', status: 'pending' }));
      setVisualizationSteps(initialSteps);
      
      try {
        for (let i = 0; i < initialSteps.length; i++) {
          await new Promise(res => setTimeout(res, 200));
          setVisualizationSteps(prev => prev.map((s, idx) => (idx === i ? { ...s, status: 'processing', data: '...' } : s)));
          await new Promise(res => setTimeout(res, 1000));

          let stepData = '';
          if (i === 0) {
            stepData = `Ciphertext: "${input.substring(0, 48)}${input.length > 48 ? '...' : ''}"`;
          } else if (i === 1) {
            stepData = `Key: "${key.substring(0, 16)}${key.length > 16 ? '...' : ''}"`;
          } else {
            const finalResult = decrypt(input, key, algorithm);
            stepData = finalResult;
            setOutput(finalResult);
          }
          
          setVisualizationSteps(prev => prev.map((s, idx) => (idx === i ? { ...s, status: 'done', data: stepData } : s)));
        }
        toast.success('AES decryption complete!');
      } catch (e: any) {
        toast.error(e.message || 'Decryption failed.');
        setVisualizationSteps(prev => prev.map(s => s.status === 'processing' ? {...s, status: 'done', data: 'Error!'} : s));
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Generic visualization for other algorithms
      const algoName = content.algorithms.find(a => a.value === algorithm)?.name || algorithm;
      const steps: VisualizationStep[] = [
        { title: '1. Prepare Ciphertext', explanation: `The ciphertext and secret key are prepared for the ${algoName} algorithm.`, data: '', status: 'pending' },
        { title: `2. Process with Inverse ${algoName} Cipher`, explanation: `The ${algoName} cipher reverses the encryption process using the secret key.`, data: '', status: 'pending' },
        { title: '3. Recover Plaintext', explanation: 'The final output is the original plaintext message.', data: '', status: 'pending' },
      ];
      setVisualizationSteps(steps);

      try {
        for (let i = 0; i < steps.length; i++) {
            await new Promise(res => setTimeout(res, 100));
            setVisualizationSteps(prev => prev.map((s, idx) => (idx === i ? { ...s, status: 'processing' } : s)));
            await new Promise(res => setTimeout(res, 800));
            let stepData = '...';
            if (i === 0) {
                stepData = `Ciphertext: "${input.substring(0, 48)}..."`;
            }
            if (i === steps.length - 1) {
                const finalResult = decrypt(input, key, algorithm);
                stepData = finalResult;
                setOutput(finalResult);
            }
            setVisualizationSteps(prev => prev.map((s, idx) => (idx === i ? { ...s, status: 'done', data: stepData } : s)));
        }
        toast.success(`${algoName} decryption complete!`);
      } catch (e: any) {
        toast.error(e.message || 'Decryption failed.');
        setVisualizationSteps(prev => prev.map(s => s.status === 'processing' ? {...s, status: 'done', data: 'Error!'} : s));
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleEncrypt = async () => {
    if (!input || !key) {
      toast.error('Input and key cannot be empty.');
      return;
    }

    if (showSteps) {
      await runSlowEncrypt();
      return;
    }

    setIsProcessing(true);
    setOutput('');
    try {
      await new Promise(res => setTimeout(res, 500));
      const result = encrypt(input, key, algorithm);
      setOutput(result);
      toast.success('Encrypted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Encryption failed.');
      setOutput('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecrypt = async () => {
    if (!input || !key) {
      toast.error('Input and key cannot be empty.');
      return;
    }

    if (showSteps) {
      await runSlowDecrypt();
      return;
    }

    setIsProcessing(true);
    setOutput('');
    try {
      await new Promise(res => setTimeout(res, 500));
      const result = decrypt(input, key, algorithm);
      setOutput(result);
      toast.success('Decrypted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Decryption failed.');
      setOutput('');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    inputType,
    input,
    file,
    key,
    algorithm,
    output,
    isProcessing,
    showSteps,
    visualizationSteps,
    setInputType: handleInputTypeChange,
    setInput,
    setFile,
    setKey,
    setAlgorithm,
    setOutput,
    setIsProcessing,
    setShowSteps,
    setVisualizationSteps,
    handleFileChange,
    handleEncrypt,
    handleDecrypt,
    handleCopy,
    handleDownload,
    handleSwap,
  };
}
