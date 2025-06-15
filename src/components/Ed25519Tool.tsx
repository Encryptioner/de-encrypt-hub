
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { Copy, Key, CheckCircle, XCircle } from 'lucide-react';
import { Input } from './ui/input';

// Helper to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper to convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string) {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

export function Ed25519Tool() {
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [input, setInput] = useState('This is a test message.');
  const [signature, setSignature] = useState('');
  const [verificationResult, setVerificationResult] = useState<'valid' | 'invalid' | null>(null);

  const handleGenerateKeys = async () => {
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        { name: 'Ed25519' },
        true,
        ['sign', 'verify']
      );
      
      // Type guard to ensure we have a CryptoKeyPair
      if (!('publicKey' in keyPair) || !('privateKey' in keyPair)) {
        throw new Error("Key generation did not return a valid CryptoKeyPair.");
      }

      const spkiPubKey = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
      const pkcs8PrivKey = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

      setPublicKey(arrayBufferToBase64(spkiPubKey));
      setPrivateKey(arrayBufferToBase64(pkcs8PrivKey));
      setSignature('');
      setVerificationResult(null);
      toast.success('Ed25519 key pair generated!');
    } catch (error) {
      toast.error('Failed to generate keys. Your browser may not support Ed25519.');
      console.error(error);
    }
  };

  const handleSign = async () => {
    if (!input || !privateKey) {
      toast.error('Message and private key are required to sign.');
      return;
    }
    try {
      const privateKeyBuffer = base64ToArrayBuffer(privateKey);
      const key = await window.crypto.subtle.importKey(
        'pkcs8',
        privateKeyBuffer,
        { name: 'Ed25519' },
        true,
        ['sign']
      );
      const encodedMessage = new TextEncoder().encode(input);
      const sig = await window.crypto.subtle.sign(
        'Ed25519',
        key,
        encodedMessage
      );
      setSignature(arrayBufferToBase64(sig));
      setVerificationResult(null);
      toast.success('Message signed successfully!');
    } catch (error) {
      toast.error('Signing failed. Ensure the private key is correct.');
      console.error(error);
    }
  };

  const handleVerify = async () => {
    if (!input || !publicKey || !signature) {
      toast.error('Message, public key, and signature are required to verify.');
      return;
    }
    try {
      const publicKeyBuffer = base64ToArrayBuffer(publicKey);
      const key = await window.crypto.subtle.importKey(
        'spki',
        publicKeyBuffer,
        { name: 'Ed25519' },
        true,
        ['verify']
      );
      const signatureBuffer = base64ToArrayBuffer(signature);
      const encodedMessage = new TextEncoder().encode(input);
      const isValid = await window.crypto.subtle.verify(
        'Ed25519',
        key,
        signatureBuffer,
        encodedMessage
      );
      setVerificationResult(isValid ? 'valid' : 'invalid');
      if (isValid) {
        toast.success('Signature is valid!');
      } else {
        toast.error('Signature is invalid!');
      }
    } catch (error) {
      setVerificationResult('invalid');
      toast.error('Verification failed. Check the public key, message, or signature format.');
      console.error(error);
    }
  };
  
  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <>
      <div className="space-y-6 pt-4">
        <div className="flex justify-end">
          <Button onClick={handleGenerateKeys} variant="outline">
            <Key className="mr-2" />
            Generate New Ed25519 Key Pair
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="ed-public-key">Public Key (Base64)</Label>
            <Textarea id="ed-public-key" placeholder='Base64-encoded public key...' value={publicKey} onChange={(e) => setPublicKey(e.target.value)} className="min-h-[120px] resize-y font-mono text-xs" />
            <Button variant="ghost" size="sm" className="w-fit" onClick={() => handleCopy(publicKey)}><Copy className="mr-2"/> Copy Public Key</Button>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ed-private-key">Private Key (Base64)</Label>
            <Textarea id="ed-private-key" placeholder='Base64-encoded private key...' value={privateKey} onChange={(e) => setPrivateKey(e.target.value)} className="min-h-[120px] resize-y font-mono text-xs" />
            <Button variant="ghost" size="sm" className="w-fit" onClick={() => handleCopy(privateKey)}><Copy className="mr-2"/> Copy Private Key</Button>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="ed-input">Message</Label>
          <Textarea id="ed-input" placeholder="The message to sign or verify..." value={input} onChange={(e) => { setInput(e.target.value); setVerificationResult(null); }} className="min-h-[100px] resize-y" />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleSign} className="flex-1">Sign with Private Key</Button>
        </div>
        
        {signature && (
            <div className="grid gap-2 pt-4">
                <div className="flex justify-between items-center">
                    <Label htmlFor="ed-signature">Generated Signature (Base64)</Label>
                    <Button variant="ghost" size="icon" onClick={() => handleCopy(signature)} title="Copy to Clipboard">
                        <Copy className="w-4 h-4" />
                        <span className="sr-only">Copy</span>
                    </Button>
                </div>
                <Textarea id="ed-signature" readOnly value={signature} className="min-h-[80px] resize-y bg-muted/50 font-mono text-xs" />
            </div>
        )}
        
        <div className="grid gap-4 pt-4 border-t">
          <Label>Verify Signature</Label>
          <div className="grid gap-2">
            <Label htmlFor="verify-signature-ed">Signature to Verify</Label>
            <Input 
              id="verify-signature-ed"
              placeholder="Paste a signature here to verify..."
              value={signature}
              onChange={(e) => { setSignature(e.target.value); setVerificationResult(null); }}
              className="font-mono text-sm"
            />
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={handleVerify} variant="secondary" className="flex-1">Verify</Button>
            {verificationResult === 'valid' && <CheckCircle className="w-6 h-6 text-green-500" />}
            {verificationResult === 'invalid' && <XCircle className="w-6 h-6 text-destructive" />}
          </div>
        </div>
      </div>
       <p className="text-xs text-muted-foreground w-full text-center pt-6">
        Uses Ed25519 for fast and secure digital signatures. Keys are in Base64 (SPKI/PKCS8).
      </p>
    </>
  );
}
