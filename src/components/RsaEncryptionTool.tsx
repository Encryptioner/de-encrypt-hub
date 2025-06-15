
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Copy, RefreshCw, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { RsaKeyManager } from './rsa/RsaKeyManager';
import { CipherVisualization } from '@/components/CipherVisualization';
import { useRsa } from '@/hooks/useRsa';
import content from '@/config/content.json';

interface RsaEncryptionToolProps {
  mode: 'encrypt' | 'decrypt';
}

export function RsaEncryptionTool({ mode }: RsaEncryptionToolProps) {
  const {
    publicKey, setPublicKey,
    privateKey, setPrivateKey,
    input, setInput,
    output,
    isProcessing,
    showSteps, setShowSteps,
    visualizationSteps,
    handleGenerateKeys,
    handleEncrypt,
    handleDecrypt,
    handleCopy,
    handleSwap,
  } = useRsa();
  
  const [animatedOutput, setAnimatedOutput] = useState('');

  useEffect(() => {
    if (isProcessing && !showSteps && input) {
      const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      const interval = setInterval(() => {
        let result = '';
        const length = mode === 'encrypt' ? (input.length * 1.5 > 344 ? 344 : input.length * 1.5) : input.length;
        for (let i = 0; i < length; i++) {
          result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
        }
        setAnimatedOutput(result);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isProcessing, showSteps, input, mode]);

  const FormComponent = mode === 'encrypt' ? RsaEncryptForm : RsaDecryptForm;

  return (
    <>
      <div className="space-y-6 pt-4">
        <RsaKeyManager
          publicKey={publicKey}
          privateKey={privateKey}
          onPublicKeyChange={setPublicKey}
          onPrivateKeyChange={setPrivateKey}
          onGenerateKeys={handleGenerateKeys}
        />
        
        <FormComponent
          input={input}
          setInput={setInput}
          output={output}
          isProcessing={isProcessing}
          showSteps={showSteps}
          setShowSteps={setShowSteps}
          visualizationSteps={visualizationSteps}
          handleAction={mode === 'encrypt' ? handleEncrypt : handleDecrypt}
          handleCopy={handleCopy}
          handleSwap={handleSwap}
          animatedOutput={animatedOutput}
        />
      </div>
       <p className="text-xs text-muted-foreground w-full text-center pt-6">
        Uses RSA-OAEP for encryption with SHA-256. Keys are in JWK format.
      </p>
    </>
  );
}

interface FormProps {
  input: string;
  setInput: (val: string) => void;
  output: string;
  isProcessing: boolean;
  showSteps: boolean;
  setShowSteps: (val: boolean) => void;
  visualizationSteps: any[]; // Re-using VisualizationStep type is tricky here
  handleAction: () => void;
  handleCopy: (text: string) => void;
  handleSwap: () => void;
  animatedOutput: string;
}

function RsaEncryptForm({ input, setInput, output, isProcessing, showSteps, setShowSteps, visualizationSteps, handleAction, handleCopy, handleSwap, animatedOutput }: FormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Encrypt with RSA</CardTitle>
        <CardDescription>Use the public key to encrypt your message.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="encrypt-input">Message to Encrypt</Label>
          <Textarea id="encrypt-input" placeholder="Your secret message..." value={input} onChange={(e) => setInput(e.target.value)} disabled={isProcessing} />
        </div>
        <div className="flex items-center space-x-2 rounded-lg border p-4">
          <Switch id="slow-mode-switch" checked={showSteps} onCheckedChange={setShowSteps} disabled={isProcessing} />
          <Label htmlFor="slow-mode-switch">Show Step-by-Step Visualization</Label>
        </div>
        <Button onClick={handleAction} disabled={isProcessing} className="w-full">
          {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isProcessing ? 'Encrypting...' : 'Encrypt'}
        </Button>
        
        {showSteps && visualizationSteps.length > 0 && (
          <CipherVisualization steps={visualizationSteps} principle={content.rsa.principle} />
        )}

        {(output || (isProcessing && !showSteps)) && (
          <div className="grid gap-2 pt-4 border-t">
            <div className="flex justify-between items-center">
              <Label htmlFor="encrypt-output">Encrypted Output (Base64)</Label>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={handleSwap} title="Use as Input for Decryption"><RefreshCw className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleCopy(output)} title="Copy"><Copy className="w-4 h-4" /></Button>
              </div>
            </div>
            <Textarea id="encrypt-output" readOnly value={isProcessing && !showSteps ? animatedOutput : output} className="min-h-[120px] resize-y bg-muted/50 font-mono text-xs" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RsaDecryptForm({ input, setInput, output, isProcessing, showSteps, setShowSteps, visualizationSteps, handleAction, handleCopy, handleSwap, animatedOutput }: FormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Decrypt with RSA</CardTitle>
        <CardDescription>Use the private key to decrypt the ciphertext.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="decrypt-input">Ciphertext to Decrypt (Base64)</Label>
          <Textarea id="decrypt-input" placeholder="Paste your Base64 encoded ciphertext..." value={input} onChange={(e) => setInput(e.target.value)} disabled={isProcessing} className="font-mono text-xs" />
        </div>
        <div className="flex items-center space-x-2 rounded-lg border p-4">
          <Switch id="slow-mode-switch-decrypt" checked={showSteps} onCheckedChange={setShowSteps} disabled={isProcessing} />
          <Label htmlFor="slow-mode-switch-decrypt">Show Step-by-Step Visualization</Label>
        </div>
        <Button onClick={handleAction} disabled={isProcessing} className="w-full" variant="secondary">
          {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isProcessing ? 'Decrypting...' : 'Decrypt'}
        </Button>
        
        {showSteps && visualizationSteps.length > 0 && (
          <CipherVisualization steps={visualizationSteps} principle={content.rsa.principle} />
        )}

        {(output || (isProcessing && !showSteps)) && (
          <div className="grid gap-2 pt-4 border-t">
            <div className="flex justify-between items-center">
              <Label htmlFor="decrypt-output">Decrypted Message</Label>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={handleSwap} title="Use as Input for Encryption"><RefreshCw className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleCopy(output)} title="Copy"><Copy className="w-4 h-4" /></Button>
              </div>
            </div>
            <Textarea id="decrypt-output" readOnly value={isProcessing && !showSteps ? animatedOutput : output} className="min-h-[120px] resize-y bg-muted/50" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
