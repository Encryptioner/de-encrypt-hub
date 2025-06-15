
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { hash, HashAlgorithm } from '@/lib/crypto';
import { Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const hashAlgorithms: { name: string; value: HashAlgorithm }[] = [
    { name: 'SHA-256', value: 'SHA-256' },
    { name: 'SHA-512', value: 'SHA-512' },
    { name: 'SHA-1', value: 'SHA-1' },
    { name: 'MD5', value: 'MD5' },
];

export function HashTool() {
  const [input, setInput] = useState('');
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>('SHA-256');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [animatedOutput, setAnimatedOutput] = useState('');

  useEffect(() => {
    if (isProcessing) {
      const randomChars = 'abcdef0123456789';
      let length = 64; // Corresponds to SHA-256
      if (algorithm === 'SHA-512') length = 128;
      if (algorithm === 'SHA-1') length = 40;
      if (algorithm === 'MD5') length = 32;

      const interval = setInterval(() => {
        let result = '';
        for (let i = 0; i < length; i++) {
          result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
        }
        setAnimatedOutput(result);
      }, 50);

      return () => clearInterval(interval);
    }
  }, [isProcessing, algorithm]);

  const handleHash = async () => {
    if (!input) {
      toast.error('Input cannot be empty.');
      return;
    }
    setIsProcessing(true);
    setOutput('');
    try {
      // Artificial delay for animation
      await new Promise(res => setTimeout(res, 500));
      const result = await hash(input, algorithm);
      setOutput(result);
      toast.success('Hashed successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Hashing failed.');
      setOutput('');
    } finally {
      setIsProcessing(false);
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

  return (
    <>
      <div className="space-y-6 pt-4">
        <div className="grid gap-2">
          <Label htmlFor="hash-input">Input Text</Label>
          <Textarea
            id="hash-input"
            placeholder="Your text to hash..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[120px] resize-y"
            disabled={isProcessing}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4 items-end">
            <div className="grid gap-2">
                <Label htmlFor="hash-algorithm">Algorithm</Label>
                <Select value={algorithm} onValueChange={(value) => setAlgorithm(value as HashAlgorithm)} disabled={isProcessing}>
                    <SelectTrigger id="hash-algorithm">
                    <SelectValue placeholder="Select algorithm" />
                    </SelectTrigger>
                    <SelectContent>
                    {hashAlgorithms.map((alg) => (
                        <SelectItem key={alg.value} value={alg.value}>
                        {alg.name}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
            </div>
            <Button onClick={handleHash} className="w-full" disabled={isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isProcessing ? 'Generating...' : 'Generate Hash'}
            </Button>
        </div>

        {(output || isProcessing) && (
            <div className="grid gap-2 pt-4 border-t">
            <div className="flex justify-between items-center">
                <Label htmlFor="hash-output">Generated Hash</Label>
                  <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy to Clipboard" disabled={isProcessing}>
                    <Copy className="w-4 h-4" />
                    <span className="sr-only">Copy</span>
                  </Button>
            </div>
            <Textarea
                id="hash-output"
                readOnly
                value={isProcessing ? animatedOutput : output}
                className="min-h-[80px] resize-y bg-muted/50 font-mono text-sm"
                placeholder={isProcessing ? '...' : ''}
            />
            </div>
        )}
      </div>
       <p className="text-xs text-muted-foreground w-full text-center pt-6">
        Generate cryptographic hashes. Note that hashing is a one-way process.
      </p>
    </>
  );
}
