
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { FileText, File as FileIcon, Download, Unlock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleDecrypt} className="flex-1" variant="secondary"><Unlock className="mr-2 h-4 w-4"/>Decrypt with Private Key</Button>
        </div>

        {(decryptedData || decryptedFileUrl) && (
          <div className="grid gap-2 pt-4 border-t">
              <div className="flex justify-between items-center">
                <Label>Decrypted Data</Label>
                {decryptedFileUrl && (
                    <Button variant="ghost" size="icon" onClick={() => handleDownloadDecrypted(decryptedFileUrl, `decrypted-${decryptFile?.name || 'file'}`)} title="Download Decrypted File">
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
  );
}
