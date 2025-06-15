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
  dataType?: 'text' | 'image';
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

    const aesStepsConfig: Omit<VisualizationStep, 'data' | 'status'>[] = [
      { title: '1. Prepare Data & Key', explanation: 'The input data and your secret key are prepared for the encryption process. The key is fundamental, as it controls the entire transformation process.' },
      { title: '2. Initial Round (AddRoundKey)', explanation: 'The data is combined with a part of the "expanded" secret key using a simple XOR operation. This is the first step in obscuring the original data.' },
      { title: '3. Main Rounds (SubBytes, ShiftRows, MixColumns, AddRoundKey)', explanation: 'The data undergoes multiple rounds (10 for AES-128) of complex transformations. Each step systematically substitutes, shuffles, and mixes the data, with the secret key guiding the transformations in each round. This is where the real strength of AES comes from.' },
      { title: '4. Final Round', explanation: 'A final, slightly different round of transformations is applied to the data.' },
      { title: '5. Generate Ciphertext', explanation: 'The fully transformed data is now the final ciphertext, presented in Base64 format. It is computationally infeasible to reverse this without the original secret key.' },
    ];

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
  
  const runSlowAesDecryption = async (data: string) => {
    if (!key) {
      toast.error('Secret key cannot be empty.');
      return;
    }
    setIsProcessing(true);
    setOutput('');
    setVisualizationSteps([]);

    const aesStepsConfig: Omit<VisualizationStep, 'data' | 'status'>[] = [
        { title: '1. Prepare Ciphertext & Key', explanation: 'The Base64 ciphertext and your secret key are loaded. The key must be identical to the one used for encryption.' },
        { title: '2. Inverse Final Round', explanation: 'The final encryption round is reversed. This involves using the same secret key to undo the last set of transformations.' },
        { title: '3. Inverse Main Rounds', explanation: 'The main encryption rounds are reversed one by one. Each step (Inverse ShiftRows, Inverse SubBytes, AddRoundKey, Inverse MixColumns) uses the secret key to precisely undo the scrambling that occurred during encryption.' },
        { title: '4. Inverse Initial Round', explanation: 'The first encryption step is undone, finally revealing the original data.' },
        { title: '5. Final Plaintext', explanation: 'The fully reversed data is now the original plaintext message.' },
    ];

    const initialSteps: VisualizationStep[] = aesStepsConfig.map(s => ({
      ...s,
      data: '',
      status: 'pending'
    }));
    
    for (let i = 0; i < initialSteps.length; i++) {
        await new Promise(res => setTimeout(res, 100));
        setVisualizationSteps(prev => prev.map((s, idx) => (idx === i ? { ...s, status: 'processing', data: '...' } : s)));
        await new Promise(res => setTimeout(res, 800));

        let stepData: string;

        if (i === initialSteps.length - 1) {
            try {
                const finalResult = decrypt(data, key, 'AES');
                stepData = finalResult.substring(0, 64) + (finalResult.length > 64 ? '...' : '');
                setOutput(finalResult);
            } catch (e: any) {
                stepData = `Error: ${e.message}`;
                setOutput(stepData);
                toast.error(`Decryption failed: ${e.message}`);
            }
        } else {
            stepData = `Simulating inverse operation... ${Math.random().toString(36).substring(2, 10)}`;
        }
        
        setVisualizationSteps(prev => prev.map((s, idx) => (idx === i ? { ...s, status: 'done', data: stepData } : s)));
    }

    setIsProcessing(false);
    toast.success("Slow-mode decryption visualization complete!");
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

    if (showSteps && algorithm === 'AES') {
      if (inputType === 'file') {
        toast.warning('Slow mode is not supported for file decryption yet.');
        return;
      }
      runSlowAesDecryption(input);
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
