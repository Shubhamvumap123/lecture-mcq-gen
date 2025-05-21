
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import AppLayout from '@/components/AppLayout';
import FileUploader from '@/components/FileUploader';
import ProcessingIndicator from '@/components/ProcessingIndicator';
import VideoPlayer from '@/components/VideoPlayer';
import TranscriptSegment from '@/components/TranscriptSegment';
import { VideoFile, TranscriptSegment as TranscriptSegmentType, MCQuestion, ProcessingProgress } from '@/types';
import { mockProcessVideo, mockGetTranscriptSegments, mockGetMCQuestions, exportMCQs } from '@/services/mockServices';

const Index = () => {
  // State for video processing
  const [processingProgress, setProcessingProgress] = useState<ProcessingProgress>({
    status: 'idle',
    progress: 0
  });
  
  // Video and transcript state
  const [videoFile, setVideoFile] = useState<VideoFile | null>(null);
  const [segments, setSegments] = useState<TranscriptSegmentType[]>([]);
  const [questionsMap, setQuestionsMap] = useState<Record<string, MCQuestion[]>>({});
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [currentVideoTime, setCurrentVideoTime] = useState<number>(0);
  
  // Handle file upload
  const handleFileSelect = async (file: File) => {
    try {
      const processedVideo = await mockProcessVideo(file, setProcessingProgress);
      setVideoFile(processedVideo);
      
      // Get transcript segments once processing is complete
      if (processedVideo.id) {
        const fetchedSegments = await mockGetTranscriptSegments(processedVideo.id);
        setSegments(fetchedSegments);
        
        // Set first segment as active
        if (fetchedSegments.length > 0) {
          setActiveSegmentId(fetchedSegments[0].id);
        }
        
        // Pre-fetch questions for all segments
        const questionsData: Record<string, MCQuestion[]> = {};
        for (const segment of fetchedSegments) {
          const questions = await mockGetMCQuestions(segment.id);
          questionsData[segment.id] = questions;
        }
        setQuestionsMap(questionsData);
      }
    } catch (error) {
      console.error('Error processing video:', error);
      toast.error('Failed to process the video. Please try again.');
      setProcessingProgress({
        status: 'error',
        progress: 0,
        message: 'An error occurred while processing the video.'
      });
    }
  };
  
  // Handle video time update
  const handleVideoTimeUpdate = (time: number) => {
    setCurrentVideoTime(time);
    
    // Find the segment that corresponds to current time
    const currentSegment = segments.find(
      seg => time >= seg.startTime && time < seg.endTime
    );
    
    if (currentSegment && currentSegment.id !== activeSegmentId) {
      setActiveSegmentId(currentSegment.id);
    }
  };
  
  // Handle segment selection
  const handleSegmentSelect = (segment: TranscriptSegmentType) => {
    setActiveSegmentId(segment.id);
    setCurrentVideoTime(segment.startTime);
  };
  
  // Handle export of questions
  const handleExportQuestions = async (segmentId: string) => {
    try {
      if (!videoFile) return;
      
      const exportData = await exportMCQs(videoFile.id, 'json');
      
      // In a real app, this would trigger a download
      // For demo, we'll just show a toast
      toast.success('Questions exported successfully!');
      console.log('Exported data:', exportData);
    } catch (error) {
      toast.error('Failed to export questions.');
    }
  };
  
  // Handle export of all questions
  const handleExportAllQuestions = async () => {
    try {
      if (!videoFile) return;
      
      const exportData = await exportMCQs(videoFile.id, 'json');
      
      toast.success('All questions exported successfully!');
      console.log('Exported all data:', exportData);
    } catch (error) {
      toast.error('Failed to export all questions.');
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Video to MCQ Generator</h1>
        <p className="text-gray-500">Upload a lecture video to automatically generate MCQ questions</p>
      </div>
      
      {!videoFile ? (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
              <CardDescription>
                Upload a lecture video to begin transcription and question generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploader 
                onFileSelect={handleFileSelect}
                disabled={processingProgress.status !== 'idle' && processingProgress.status !== 'error'}
              />
            </CardContent>
          </Card>
          
          {processingProgress.status !== 'idle' && (
            <ProcessingIndicator progress={processingProgress} />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <VideoPlayer 
              videoUrl={videoFile.url} 
              currentTime={currentVideoTime}
              onTimeUpdate={handleVideoTimeUpdate}
            />
            
            {processingProgress.status !== 'complete' ? (
              <ProcessingIndicator progress={processingProgress} />
            ) : (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle>Transcript & Questions</CardTitle>
                    <CardDescription>
                      Generated questions from video transcript
                    </CardDescription>
                  </div>
                  <Button onClick={handleExportAllQuestions}>
                    Export All
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Tabs defaultValue="transcript" className="w-full">
                    <div className="px-6 pt-2">
                      <TabsList className="w-full">
                        <TabsTrigger value="transcript" className="flex-1">Transcript</TabsTrigger>
                        <TabsTrigger value="questions" className="flex-1">Questions</TabsTrigger>
                      </TabsList>
                    </div>
                    
                    <TabsContent value="transcript">
                      <div className="px-6 py-2">
                        <div className="max-h-[500px] overflow-y-auto">
                          {segments.map(segment => (
                            <div key={segment.id}>
                              <TranscriptSegment
                                segment={segment}
                                questions={questionsMap[segment.id] || []}
                                isActive={segment.id === activeSegmentId}
                                onSelect={() => handleSegmentSelect(segment)}
                                onExport={() => handleExportQuestions(segment.id)}
                              />
                              <Separator className="my-2" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="questions">
                      <div className="px-6 py-2">
                        <div className="max-h-[500px] overflow-y-auto">
                          {segments.map(segment => {
                            const questions = questionsMap[segment.id] || [];
                            if (questions.length === 0) return null;
                            
                            return (
                              <div key={segment.id} className="mb-6">
                                <h3 className="font-medium mb-2">
                                  {segment.startTime / 60} - {segment.endTime / 60} minutes
                                </h3>
                                
                                {questions.map((question, index) => (
                                  <Card key={question.id} className="mb-3 p-4">
                                    <p className="font-medium mb-3">Q{index + 1}: {question.question}</p>
                                    <div className="space-y-2">
                                      {question.options.map((option, optionIndex) => (
                                        <div 
                                          key={optionIndex} 
                                          className={`p-2 rounded-md ${
                                            optionIndex === question.correctAnswer 
                                              ? 'bg-green-50 border border-green-200' 
                                              : 'bg-gray-50'
                                          }`}
                                        >
                                          <span className="font-medium mr-2">
                                            {String.fromCharCode(65 + optionIndex)}.
                                          </span>
                                          {option}
                                          {optionIndex === question.correctAnswer && (
                                            <span className="text-green-600 ml-2 text-sm">✓ Correct</span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
          
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Video Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">File Name</h3>
                    <p className="text-sm">{videoFile.name}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Size</h3>
                    <p className="text-sm">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Uploaded</h3>
                    <p className="text-sm">{videoFile.uploadedAt.toLocaleString()}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Segments</h3>
                    <p className="text-sm">{segments.length} (5-minute intervals)</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Questions Generated</h3>
                    <p className="text-sm">
                      {Object.values(questionsMap).reduce((sum, questions) => sum + questions.length, 0)}
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setVideoFile(null);
                      setSegments([]);
                      setQuestionsMap({});
                      setActiveSegmentId(null);
                      setProcessingProgress({ status: 'idle', progress: 0 });
                    }}
                  >
                    Upload a Different Video
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Index;
