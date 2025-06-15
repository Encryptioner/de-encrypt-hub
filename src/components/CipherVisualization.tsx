
import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { CheckCircle2, Loader2, CircleDotDashed } from 'lucide-react';
import { type VisualizationStep } from '@/hooks/useCipher';
import { AnimatePresence, motion } from 'framer-motion';

interface CipherVisualizationProps {
  steps: VisualizationStep[];
  principle?: string;
}

const getIcon = (status: VisualizationStep['status']) => {
  switch (status) {
    case 'done':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'processing':
      return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
    default:
      return <CircleDotDashed className="h-5 w-5 text-muted-foreground" />;
  }
};

export function CipherVisualization({ steps, principle }: CipherVisualizationProps) {
  const visibleSteps = steps.filter(step => step.status !== 'pending');
  
  return (
    <div className="space-y-6 pt-6">
      {principle && (
         <Card className="bg-muted/30 animate-fade-in">
          <CardHeader>
            <CardTitle>Algorithmic Principle</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{principle}</p>
          </CardContent>
        </Card>
      )}
      <div className="space-y-4">
        <AnimatePresence>
          {visibleSteps.map((step, index) => (
            <motion.div
              key={index}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Card className={step.status === 'processing' ? 'border-primary' : ''}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">{step.title}</CardTitle>
                  {getIcon(step.status)}
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">{step.explanation}</CardDescription>
                  {step.data && step.dataType === 'image' && (
                    <div className="mt-2 rounded-md bg-muted p-2 flex justify-center">
                        <img src={step.data} alt={step.title} className="max-w-full h-auto max-h-48 rounded-sm object-contain" />
                    </div>
                  )}
                  {step.data && (!step.dataType || step.dataType === 'text') && (
                    <pre className="mt-2 rounded-md bg-muted p-4">
                      <code className="text-muted-foreground break-all whitespace-pre-wrap font-mono text-xs">{step.data}</code>
                    </pre>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
