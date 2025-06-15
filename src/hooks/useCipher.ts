
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
  
  const runSlowEncryption = async (data: string | ArrayBuffer) => {
    if (!key) {
      toast.error('Secret key cannot be empty.');
      return;
    }
    setIsProcessing(true);
    setOutput('');
    setVisualizationSteps([]);

    const isStreamCipher = ['Rabbit', 'RC4', 'RC4Drop'].includes(algorithm);
    let stepsConfig: Omit<VisualizationStep, 'data' | 'status'>[];

    if (isStreamCipher) {
      stepsConfig = [
        { title: '1. Prepare Data & Key', explanation: 'The process starts with your data and the secret key. For a stream cipher, the key is the crucial "seed" for generating a unique data stream.' },
        { title: '2. Initialize Keystream Generator', explanation: 'The secret key is used to set up the complex internal state of a keystream generator. This is a highly sensitive process where the key dictates the generator\'s output.' },
        { title: '3. Generate Keystream', explanation: 'The generator produces a stream of pseudo-random bytes, called the keystream. Given the same key, it will always produce the exact same keystream, which is why the key is so important.' },
        { title: '4. XOR with Plaintext', explanation: 'The plaintext is combined with the keystream using a simple XOR operation. This is surprisingly secure because the keystream is secret. To decrypt, the recipient generates the same keystream (using the same key) and XORs it against the ciphertext to reveal the original data.' },
        { title: '5. Final Ciphertext', explanation: 'The result of the XOR operation is the final ciphertext. It is computationally infeasible to reverse this without the original secret key.' },
      ];
    } else { // Block Ciphers
      stepsConfig = [
        { title: '1. Prepare Data & Key', explanation: 'The input data and your secret key are prepared. In a symmetric block cipher, this key is used to control every step of the transformation.' },
        { title: '2. Key Expansion/Scheduling', explanation: 'The secret key is expanded into a series of different "round keys". Using a different key for each round of encryption is a critical feature that dramatically increases the algorithm\'s security.' },
        { title: '3. Main Rounds of Transformation', explanation: 'The data is processed in fixed-size blocks through multiple rounds of complex transformations (like substitution and permutation). Each round uses a different round key to systematically scramble the data based on the original secret key.' },
        { title: '4. Final Ciphertext', explanation: 'After all rounds are complete, the fully transformed data is the final ciphertext. It is presented here in Base64 format.' },
      ];
    }
    
    let dataForEncryption: string;
    let dataForVisualization: string;

    if (typeof data === 'string') {
      dataForEncryption = data;
      dataForVisualization = data;
    } else {
      dataForEncryption = arrayBufferToBase64(data);
      dataForVisualization = `File: ${file?.name || 'binary data'}`;
    }

    const textToHex = (text: string) => text.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
    const hexScramble = (hex: string) => hex.split('').sort(() => 0.5 - Math.random()).join('');

    const initialSteps: VisualizationStep[] = stepsConfig.map(s => ({ ...s, data: '', status: 'pending' }));
    
    setVisualizationSteps(initialSteps);

    for (let i = 0; i < initialSteps.length; i++) {
        await new Promise(res => setTimeout(res, 100));
        setVisualizationSteps(prev => prev.map((s, idx) => (idx === i ? { ...s, status: 'processing', data: '...' } : s)));
        await new Promise(res => setTimeout(res, 800));

        let stepData: string;

        if (i === 0) {
            stepData = `Input: "${dataForVisualization.substring(0, 30)}${dataForVisualization.length > 30 ? '...' : ''}"\nKey: "${key.substring(0, 16)}..."`;
        } else if (isStreamCipher) {
            // Stream Cipher Steps
            if (i === 1) {
                stepData = `Initializing keystream generator with the secret key.`;
            } else if (i === 2) {
                const fakeKeystream = hexScramble(textToHex(key + dataForVisualization).substring(0, 32));
                stepData = `Generated Keystream: ${fakeKeystream}...`;
            } else if (i === 3) {
                stepData = `XORing the input data with the generated keystream.`;
            } else { // Final step
                const finalResult = encrypt(dataForEncryption, key, algorithm);
                stepData = finalResult;
                setOutput(finalResult);
            }
        } else {
            // Block Cipher Steps
            if (i === 1) {
                stepData = `Secret key is expanded into multiple unique 'round keys'.`;
            } else if (i === 2) {
                 stepData = `Simulating a transformation round on a data block using a round key.`;
            } else { // Final step
                const finalResult = encrypt(dataForEncryption, key, algorithm);
                stepData = finalResult;
                setOutput(finalResult);
            }
        }
        
        setVisualizationSteps(prev => prev.map((s, idx) => (idx === i ? { ...s, status: 'done', data: stepData } : s)));
    }

    setIsProcessing(false);
    toast.success("Slow-mode encryption visualization complete!");
  };
  
  const runSlowDecryption = async (data: string) => {
    if (!key) {
      toast.error('Secret key cannot be empty.');
      return;
    }
    setIsProcessing(true);
    setOutput('');
    setVisualizationSteps([]);

    const isStreamCipher = ['Rabbit', 'RC4', 'RC4Drop'].includes(algorithm);
    let stepsConfig: Omit<VisualizationStep, 'data' | 'status'>[];

    if (isStreamCipher) {
       stepsConfig = [
        { title: '1. Prepare Ciphertext & Key', explanation: 'The ciphertext and secret key are loaded. To decrypt, the key must be identical to the one used for encryption.' },
        { title: '2. Initialize Keystream Generator', explanation: 'The secret key is used to initialize the keystream generator to the exact same state it was in during encryption. This is why the key is critical.' },
        { title: '3. Generate Keystream', explanation: 'The generator produces the same pseudo-random keystream as before. This is the "key" to unlocking the data.' },
        { title: '4. XOR with Ciphertext', explanation: 'The ciphertext is XORed with the keystream. Because XORing the same value twice cancels it out, this operation precisely reverses the encryption, revealing the original plaintext.' },
        { title: '5. Final Plaintext', explanation: 'The fully reversed data is now the original plaintext message.' },
      ];
    } else { // Block Ciphers
      stepsConfig = [
        { title: '1. Prepare Ciphertext & Key', explanation: 'The Base64 ciphertext and your secret key are loaded. The key must be identical to the one used for encryption to reverse the process.' },
        { title: '2. Key Expansion/Scheduling', explanation: 'The same key expansion process is performed to generate the same set of round keys used during encryption. For decryption, these keys are typically used in reverse order.' },
        { title: '3. Inverse Main Rounds', explanation: 'The decryption process applies the inverse of the encryption transformations, round by round. Each inverse step uses the corresponding round key to systematically unscramble the data.' },
        { title: '4. Final Plaintext', explanation: 'After the final inverse round, the original plaintext is revealed.' },
    ];
    }
    
    const initialSteps: VisualizationStep[] = stepsConfig.map(s => ({ ...s, data: '', status: 'pending' }));
    
    setVisualizationSteps(initialSteps);
    
    for (let i = 0; i < initialSteps.length; i++) {
        await new Promise(res => setTimeout(res, 100));
        setVisualizationSteps(prev => prev.map((s, idx) => (idx === i ? { ...s, status: 'processing', data: '...' } : s)));
        await new Promise(res => setTimeout(res, 800));

        let stepData: string;

        if (i === 0) {
            stepData = `Ciphertext: "${data.substring(0, 30)}..."\nKey: "${key.substring(0, 16)}..."`;
        } else if (i < initialSteps.length - 1) {
            if (isStreamCipher) {
                if (i === 1) stepData = `Initializing keystream generator with the secret key.`;
                else if (i === 2) stepData = `Re-generating the exact same keystream as used in encryption.`;
                else if (i === 3) stepData = `XORing the ciphertext with the keystream to reverse encryption.`;
                else stepData = `Simulating inverse operation...`;
            } else { // Block Cipher
                if (i === 1) stepData = `Secret key is expanded into 'round keys' for decryption.`;
                else if (i === 2) stepData = `Simulating an inverse transformation round on a data block.`;
                else stepData = `Simulating inverse operation...`;
            }
        } else {
            try {
                const finalResult = decrypt(data, key, algorithm);
                stepData = finalResult.substring(0, 64) + (finalResult.length > 64 ? '...' : '');
                setOutput(finalResult);
            } catch (e: any) {
                stepData = `Error: ${e.message}`;
                setOutput(stepData);
                toast.error(`Decryption failed: ${e.message}`);
            }
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
    
    if (showSteps) {
      // The slow mode needs the original, un-encoded data for files
      runSlowEncryption(inputType === 'file' ? (originalData as ArrayBuffer) : (originalData as string));
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

    if (showSteps) {
      if (inputType === 'file') {
        toast.warning('Slow mode is not supported for file decryption yet.');
        return;
      }
      runSlowDecryption(input);
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
