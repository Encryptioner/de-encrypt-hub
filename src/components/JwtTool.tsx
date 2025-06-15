import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { EncryptJWT, jwtDecrypt } from 'jose';
import { Copy, RefreshCw, Download, FileText, File as FileIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

/**
 * Derives a 256-bit key from a secret string using SHA-256.
 * This is used to ensure the key is the correct length for A256GCM.
 */
const getDerivedKey = async (secret: string): Promise<Uint8Array> => {
  const secretKeyMaterial = new TextEncoder().encode(secret);
  const secretHash = await crypto.subtle.digest('SHA-256', secretKeyMaterial);
  return new Uint8Array(secretHash);
};

interface JwtToolProps {
  mode: 'encrypt' | 'decrypt';
}

export function JwtTool({ mode }: JwtToolProps) {
  const [input, setInput] = useState(mode === 'encrypt' ? '{\n  "message": "Hello from Lovable!"\n}' : '');
  const [secret, setSecret] = useState('');
  const [output, setOutput] = useState('');
  const [decryptInputType, setDecryptInputType] = useState<'text' | 'file'>('text');
  const [decryptFile, setDecryptFile] = useState<globalThis.File | null>(null);

  const handleEncrypt = async () => {
    if (!input || !secret) {
      toast.error('Payload and secret key cannot be empty.');
      return;
    }
    let payload;
    try {
      payload = JSON.parse(input);
    } catch (e) {
      toast.error('Invalid JSON payload.');
      return;
    }

    try {
      const derivedKey = await getDerivedKey(secret);
      const jwe = await new EncryptJWT(payload)
        .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
        .setIssuedAt()
        .encrypt(derivedKey);
      
      setOutput(jwe);
      toast.success('Payload encrypted successfully as JWT!');
    } catch (error: any) {
      toast.error(error.message || 'JWT encryption failed.');
    }
  };

  const handleDecrypt = async () => {
    if (!input || !secret) {
      toast.error('JWT and secret key cannot be empty.');
      return;
    }
    try {
      const derivedKey = await getDerivedKey(secret);
      const { payload } = await jwtDecrypt(input, derivedKey);
      setOutput(JSON.stringify(payload, null, 2));
      toast.success('JWT decrypted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'JWT decryption failed.');
    }
  };
  
  const handleCopy = () => {
    if (!output) {
      toast.error('Nothing to copy.');
      return;
    }
    navigator.clipboard.writeText(output);
    toast.success('Result copied to clipboard!');
  };

  const handleDownload = () => {
    if (!output) {
      toast.error('Nothing to download.');
      return;
    }
    
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const filename = mode === 'encrypt' ? 'encrypted.jwt' : 'decrypted.json';

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Download started.');
  };

  const handleSwap = () => {
    if (!output) {
        toast.error('Nothing to use as input.');
        return;
    }
    setInput(output);
    setOutput('');
  }

  const handleDecryptFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
        setDecryptFile(selectedFile);
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            if (typeof content === 'string') {
                setInput(content);
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

  return (
    <>
      <div className="space-y-6 pt-4">
        <div className="grid gap-2">
          <Label htmlFor="jwt-input">{mode === 'encrypt' ? 'Payload (JSON)' : 'JWT Token'}</Label>
          {mode === 'encrypt' ? (
            <Textarea
              id="jwt-input"
              placeholder='{ "data": "your_json_payload" }'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[120px] resize-y"
            />
          ) : (
            <Tabs defaultValue="text" className="w-full" onValueChange={(value) => setDecryptInputType(value as 'text' | 'file')}>
              <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text"><FileText className="mr-2 h-4 w-4" />Text Input</TabsTrigger>
                  <TabsTrigger value="file"><FileIcon className="mr-2 h-4 w-4" />File Input</TabsTrigger>
              </TabsList>
              <TabsContent value="text" className="pt-2">
                <Textarea
                  id="jwt-input"
                  placeholder='Paste your JWT token here...'
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="min-h-[120px] resize-y font-mono text-sm"
                />
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
        <div className="grid gap-2">
          <Label htmlFor="jwt-key">Secret Key</Label>
          <Input
              id="jwt-key"
              type="password"
              placeholder="Your secret key..."
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
            {mode === 'encrypt' ? (
              <Button onClick={handleEncrypt} className="flex-1">Encrypt JWT</Button>
            ) : (
              <Button onClick={handleDecrypt} className="flex-1" variant="secondary">Decrypt JWT</Button>
            )}
        </div>

        {output && (
            <div className="grid gap-2 pt-4">
            <div className="flex justify-between items-center">
                <Label htmlFor="jwt-output">Result</Label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={handleDownload} title="Download Result">
                    <Download className="w-4 h-4" />
                    <span className="sr-only">Download</span>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleSwap} title="Use as Input">
                    <RefreshCw className="w-4 h-4" />
                    <span className="sr-only">Use as Input</span>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy to Clipboard">
                    <Copy className="w-4 h-4" />
                    <span className="sr-only">Copy</span>
                  </Button>
                </div>
            </div>
            <Textarea
                id="jwt-output"
                readOnly
                value={output}
                className="min-h-[120px] resize-y bg-muted/50 font-mono text-sm"
            />
            </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground w-full text-center pt-6">
        Uses JWT (JWE) with `dir` and `A256GCM` for encryption. The secret key is hashed with SHA-256 to produce the encryption key.
      </p>
    </>
  );
}
