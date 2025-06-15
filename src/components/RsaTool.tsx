
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { Copy, Key, RefreshCw } from 'lucide-react';

// Helper to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
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
  const [input, setInput] = useState('My secret message');
  const [output, setOutput] = useState('');

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

  const handleEncrypt = async () => {
    if (!input || !publicKey) {
      toast.error('Input text and public key are required.');
      return;
    }
    try {
      const publicKeyJwk = JSON.parse(publicKey);
      const key = await window.crypto.subtle.importKey(
        'jwk',
        publicKeyJwk,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        true,
        ['encrypt']
      );
      const encodedInput = new TextEncoder().encode(input);
      const encrypted = await window.crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        key,
        encodedInput
      );
      setOutput(arrayBufferToBase64(encrypted));
      toast.success('Encrypted successfully!');
    } catch (error) {
      toast.error('Encryption failed. Ensure the public key is correct.');
      console.error(error);
    }
  };

  const handleDecrypt = async () => {
    if (!input || !privateKey) {
      toast.error('Input ciphertext and private key are required.');
      return;
    }
    try {
      const privateKeyJwk = JSON.parse(privateKey);
      const key = await window.crypto.subtle.importKey(
        'jwk',
        privateKeyJwk,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        true,
        ['decrypt']
      );
      const encryptedBuffer = base64ToArrayBuffer(input);
      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        key,
        encryptedBuffer
      );
      setOutput(new TextDecoder().decode(decrypted));
      toast.success('Decrypted successfully!');
    } catch (error) {
      toast.error('Decryption failed. Check the private key or ciphertext.');
      console.error(error);
    }
  };
  
  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleSwap = () => {
    if (!output) {
        toast.error('Nothing to use as input.');
        return;
    }
    setInput(output);
    setOutput('');
  }

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
          <Label htmlFor="rsa-input">Input (Plaintext / Ciphertext)</Label>
          <Textarea id="rsa-input" placeholder="Your secret message or Base64 ciphertext..." value={input} onChange={(e) => setInput(e.target.value)} className="min-h-[120px] resize-y" />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleEncrypt} className="flex-1">Encrypt with Public Key</Button>
          <Button onClick={handleDecrypt} className="flex-1" variant="secondary">Decrypt with Private Key</Button>
        </div>

        {output && (
          <div className="grid gap-2 pt-4">
            <div className="flex justify-between items-center">
                <Label htmlFor="rsa-output">Result</Label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={handleSwap} title="Use as Input">
                    <RefreshCw className="w-4 h-4" />
                    <span className="sr-only">Use as Input</span>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleCopy(output)} title="Copy to Clipboard">
                    <Copy className="w-4 h-4" />
                    <span className="sr-only">Copy</span>
                  </Button>
                </div>
            </div>
            <Textarea id="rsa-output" readOnly value={output} className="min-h-[120px] resize-y bg-muted/50" />
          </div>
        )}
      </div>
       <p className="text-xs text-muted-foreground w-full text-center pt-6">
        Uses RSA-OAEP with SHA-256 padding. Keys are in JSON Web Key (JWK) format.
      </p>
    </>
  );
}
