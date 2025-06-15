
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

export function RsaTool() {
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [input, setInput] = useState('This is a test message.');
  const [signature, setSignature] = useState('');
  const [verificationResult, setVerificationResult] = useState<'valid' | 'invalid' | null>(null);

  const handleGenerateKeys = async () => {
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'RSA-PSS',
          modulusLength: 2048,
          publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
          hash: 'SHA-256',
        },
        true,
        ['sign', 'verify']
      );
      
      const publicKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
      const privateKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);

      setPublicKey(JSON.stringify(publicKeyJwk, null, 2));
      setPrivateKey(JSON.stringify(privateKeyJwk, null, 2));
      setSignature('');
      setVerificationResult(null);
      toast.success('RSA key pair generated successfully!');
    } catch (error) {
      toast.error('Failed to generate keys.');
      console.error(error);
    }
  };

  const handleSign = async () => {
    if (!input || !privateKey) {
      toast.error('Input message and private key are required.');
      return;
    }
    try {
      const privateKeyJwk = JSON.parse(privateKey);
      const key = await window.crypto.subtle.importKey(
        'jwk',
        privateKeyJwk,
        { name: 'RSA-PSS', hash: 'SHA-256' },
        true,
        ['sign']
      );
      const encodedInput = new TextEncoder().encode(input);
      const sig = await window.crypto.subtle.sign(
        { name: 'RSA-PSS', saltLength: 32 },
        key,
        encodedInput
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
      const publicKeyJwk = JSON.parse(publicKey);
      const key = await window.crypto.subtle.importKey(
        'jwk',
        publicKeyJwk,
        { name: 'RSA-PSS', hash: 'SHA-256' },
        true,
        ['verify']
      );
      const signatureBuffer = base64ToArrayBuffer(signature);
      const encodedInput = new TextEncoder().encode(input);
      const isValid = await window.crypto.subtle.verify(
        { name: 'RSA-PSS', saltLength: 32 },
        key,
        signatureBuffer,
        encodedInput
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
            Generate New 2048-bit Key Pair
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="rsa-public-key">Public Key (JWK)</Label>
            <Textarea id="rsa-public-key" placeholder='Your public key in JSON Web Key format...' value={publicKey} onChange={(e) => setPublicKey(e.target.value)} className="min-h-[160px] resize-y font-mono text-xs" />
            <Button variant="ghost" size="sm" className="w-fit" onClick={() => handleCopy(publicKey)}>
                <Copy className="mr-2"/> Copy Public Key
            </Button>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="rsa-private-key">Private Key (JWK)</Label>
            <Textarea id="rsa-private-key" placeholder='Your private key in JSON Web Key format...' value={privateKey} onChange={(e) => setPrivateKey(e.target.value)} className="min-h-[160px] resize-y font-mono text-xs" />
            <Button variant="ghost" size="sm" className="w-fit" onClick={() => handleCopy(privateKey)}>
                <Copy className="mr-2"/> Copy Private Key
            </Button>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="rsa-input">Message</Label>
          <Textarea id="rsa-input" placeholder="The message to sign or verify..." value={input} onChange={(e) => { setInput(e.target.value); setVerificationResult(null); }} className="min-h-[120px] resize-y" />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleSign} className="flex-1">Sign with Private Key</Button>
        </div>

        {signature && (
          <div className="grid gap-2 pt-4">
            <div className="flex justify-between items-center">
                <Label htmlFor="rsa-signature">Generated Signature (Base64)</Label>
                <Button variant="ghost" size="icon" onClick={() => handleCopy(signature)} title="Copy to Clipboard">
                    <Copy className="w-4 h-4" />
                    <span className="sr-only">Copy</span>
                </Button>
            </div>
            <Textarea id="rsa-signature" readOnly value={signature} className="min-h-[80px] resize-y bg-muted/50 font-mono text-xs" />
          </div>
        )}
        
        <div className="grid gap-4 pt-4 border-t">
          <Label>Verify Signature</Label>
          <div className="grid gap-2">
            <Label htmlFor="verify-signature-rsa">Signature to Verify</Label>
            <Input 
              id="verify-signature-rsa"
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
        Uses RSA-PSS with SHA-256 for signatures. Keys are in JSON Web Key (JWK) format.
      </p>
    </>
  );
}
