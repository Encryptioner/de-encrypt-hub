
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { hash, HashAlgorithm } from '@/lib/crypto';
import { Copy, CheckCircle, XCircle } from 'lucide-react';
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
  const [hashToVerify, setHashToVerify] = useState('');
  const [verificationResult, setVerificationResult] = useState<'valid' | 'invalid' | null>(null);

  const handleHash = async () => {
    if (!input) {
      toast.error('Input cannot be empty.');
      return;
    }
    try {
      const result = await hash(input, algorithm);
      setOutput(result);
      setVerificationResult(null); // Reset verification on new hash
      toast.success('Hashed successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Hashing failed.');
    }
  };

  const handleVerify = () => {
    if (!output || !hashToVerify) {
      toast.error('Please generate a hash and provide a hash to verify against.');
      return;
    }
    if (output === hashToVerify) {
      setVerificationResult('valid');
      toast.success('Hashes match!');
    } else {
      setVerificationResult('invalid');
      toast.error('Hashes do not match.');
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
            onChange={(e) => {
              setInput(e.target.value);
              setVerificationResult(null); // Reset verification on input change
            }}
            className="min-h-[120px] resize-y"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4 items-end">
            <div className="grid gap-2">
                <Label htmlFor="hash-algorithm">Algorithm</Label>
                <Select value={algorithm} onValueChange={(value) => setAlgorithm(value as HashAlgorithm)}>
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
            <Button onClick={handleHash} className="w-full">Generate Hash</Button>
        </div>

        {output && (
            <div className="grid gap-2 pt-4">
            <div className="flex justify-between items-center">
                <Label htmlFor="hash-output">Generated Hash</Label>
                  <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy to Clipboard">
                    <Copy className="w-4 h-4" />
                    <span className="sr-only">Copy</span>
                  </Button>
            </div>
            <Textarea
                id="hash-output"
                readOnly
                value={output}
                className="min-h-[80px] resize-y bg-muted/50 font-mono text-sm"
            />
            </div>
        )}

        <div className="grid gap-4 pt-4 border-t">
          <div className="grid gap-2">
            <Label htmlFor="verify-hash">Verify Hash</Label>
            <Input 
              id="verify-hash"
              placeholder="Paste a hash here to verify..."
              value={hashToVerify}
              onChange={(e) => {
                setHashToVerify(e.target.value);
                setVerificationResult(null);
              }}
              className="font-mono text-sm"
            />
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={handleVerify} variant="secondary" className="flex-1">Verify</Button>
            {verificationResult === 'valid' && <CheckCircle className="w-6 h-6 text-green-500" />}
            {verificationResult === 'invalid' && <XCircle className="w-6 h-6 text-destructive" />}
          </div>
        </div>
      </div>
       <p className="text-xs text-muted-foreground w-full text-center pt-6">
        Generate cryptographic hashes. Note that hashing is a one-way process.
      </p>
    </>
  );
}
