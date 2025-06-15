
import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { Copy, Key, FileText, File as FileIcon, Download, Loader2 } from 'lucide-react';
import { Input } from './ui/input';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { arrayBufferToBase64 } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';


export function RsaTool() {
  const [publicKey, setPublicKey] = React.useState('');
  const [privateKey, setPrivateKey] = React.useState('');
  
  // Signing state
  const [signInputType, setSignInputType] = React.useState<'text' | 'file'>('text');
  const [signTextInput, setSignTextInput] = React.useState('This is a test message.');
  const [signFile, setSignFile] = React.useState<globalThis.File | null>(null);
  const [signFileBuffer, setSignFileBuffer] = React.useState<ArrayBuffer | null>(null);
  const [signature, setSignature] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [animatedSignature, setAnimatedSignature] = React.useState('');

  React.useEffect(() => {
    if (isProcessing) {
      const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      const interval = setInterval(() => {
        let result = '';
        for (let i = 0; i < 344; i++) { // 2048 bit signature is 256 bytes -> ~344 Base64 chars
          result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
        }
        setAnimatedSignature(result);
      }, 50);

      return () => clearInterval(interval);
    }
  }, [isProcessing]);

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
      toast.success('RSA key pair generated successfully for signing!');
    } catch (error) {
      toast.error('Failed to generate keys.');
      console.error(error);
    }
  };

  const handleSignFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setSignFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target?.result;
        if (buffer instanceof ArrayBuffer) {
          setSignFileBuffer(buffer);
          setSignature('');
          toast.success(`File for signing "${selectedFile.name}" loaded.`);
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
    if (signInputType === 'text') {
      if (!signTextInput) {
        toast.error('Input message is required.');
        return;
      }
      dataToSign = new TextEncoder().encode(signTextInput);
    } else {
      if (!signFileBuffer) {
        toast.error('A file must be loaded for signing.');
        return;
      }
      dataToSign = signFileBuffer;
    }
    
    setIsProcessing(true);
    setSignature('');
    try {
      await new Promise(res => setTimeout(res, 500)); // artifical delay
      const privateKeyJwk = JSON.parse(privateKey);
      const key = await window.crypto.subtle.importKey(
        'jwk',
        privateKeyJwk,
        { name: 'RSA-PSS', hash: 'SHA-256' },
        true,
        ['sign']
      );
      const sig = await window.crypto.subtle.sign(
        { name: 'RSA-PSS', saltLength: 32 },
        key,
        dataToSign
      );
      setSignature(arrayBufferToBase64(sig));
      toast.success('Data signed successfully!');
    } catch (error) {
      toast.error('Signing failed. Ensure the private key is correct.');
      console.error(error);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleDownloadSignature = () => {
    if (!signature) {
        toast.error('Nothing to download.');
        return;
    }
    const blob = new Blob([signature], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'signature.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Signature download started.');
  };

  return (
    <>
      <div className="space-y-6 pt-4">
        <div className="flex justify-end">
          <Button onClick={handleGenerateKeys} variant="outline" disabled={isProcessing}>
            <Key className="mr-2" />
            Generate New 2048-bit Key Pair
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="rsa-public-key">Public Key (JWK)</Label>
            <Textarea id="rsa-public-key" placeholder='Your public key in JSON Web Key format...' value={publicKey} onChange={(e) => setPublicKey(e.target.value)} className="min-h-[160px] resize-y font-mono text-xs" disabled={isProcessing}/>
            <Button variant="ghost" size="sm" className="w-fit" onClick={() => handleCopy(publicKey)} disabled={isProcessing}>
                <Copy className="mr-2"/> Copy Public Key
            </Button>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="rsa-private-key">Private Key (JWK)</Label>
            <Textarea id="rsa-private-key" placeholder='Your private key in JSON Web Key format...' value={privateKey} onChange={(e) => setPrivateKey(e.target.value)} className="min-h-[160px] resize-y font-mono text-xs" disabled={isProcessing}/>
            <Button variant="ghost" size="sm" className="w-fit" onClick={() => handleCopy(privateKey)} disabled={isProcessing}>
                <Copy className="mr-2"/> Copy Private Key
            </Button>
          </div>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Digital Signature (RSA-PSS)</CardTitle>
                <CardDescription>Sign data with your private key to prove authenticity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label>Data to Sign</Label>
                    <RadioGroup
                        defaultValue="text"
                        value={signInputType}
                        onValueChange={(value) => {
                            setSignInputType(value as 'text' | 'file');
                            setSignature('');
                        }}
                        className="flex items-center gap-4 py-2"
                        disabled={isProcessing}
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="text" id="rsa-sign-text-type" />
                            <Label htmlFor="rsa-sign-text-type" className="flex items-center cursor-pointer font-normal"><FileText className="mr-2 h-4 w-4" />Text Input</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="file" id="rsa-sign-file-type" />
                            <Label htmlFor="rsa-sign-file-type" className="flex items-center cursor-pointer font-normal"><FileIcon className="mr-2 h-4 w-4" />File Input</Label>
                        </div>
                    </RadioGroup>

                    {signInputType === 'text' ? (
                        <Textarea
                            id="rsa-sign-input"
                            placeholder="The message to sign..."
                            value={signTextInput}
                            onChange={(e) => { setSignTextInput(e.target.value); setSignature(''); }}
                            className="min-h-[120px] resize-y"
                            disabled={isProcessing}
                        />
                    ) : (
                        <div className="grid gap-2">
                            <Input id="rsa-sign-file-input" type="file" onChange={handleSignFileChange} disabled={isProcessing}/>
                            {signFile && <p className="text-sm text-muted-foreground">Selected: {signFile.name} ({(signFile.size / 1024).toFixed(2)} KB)</p>}
                        </div>
                    )}
                </div>
                <Button onClick={handleSign} className="w-full" disabled={isProcessing || !privateKey}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isProcessing ? 'Signing...' : 'Sign with Private Key'}
                </Button>
                {(signature || isProcessing) && (
                    <div className="grid gap-2 pt-4 border-t">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="rsa-signature">Generated Signature (Base64)</Label>
                            <div>
                                <Button variant="ghost" size="icon" onClick={handleDownloadSignature} title="Download Signature" disabled={isProcessing}>
                                    <Download className="w-4 h-4" />
                                    <span className="sr-only">Download</span>
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleCopy(signature)} title="Copy to Clipboard" disabled={isProcessing}>
                                    <Copy className="w-4 h-4" />
                                    <span className="sr-only">Copy</span>
                                </Button>
                            </div>
                        </div>
                        <Textarea id="rsa-signature" readOnly value={isProcessing ? animatedSignature : signature} className="min-h-[80px] resize-y bg-muted/50 font-mono text-xs" />
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
       <p className="text-xs text-muted-foreground w-full text-center pt-6">
        Uses RSA-PSS for signatures with SHA-256. Keys are in JWK format.
      </p>
    </>
  );
}
