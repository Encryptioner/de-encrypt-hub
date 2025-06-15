
import { useState } from 'react';
import { toast } from 'sonner';
import { type VisualizationStep } from '@/hooks/useCipher';
import { arrayBufferToBase64, base64ToArrayBuffer } from '@/lib/utils';

export function useRsa() {
    // Key State
    const [publicKey, setPublicKey] = useState('');
    const [privateKey, setPrivateKey] = useState('');

    // Input/Output State
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    
    // UI State
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSteps, setShowSteps] = useState(false);
    const [visualizationSteps, setVisualizationSteps] = useState<VisualizationStep[]>([]);
    
    const handleGenerateKeys = async () => {
        try {
            const keyPair = await window.crypto.subtle.generateKey(
                {
                    name: 'RSA-OAEP',
                    modulusLength: 2048,
                    publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
                    hash: 'SHA-256',
                },
                true,
                ['encrypt', 'decrypt']
            );
            
            const publicKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
            const privateKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);

            setPublicKey(JSON.stringify(publicKeyJwk, null, 2));
            setPrivateKey(JSON.stringify(privateKeyJwk, null, 2));
            toast.success('RSA key pair generated successfully!');
        } catch (error) {
            toast.error('Failed to generate keys.');
            console.error(error);
        }
    };

    const runSlowMode = async (mode: 'encrypt' | 'decrypt', data: string, keyJwkStr: string) => {
        setIsProcessing(true);
        setOutput('');
        setVisualizationSteps([]);

        const encryptionSteps = [
            { title: '1. Load Public Key', explanation: 'The public key, which can be shared freely, is loaded. It contains the mathematical components needed to encrypt data, but not to decrypt it.' },
            { title: '2. Prepare Data (OAEP Padding)', explanation: 'The message is prepared with a special, random padding (OAEP). This enhances security by preventing attacks based on predictable message formats.' },
            { title: '3. Encrypt with Public Key', explanation: 'The padded message is mathematically transformed using the public key. This process is a "one-way street"; the data can now only be decrypted by the corresponding private key.' },
            { title: '4. Final Ciphertext', explanation: 'The result is the Base64 encoded ciphertext, ready to be sent securely.' },
        ];
        const decryptionSteps = [
            { title: '1. Load Private Key', explanation: 'The private key, which must be kept secret, is loaded. It contains the unique mathematical components required to reverse the encryption.' },
            { title: '2. Decrypt with Private Key', explanation: 'The ciphertext is mathematically transformed using the private key. Only the correct private key can successfully reverse the public key\'s encryption.' },
            { title: '3. Remove Padding', explanation: 'The random OAEP padding that was added during encryption is now removed, leaving only the original data.' },
            { title: '4. Final Plaintext', explanation: 'The original message is recovered.' },
        ];

        const stepsConfig = mode === 'encrypt' ? encryptionSteps : decryptionSteps;
        let currentData = data.substring(0, 64) + (data.length > 64 ? '...' : '');

        const initialSteps: VisualizationStep[] = stepsConfig.map(s => ({
            ...s, data: '', status: 'pending'
        }));
        setVisualizationSteps(initialSteps);

        for (let i = 0; i < initialSteps.length; i++) {
            await new Promise(res => setTimeout(res, 100));
            setVisualizationSteps(prev => prev.map((s, idx) => (idx === i ? { ...s, status: 'processing', data: '...' } : s)));
            await new Promise(res => setTimeout(res, 800));

            // Simulate data transformation
            currentData = currentData.split('').sort(() => 0.5 - Math.random()).join('');
            let stepData = `State: ${currentData}`;

            if (i === initialSteps.length - 1) {
                // Perform the actual operation on the last step
                try {
                    if (mode === 'encrypt') {
                        const key = await window.crypto.subtle.importKey('jwk', JSON.parse(keyJwkStr), { name: 'RSA-OAEP', hash: 'SHA-256' }, true, ['encrypt']);
                        const encrypted = await window.crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, new TextEncoder().encode(data));
                        stepData = arrayBufferToBase64(encrypted);
                        setOutput(stepData);
                    } else {
                        const key = await window.crypto.subtle.importKey('jwk', JSON.parse(keyJwkStr), { name: 'RSA-OAEP', hash: 'SHA-256' }, true, ['decrypt']);
                        const decrypted = await window.crypto.subtle.decrypt({ name: 'RSA-OAEP' }, key, base64ToArrayBuffer(data));
                        stepData = new TextDecoder().decode(decrypted);
                        setOutput(stepData);
                    }
                } catch (e: any) {
                    stepData = `Error: ${e.message}`;
                    setOutput(stepData);
                    toast.error(`Operation failed: ${e.message}`);
                }
            }
            setVisualizationSteps(prev => prev.map((s, idx) => (idx === i ? { ...s, status: 'done', data: stepData } : s)));
        }
        setIsProcessing(false);
        toast.success(`Slow-mode ${mode} visualization complete!`);
    };

    const handleEncrypt = async () => {
        if (!input) return toast.error('Input message cannot be empty.');
        if (!publicKey) return toast.error('Public key is required for encryption.');
        
        if (showSteps) {
            runSlowMode('encrypt', input, publicKey);
            return;
        }

        setIsProcessing(true);
        setOutput('');
        try {
            await new Promise(res => setTimeout(res, 500));
            const key = await window.crypto.subtle.importKey('jwk', JSON.parse(publicKey), { name: 'RSA-OAEP', hash: 'SHA-256' }, true, ['encrypt']);
            const encrypted = await window.crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, new TextEncoder().encode(input));
            const result = arrayBufferToBase64(encrypted);
            setOutput(result);
            toast.success('Encryption successful!');
        } catch (e: any) {
            toast.error(`Encryption failed: ${e.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDecrypt = async () => {
        if (!input) return toast.error('Ciphertext cannot be empty.');
        if (!privateKey) return toast.error('Private key is required for decryption.');

        if (showSteps) {
            runSlowMode('decrypt', input, privateKey);
            return;
        }

        setIsProcessing(true);
        setOutput('');
        try {
            await new Promise(res => setTimeout(res, 500));
            const key = await window.crypto.subtle.importKey('jwk', JSON.parse(privateKey), { name: 'RSA-OAEP', hash: 'SHA-256' }, true, ['decrypt']);
            const decrypted = await window.crypto.subtle.decrypt({ name: 'RSA-OAEP' }, key, base64ToArrayBuffer(input));
            const result = new TextDecoder().decode(decrypted);
            setOutput(result);
            toast.success('Decryption successful!');
        } catch (e: any) {
            toast.error(`Decryption failed: ${e.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCopy = (text: string) => {
        if (!text) return toast.error('Nothing to copy.');
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
    };

    const handleSwap = () => {
        if (!output) return toast.error('Nothing to use as input.');
        setInput(output);
        setOutput('');
    };

    return {
        publicKey, setPublicKey,
        privateKey, setPrivateKey,
        input, setInput,
        output,
        isProcessing,
        showSteps, setShowSteps,
        visualizationSteps,
        handleGenerateKeys,
        handleEncrypt,
        handleDecrypt,
        handleCopy,
        handleSwap,
    };
}
