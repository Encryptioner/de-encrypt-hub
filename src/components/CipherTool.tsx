
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Copy, RefreshCw, FileText, File as FileIcon, Download } from 'lucide-react';
import content from '@/config/content.json';
import { useCipher, Algorithm } from '@/hooks/useCipher';

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
    handleFileChange,
    handleEncrypt,
    handleDecrypt,
    handleCopy,
    handleDownload,
    handleSwap,
    handleInputTypeChange,
  } = useCipher({ mode });

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
            >
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="text" id="cipher-text-type" />
                    <Label htmlFor="cipher-text-type" className="flex items-center cursor-pointer font-normal"><FileText className="mr-2 h-4 w-4"/>Text</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="file" id="cipher-file-type" />
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
                />
            ) : (
                <div className="grid gap-2">
                    <Input id="file-input" type="file" onChange={handleFileChange} key={file?.name || ''} />
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
