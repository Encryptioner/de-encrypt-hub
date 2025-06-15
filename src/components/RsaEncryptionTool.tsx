
import { useState } from 'react';
import { toast } from 'sonner';
import { RsaKeyManager } from './rsa/RsaKeyManager';
import { RsaEncryptForm } from './rsa/RsaEncryptForm';
import { RsaDecryptForm } from './rsa/RsaDecryptForm';

interface RsaEncryptionToolProps {
  mode: 'encrypt' | 'decrypt';
}

export function RsaEncryptionTool({ mode }: RsaEncryptionToolProps) {
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');

  const handleGenerateKeys = async () => {
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
          hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt']
      );
      
      const publicKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
      const privateKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);

      setPublicKey(JSON.stringify(publicKeyJwk, null, 2));
      setPrivateKey(JSON.stringify(privateKeyJwk, null, 2));
      toast.success('RSA key pair generated successfully!');
    } catch (error) {
      toast.error('Failed to generate keys.');
      console.error(error);
    }
  };

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
        
        {mode === 'encrypt' ? (
          <RsaEncryptForm publicKey={publicKey} />
        ) : (
          <RsaDecryptForm privateKey={privateKey} />
        )}
      </div>
       <p className="text-xs text-muted-foreground w-full text-center pt-6">
        Uses RSA-OAEP for encryption with SHA-256. Keys are in JWK format.
      </p>
    </>
  );
}
