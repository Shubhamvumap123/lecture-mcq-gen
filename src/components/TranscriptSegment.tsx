
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TranscriptSegment as TranscriptSegmentType, MCQuestion } from '@/types';

interface TranscriptSegmentProps {
  segment: TranscriptSegmentType;
  questions: MCQuestion[];
  isActive: boolean;
  onSelect: () => void;
  onExport: () => void;
}

const TranscriptSegment: React.FC<TranscriptSegmentProps> = ({
  segment,
  questions,
  isActive,
  onSelect,
  onExport
}) => {
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className={`timeline-segment ${isActive ? 'active' : ''}`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium">
          {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
        </h4>
        <Button 
          variant="outline" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onExport();
          }}
        >
          Export
        </Button>
      </div>
      <p className="text-sm text-gray-700 mb-3">{segment.text}</p>
      
      <div className="mt-4">
        <h5 className="text-sm font-medium mb-2">Questions ({questions.length}):</h5>
        <div className="space-y-3">
          {questions.map((q, index) => (
            <Card key={q.id} className="p-3 text-sm">
              <p className="font-medium mb-2">Q{index + 1}: {q.question}</p>
              <div className="space-y-1 pl-4">
                {q.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-start">
                    <span className={`inline-block w-5 ${optionIndex === q.correctAnswer ? 'text-green-600 font-medium' : ''}`}>
                      {String.fromCharCode(65 + optionIndex)}.
                    </span>
                    <span className={optionIndex === q.correctAnswer ? 'text-green-600 font-medium' : ''}>
                      {option}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TranscriptSegment;
