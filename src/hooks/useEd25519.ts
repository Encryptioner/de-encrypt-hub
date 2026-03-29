import * as React from 'react';
import { toast } from 'sonner';
import { type VisualizationStep } from '@/hooks/useCipher';
import { arrayBufferToBase64, base64ToArrayBuffer } from '@/lib/utils';
import { trackEvent, sanitizeError } from '@/lib/googleAnalytics';

export function useEd25519() {
  const [publicKey, setPublicKey] = React.useState('');
  const [privateKey, setPrivateKey] = React.useState('');
  const [inputType, setInputType] = React.useState<'text' | 'file'>('text');
  const [textInput, setTextInput] = React.useState('This is a test message.');
  const [file, setFile] = React.useState<File | null>(null);
  const [fileBuffer, setFileBuffer] = React.useState<ArrayBuffer | null>(null);
  const [signature, setSignature] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [processingAction, setProcessingAction] = React.useState<'sign' | 'verify' | null>(null);
  const [animatedSignature, setAnimatedSignature] = React.useState('');
  const [showSteps, setShowSteps] = React.useState(false);
  const [visualizationSteps, setVisualizationSteps] = React.useState<VisualizationStep[]>([]);
  
  React.useEffect(() => {
    if (isProcessing && processingAction === 'sign' && !showSteps) {
      const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      const interval = setInterval(() => {
        let result = '';
        for (let i = 0; i < 88; i++) { // Ed25519 signatures are 64 bytes -> 88 Base64 chars
          result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
        }
        setAnimatedSignature(result);
      }, 50);

      return () => clearInterval(interval);
    }
  }, [isProcessing, showSteps, processingAction]);

  const handleGenerateKeys = async () => {
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        { name: 'Ed25519' }, true, ['sign', 'verify']
      );
      
      if (!('publicKey' in keyPair) || !('privateKey' in keyPair)) {
        throw new Error("Key generation did not return a valid CryptoKeyPair.");
      }

      const spkiPubKey = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
      const pkcs8PrivKey = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

      setPublicKey(arrayBufferToBase64(spkiPubKey));
      setPrivateKey(arrayBufferToBase64(pkcs8PrivKey));
      setSignature('');
      toast.success('Ed25519 key pair generated!');
    } catch (error) {
      toast.error('Failed to generate keys. Your browser may not support Ed25519.');
      console.error(error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target?.result;
        if (buffer instanceof ArrayBuffer) {
          setFileBuffer(buffer);
          setSignature('');
          toast.success(`File "${selectedFile.name}" loaded.`);
        } else {
          toast.error("Failed to read file as ArrayBuffer.");
        }
      };
      reader.onerror = () => toast.error("Error reading file.");
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const runSlowSign = async (dataToSign: ArrayBuffer) => {
    setIsProcessing(true);
    setProcessingAction('sign');
    setSignature('');

    const steps = [
        { title: '1. Load Data & Private Key', explanation: 'The signing process begins with your data and your secret Ed25519 private key. This key is the foundation of the signature and must be kept absolutely secret.' },
        { title: '2. Hash Message (SHA-512)', explanation: 'The Ed25519 algorithm first hashes the entire message using SHA-512. This creates a unique, fixed-size fingerprint of your data, ensuring that even a tiny change would be detected.' },
        { title: '3. Sign with Private Key', explanation: 'The algorithm then uses your private key and the message hash to perform calculations on a special elliptic curve (Curve25519). This generates a digital signature that is mathematically linked to both your key and your data.' },
        { title: '4. Final Signature', explanation: 'This is the final signature. It can be shared publicly with your public key and the original data. Anyone can verify it, but only someone with your private key could have created it.' },
    ];
    
    const initialSteps: VisualizationStep[] = steps.map(s => ({ ...s, data: '', status: 'pending' }));
    setVisualizationSteps(initialSteps);
    
    try {
        for (let i = 0; i < initialSteps.length; i++) {
            await new Promise(res => setTimeout(res, 100));
            setVisualizationSteps(prev => prev.map((s, idx) => (idx === i ? { ...s, status: 'processing', data: '...' } : s)));
            await new Promise(res => setTimeout(res, 800));

            let stepData = '';
            if (i === 0) {
                stepData = `Private key and data loaded.`;
            } else if (i === 1) {
                const hashBuffer = await window.crypto.subtle.digest('SHA-512', dataToSign);
                stepData = `Message Hash: ${arrayBufferToBase64(hashBuffer).substring(0, 44)}...`;
            } else if (i === 2) {
                stepData = `Signing hash with private key using elliptic curve math...`;
            } else {
                const privateKeyBuffer = base64ToArrayBuffer(privateKey);
                const key = await window.crypto.subtle.importKey('pkcs8', privateKeyBuffer, { name: 'Ed25519' }, true, ['sign']);
                const sig = await window.crypto.subtle.sign('Ed25519', key, dataToSign);
                const finalSignature = arrayBufferToBase64(sig);
                stepData = finalSignature;
                setSignature(finalSignature);
            }
            
            setVisualizationSteps(prev => prev.map((s, idx) => (idx === i ? { ...s, status: 'done', data: stepData } : s)));
        }
        toast.success("Signing visualization complete!");
    } catch (e: unknown) {
        toast.error('Signing failed. Ensure the private key is correct.');
    } finally {
        setIsProcessing(false);
        setProcessingAction(null);
    }
  };

  const runSlowVerify = async (dataToVerify: ArrayBuffer, signatureToVerify: string) => {
    setIsProcessing(true);
    setProcessingAction('verify');

    const steps = [
        { title: '1. Load Data, Public Key & Signature', explanation: 'Verification uses the public data, the signature, and the public key. The public key corresponds to the private key used for signing.' },
        { title: '2. Hash Original Message (SHA-512)', explanation: 'Just like signing, the verifier re-calculates the SHA-512 hash of the original message. This must match the hash used during signing.' },
        { title: '3. Verify Signature with Public Key', explanation: 'The core of verification. The algorithm uses the public key to perform a mathematical check on the signature against the data hash. This should confirm the private key\'s operation.' },
        { title: '4. Compare and Validate', explanation: 'The result of the check is a simple boolean: valid or invalid. If valid, the signature is authentic and the data is untampered. If invalid, the signature or data cannot be trusted.' },
    ];
    
    const initialSteps: VisualizationStep[] = steps.map(s => ({ ...s, data: '', status: 'pending' }));
    setVisualizationSteps(initialSteps);
    
    try {
        for (let i = 0; i < initialSteps.length; i++) {
            await new Promise(res => setTimeout(res, 100));
            setVisualizationSteps(prev => prev.map((s, idx) => (idx === i ? { ...s, status: 'processing', data: '...' } : s)));
            await new Promise(res => setTimeout(res, 800));

            let stepData = '';
            if (i === 0) {
                stepData = `Public key, data, and signature loaded.`;
            } else if (i === 1) {
                const hashBuffer = await window.crypto.subtle.digest('SHA-512', dataToVerify);
                stepData = `Message Hash: ${arrayBufferToBase64(hashBuffer).substring(0, 44)}...`;
            } else if (i === 2) {
                stepData = `Verifying signature against hash using public key...`;
            } else {
                const publicKeyBuffer = base64ToArrayBuffer(publicKey);
                const signatureBuffer = base64ToArrayBuffer(signatureToVerify);
                const key = await window.crypto.subtle.importKey('spki', publicKeyBuffer, { name: 'Ed25519' }, true, ['verify']);
                const isValid = await window.crypto.subtle.verify('Ed25519', key, signatureBuffer, dataToVerify);
                stepData = `Verification Result: ${isValid ? 'VALID' : 'INVALID'}`;
                if (isValid) {
                    toast.success("Signature is valid!");
                } else {
                    toast.error("Signature is INVALID!");
                }
            }
            
            setVisualizationSteps(prev => prev.map((s, idx) => (idx === i ? { ...s, status: 'done', data: stepData } : s)));
        }
        toast.info("Verification visualization complete!");
    } catch (e: unknown) {
        toast.error('Verification failed. Ensure the public key and signature are correct.');
        setVisualizationSteps(prev => prev.map(s => s.status === 'processing' ? {...s, status: 'done', data: 'Error!'} : s));
    } finally {
        setIsProcessing(false);
        setProcessingAction(null);
    }
  };

  const handleSign = async () => {
    if (!privateKey) {
      toast.error('Private key is required to sign.');
      return;
    }

    let dataToSign: ArrayBuffer;
    if (inputType === 'text') {
      if (!textInput) {
        toast.error('Input message is required.');
        return;
      }
      dataToSign = new TextEncoder().encode(textInput);
    } else {
      if (!fileBuffer) {
        toast.error('A file must be loaded first.');
        return;
      }
      dataToSign = fileBuffer;
    }

    if (showSteps) {
        await runSlowSign(dataToSign);
        return;
    }

    setIsProcessing(true);
    setProcessingAction('sign');
    setSignature('');
    try {
      await new Promise(res => setTimeout(res, 500)); // artifical delay
      const privateKeyBuffer = base64ToArrayBuffer(privateKey);
      const key = await window.crypto.subtle.importKey('pkcs8', privateKeyBuffer, { name: 'Ed25519' }, true, ['sign']);
      const sig = await window.crypto.subtle.sign('Ed25519', key, dataToSign);
      setSignature(arrayBufferToBase64(sig));
      toast.success('Data signed successfully!');
      trackEvent({ name: "signature_operation", params: { algorithm: "ed25519", operation: "sign" } });
    } catch (error) {
      toast.error('Signing failed. Ensure the private key is correct.');
      console.error(error);
      trackEvent({ name: "signature_failed", params: { algorithm: "ed25519", operation: "sign", error: sanitizeError(error) } });
    } finally {
      setIsProcessing(false);
      setProcessingAction(null);
    }
  };

  const handleVerify = async () => {
    if (!publicKey) {
      toast.error('Public key is required to verify.');
      return;
    }
    if (!signature) {
      toast.error('Signature is required to verify.');
      return;
    }

    let dataToVerify: ArrayBuffer;
    if (inputType === 'text') {
      if (!textInput) {
        toast.error('Input message is required.');
        return;
      }
      dataToVerify = new TextEncoder().encode(textInput);
    } else {
      if (!fileBuffer) {
        toast.error('A file must be loaded first.');
        return;
      }
      dataToVerify = fileBuffer;
    }

    if (showSteps) {
        await runSlowVerify(dataToVerify, signature);
        return;
    }

    setIsProcessing(true);
    setProcessingAction('verify');
    try {
      await new Promise(res => setTimeout(res, 500)); // artifical delay
      const publicKeyBuffer = base64ToArrayBuffer(publicKey);
      const signatureBuffer = base64ToArrayBuffer(signature);
      const key = await window.crypto.subtle.importKey('spki', publicKeyBuffer, { name: 'Ed25519' }, true, ['verify']);
      const isValid = await window.crypto.subtle.verify('Ed25519', key, signatureBuffer, dataToVerify);
      if (isValid) {
        toast.success('Signature is valid!');
      } else {
        toast.error('Signature is INVALID!');
      }
      trackEvent({ name: "signature_operation", params: { algorithm: "ed25519", operation: "verify" } });
    } catch (error) {
      toast.error('Verification failed. Check public key or signature format.');
      console.error(error);
      trackEvent({ name: "signature_failed", params: { algorithm: "ed25519", operation: "verify", error: sanitizeError(error) } });
    } finally {
      setIsProcessing(false);
      setProcessingAction(null);
    }
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
    trackEvent({ name: "result_copied", params: { tool: "signature" } });
  };
  
  const handleDownload = (content: string, fileName: string) => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded as ${fileName}`);
  };
  
  return {
    publicKey, setPublicKey,
    privateKey, setPrivateKey,
    inputType, setInputType,
    textInput, setTextInput,
    file, setFile,
    fileBuffer,
    signature, setSignature,
    isProcessing,
    animatedSignature,
    showSteps, setShowSteps,
    visualizationSteps,
    handleGenerateKeys,
    handleFileChange,
    handleSign,
    handleCopy,
    handleVerify,
    processingAction,
    handleDownload,
  }
}
