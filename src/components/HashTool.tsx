import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type HashAlgorithm } from '@/lib/crypto';
import { Copy, Loader2 } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { useHash } from '@/hooks/useHash';
import { CipherVisualization } from './CipherVisualization';
import content from '@/config/content.json';

const hashAlgorithms: { name: string; value: HashAlgorithm }[] = [
    { name: 'SHA-256', value: 'SHA-256' },
    { name: 'SHA-512', value: 'SHA-512' },
    { name: 'SHA-1', value: 'SHA-1' },
    { name: 'MD5', value: 'MD5' },
];

export function HashTool() {
  const {
    input, setInput,
    algorithm, setAlgorithm,
    output,
    isProcessing,
    animatedOutput,
    showSteps, setShowSteps,
    visualizationSteps,
    handleHash,
    handleCopy,
  } = useHash();

  const principle = (content.hashing as Record<string, string>)[algorithm] || content.hashing.generic;

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

        <div className="flex items-center space-x-2 rounded-lg border p-4">
            <Switch
                id="slow-mode-switch"
                checked={showSteps}
                onCheckedChange={setShowSteps}
                disabled={isProcessing}
            />
            <Label htmlFor="slow-mode-switch">Show Step-by-Step Visualization</Label>
        </div>

        <Button onClick={handleHash} className="w-full" disabled={isProcessing || !input}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isProcessing ? 'Generating...' : 'Generate Hash'}
        </Button>

        {showSteps && visualizationSteps.length > 0 && (
            <CipherVisualization
              steps={visualizationSteps}
              principle={principle}
            />
        )}

        {(output || (isProcessing && !showSteps)) && (
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
                value={isProcessing && !showSteps ? animatedOutput : output}
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
