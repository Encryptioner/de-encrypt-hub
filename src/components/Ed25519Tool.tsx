
import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Key, FileText, File, Loader2 } from 'lucide-react';
import { Input } from './ui/input';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from './ui/switch';
import { useEd25519 } from '@/hooks/useEd25519';
import { CipherVisualization } from './CipherVisualization';
import content from '@/config/content.json';

export function Ed25519Tool() {
  const {
    publicKey, setPublicKey,
    privateKey, setPrivateKey,
    inputType, setInputType,
    textInput, setTextInput,
    file,
    signature,
    isProcessing,
    animatedSignature,
    showSteps, setShowSteps,
    visualizationSteps,
    handleGenerateKeys,
    handleFileChange,
    handleSign,
    handleCopy,
  } = useEd25519();
  
  return (
    <>
      <div className="space-y-6 pt-4">
        <div className="flex justify-end">
          <Button onClick={handleGenerateKeys} variant="outline" disabled={isProcessing}>
            <Key className="mr-2 h-4 w-4" />
            Generate New Ed25519 Key Pair
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="ed-public-key">Public Key (Base64)</Label>
            <Textarea id="ed-public-key" placeholder='Base64-encoded public key...' value={publicKey} onChange={(e) => setPublicKey(e.target.value)} className="min-h-[120px] resize-y font-mono text-xs" disabled={isProcessing}/>
            <Button variant="ghost" size="sm" className="w-fit" onClick={() => handleCopy(publicKey)} disabled={isProcessing || !publicKey}><Copy className="mr-2 h-4 w-4"/> Copy Public Key</Button>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ed-private-key">Private Key (Base64)</Label>
            <Textarea id="ed-private-key" placeholder='Base64-encoded private key...' value={privateKey} onChange={(e) => setPrivateKey(e.target.value)} className="min-h-[120px] resize-y font-mono text-xs" disabled={isProcessing}/>
            <Button variant="ghost" size="sm" className="w-fit" onClick={() => handleCopy(privateKey)} disabled={isProcessing || !privateKey}><Copy className="mr-2 h-4 w-4"/> Copy Private Key</Button>
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Data to Sign</Label>
           <RadioGroup
                value={inputType}
                onValueChange={(value) => {
                    setInputType(value as 'text' | 'file');
                }}
                className="flex items-center gap-4 py-2"
                disabled={isProcessing}
            >
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="text" id="ed-text-type" />
                    <Label htmlFor="ed-text-type" className="flex items-center cursor-pointer font-normal"><FileText className="mr-2 h-4 w-4" />Text Input</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="file" id="ed-file-type" />
                    <Label htmlFor="ed-file-type" className="flex items-center cursor-pointer font-normal"><File className="mr-2 h-4 w-4" />File Input</Label>
                </div>
            </RadioGroup>
            
            {inputType === 'text' ? (
                <Textarea
                    id="ed-input"
                    placeholder="The message to sign..."
                    value={textInput}
                    onChange={(e) => { setTextInput(e.target.value); }}
                    className="min-h-[100px] resize-y"
                    disabled={isProcessing}
                />
            ) : (
                <div className="grid gap-2">
                    <Input id="ed-file-input" type="file" onChange={handleFileChange} disabled={isProcessing} key={file?.name || ''} />
                    {file && <p className="text-sm text-muted-foreground">Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)</p>}
                </div>
            )}
        </div>
        
        <div className="flex items-center space-x-2 rounded-lg border p-4">
            <Switch id="ed-slow-mode" checked={showSteps} onCheckedChange={setShowSteps} disabled={isProcessing} />
            <Label htmlFor="ed-slow-mode">Show Step-by-Step Visualization</Label>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleSign} className="flex-1" disabled={isProcessing || !privateKey}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isProcessing ? 'Signing...' : 'Sign with Private Key'}
          </Button>
        </div>
        
        {showSteps && visualizationSteps.length > 0 && (
            <div className="pt-4 border-t">
              <CipherVisualization
                steps={visualizationSteps}
                principle={content.ed25519.principle}
              />
            </div>
        )}

        {(signature || (isProcessing && !showSteps)) && (
            <div className="grid gap-2 pt-4 border-t">
                <div className="flex justify-between items-center">
                    <Label htmlFor="ed-signature">Generated Signature (Base64)</Label>
                    <Button variant="ghost" size="icon" onClick={() => handleCopy(signature)} title="Copy to Clipboard" disabled={isProcessing || !signature}>
                        <Copy className="w-4 h-4" />
                        <span className="sr-only">Copy</span>
                    </Button>
                </div>
                <Textarea id="ed-signature" readOnly value={isProcessing && !showSteps ? animatedSignature : signature} className="min-h-[80px] resize-y bg-muted/50 font-mono text-xs" />
            </div>
        )}
        
      </div>
       <p className="text-xs text-muted-foreground w-full text-center pt-6">
        Uses Ed25519 for fast and secure digital signatures. Keys are in Base64 (SPKI/PKCS8).
      </p>
    </>
  );
}
