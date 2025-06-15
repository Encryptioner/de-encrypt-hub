
import { useState } from 'react';
import { toast } from 'sonner';
import { type Algorithm } from '@/lib/crypto';
import type { VisualizationStep } from './cipher-types';
import { useCipherProcessor } from './useCipherProcessor';

export type { Algorithm, VisualizationStep };

interface UseCipherProps {
  mode: 'encrypt' | 'decrypt';
}

export function useCipher({ mode }: UseCipherProps) {
  const [inputType, setInputType] = useState<'text' | 'file'>('text');
  const [input, setInput] = useState('This is a test message.');
  const [file, setFile] = useState<File | null>(null);
  const [key, setKey] = useState('');
  const [algorithm, setAlgorithm] = useState<Algorithm>('AES');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [visualizationSteps, setVisualizationSteps] = useState<VisualizationStep[]>([]);

  const { handleEncrypt, handleDecrypt } = useCipherProcessor({
    mode,
    input,
    key,
    algorithm,
    showSteps,
    setIsProcessing,
    setOutput,
    setVisualizationSteps,
  });

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
    setShowSteps,
    handleFileChange,
    handleEncrypt,
    handleDecrypt,
    handleCopy,
    handleDownload,
    handleSwap,
  };
}
