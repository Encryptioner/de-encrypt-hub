
export interface VisualizationStep {
  title: string;
  explanation: string;
  data: string;
  status: 'pending' | 'processing' | 'done';
  dataType?: 'image' | 'text';
}
