import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Copy, RefreshCw, FileText, File as FileIcon, Download, Loader2 } from 'lucide-react';
import content from '@/config/content.json';
import { useCipher, Algorithm } from '@/hooks/useCipher';
import { CipherVisualization } from './CipherVisualization';

interface CipherToolProps {
  mode: 'encrypt' | 'decrypt';
}

export function CipherTool({ mode }: CipherToolProps) {
  const {
    inputType,
    input, setInput,
    file,
    key, setKey,
    algorithm, setAlgorithm,
    output,
    isProcessing,
    showSteps, setShowSteps,
    visualizationSteps,
    handleFileChange,
    handleEncrypt,
    handleDecrypt,
    handleCopy,
    handleDownload,
    handleSwap,
    handleInputTypeChange,
  } = useCipher({ mode });
  
  const [animatedOutput, setAnimatedOutput] = React.useState('');

  React.useEffect(() => {
    if (isProcessing && inputType === 'text' && input && !showSteps) {
      const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const interval = setInterval(() => {
        let result = '';
        for (let i = 0; i < input.length; i++) {
          result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
        }
        setAnimatedOutput(result);
      }, 50);

      return () => clearInterval(interval);
    }
  }, [isProcessing, inputType, input, showSteps]);

  const algorithmData = content.algorithms.find(a => a.value === algorithm);
  const supportsSlowMode = algorithm === 'AES';

  return (
    <>
      <div className="space-y-6 pt-4">
        <div className="grid gap-2">
            <Label>Input</Label>
            <RadioGroup
                defaultValue="text"
                value={inputType}
                onValueChange={(value) => handleInputTypeChange(value as 'text' | 'file')}
                className="flex items-center gap-4 py-2"
                disabled={isProcessing}
            >
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="text" id="cipher-text-type" disabled={isProcessing}/>
                    <Label htmlFor="cipher-text-type" className="flex items-center cursor-pointer font-normal"><FileText className="mr-2 h-4 w-4"/>Text</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="file" id="cipher-file-type" disabled={isProcessing}/>
                    <Label htmlFor="cipher-file-type" className="flex items-center cursor-pointer font-normal"><FileIcon className="mr-2 h-4 w-4"/>File</Label>
                </div>
            </RadioGroup>
            
            {inputType === 'text' ? (
                <Textarea
                    id="input"
                    placeholder="Your secret message or ciphertext..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="min-h-[120px] resize-y"
                    disabled={isProcessing}
                />
            ) : (
                <div className="grid gap-2">
                    <Input id="file-input" type="file" onChange={handleFileChange} key={file?.name || ''} disabled={isProcessing} />
                    {file && <p className="text-sm text-muted-foreground">Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)</p>}
                </div>
            )}
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
                disabled={isProcessing}
            />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="algorithm">Algorithm</Label>
                <Select value={algorithm} onValueChange={(value) => setAlgorithm(value as Algorithm)} disabled={isProcessing}>
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
            </div>
        </div>

        {supportsSlowMode && (
            <div className="flex items-center space-x-2 rounded-lg border p-4">
                <Switch
                    id="slow-mode-switch"
                    checked={showSteps}
                    onCheckedChange={(checked) => {
                        setShowSteps(checked);
                    }}
                    disabled={isProcessing}
                />
                <Label htmlFor="slow-mode-switch" className="flex flex-col">
                    Show Step-by-Step Visualization
                    <span className="text-xs font-normal text-muted-foreground">(Only for AES)</span>
                </Label>
            </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
            {mode === 'encrypt' ? (
                <Button onClick={handleEncrypt} className="flex-1" disabled={isProcessing}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isProcessing ? 'Encrypting...' : 'Encrypt'}
                </Button>
            ) : (
                <Button onClick={handleDecrypt} className="flex-1" variant="secondary" disabled={isProcessing}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isProcessing ? 'Decrypting...' : 'Decrypt'}
                </Button>
            )}
        </div>

        {showSteps && visualizationSteps.length > 0 && (
            <CipherVisualization steps={visualizationSteps} principle={algorithmData?.principle} />
        )}

            <div className="grid gap-2 pt-4">
                <div className="flex justify-between items-center">
                    <Label htmlFor="output">Result</Label>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={handleDownload} title="Download Result" disabled={isProcessing}>
                            <Download className="w-4 h-4" />
                            <span className="sr-only">Download</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleSwap} title="Use as Input" disabled={isProcessing}>
                            <RefreshCw className="w-4 h-4" />
                            <span className="sr-only">Use as Input</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy to Clipboard" disabled={isProcessing}>
                            <Copy className="w-4 h-4" />
                            <span className="sr-only">Copy</span>
                        </Button>
                    </div>
                </div>
                <Textarea
                    id="output"
                    readOnly
                    value={isProcessing && inputType === 'text' && !showSteps ? animatedOutput : output}
                    className="min-h-[120px] resize-y bg-muted/50"
                    placeholder={isProcessing ? (inputType === 'file' ? 'Processing file...' : '...') : 'Encrypted or decrypted output will appear here.'}
                />
            </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground w-full text-center pt-6">{algorithmData?.description}</p>
    </>
  );
}
