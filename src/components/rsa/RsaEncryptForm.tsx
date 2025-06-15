
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { Copy, FileText, File as FileIcon, Download, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { arrayBufferToBase64, base64ToArrayBuffer } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface RsaEncryptFormProps {
  publicKey: string;
}

export function RsaEncryptForm({ publicKey }: RsaEncryptFormProps) {
  const [cryptInputType, setCryptInputType] = useState<'text' | 'file'>('text');
  const [cryptTextInput, setCryptTextInput] = useState('This is a secret message.');
  const [cryptFile, setCryptFile] = useState<File | null>(null);
  const [cryptFileBuffer, setCryptFileBuffer] = useState<ArrayBuffer | null>(null);
  const [encryptedData, setEncryptedData] = useState('');

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
      toast.success('Encryption successful!');
    } catch (error) {
      toast.error('Encryption failed. Ensure the public key is correct.');
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Encryption (RSA-OAEP)</CardTitle>
        <CardDescription>Encrypt with public key for confidentiality.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label>Data to Encrypt</Label>
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
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleEncrypt} className="flex-1"><Lock className="mr-2 h-4 w-4"/>Encrypt with Public Key</Button>
        </div>

        {encryptedData && (
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
      </CardContent>
    </Card>
  );
}
