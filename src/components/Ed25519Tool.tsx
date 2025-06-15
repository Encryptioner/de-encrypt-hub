import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { Copy, Key, FileText, File } from 'lucide-react';
import { Input } from './ui/input';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
  const [inputType, setInputType] = useState<'text' | 'file'>('text');
  const [textInput, setTextInput] = useState('This is a test message.');
  const [file, setFile] = useState<globalThis.File | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [signature, setSignature] = useState('');

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
      reader.onerror = () => {
        toast.error("Error reading file.");
      };
      reader.readAsArrayBuffer(selectedFile);
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

    try {
      const privateKeyBuffer = base64ToArrayBuffer(privateKey);
      const key = await window.crypto.subtle.importKey(
        'pkcs8',
        privateKeyBuffer,
        { name: 'Ed25519' },
        true,
        ['sign']
      );
      const sig = await window.crypto.subtle.sign(
        'Ed25519',
        key,
        dataToSign
      );
      setSignature(arrayBufferToBase64(sig));
      toast.success('Data signed successfully!');
    } catch (error) {
      toast.error('Signing failed. Ensure the private key is correct.');
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
          <Label>Data to Sign</Label>
           <RadioGroup
                defaultValue="text"
                value={inputType}
                onValueChange={(value) => {
                    setInputType(value as 'text' | 'file');
                    setSignature('');
                }}
                className="flex items-center gap-4 py-2"
            >
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="text" id="ed-text-type" />
                    <Label htmlFor="ed-text-type" className="flex items-center cursor-pointer font-normal"><FileText className="mr-2 h-4 w-4" />Text Input</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="file" id="ed-file-type" />
                    <Label htmlFor="ed-file-type" className="flex items-center cursor-pointer font-normal"><File className="mr-2 h-4 w-4" />File Input</Label>
                </div>
            </RadioGroup>
            
            {inputType === 'text' ? (
                <Textarea
                    id="ed-input"
                    placeholder="The message to sign..."
                    value={textInput}
                    onChange={(e) => { setTextInput(e.target.value); setSignature(''); }}
                    className="min-h-[100px] resize-y"
                />
            ) : (
                <div className="grid gap-2">
                    <Input id="ed-file-input" type="file" onChange={handleFileChange} />
                    {file && <p className="text-sm text-muted-foreground">Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)</p>}
                </div>
            )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleSign} className="flex-1">Sign with Private Key</Button>
        </div>
        
        {signature && (
            <div className="grid gap-2 pt-4 border-t">
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
        
      </div>
       <p className="text-xs text-muted-foreground w-full text-center pt-6">
        Uses Ed25519 for fast and secure digital signatures. Keys are in Base64 (SPKI/PKCS8).
      </p>
    </>
  );
}
