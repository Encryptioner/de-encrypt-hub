
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { encrypt, decrypt } from '@/lib/crypto';
import { Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import content from '@/config/content.json';

type Algorithm = 'AES' | 'DES' | 'TripleDES' | 'Rabbit' | 'RC4';

export function EncryptionTool() {
  const [input, setInput] = useState('');
  const [key, setKey] = useState('');
  const [algorithm, setAlgorithm] = useState<Algorithm>('AES');
  const [output, setOutput] = useState('');

  const handleEncrypt = () => {
    if (!input || !key) {
      toast.error('Input message and key cannot be empty.');
      return;
    }
    try {
      const result = encrypt(input, key, algorithm);
      setOutput(result);
      toast.success('Message encrypted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Encryption failed.');
    }
  };

  const handleDecrypt = () => {
    if (!input || !key) {
      toast.error('Input ciphertext and key cannot be empty.');
      return;
    }
    try {
      const result = decrypt(input, key, algorithm);
      setOutput(result);
      toast.success('Ciphertext decrypted successfully!');
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

  const handleSwap = () => {
    if (!output) {
        toast.error('Nothing to use as input.');
        return;
    }
    setInput(output);
    setOutput('');
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl shadow-primary/5 dark:shadow-primary/10">
      <CardHeader>
        <CardTitle className="text-2xl">Encryption Tool</CardTitle>
        <CardDescription>Select an algorithm and enter your message and key.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-2">
          <Label htmlFor="input">Input</Label>
          <Textarea
            id="input"
            placeholder="Your secret message or ciphertext..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[120px] resize-y"
          />
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
            <Button onClick={handleEncrypt} className="flex-1">Encrypt</Button>
            <Button onClick={handleDecrypt} className="flex-1" variant="secondary">Decrypt</Button>
        </div>

        {output && (
            <div className="grid gap-2 pt-4">
            <div className="flex justify-between items-center">
                <Label htmlFor="output">Result</Label>
                <div className="flex gap-2">
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
            />
            </div>
        )}
      </CardContent>
      <CardFooter>
          <p className="text-xs text-muted-foreground w-full text-center">{content.algorithms.find(a => a.value === algorithm)?.description}</p>
      </CardFooter>
    </Card>
  );
}
