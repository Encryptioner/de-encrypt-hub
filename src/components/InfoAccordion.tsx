
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function InfoAccordion() {
  return (
    <section className="w-full max-w-4xl mx-auto py-8">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="how-it-works">
          <AccordionTrigger className="text-lg font-semibold">How It Works</AccordionTrigger>
          <AccordionContent className="text-muted-foreground space-y-2">
            <p>De-encrypt Hub leverages the built-in <code className="font-mono text-sm bg-muted p-1 rounded">window.crypto</code> API available in modern web browsers. This powerful API allows for cryptographic operations like encryption, decryption, and key generation to be performed directly on your device.</p>
            <p>Because all operations are client-side, your sensitive information never leaves your computer. This provides a high level of privacy and security, as there is no server interaction involved in the core cryptographic processes.</p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="security-notice">
          <AccordionTrigger className="text-lg font-semibold">Security Notice</AccordionTrigger>
          <AccordionContent className="text-muted-foreground space-y-2">
            <p><strong>Your security is our priority, but it's a shared responsibility.</strong> While this tool is designed to be secure, please remember:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Do not share private keys.</strong> Your private key should be kept secret and secure. Never share it with anyone or post it publicly.</li>
              <li><strong>Be mindful of your environment.</strong> Ensure your computer is free from malware and that you are on a secure network connection.</li>
              <li><strong>This is a browser-based tool.</strong> While we utilize secure browser APIs, it does not replace dedicated, audited security software for high-stakes applications. Always assess your own risk.</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="supported-formats">
          <AccordionTrigger className="text-lg font-semibold">Supported Formats & Algorithms</AccordionTrigger>
          <AccordionContent className="text-muted-foreground space-y-4">
            <div>
              <h4 className="font-semibold text-foreground">Input/Output</h4>
              <p>You can encrypt/decrypt any UTF-8 text. File support for encryption and decryption is planned for a future update.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Keys & Formats</h4>
              <p>For RSA, we use the JSON Web Key (JWK) format. This is a standard, easy-to-use format. Keys for other algorithms like AES are typically strings or hex values.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Algorithm Comparison</h4>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr className="text-foreground">
                      <th className="p-2 font-semibold">Category</th>
                      <th className="p-2 font-semibold">Algorithms</th>
                      <th className="p-2 font-semibold">Primary Use Case</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Symmetric Ciphers</td>
                      <td className="p-2">AES, DES, TripleDES</td>
                      <td className="p-2">Encrypting data with a single shared key.</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Asymmetric Encryption</td>
                      <td className="p-2">RSA-OAEP</td>
                      <td className="p-2">Encrypting with a public key, decrypting with a private key.</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Digital Signatures</td>
                      <td className="p-2">RSA-PSS, Ed25519</td>
                      <td className="p-2">Verifying message authenticity and integrity.</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Hashing</td>
                      <td className="p-2">SHA-256, SHA-512, MD5</td>
                      <td className="p-2">Creating a one-way, unique data fingerprint.</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium">Token Handling</td>
                      <td className="p-2">JWT</td>
                      <td className="p-2">Securely transmitting information between parties.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="faq">
          <AccordionTrigger className="text-lg font-semibold">Frequently Asked Questions</AccordionTrigger>
          <AccordionContent className="text-muted-foreground space-y-4">
            <div>
              <h4 className="font-semibold text-foreground">Is my data secure?</h4>
              <p>Yes. Your data is processed entirely on your device and is never sent to our servers. We utilize your browser's native cryptographic functions for all operations.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">What algorithms are supported?</h4>
              <p>We support a range of industry-standard algorithms, including AES, DES, TripleDES for symmetric ciphers, RSA for asymmetric encryption and signing, JWT for token handling, and various hashing functions like SHA-256.</p>
            </div>
             <div>
              <h4 className="font-semibold text-foreground">Can I use this for production systems?</h4>
              <p>This tool is excellent for development, testing, and learning purposes. For production systems, we recommend using dedicated, server-side cryptographic libraries that are part of a robust security infrastructure. Using browser-based crypto for primary production security can be risky.</p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
