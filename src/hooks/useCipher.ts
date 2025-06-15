
import { useState } from 'react';
import { toast } from 'sonner';
import { encrypt, decrypt } from '@/lib/crypto';
import { arrayBufferToBase64, base64ToArrayBuffer } from '@/lib/utils';

export type Algorithm = 'AES' | 'DES' | 'TripleDES' | 'Rabbit' | 'RC4' | 'RC4Drop';

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setOutput('');
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileContent = event.target?.result;
        if (typeof fileContent === 'string') {
          setInput(fileContent);
          toast.success(`File "${f.name}" loaded.`);
        } else {
          toast.error("Failed to read file as text.");
        }
      };
      reader.onerror = () => {
        toast.error("Error reading file.");
      };
      reader.readAsText(f);
    }
  };
  
  const handleEncrypt = async () => {
    if (!key) {
      toast.error('Secret key cannot be empty.');
      return;
    }
    let dataToEncrypt: string;

    if (inputType === 'text') {
      if (!input) {
        toast.error('Input message cannot be empty.');
        return;
      }
      dataToEncrypt = input;
    } else {
      if (!file) {
        toast.error('A file must be selected for encryption.');
        return;
      }
      const buffer = await file.arrayBuffer();
      dataToEncrypt = arrayBufferToBase64(buffer);
    }
    
    try {
      const result = encrypt(dataToEncrypt, key, algorithm);
      setOutput(result);
      toast.success('Encryption successful!');
    } catch (error: any) {
      toast.error(error.message || 'Encryption failed.');
    }
  };

  const handleDecrypt = () => {
    if (!input || !key) {
      toast.error('Input ciphertext and key cannot be empty.');
      return;
    }
    try {
      const result = decrypt(input, key, algorithm);
      setOutput(result);
      toast.success('Decryption successful!');
    } catch (error: any) {
      toast.error(error.message || 'Decryption failed.');
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
    handleFileChange,
    handleEncrypt,
    handleDecrypt,
    handleCopy,
    handleDownload,
    handleSwap,
    handleInputTypeChange,
  };
}
