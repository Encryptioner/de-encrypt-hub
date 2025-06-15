
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Key } from 'lucide-react';
import { toast } from 'sonner';

interface RsaKeyManagerProps {
  publicKey: string;
  privateKey: string;
  onPublicKeyChange: (key: string) => void;
  onPrivateKeyChange: (key: string) => void;
  onGenerateKeys: () => void;
}

export function RsaKeyManager({ publicKey, privateKey, onPublicKeyChange, onPrivateKeyChange, onGenerateKeys }: RsaKeyManagerProps) {
  
  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={onGenerateKeys} variant="outline">
          <Key className="mr-2 h-4 w-4" />
          Generate New 2048-bit Key Pair
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="rsa-public-key-enc">Public Key (JWK)</Label>
          <Textarea id="rsa-public-key-enc" placeholder='Your public key in JSON Web Key format...' value={publicKey} onChange={(e) => onPublicKeyChange(e.target.value)} className="min-h-[160px] resize-y font-mono text-xs" />
          <Button variant="ghost" size="sm" className="w-fit" onClick={() => handleCopy(publicKey)}>
              <Copy className="mr-2 h-4 w-4"/> Copy Public Key
          </Button>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="rsa-private-key-enc">Private Key (JWK)</Label>
          <Textarea id="rsa-private-key-enc" placeholder='Your private key in JSON Web Key format...' value={privateKey} onChange={(e) => onPrivateKeyChange(e.target.value)} className="min-h-[160px] resize-y font-mono text-xs" />
          <Button variant="ghost" size="sm" className="w-fit" onClick={() => handleCopy(privateKey)}>
              <Copy className="mr-2 h-4 w-4"/> Copy Private Key
          </Button>
        </div>
      </div>
    </>
  );
}
