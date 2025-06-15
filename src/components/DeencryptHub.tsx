
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CipherTool } from "./CipherTool";
import { JwtTool } from "./JwtTool";
import { HashTool } from "./HashTool";
import { DigitalSignatureTool } from "./DigitalSignatureTool";
import { RsaEncryptionTool } from "./RsaEncryptionTool";
import { Lock, Unlock } from "lucide-react";

export function DeencryptHub() {
  return (
    <Card className="w-full max-w-4xl mx-auto shadow-2xl shadow-primary/5 dark:shadow-primary/10">
      <CardHeader>
        <CardTitle className="text-2xl">De-encrypt Hub</CardTitle>
        <CardDescription>Select a category and then choose your desired tool.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="encrypt" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="encrypt"><Lock className="mr-2"/>Encrypt / Sign</TabsTrigger>
            <TabsTrigger value="decrypt"><Unlock className="mr-2"/>Decrypt / Verify</TabsTrigger>
          </TabsList>

          {/* Encryption / Signing Tools */}
          <TabsContent value="encrypt">
            <Tabs defaultValue="ciphers" className="w-full pt-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="ciphers">Ciphers</TabsTrigger>
                <TabsTrigger value="rsa">RSA</TabsTrigger>
                <TabsTrigger value="jwt">JWT</TabsTrigger>
                <TabsTrigger value="signatures">Digital Signatures</TabsTrigger>
                <TabsTrigger value="hashing">Hashing</TabsTrigger>
              </TabsList>
              <TabsContent value="ciphers"><CipherTool mode="encrypt" /></TabsContent>
              <TabsContent value="rsa"><RsaEncryptionTool mode="encrypt" /></TabsContent>
              <TabsContent value="jwt"><JwtTool mode="encrypt" /></TabsContent>
              <TabsContent value="signatures"><DigitalSignatureTool /></TabsContent>
              <TabsContent value="hashing"><HashTool /></TabsContent>
            </Tabs>
          </TabsContent>

          {/* Decryption / Verification Tools */}
          <TabsContent value="decrypt">
            <Tabs defaultValue="ciphers" className="w-full pt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="ciphers">Ciphers</TabsTrigger>
                <TabsTrigger value="rsa">RSA</TabsTrigger>
                <TabsTrigger value="jwt">JWT</TabsTrigger>
              </TabsList>
              <TabsContent value="ciphers"><CipherTool mode="decrypt" /></TabsContent>
              <TabsContent value="rsa"><RsaEncryptionTool mode="decrypt" /></TabsContent>
              <TabsContent value="jwt"><JwtTool mode="decrypt" /></TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
