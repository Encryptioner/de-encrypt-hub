
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { FileText, File as FileIcon, Download, Unlock, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { base64ToArrayBuffer } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface RsaDecryptFormProps {
  privateKey: string;
}

export function RsaDecryptForm({ privateKey }: RsaDecryptFormProps) {
  const [encryptedData, setEncryptedData] = useState('');
  const [decryptedData, setDecryptedData] = useState('');
  const [decryptedFileUrl, setDecryptedFileUrl] = useState<string | null>(null);

  const [decryptInputType, setDecryptInputType] = useState<'text' | 'file'>('text');
  const [decryptFile, setDecryptFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [animatedOutput, setAnimatedOutput] = useState('');

  useEffect(() => {
    if (isProcessing) {
      const randomChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,."\':;';
      const interval = setInterval(() => {
        let result = '';
        const length = Math.min(Math.floor(encryptedData.length * 0.75), 350);

        for (let i = 0; i < length; i++) {
          result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
        }
        setAnimatedOutput(result);
      }, 50);

      return () => clearInterval(interval);
    }
  }, [isProcessing, encryptedData]);

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
  
  const handleDecrypt = async () => {
    if (!privateKey) { toast.error('Private key is required for decryption.'); return; }
    if (!encryptedData) { toast.error('No encrypted data to decrypt.'); return; }

    setIsProcessing(true);
    setDecryptedData('');
    setDecryptedFileUrl(null);

    try {
      await new Promise(res => setTimeout(res, 500));
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
    } finally {
      setIsProcessing(false);
    }
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
    <Card>
      <CardHeader>
        <CardTitle>Decryption (RSA-OAEP)</CardTitle>
        <CardDescription>Decrypt with private key for confidentiality.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label>Data to Decrypt</Label>
           <RadioGroup
                defaultValue="text"
                value={decryptInputType}
                onValueChange={(value) => setDecryptInputType(value as 'text' | 'file')}
                className="flex items-center gap-4 py-2"
                disabled={isProcessing}
            >
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="text" id="rsa-decrypt-text-type" />
                    <Label htmlFor="rsa-decrypt-text-type" className="flex items-center cursor-pointer font-normal"><FileText className="mr-2 h-4 w-4" />Text Input</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="file" id="rsa-decrypt-file-type" />
                    <Label htmlFor="rsa-decrypt-file-type" className="flex items-center cursor-pointer font-normal"><FileIcon className="mr-2 h-4 w-4" />File Input</Label>
                </div>
            </RadioGroup>

            {decryptInputType === 'text' ? (
                <Textarea id="rsa-encrypted-input" placeholder="Paste your Base64 encrypted data here..." value={encryptedData} onChange={(e) => setEncryptedData(e.target.value)} className="min-h-[80px] resize-y bg-muted/50 font-mono text-xs" disabled={isProcessing}/>
            ) : (
                <div className="grid gap-2">
                    <Input type="file" onChange={handleDecryptFileChange} disabled={isProcessing}/>
                    {decryptFile && <p className="text-sm text-muted-foreground">Selected: {decryptFile.name}</p>}
                </div>
            )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleDecrypt} className="flex-1" variant="secondary" disabled={isProcessing}>
            {isProcessing ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Decrypting...</>
            ) : (
              <><Unlock className="mr-2 h-4 w-4"/>Decrypt with Private Key</>
            )}
          </Button>
        </div>

        {(decryptedData || decryptedFileUrl || isProcessing) && (
          <div className="grid gap-2 pt-4 border-t">
              <div className="flex justify-between items-center">
                <Label>Decrypted Data</Label>
                {decryptedFileUrl && !isProcessing && (
                    <Button variant="ghost" size="icon" onClick={() => handleDownloadDecrypted(decryptedFileUrl, `decrypted-${decryptFile?.name || 'file'}`)} title="Download Decrypted File">
                        <Download className="w-4 h-4" />
                    </Button>
                )}
              </div>
              
              {isProcessing ? (
                <Textarea readOnly value={animatedOutput} className="min-h-[80px] resize-y bg-muted/50 font-mono text-xs" />
              ) : (
                <>
                  {decryptedData && <Textarea readOnly value={decryptedData} className="min-h-[80px] resize-y bg-muted/50" />}
                  {decryptedFileUrl && <p className="text-sm text-green-600">Decrypted file is ready for download.</p>}
                </>
              )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
