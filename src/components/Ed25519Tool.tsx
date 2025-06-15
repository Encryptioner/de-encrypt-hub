import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Key, FileText, File, Loader2, Download } from 'lucide-react';
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
    signature, setSignature,
    isProcessing,
    animatedSignature,
    showSteps, setShowSteps,
    visualizationSteps,
    handleGenerateKeys,
    handleFileChange,
    handleSign,
    handleCopy,
    handleVerify,
    processingAction,
    handleDownload,
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
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="w-fit" onClick={() => handleCopy(publicKey)} disabled={isProcessing || !publicKey}><Copy className="mr-2 h-4 w-4"/> Copy Public Key</Button>
              <Button variant="ghost" size="sm" className="w-fit" onClick={() => handleDownload(publicKey, 'ed25519_public_key.txt')} disabled={isProcessing || !publicKey}><Download className="mr-2 h-4 w-4"/> Download Key</Button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ed-private-key">Private Key (Base64)</Label>
            <Textarea id="ed-private-key" placeholder='Base64-encoded private key...' value={privateKey} onChange={(e) => setPrivateKey(e.target.value)} className="min-h-[120px] resize-y font-mono text-xs" disabled={isProcessing}/>
             <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="w-fit" onClick={() => handleCopy(privateKey)} disabled={isProcessing || !privateKey}><Copy className="mr-2 h-4 w-4"/> Copy Private Key</Button>
              <Button variant="ghost" size="sm" className="w-fit" onClick={() => handleDownload(privateKey, 'ed25519_private_key.txt')} disabled={isProcessing || !privateKey}><Download className="mr-2 h-4 w-4"/> Download Key</Button>
            </div>
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
            {isProcessing && processingAction === 'sign' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isProcessing && processingAction === 'sign' ? 'Signing...' : 'Sign with Private Key'}
          </Button>
          <Button onClick={handleVerify} variant="secondary" className="flex-1" disabled={isProcessing || !publicKey || !signature}>
            {isProcessing && processingAction === 'verify' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isProcessing && processingAction === 'verify' ? 'Verifying...' : 'Verify with Public Key'}
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

        <div className="grid gap-2 pt-4 border-t">
            <div className="flex justify-between items-center">
                <Label htmlFor="ed-signature">Signature (Base64)</Label>
                <div className="flex items-center">
                  <Button variant="ghost" size="icon" onClick={() => handleDownload(signature, 'ed25519-signature.txt')} title="Download Signature" disabled={!signature}>
                      <Download className="w-4 h-4" />
                      <span className="sr-only">Download</span>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleCopy(signature)} title="Copy to Clipboard" disabled={!signature}>
                      <Copy className="w-4 h-4" />
                      <span className="sr-only">Copy</span>
                  </Button>
                </div>
            </div>
            <Textarea
              id="ed-signature"
              placeholder="Paste a signature to verify, or see the generated one here."
              value={(isProcessing && processingAction === 'sign' && !showSteps) ? animatedSignature : signature}
              onChange={(e) => setSignature(e.target.value)}
              className="min-h-[80px] resize-y bg-muted/50 font-mono text-xs"
              disabled={isProcessing}
            />
        </div>
        
      </div>
       <p className="text-xs text-muted-foreground w-full text-center pt-6">
        Uses Ed25519 for fast and secure digital signatures. Keys are in Base64 (SPKI/PKCS8).
      </p>
    </>
  );
}
