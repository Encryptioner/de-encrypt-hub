import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Key, FileText, File as FileIcon, Download, Loader2 } from 'lucide-react';
import { Input } from './ui/input';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from './ui/switch';
import { CipherVisualization } from './CipherVisualization';
import content from '@/config/content.json';
import { useRsaSign } from '@/hooks/useRsaSign';


export function RsaTool() {
  const {
    publicKey, setPublicKey,
    privateKey, setPrivateKey,
    signInputType, setSignInputType,
    signTextInput, setSignTextInput,
    signFile,
    signature, setSignature,
    isProcessing,
    processingAction,
    animatedSignature,
    showSteps, setShowSteps,
    visualizationSteps,
    handleGenerateKeys,
    handleSignFileChange,
    handleSign,
    handleVerify,
    handleCopy,
    handleDownloadSignature,
  } = useRsaSign();

  const isSignDisabled = isProcessing || !privateKey || (signInputType === 'text' && !signTextInput) || (signInputType === 'file' && !signFile);
  const isVerifyDisabled = isProcessing || !publicKey || !signature || (signInputType === 'text' && !signTextInput) || (signInputType === 'file' && !signFile);

  return (
    <>
      <div className="space-y-6 pt-4">
        <div className="flex justify-end">
          <Button onClick={handleGenerateKeys} variant="outline" disabled={isProcessing}>
            <Key className="mr-2" />
            Generate New 2048-bit Key Pair
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="rsa-public-key">Public Key (JWK)</Label>
            <Textarea id="rsa-public-key" placeholder='Your public key in JSON Web Key format...' value={publicKey} onChange={(e) => setPublicKey(e.target.value)} className="min-h-[160px] resize-y font-mono text-xs" disabled={isProcessing}/>
            <Button variant="ghost" size="sm" className="w-fit" onClick={() => handleCopy(publicKey)} disabled={isProcessing}>
                <Copy className="mr-2"/> Copy Public Key
            </Button>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="rsa-private-key">Private Key (JWK)</Label>
            <Textarea id="rsa-private-key" placeholder='Your private key in JSON Web Key format...' value={privateKey} onChange={(e) => setPrivateKey(e.target.value)} className="min-h-[160px] resize-y font-mono text-xs" disabled={isProcessing}/>
            <Button variant="ghost" size="sm" className="w-fit" onClick={() => handleCopy(privateKey)} disabled={isProcessing}>
                <Copy className="mr-2"/> Copy Private Key
            </Button>
          </div>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Digital Signature (RSA-PSS)</CardTitle>
                <CardDescription>Sign data with your private key to prove authenticity and verify with the public key.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label>Data to Sign</Label>
                    <RadioGroup
                        defaultValue="text"
                        value={signInputType}
                        onValueChange={(value) => {
                            setSignInputType(value as 'text' | 'file');
                            setSignature('');
                        }}
                        className="flex items-center gap-4 py-2"
                        disabled={isProcessing}
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="text" id="rsa-sign-text-type" />
                            <Label htmlFor="rsa-sign-text-type" className="flex items-center cursor-pointer font-normal"><FileText className="mr-2 h-4 w-4" />Text Input</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="file" id="rsa-sign-file-type" />
                            <Label htmlFor="rsa-sign-file-type" className="flex items-center cursor-pointer font-normal"><FileIcon className="mr-2 h-4 w-4" />File Input</Label>
                        </div>
                    </RadioGroup>

                    {signInputType === 'text' ? (
                        <Textarea
                            id="rsa-sign-input"
                            placeholder="The message to sign..."
                            value={signTextInput}
                            onChange={(e) => { setSignTextInput(e.target.value); setSignature(''); }}
                            className="min-h-[120px] resize-y"
                            disabled={isProcessing}
                        />
                    ) : (
                        <div className="grid gap-2">
                            <Input id="rsa-sign-file-input" type="file" onChange={handleSignFileChange} disabled={isProcessing}/>
                            {signFile && <p className="text-sm text-muted-foreground">Selected: {signFile.name} ({(signFile.size / 1024).toFixed(2)} KB)</p>}
                        </div>
                    )}
                </div>

                <div className="flex items-center space-x-2 rounded-lg border p-4">
                    <Switch id="rsa-slow-mode" checked={showSteps} onCheckedChange={setShowSteps} disabled={isProcessing} />
                    <Label htmlFor="rsa-slow-mode">Show Step-by-Step Visualization</Label>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button onClick={handleSign} className="flex-1" disabled={isSignDisabled}>
                    {isProcessing && processingAction === 'sign' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isProcessing && processingAction === 'sign' ? 'Signing...' : 'Sign with Private Key'}
                  </Button>
                  <Button onClick={handleVerify} variant="secondary" className="flex-1" disabled={isVerifyDisabled}>
                    {isProcessing && processingAction === 'verify' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isProcessing && processingAction === 'verify' ? 'Verifying...' : 'Verify with Public Key'}
                  </Button>
                </div>

                {showSteps && visualizationSteps.length > 0 && (
                  <div className="pt-4 border-t">
                    <CipherVisualization
                      steps={visualizationSteps}
                      principle={content['rsa-pss'].principle}
                    />
                  </div>
                )}

                <div className="grid gap-2 pt-4 border-t">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="rsa-signature">Signature (Base64)</Label>
                        <div>
                            <Button variant="ghost" size="icon" onClick={handleDownloadSignature} title="Download Signature" disabled={!signature}>
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
                      id="rsa-signature"
                      placeholder="Paste a signature to verify, or see the generated one here."
                      value={(isProcessing && processingAction === 'sign' && !showSteps) ? animatedSignature : signature}
                      onChange={(e) => setSignature(e.target.value)}
                      className="min-h-[80px] resize-y bg-muted/50 font-mono text-xs"
                      disabled={isProcessing}
                    />
                </div>
            </CardContent>
        </Card>
      </div>
       <p className="text-xs text-muted-foreground w-full text-center pt-6">
        Uses RSA-PSS for signatures with SHA-256. Keys are in JWK format.
      </p>
    </>
  );
}
