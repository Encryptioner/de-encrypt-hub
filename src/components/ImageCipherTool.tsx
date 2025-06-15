
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, KeyRound, Lock, Unlock, Download, RefreshCw, Loader2, Image as ImageIcon } from 'lucide-react';
import { useImageCipher } from '@/hooks/useImageCipher';
import { ImageAlgorithm } from '@/lib/imageEncryption';
import content from '@/config/content.json';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ImageCipherToolProps {
  mode: 'encrypt' | 'decrypt';
}

export function ImageCipherTool({ mode }: ImageCipherToolProps) {
  const {
    originalImage,
    processedImage,
    key, setKey,
    algorithm, setAlgorithm,
    isProcessing,
    handleImageUpload,
    handleProcess,
    handleDownload,
    handleReset,
  } = useImageCipher({ mode });

  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0]);
    }
    e.target.value = ''; // Reset file input
  };

  const handleDragEvents = (e: React.DragEvent<HTMLLabelElement>, isEntering: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(isEntering);
  }

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    handleDragEvents(e, false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Column */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Original Image</CardTitle>
            <CardDescription>Upload the image you want to {mode}.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col items-center justify-center p-4">
            {originalImage ? (
                <div className="relative w-full aspect-video rounded-md overflow-hidden border">
                    <img src={originalImage} alt="Original" className="w-full h-full object-contain" />
                </div>
            ) : (
                <Label 
                  htmlFor="image-upload"
                  className={`flex flex-col items-center justify-center w-full h-full min-h-[200px] border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'border-input hover:border-primary/50'}`}
                  onDragEnter={(e) => handleDragEvents(e, true)}
                  onDragLeave={(e) => handleDragEvents(e, false)}
                  onDragOver={(e) => handleDragEvents(e, true)}
                  onDrop={handleDrop}
                >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, GIF, etc.</p>
                    </div>
                    <Input id="image-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                </Label>
            )}
          </CardContent>
        </Card>

        {/* Output Column */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Processed Image</CardTitle>
            <CardDescription>The {mode}ed image will appear here.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col items-center justify-center bg-muted/20 rounded-b-lg p-4">
            {isProcessing && (
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Processing...</p>
                </div>
            )}
            {!isProcessing && processedImage && (
                <div className="relative w-full aspect-video rounded-md overflow-hidden border">
                    <img src={processedImage} alt="Processed" className="w-full h-full object-contain" />
                </div>
            )}
            {!isProcessing && !processedImage && (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ImageIcon className="w-12 h-12" />
                    <p>Result will be shown here</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      {originalImage && (
        <div className="space-y-4 pt-4 border-t">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="image-key" className="flex items-center"><KeyRound />Secret Key</Label>
              <Input
                id="image-key"
                type="password"
                placeholder="Your secret key..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image-algorithm">Algorithm</Label>
              <Select value={algorithm} onValueChange={(value) => setAlgorithm(value as ImageAlgorithm)}>
                <SelectTrigger id="image-algorithm">
                  <SelectValue placeholder="Select algorithm" />
                </SelectTrigger>
                <SelectContent>
                  {(content.imageAlgorithms || []).map((alg) => (
                    <SelectItem key={alg.value} value={alg.value}>
                      {alg.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button onClick={handleProcess} disabled={isProcessing || !key} className="flex-1">
              {isProcessing ? <Loader2 className="animate-spin" /> : (mode === 'encrypt' ? <Lock /> : <Unlock />)}
              {isProcessing ? 'Processing...' : (mode === 'encrypt' ? 'Encrypt Image' : 'Decrypt Image')}
            </Button>
            {processedImage && (
              <Button onClick={handleDownload} variant="outline" className="flex-1">
                <Download/>Download Result
              </Button>
            )}
            <Button onClick={handleReset} variant="ghost" className="flex-1 sm:flex-none">
              <RefreshCw /> Reset
            </Button>
          </div>
          <p className="text-xs text-muted-foreground w-full text-center pt-2">{(content.imageAlgorithms || []).find(a => a.value === algorithm)?.description}</p>
        </div>
      )}
    </div>
  );
}
