
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader } from 'lucide-react';
import { ProcessingProgress, ProcessingStatus } from '@/types';

interface ProcessingIndicatorProps {
  progress: ProcessingProgress;
}

const ProcessingIndicator: React.FC<ProcessingIndicatorProps> = ({ progress }) => {
  const getStatusMessage = (status: ProcessingStatus): string => {
    switch (status) {
      case 'idle':
        return 'Waiting to start...';
      case 'uploading':
        return 'Uploading video...';
      case 'processing':
        return 'Processing video...';
      case 'transcribing':
        return 'Transcribing audio...';
      case 'generating':
        return 'Generating questions...';
      case 'complete':
        return 'Process completed!';
      case 'error':
        return 'Error occurred';
      default:
        return 'Processing...';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center">
          {progress.status !== 'complete' && progress.status !== 'error' && (
            <Loader className="w-5 h-5 mr-2 animate-spin" />
          )}
          {progress.status === 'complete' && (
            <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          )}
          {progress.status === 'error' && (
            <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          )}
          Processing Status
        </CardTitle>
        <CardDescription>
          {progress.message || getStatusMessage(progress.status)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Progress value={progress.progress} className="w-full" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0%</span>
            <span>{progress.progress}%</span>
            <span>100%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProcessingIndicator;
