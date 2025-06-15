
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { Copy, FileText, File as FileIcon, Download, Lock, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [animatedOutput, setAnimatedOutput] = useState('');

  useEffect(() => {
    if (isProcessing) {
      const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      const interval = setInterval(() => {
        let result = '';
        const length = cryptInputType === 'text'
          ? cryptTextInput.length * 1.5
          : cryptFileBuffer ? cryptFileBuffer.byteLength * 1.33 : 200;
        
        const outputLength = Math.min(Math.floor(length), 350);

        for (let i = 0; i < outputLength; i++) {
          result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
        }
        setAnimatedOutput(result);
      }, 50);

      return () => clearInterval(interval);
    }
  }, [isProcessing, cryptInputType, cryptTextInput, cryptFileBuffer]);

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

    setIsProcessing(true);
    setEncryptedData('');

    try {
      await new Promise(res => setTimeout(res, 500));
      const publicKeyJwk = JSON.parse(publicKey);
      const key = await window.crypto.subtle.importKey('jwk', publicKeyJwk, { name: 'RSA-OAEP', hash: 'SHA-256' }, true, ['encrypt']);
      const encrypted = await window.crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, dataToEncrypt);
      setEncryptedData(arrayBufferToBase64(encrypted));
      toast.success('Encryption successful!');
    } catch (error) {
      toast.error('Encryption failed. Ensure the public key is correct.');
      setEncryptedData('');
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
          <RadioGroup
              defaultValue="text"
              value={cryptInputType}
              onValueChange={(value) => setCryptInputType(value as 'text' | 'file')}
              className="flex items-center gap-4 py-2"
              disabled={isProcessing}
          >
              <div className="flex items-center space-x-2">
                  <RadioGroupItem value="text" id="rsa-encrypt-text-type" />
                  <Label htmlFor="rsa-encrypt-text-type" className="flex items-center cursor-pointer font-normal"><FileText className="mr-2 h-4 w-4" />Text Input</Label>
              </div>
              <div className="flex items-center space-x-2">
                  <RadioGroupItem value="file" id="rsa-encrypt-file-type" />
                  <Label htmlFor="rsa-encrypt-file-type" className="flex items-center cursor-pointer font-normal"><FileIcon className="mr-2 h-4 w-4" />File Input</Label>
              </div>
          </RadioGroup>

          {cryptInputType === 'text' ? (
              <Textarea placeholder="Your secret message..." value={cryptTextInput} onChange={(e) => setCryptTextInput(e.target.value)} className="min-h-[120px] resize-y" disabled={isProcessing} />
          ) : (
              <div className="grid gap-2">
                  <Input type="file" onChange={handleCryptFileChange} disabled={isProcessing} />
                  {cryptFile && <p className="text-sm text-muted-foreground">Selected: {cryptFile.name} ({(cryptFile.size / 1024).toFixed(2)} KB)</p>}
              </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleEncrypt} className="flex-1" disabled={isProcessing}>
            {isProcessing ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Encrypting...</>
            ) : (
              <><Lock className="mr-2 h-4 w-4"/>Encrypt with Public Key</>
            )}
          </Button>
        </div>

        {(encryptedData || isProcessing) && (
          <div className="grid gap-2 pt-4 border-t">
              <div className="flex justify-between items-center">
                  <Label htmlFor="rsa-encrypted">Encrypted Data (Base64)</Label>
                  <div>
                      <Button variant="ghost" size="icon" onClick={() => handleDownload(encryptedData, 'encrypted.bin')} title="Download Encrypted Data" disabled={isProcessing}><Download className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleCopy(encryptedData)} title="Copy to Clipboard" disabled={isProcessing}><Copy className="w-4 h-4" /></Button>
                  </div>
              </div>
              <Textarea id="rsa-encrypted" readOnly value={isProcessing ? animatedOutput : encryptedData} className="min-h-[80px] resize-y bg-muted/50 font-mono text-xs" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
