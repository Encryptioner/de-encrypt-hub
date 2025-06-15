import { useState } from 'react';
import { toast } from 'sonner';
import { encrypt, decrypt } from '@/lib/crypto';
import { arrayBufferToBase64, base64ToArrayBuffer } from '@/lib/utils';
import content from '@/config/content.json';

export type Algorithm = 'AES' | 'DES' | 'TripleDES' | 'Rabbit' | 'RC4' | 'RC4Drop';

export type VisualizationStep = {
  title: string;
  explanation: string;
  data: string;
  status: 'pending' | 'processing' | 'done';
};

interface UseCipherProps {
  mode: 'encrypt' | 'decrypt';
}

export function useCipher({ mode }: UseCipherProps) {
  const [inputType, setInputType] = useState<'text' | 'file'>('text');
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [key, setKey] = useState('');
  const [algorithm, setAlgorithm] = useState<Algorithm>('AES');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [visualizationSteps, setVisualizationSteps] = useState<VisualizationStep[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setInput(''); // Clear text input to avoid showing garbled content for binary files
      setOutput('');
      toast.success(`File "${f.name}" loaded. Ready for encryption.`);
    }
  };
  
  const runSlowAesEncryption = async (data: string | ArrayBuffer) => {
    if (!key) {
      toast.error('Secret key cannot be empty.');
      return;
    }
    setIsProcessing(true);
    setOutput('');
    setVisualizationSteps([]);

    const aesConfig = content.algorithms.find(a => a.value === 'AES');
    const aesStepsConfig = aesConfig?.visualizationSteps;

    if (!aesStepsConfig) {
      toast.error("Could not find visualization steps for AES.");
      setIsProcessing(false);
      return;
    }

    let dataForEncryption: string;
    let dataForVisualization: string;

    if (typeof data === 'string') {
      dataForEncryption = data;
      dataForVisualization = data;
    } else {
      dataForEncryption = arrayBufferToBase64(data);
      // Show a snippet for files, as Base64 can be very long
      dataForVisualization = dataForEncryption.substring(0, 44) + '...';
    }

    const textToHex = (text: string) => text.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
    const hexScramble = (hex: string) => hex.split('').sort(() => 0.5 - Math.random()).join('');

    let currentHex = textToHex(dataForVisualization.substring(0, 32));

    const initialSteps: VisualizationStep[] = aesStepsConfig.map(s => ({
      ...s,
      data: '',
      status: 'pending'
    }));
    setVisualizationSteps(initialSteps);
    
    for (let i = 0; i < initialSteps.length; i++) {
        await new Promise(res => setTimeout(res, 100));
        // Set status to processing
        setVisualizationSteps(prev => prev.map((s, idx) => (idx === i ? { ...s, status: 'processing', data: '...' } : s)));
        await new Promise(res => setTimeout(res, 800));

        currentHex = hexScramble(currentHex); // Simulate data transformation
        let stepData: string;

        if (i === 0) {
            stepData = `Input: "${dataForVisualization.substring(0, 48)}"`;
        } else if (i < initialSteps.length - 1) {
            stepData = currentHex;
        } else {
            const finalResult = encrypt(dataForEncryption, key, 'AES');
            stepData = finalResult;
            setOutput(finalResult);
        }
        
        // Set status to done
        setVisualizationSteps(prev => prev.map((s, idx) => (idx === i ? { ...s, status: 'done', data: stepData } : s)));
    }

    setIsProcessing(false);
    toast.success("Slow-mode encryption visualization complete!");
  };
  
  const handleEncrypt = async () => {
    if (!key) {
      toast.error('Secret key cannot be empty.');
      return;
    }

    let dataToEncrypt: string | ArrayBuffer;
    let originalData: string | ArrayBuffer;

    if (inputType === 'text') {
      if (!input) {
        toast.error('Input message cannot be empty.');
        return;
      }
      dataToEncrypt = input;
      originalData = input;
    } else {
      if (!file) {
        toast.error('A file must be selected for encryption.');
        return;
      }
      const buffer = await file.arrayBuffer();
      dataToEncrypt = arrayBufferToBase64(buffer);
      originalData = buffer;
    }
    
    if (showSteps && algorithm === 'AES') {
      // The slow mode needs the original, un-encoded data for files
      runSlowAesEncryption(inputType === 'file' ? (originalData as ArrayBuffer) : (originalData as string));
      return;
    }
    
    setIsProcessing(true);
    setOutput('');
    try {
      // Artificial delay for animation
      await new Promise(res => setTimeout(res, inputType === 'text' ? 500 : 1000));
      const result = encrypt(dataToEncrypt as string, key, algorithm);
      setOutput(result);
      toast.success('Encryption successful!');
    } catch (error: any) {
      toast.error(error.message || 'Encryption failed.');
      setOutput('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecrypt = async () => {
    if (!input || !key) {
      toast.error('Input ciphertext and key cannot be empty.');
      return;
    }
    setIsProcessing(true);
    setOutput('');
    try {
      // Artificial delay for animation
      await new Promise(res => setTimeout(res, 500));
      const result = decrypt(input, key, algorithm);
      setOutput(result);
      toast.success('Decryption successful!');
    } catch (error: any) {
      toast.error(error.message || 'Decryption failed.');
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
  
  const handleDownload = () => {
    if (!output) {
        toast.error('Nothing to download.');
        return;
    }
    
    let blob: Blob;
    let filename: string;

    try {
      // Assume output is base64 and try to decode
      const buffer = base64ToArrayBuffer(output);
      blob = new Blob([buffer]);
      filename = `decrypted-file${file ? `-${file.name}` : ''}`;
      if (!filename.includes('.')) filename += '.bin'; // Add a generic extension
    } catch (e) {
      // If it fails, treat as plain text
      blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
      filename = 'decrypted-text.txt';
    }

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
    setInputType('text');
    setInput(output);
    setOutput('');
  };
  
  const handleInputTypeChange = (newType: 'text' | 'file') => {
    setInputType(newType);
    setInput('');
    setFile(null);
    setOutput('');
  };

  return {
    inputType,
    input, setInput,
    file,
    key, setKey,
    algorithm, setAlgorithm,
    output,
    isProcessing,
    showSteps, setShowSteps,
    visualizationSteps,
    handleFileChange,
    handleEncrypt,
    handleDecrypt,
    handleCopy,
    handleDownload,
    handleSwap,
    handleInputTypeChange,
  };
}
