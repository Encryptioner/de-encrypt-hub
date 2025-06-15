import { toast } from 'sonner';
import { encrypt, decrypt, type Algorithm } from '@/lib/crypto';
import content from '@/config/content.json';
import type { VisualizationStep } from './cipher-types';

interface UseCipherProcessorProps {
    mode: 'encrypt' | 'decrypt';
    input: string;
    key: string;
    algorithm: Algorithm;
    showSteps: boolean;
    setIsProcessing: (isProcessing: boolean) => void;
    setOutput: (output: string) => void;
    setVisualizationSteps: (steps: VisualizationStep[] | ((prev: VisualizationStep[]) => VisualizationStep[])) => void;
}

export function useCipherProcessor({
    mode,
    input,
    key,
    algorithm,
    showSteps,
    setIsProcessing,
    setOutput,
    setVisualizationSteps,
}: UseCipherProcessorProps) {

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

    return { handleEncrypt, handleDecrypt };
}
