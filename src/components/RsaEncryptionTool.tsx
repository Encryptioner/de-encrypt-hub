import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { Copy, Key, FileText, File as FileIcon, Download, Lock, Unlock } from 'lucide-react';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { arrayBufferToBase64, base64ToArrayBuffer } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface RsaEncryptionToolProps {
  mode: 'encrypt' | 'decrypt';
}

export function RsaEncryptionTool({ mode }: RsaEncryptionToolProps) {
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  
  const [cryptInputType, setCryptInputType] = useState<'text' | 'file'>('text');
  const [cryptTextInput, setCryptTextInput] = useState('This is a secret message.');
  const [cryptFile, setCryptFile] = useState<globalThis.File | null>(null);
  const [cryptFileBuffer, setCryptFileBuffer] = useState<ArrayBuffer | null>(null);
  const [encryptedData, setEncryptedData] = useState('');
  const [decryptedData, setDecryptedData] = useState('');
  const [decryptedFileUrl, setDecryptedFileUrl] = useState<string | null>(null);

  const [decryptInputType, setDecryptInputType] = useState<'text' | 'file'>('text');
  const [decryptFile, setDecryptFile] = useState<globalThis.File | null>(null);

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
      setEncryptedData('');
      setDecryptedData('');
      setDecryptedFileUrl(null);
      toast.success('RSA key pair generated successfully!');
    } catch (error) {
      toast.error('Failed to generate keys.');
      console.error(error);
    }
  };

  const handleCryptFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setCryptFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target?.result;
        if (buffer instanceof ArrayBuffer) {
          setCryptFileBuffer(buffer);
          setEncryptedData('');
          setDecryptedData('');
          setDecryptedFileUrl(null);
          toast.success(`File for encryption "${selectedFile.name}" loaded.`);
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

  const handleDecryptFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setDecryptFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (typeof content === 'string') {
          setEncryptedData(content);
          setDecryptedData('');
          setDecryptedFileUrl(null);
          toast.success(`File for decryption "${selectedFile.name}" loaded.`);
        } else {
          toast.error("Failed to read file as text.");
        }
      };
      reader.onerror = () => {
        toast.error("Error reading file.");
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleEncrypt = async () => {
    if (!publicKey) {
      toast.error('Public key is required for encryption.');
      return;
    }

    let dataToEncrypt: ArrayBuffer;
    if (cryptInputType === 'text') {
      if (!cryptTextInput) { toast.error('Input message is required.'); return; }
      dataToEncrypt = new TextEncoder().encode(cryptTextInput);
    } else {
      if (!cryptFileBuffer) { toast.error('A file must be loaded for encryption.'); return; }
      dataToEncrypt = cryptFileBuffer;
    }

    try {
      const publicKeyJwk = JSON.parse(publicKey);
      const key = await window.crypto.subtle.importKey('jwk', publicKeyJwk, { name: 'RSA-OAEP', hash: 'SHA-256' }, true, ['encrypt']);
      const encrypted = await window.crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, dataToEncrypt);
      setEncryptedData(arrayBufferToBase64(encrypted));
      setDecryptedData('');
      setDecryptedFileUrl(null);
      toast.success('Encryption successful!');
    } catch (error) {
      toast.error('Encryption failed. Ensure the public key is correct.');
      console.error(error);
    }
  };

  const handleDecrypt = async () => {
    if (!privateKey) { toast.error('Private key is required for decryption.'); return; }
    if (!encryptedData) { toast.error('No encrypted data to decrypt.'); return; }

    try {
      const privateKeyJwk = JSON.parse(privateKey);
      const dataToDecrypt = base64ToArrayBuffer(encryptedData);
      const key = await window.crypto.subtle.importKey('jwk', privateKeyJwk, { name: 'RSA-OAEP', hash: 'SHA-256' }, true, ['decrypt']);
      const decrypted = await window.crypto.subtle.decrypt({ name: 'RSA-OAEP' }, key, dataToDecrypt);
      
      setDecryptedFileUrl(null);
      setDecryptedData('');

      try {
        const text = new TextDecoder('utf-8', { fatal: true }).decode(decrypted);
        setDecryptedData(text);
      } catch (e) {
        const blob = new Blob([decrypted]);
        const url = URL.createObjectURL(blob);
        setDecryptedFileUrl(url);
      }
      toast.success('Decryption successful!');
    } catch (error) {
      toast.error('Decryption failed. Ensure the private key and encrypted data are correct.');
      console.error(error);
    }
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleDownload = (data: string, filename: string) => {
    if (!data) return;
    
    let blob: Blob;
    try {
      const buffer = base64ToArrayBuffer(data);
      blob = new Blob([buffer]);
    } catch (e) {
      blob = new Blob([data], { type: 'text/plain;charset=utf-8' });
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadDecrypted = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
            <Label htmlFor="rsa-public-key-enc">Public Key (JWK)</Label>
            <Textarea id="rsa-public-key-enc" placeholder='Your public key in JSON Web Key format...' value={publicKey} onChange={(e) => setPublicKey(e.target.value)} className="min-h-[160px] resize-y font-mono text-xs" />
            <Button variant="ghost" size="sm" className="w-fit" onClick={() => handleCopy(publicKey)}>
                <Copy className="mr-2"/> Copy Public Key
            </Button>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="rsa-private-key-enc">Private Key (JWK)</Label>
            <Textarea id="rsa-private-key-enc" placeholder='Your private key in JSON Web Key format...' value={privateKey} onChange={(e) => setPrivateKey(e.target.value)} className="min-h-[160px] resize-y font-mono text-xs" />
            <Button variant="ghost" size="sm" className="w-fit" onClick={() => handleCopy(privateKey)}>
                <Copy className="mr-2"/> Copy Private Key
            </Button>
          </div>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Encryption & Decryption (RSA-OAEP)</CardTitle>
                <CardDescription>Encrypt with public key, decrypt with private key for confidentiality.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label>{mode === 'encrypt' ? 'Data to Encrypt' : 'Data to Decrypt'}</Label>
                    {mode === 'encrypt' ? (
                        <Tabs defaultValue="text" className="w-full" onValueChange={(value) => setCryptInputType(value as 'text' | 'file')}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="text"><FileText className="mr-2 h-4 w-4" />Text Input</TabsTrigger>
                                <TabsTrigger value="file"><FileIcon className="mr-2 h-4 w-4" />File Input</TabsTrigger>
                            </TabsList>
                            <TabsContent value="text" className="pt-2">
                                <Textarea placeholder="Your secret message..." value={cryptTextInput} onChange={(e) => setCryptTextInput(e.target.value)} className="min-h-[120px] resize-y" />
                            </TabsContent>
                            <TabsContent value="file" className="pt-2">
                                <div className="grid gap-2">
                                    <Input type="file" onChange={handleCryptFileChange} />
                                    {cryptFile && <p className="text-sm text-muted-foreground">Selected: {cryptFile.name} ({(cryptFile.size / 1024).toFixed(2)} KB)</p>}
                                </div>
                            </TabsContent>
                        </Tabs>
                    ) : (
                        <Tabs defaultValue="text" className="w-full" onValueChange={(value) => setDecryptInputType(value as 'text' | 'file')}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="text"><FileText className="mr-2 h-4 w-4" />Text Input</TabsTrigger>
                                <TabsTrigger value="file"><FileIcon className="mr-2 h-4 w-4" />File Input</TabsTrigger>
                            </TabsList>
                            <TabsContent value="text" className="pt-2">
                                <Textarea id="rsa-encrypted-input" placeholder="Paste your Base64 encrypted data here..." value={encryptedData} onChange={(e) => setEncryptedData(e.target.value)} className="min-h-[80px] resize-y bg-muted/50 font-mono text-xs" />
                            </TabsContent>
                            <TabsContent value="file" className="pt-2">
                                <div className="grid gap-2">
                                    <Input type="file" onChange={handleDecryptFileChange} />
                                    {decryptFile && <p className="text-sm text-muted-foreground">Selected: {decryptFile.name}</p>}
                                </div>
                            </TabsContent>
                        </Tabs>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  {mode === 'encrypt' ? (
                    <Button onClick={handleEncrypt} className="flex-1"><Lock className="mr-2"/>Encrypt with Public Key</Button>
                  ) : (
                    <Button onClick={handleDecrypt} className="flex-1" variant="secondary"><Unlock className="mr-2"/>Decrypt with Private Key</Button>
                  )}
                </div>

                {mode === 'encrypt' && encryptedData && (
                    <div className="grid gap-2 pt-4 border-t">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="rsa-encrypted">Encrypted Data (Base64)</Label>
                            <div>
                                <Button variant="ghost" size="icon" onClick={() => handleDownload(encryptedData, 'encrypted.bin')} title="Download Encrypted Data"><Download className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleCopy(encryptedData)} title="Copy to Clipboard"><Copy className="w-4 h-4" /></Button>
                            </div>
                        </div>
                        <Textarea id="rsa-encrypted" readOnly value={encryptedData} className="min-h-[80px] resize-y bg-muted/50 font-mono text-xs" />
                    </div>
                )}
                
                {mode === 'decrypt' && (decryptedData || decryptedFileUrl) && (
                    <div className="grid gap-2 pt-4 border-t">
                         <div className="flex justify-between items-center">
                            <Label>Decrypted Data</Label>
                            {decryptedFileUrl && (
                                <Button variant="ghost" size="icon" onClick={() => handleDownloadDecrypted(decryptedFileUrl, `decrypted-${cryptFile?.name || 'file'}`)} title="Download Decrypted File">
                                    <Download className="w-4 h-4" />
                                </Button>
                            )}
                         </div>
                         {decryptedData && <Textarea readOnly value={decryptedData} className="min-h-[80px] resize-y bg-muted/50" />}
                         {decryptedFileUrl && <p className="text-sm text-green-600">Decrypted file is ready for download.</p>}
                    </div>
                )}
            </CardContent>
        </Card>

      </div>
       <p className="text-xs text-muted-foreground w-full text-center pt-6">
        Uses RSA-OAEP for encryption with SHA-256. Keys are in JWK format.
      </p>
    </>
  );
}
