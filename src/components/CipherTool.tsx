
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { encrypt, decrypt } from '@/lib/crypto';
import { arrayBufferToBase64, base64ToArrayBuffer } from '@/lib/utils';
import { Copy, RefreshCw, FileText, File as FileIcon, Download } from 'lucide-react';
import { toast } from 'sonner';
import content from '@/config/content.json';

type Algorithm = 'AES' | 'DES' | 'TripleDES' | 'Rabbit' | 'RC4' | 'RC4Drop';

interface CipherToolProps {
  mode: 'encrypt' | 'decrypt';
}

export function CipherTool({ mode }: CipherToolProps) {
  const [inputType, setInputType] = useState<'text' | 'file'>('text');
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [key, setKey] = useState('');
  const [algorithm, setAlgorithm] = useState<Algorithm>('AES');
  const [output, setOutput] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      // We don't set text input here, just hold the file reference
      toast.success(`File "${f.name}" loaded.`);
      setOutput('');
    }
  };
  
  const handleEncrypt = async () => {
    if (!key) {
      toast.error('Secret key cannot be empty.');
      return;
    }
    let dataToEncrypt: string;

    if (inputType === 'text') {
      if (!input) {
        toast.error('Input message cannot be empty.');
        return;
      }
      dataToEncrypt = input;
    } else {
      if (!file) {
        toast.error('A file must be selected for encryption.');
        return;
      }
      const buffer = await file.arrayBuffer();
      dataToEncrypt = arrayBufferToBase64(buffer);
    }
    
    try {
      const result = encrypt(dataToEncrypt, key, algorithm);
      setOutput(result);
      toast.success('Encryption successful!');
    } catch (error: any) {
      toast.error(error.message || 'Encryption failed.');
    }
  };

  const handleDecrypt = () => {
    // Decryption always uses the text input as it contains the ciphertext
    if (!input || !key) {
      toast.error('Input ciphertext and key cannot be empty.');
      return;
    }
    try {
      const result = decrypt(input, key, algorithm);
      setOutput(result);
      toast.success('Decryption successful!');
    } catch (error: any) {
      toast.error(error.message || 'Decryption failed.');
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
    
    let blob: Blob;
    let filename: string;

    try {
      // Assume output is base64 and try to decode
      const buffer = base64ToArrayBuffer(output);
      blob = new Blob([buffer]);
      filename = `decrypted-file${file ? `-${file.name}` : ''}`;
      if (!filename.includes('.')) filename += '.bin'; // Add a generic extension
    } catch (e) {
      // If it fails, treat as plain text
      blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
      filename = 'decrypted-text.txt';
    }

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
    setInputType('text');
    setInput(output);
    setOutput('');
  };

  return (
    <>
      <div className="space-y-6 pt-4">
        <div className="grid gap-2">
            <Label>Input</Label>
            <Tabs defaultValue="text" className="w-full" onValueChange={(value) => {
                setInputType(value as 'text' | 'file');
                setOutput('');
            }}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="text"><FileText className="mr-2 h-4 w-4" />Text</TabsTrigger>
                    <TabsTrigger value="file"><FileIcon className="mr-2 h-4 w-4" />File</TabsTrigger>
                </TabsList>
                <TabsContent value="text" className="pt-2">
                    <Textarea
                        id="input"
                        placeholder="Your secret message or ciphertext..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="min-h-[120px] resize-y"
                    />
                </TabsContent>
                <TabsContent value="file" className="pt-2">
                     <div className="grid gap-2">
                        <Input id="file-input" type="file" onChange={handleFileChange} />
                        {file && <p className="text-sm text-muted-foreground">Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)</p>}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
            <Label htmlFor="key">Secret Key</Label>
            <Input
                id="key"
                type="password"
                placeholder="Your secret key..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
            />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="algorithm">Algorithm</Label>
                <Select value={algorithm} onValueChange={(value) => setAlgorithm(value as Algorithm)}>
                    <SelectTrigger id="algorithm">
                    <SelectValue placeholder="Select algorithm" />
                    </SelectTrigger>
                    <SelectContent>
                    {content.algorithms.map((alg) => (
                        <SelectItem key={alg.value} value={alg.value}>
                        {alg.name}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
            {mode === 'encrypt' ? (
                <Button onClick={handleEncrypt} className="flex-1">Encrypt</Button>
            ) : (
                <Button onClick={handleDecrypt} className="flex-1" variant="secondary">Decrypt</Button>
            )}
        </div>

        {output && (
            <div className="grid gap-2 pt-4">
                <div className="flex justify-between items-center">
                    <Label htmlFor="output">Result</Label>
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
                    id="output"
                    readOnly
                    value={output}
                    className="min-h-[120px] resize-y bg-muted/50"
                    placeholder="Encrypted or decrypted output will appear here."
                />
            </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground w-full text-center pt-6">{content.algorithms.find(a => a.value === algorithm)?.description}</p>
    </>
  );
}
