import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CipherTool } from "./CipherTool";
import { JwtTool } from "./JwtTool";
import { HashTool } from "./HashTool";
import { DigitalSignatureTool } from "./DigitalSignatureTool";
import { RsaEncryptionTool } from "./RsaEncryptionTool";
import { Lock, Unlock, Image as ImageIcon } from "lucide-react";
import { ImageCipherTool } from "./ImageCipherTool";

export function DeencryptHub() {
  const level2TabsList = "flex h-auto flex-wrap items-center justify-start gap-4 rounded-none border-b bg-transparent p-0";
  const level2TabsTrigger = "rounded-none border-b-2 border-transparent bg-transparent px-2 py-2 text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-2xl shadow-primary/5 dark:shadow-primary/10">
      <CardHeader>
        <CardTitle className="text-2xl">De-encrypt Hub</CardTitle>
        <CardDescription>Select a category and then choose your desired tool.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="encrypt" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="encrypt"><Lock className="mr-2 h-4 w-4"/>Encrypt / Sign</TabsTrigger>
            <TabsTrigger value="decrypt"><Unlock className="mr-2 h-4 w-4"/>Decrypt / Verify</TabsTrigger>
          </TabsList>

          {/* Encryption / Signing Tools */}
          <TabsContent value="encrypt">
            <Tabs defaultValue="ciphers" className="w-full pt-4">
              <TabsList className={level2TabsList}>
                <TabsTrigger value="ciphers" className={level2TabsTrigger}>Ciphers</TabsTrigger>
                <TabsTrigger value="images" className={level2TabsTrigger}><ImageIcon className="mr-2 h-4 w-4"/>Images</TabsTrigger>
                <TabsTrigger value="rsa" className={level2TabsTrigger}>RSA</TabsTrigger>
                <TabsTrigger value="jwt" className={level2TabsTrigger}>JWT</TabsTrigger>
                <TabsTrigger value="signatures" className={level2TabsTrigger}>Digital Signatures</TabsTrigger>
                <TabsTrigger value="hashing" className={level2TabsTrigger}>Hashing</TabsTrigger>
              </TabsList>
              <TabsContent value="ciphers" className="pt-6"><CipherTool mode="encrypt" /></TabsContent>
              <TabsContent value="images" className="pt-6"><ImageCipherTool mode="encrypt" /></TabsContent>
              <TabsContent value="rsa" className="pt-6"><RsaEncryptionTool mode="encrypt" /></TabsContent>
              <TabsContent value="jwt" className="pt-6"><JwtTool mode="encrypt" /></TabsContent>
              <TabsContent value="signatures" className="pt-6"><DigitalSignatureTool /></TabsContent>
              <TabsContent value="hashing" className="pt-6"><HashTool /></TabsContent>
            </Tabs>
          </TabsContent>

          {/* Decryption / Verification Tools */}
          <TabsContent value="decrypt">
            <Tabs defaultValue="ciphers" className="w-full pt-4">
              <TabsList className={level2TabsList}>
                <TabsTrigger value="ciphers" className={level2TabsTrigger}>Ciphers</TabsTrigger>
                <TabsTrigger value="images" className={level2TabsTrigger}><ImageIcon className="mr-2 h-4 w-4"/>Images</TabsTrigger>
                <TabsTrigger value="rsa" className={level2TabsTrigger}>RSA</TabsTrigger>
                <TabsTrigger value="jwt" className={level2TabsTrigger}>JWT</TabsTrigger>
              </TabsList>
              <TabsContent value="ciphers" className="pt-6"><CipherTool mode="decrypt" /></TabsContent>
              <TabsContent value="images" className="pt-6"><ImageCipherTool mode="decrypt" /></TabsContent>
              <TabsContent value="rsa" className="pt-6"><RsaEncryptionTool mode="decrypt" /></TabsContent>
              <TabsContent value="jwt" className="pt-6"><JwtTool mode="decrypt" /></TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
