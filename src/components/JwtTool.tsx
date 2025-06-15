import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { EncryptJWT, jwtDecrypt } from 'jose';
import { Copy, RefreshCw, Download, FileText, File as FileIcon, Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Switch } from './ui/switch';
import { CipherVisualization } from './CipherVisualization';
import { type VisualizationStep } from '@/hooks/useCipher';
import content from '@/config/content.json';

/**
 * Derives a 256-bit key from a secret string using SHA-256.
 * This is used to ensure the key is the correct length for A256GCM.
 */
const getDerivedKey = async (secret: string): Promise<Uint8Array> => {
  const secretKeyMaterial = new TextEncoder().encode(secret);
  const secretHash = await crypto.subtle.digest('SHA-256', secretKeyMaterial);
  return new Uint8Array(secretHash);
};

interface JwtToolProps {
  mode: 'encrypt' | 'decrypt';
}

export function JwtTool({ mode }: JwtToolProps) {
  const [input, setInput] = React.useState(mode === 'encrypt' ? '{\n  "message": "Hello from Lovable!"\n}' : '');
  const [secret, setSecret] = React.useState('');
  const [output, setOutput] = React.useState('');
  const [decryptInputType, setDecryptInputType] = React.useState<'text' | 'file'>('text');
  const [decryptFile, setDecryptFile] = React.useState<globalThis.File | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [animatedOutput, setAnimatedOutput] = React.useState('');
  const [showSteps, setShowSteps] = React.useState(false);
  const [visualizationSteps, setVisualizationSteps] = React.useState<VisualizationStep[]>([]);

  React.useEffect(() => {
    if (isProcessing && input && !showSteps) {
      const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._-';
      const interval = setInterval(() => {
        let result = '';
        const length = mode === 'encrypt' ? JSON.stringify(JSON.parse(input)).length * 1.5 : input.length;
        for (let i = 0; i < length; i++) {
          result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
        }
        setAnimatedOutput(result);
      }, 50);

      return () => clearInterval(interval);
    }
  }, [isProcessing, input, mode, showSteps]);

  const runSlowEncrypt = async () => {
    if (!input || !secret) {
      toast.error('Payload and secret key cannot be empty.');
      return;
    }
    let payload;
    try { payload = JSON.parse(input); } catch (e) { toast.error('Invalid JSON payload.'); return; }
    
    setIsProcessing(true);
    setOutput('');
    setVisualizationSteps([]);

    const steps = [
        { title: '1. Prepare JWE Header', explanation: 'A standard header is created specifying the encryption algorithm (`dir` for direct key usage) and content encryption method (`A256GCM`). This part is not secret and is encoded in Base64.' },
        { title: '2. Derive Encryption Key', explanation: 'The provided secret is securely hashed using SHA-256 to create a 256-bit key. This derived key is what actually encrypts the data. It ensures your original secret is never used directly and the key is the correct size.' },
        { title: '3. Encrypt Payload', explanation: 'The JSON payload is encrypted using the derived key and the A256GCM algorithm. This turns your readable data into unreadable ciphertext.' },
        { title: '4. Assemble JWE', explanation: 'The Base64-encoded header, encrypted key (empty for `dir`), initialization vector (IV), ciphertext, and authentication tag are combined into the final compact JWE string.' }
    ];

    const initialSteps: VisualizationStep[] = steps.map(s => ({ ...s, data: '', status: 'pending' }));
    setVisualizationSteps(initialSteps);

    try {
        const header = { alg: 'dir', enc: 'A256GCM' };
        // Step 1
        await new Promise(res => setTimeout(res, 100));
        setVisualizationSteps(prev => prev.map((s, i) => i === 0 ? { ...s, status: 'processing' } : s));
        await new Promise(res => setTimeout(res, 800));
        setVisualizationSteps(prev => prev.map((s, i) => i === 0 ? { ...s, status: 'done', data: JSON.stringify(header, null, 2) } : s));

        // Step 2
        await new Promise(res => setTimeout(res, 100));
        setVisualizationSteps(prev => prev.map((s, i) => i === 1 ? { ...s, status: 'processing' } : s));
        const derivedKey = await getDerivedKey(secret);
        await new Promise(res => setTimeout(res, 800));
        setVisualizationSteps(prev => prev.map((s, i) => i === 1 ? { ...s, status: 'done', data: 'Key derived successfully (not displayed for security).' } : s));

        // Step 3
        await new Promise(res => setTimeout(res, 100));
        setVisualizationSteps(prev => prev.map((s, i) => i === 2 ? { ...s, status: 'processing' } : s));
        await new Promise(res => setTimeout(res, 800));
        const payloadSnippet = `Payload: ${input.substring(0, 100)}${input.length > 100 ? '...' : ''}`;
        setVisualizationSteps(prev => prev.map((s, i) => i === 2 ? { ...s, status: 'done', data: `${payloadSnippet}\nPayload is now encrypted.` } : s));
        
        // Step 4
        await new Promise(res => setTimeout(res, 100));
        setVisualizationSteps(prev => prev.map((s, i) => i === 3 ? { ...s, status: 'processing' } : s));
        const jwe = await new EncryptJWT(payload).setProtectedHeader(header).setIssuedAt().encrypt(derivedKey);
        await new Promise(res => setTimeout(res, 500));
        setVisualizationSteps(prev => prev.map((s, i) => i === 3 ? { ...s, status: 'done', data: jwe } : s));
        
        setOutput(jwe);
        toast.success('Slow-mode JWT encryption complete!');
    } catch (e: any) {
        toast.error(e.message || 'JWT encryption failed.');
        setVisualizationSteps(prev => prev.map(s => ({...s, status: 'done', data: s.data || 'Error!'})));
    } finally {
        setIsProcessing(false);
    }
  };

  const runSlowDecrypt = async () => {
    if (!input || !secret) {
      toast.error('JWT and secret key cannot be empty.');
      return;
    }
    setIsProcessing(true);
    setOutput('');
    setVisualizationSteps([]);

    const steps = [
        { title: '1. Parse JWE', explanation: 'The JWE string is split into its components: header, IV, ciphertext, and tag.'},
        { title: '2. Derive Decryption Key', explanation: 'The exact same secret key is used to derive the exact same 256-bit key via SHA-256. If the secret is even one character off, the derived key will be completely different, and decryption will fail.' },
        { title: '3. Decrypt Ciphertext', explanation: 'The derived key and IV are used with the A256GCM algorithm to decrypt the ciphertext. The authentication tag is checked to ensure the data was not tampered with.' },
        { title: '4. Recovered Payload', explanation: 'If the key is correct and the data is authentic, the original JSON payload is successfully recovered.' }
    ];
    
    const initialSteps: VisualizationStep[] = steps.map(s => ({ ...s, data: '', status: 'pending' }));
    setVisualizationSteps(initialSteps);

    try {
        // Step 1
        await new Promise(res => setTimeout(res, 100));
        setVisualizationSteps(prev => prev.map((s, i) => i === 0 ? { ...s, status: 'processing' } : s));
        await new Promise(res => setTimeout(res, 800));
        setVisualizationSteps(prev => prev.map((s, i) => i === 0 ? { ...s, status: 'done', data: `JWE to decrypt: ${input.substring(0,60)}...` } : s));

        // Step 2
        await new Promise(res => setTimeout(res, 100));
        setVisualizationSteps(prev => prev.map((s, i) => i === 1 ? { ...s, status: 'processing' } : s));
        const derivedKey = await getDerivedKey(secret);
        await new Promise(res => setTimeout(res, 800));
        setVisualizationSteps(prev => prev.map((s, i) => i === 1 ? { ...s, status: 'done', data: 'Key derived successfully (not displayed for security).' } : s));

        // Step 3 & 4
        await new Promise(res => setTimeout(res, 100));
        setVisualizationSteps(prev => prev.map((s, i) => (i === 2 || i === 3) ? { ...s, status: 'processing' } : s));
        
        const { payload } = await jwtDecrypt(input, derivedKey);
        const result = JSON.stringify(payload, null, 2);

        await new Promise(res => setTimeout(res, 800));
        setVisualizationSteps(prev => prev.map((s, i) => i === 2 ? { ...s, status: 'done', data: 'Ciphertext decrypted and verified.' } : s));
        
        await new Promise(res => setTimeout(res, 500));
        setVisualizationSteps(prev => prev.map((s, i) => i === 3 ? { ...s, status: 'done', data: result } : s));
        setOutput(result);
        toast.success('Slow-mode JWT decryption complete!');

    } catch (e: any) {
        toast.error(e.message || 'JWT decryption failed.');
        setVisualizationSteps(prev => prev.map(s => ({...s, status: 'done', data: s.data || 'Error!'})));
    } finally {
        setIsProcessing(false);
    }
  };

  const handleEncrypt = async () => {
    if (showSteps) {
        runSlowEncrypt();
        return;
    }
    if (!input || !secret) {
      toast.error('Payload and secret key cannot be empty.');
      return;
    }
    let payload;
    try {
      payload = JSON.parse(input);
    } catch (e) {
      toast.error('Invalid JSON payload.');
      return;
    }

    setIsProcessing(true);
    setOutput('');
    try {
      // Artificial delay for animation
      await new Promise(res => setTimeout(res, 500));
      const derivedKey = await getDerivedKey(secret);
      const jwe = await new EncryptJWT(payload)
        .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
        .setIssuedAt()
        .encrypt(derivedKey);
      
      setOutput(jwe);
      toast.success('Payload encrypted successfully as JWT!');
    } catch (error: any) {
      toast.error(error.message || 'JWT encryption failed.');
      setOutput('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecrypt = async () => {
    if (showSteps) {
        runSlowDecrypt();
        return;
    }
    if (!input || !secret) {
      toast.error('JWT and secret key cannot be empty.');
      return;
    }
    setIsProcessing(true);
    setOutput('');
    try {
      // Artificial delay for animation
      await new Promise(res => setTimeout(res, 500));
      const derivedKey = await getDerivedKey(secret);
      const { payload } = await jwtDecrypt(input, derivedKey);
      setOutput(JSON.stringify(payload, null, 2));
      toast.success('JWT decrypted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'JWT decryption failed.');
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

  const handleDownload = () => {
    if (!output) {
      toast.error('Nothing to download.');
      return;
    }
    
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const filename = mode === 'encrypt' ? 'encrypted.jwt' : 'decrypted.json';

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Download started.');
  };

  const handleSwap = () => {
    if (!output) {
        toast.error('Nothing to use as input.');
        return;
    }
    setInput(output);
    setOutput('');
  }

  const handleDecryptFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
        setDecryptFile(selectedFile);
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            if (typeof content === 'string') {
                setInput(content);
                toast.success(`File for decryption "${selectedFile.name}" loaded.`);
            } else {
                toast.error("Failed to read file as text.");
            }
        };
        reader.onerror = () => {
            toast.error("Error reading file.");
        };
        reader.readAsText(selectedFile);
    }
  };

  return (
    <>
      <div className="space-y-6 pt-4">
        <div className="grid gap-2">
          <Label htmlFor="jwt-input">{mode === 'encrypt' ? 'Payload (JSON)' : 'JWT Token'}</Label>
          {mode === 'encrypt' ? (
            <Textarea
              id="jwt-input"
              placeholder='{ "data": "your_json_payload" }'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[120px] resize-y"
              disabled={isProcessing}
            />
          ) : (
             <div className="space-y-2">
                <RadioGroup
                    defaultValue="text"
                    value={decryptInputType}
                    onValueChange={(value) => setDecryptInputType(value as 'text' | 'file')}
                    className="flex items-center gap-4 py-2"
                    disabled={isProcessing}
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="text" id="jwt-text-type" />
                        <Label htmlFor="jwt-text-type" className="flex items-center cursor-pointer font-normal"><FileText className="mr-2 h-4 w-4" />Text Input</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="file" id="jwt-file-type" />
                        <Label htmlFor="jwt-file-type" className="flex items-center cursor-pointer font-normal"><FileIcon className="mr-2 h-4 w-4" />File Input</Label>
                    </div>
                </RadioGroup>
                
                {decryptInputType === 'text' ? (
                    <Textarea
                      id="jwt-input"
                      placeholder='Paste your JWT token here...'
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="min-h-[120px] resize-y font-mono text-sm"
                      disabled={isProcessing}
                    />
                ) : (
                    <div className="grid gap-2">
                        <Input type="file" onChange={handleDecryptFileChange} disabled={isProcessing} />
                        {decryptFile && <p className="text-sm text-muted-foreground">Selected: {decryptFile.name}</p>}
                    </div>
                )}
            </div>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="jwt-key">Secret Key</Label>
          <Input
              id="jwt-key"
              type="password"
              placeholder="Your secret key..."
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              disabled={isProcessing}
          />
        </div>

        <div className="flex items-center space-x-2 rounded-lg border p-4">
          <Switch id="jwt-slow-mode" checked={showSteps} onCheckedChange={setShowSteps} disabled={isProcessing} />
          <Label htmlFor="jwt-slow-mode">Show Step-by-Step Visualization</Label>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
            {mode === 'encrypt' ? (
              <Button onClick={handleEncrypt} className="flex-1" disabled={isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isProcessing ? 'Encrypting...' : 'Encrypt JWT'}
              </Button>
            ) : (
              <Button onClick={handleDecrypt} className="flex-1" variant="secondary" disabled={isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isProcessing ? 'Decrypting...' : 'Decrypt JWT'}
              </Button>
            )}
        </div>

        {showSteps && visualizationSteps.length > 0 && (
          <div className="pt-4">
            <CipherVisualization
              steps={visualizationSteps}
              principle={content.jwe.principle}
            />
          </div>
        )}

        {(output || (isProcessing && !showSteps)) && (
            <div className="grid gap-2 pt-4">
            <div className="flex justify-between items-center">
                <Label htmlFor="jwt-output">Result</Label>
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
                id="jwt-output"
                readOnly
                value={isProcessing && !showSteps ? animatedOutput : output}
                className="min-h-[120px] resize-y bg-muted/50 font-mono text-sm"
            />
            </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground w-full text-center pt-6">
        Uses JWT (JWE) with `dir` and `A256GCM` for encryption. The secret key is hashed with SHA-256 to produce the encryption key.
      </p>
    </>
  );
}
