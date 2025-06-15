
import { ShieldCheck, ShieldOff, Check } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="w-full max-w-4xl mx-auto text-center py-12 md:py-16">
      <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
        Secure, Private, Browser-Based Encryption & Decryption
      </h2>
      <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
        De-encrypt Hub provides a suite of professional-grade cryptographic tools that work entirely in your browser. Your data never leaves your device.
      </p>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
        <div className="flex flex-col items-center gap-2 p-4 rounded-lg">
          <ShieldCheck className="h-10 w-10 text-primary" />
          <h3 className="font-semibold">Client-Side Processing</h3>
          <p className="text-sm text-muted-foreground">All cryptographic operations are performed locally in your browser.</p>
        </div>
        <div className="flex flex-col items-center gap-2 p-4 rounded-lg">
          <ShieldOff className="h-10 w-10 text-primary" />
          <h3 className="font-semibold">No Data Uploaded</h3>
          <p className="text-sm text-muted-foreground">Your sensitive data, keys, and files are never sent to any server.</p>
        </div>
        <div className="flex flex-col items-center gap-2 p-4 rounded-lg">
          <Check className="h-10 w-10 text-primary" />
          <h3 className="font-semibold">Free to Use</h3>
          <p className="text-sm text-muted-foreground">The tool is free to use. The code is public and can be audited.</p>
        </div>
      </div>
    </section>
  );
}
