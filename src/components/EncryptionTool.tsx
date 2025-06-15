
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CipherTool } from "./CipherTool";
import { JwtTool } from "./JwtTool";
import { RsaTool } from "./RsaTool";
import { HashTool } from "./HashTool";
import { Ed25519Tool } from "./Ed25519Tool";

export function EncryptionTool() {
  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl shadow-primary/5 dark:shadow-primary/10">
      <CardHeader>
        <CardTitle className="text-2xl">Encryption Tool</CardTitle>
        <CardDescription>Select a tool and enter your data.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ciphers" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="ciphers">Ciphers</TabsTrigger>
            <TabsTrigger value="jwt">JWT (JWE)</TabsTrigger>
            <TabsTrigger value="rsa">RSA</TabsTrigger>
            <TabsTrigger value="hashing">Hashing</TabsTrigger>
            <TabsTrigger value="ed25519">Ed25519</TabsTrigger>
          </TabsList>
          <TabsContent value="ciphers">
            <CipherTool />
          </TabsContent>
          <TabsContent value="jwt">
            <JwtTool />
          </TabsContent>
          <TabsContent value="rsa">
            <RsaTool />
          </TabsContent>
          <TabsContent value="hashing">
            <HashTool />
          </TabsContent>
          <TabsContent value="ed25519">
            <Ed25519Tool />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
