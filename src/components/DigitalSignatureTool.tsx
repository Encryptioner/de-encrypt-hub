
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ed25519Tool } from "./Ed25519Tool";
import { RsaTool } from "./RsaTool";

export function DigitalSignatureTool() {
  return (
    <Tabs defaultValue="rsa" className="w-full">
      <TabsList className="grid w-auto grid-cols-2 gap-2 mx-auto">
        <TabsTrigger value="rsa">RSA</TabsTrigger>
        <TabsTrigger value="ed25519">Ed25519</TabsTrigger>
      </TabsList>
      <TabsContent value="rsa">
        <RsaTool />
      </TabsContent>
      <TabsContent value="ed25519">
        <Ed25519Tool />
      </TabsContent>
    </Tabs>
  );
}
