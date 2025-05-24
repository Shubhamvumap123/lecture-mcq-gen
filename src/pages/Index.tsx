import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import AppLayout from '@/components/AppLayout';
import FileUploader from '@/components/FileUploader';
import ProcessingIndicator from '@/components/ProcessingIndicator';
import VideoPlayer from '@/components/VideoPlayer';
import TranscriptSegment from '@/components/TranscriptSegment';
import { VideoFile, TranscriptSegment as TranscriptSegmentType, MCQuestion, ProcessingProgress } from '@/types';
import { 
  processVideo, 
  getTranscriptSegments, 
  getMCQuestions, 
  exportMCQs,
  checkAPIHealth 
} from '@/services/apiServices';

const Index = () => {
  // API connection state
  const [isAPIConnected, setIsAPIConnected] = useState<boolean | null>(null);
  
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
  
  // Loading states
  const [isLoadingSegments, setIsLoadingSegments] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<Record<string, boolean>>({});

  // Check API health on component mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const isHealthy = await checkAPIHealth();
        setIsAPIConnected(isHealthy);
        
        if (!isHealthy) {
          toast.error('Unable to connect to API server. Please ensure the backend is running.');
        }
      } catch (error) {
        setIsAPIConnected(false);
        toast.error('Failed to check API connection');
      }
    };

    checkConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle file upload
  const handleFileSelect = async (file: File) => {
    if (!isAPIConnected) {
      toast.error('API server is not connected. Please check your backend server.');
      return;
    }

    try {
      setProcessingProgress({ status: 'uploading', progress: 0 });
      
      const processedVideo = await processVideo(file, setProcessingProgress);
      setVideoFile(processedVideo);
      
      // Get transcript segments once processing is complete
      if (processedVideo.id) {
        await loadTranscriptAndQuestions(processedVideo.id);
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

  // Load transcript segments and questions
  const loadTranscriptAndQuestions = async (videoId: string) => {
    try {
      setIsLoadingSegments(true);
      
      // Get transcript segments
      const fetchedSegments = await getTranscriptSegments(videoId);
      setSegments(fetchedSegments);
      
      // Set first segment as active
      if (fetchedSegments.length > 0) {
        setActiveSegmentId(fetchedSegments[0].id);
      }
      
      // Load questions for all segments
      const questionsData: Record<string, MCQuestion[]> = {};
      const loadingStates: Record<string, boolean> = {};
      
      for (const segment of fetchedSegments) {
        loadingStates[segment.id] = true;
        setIsLoadingQuestions(prev => ({ ...prev, [segment.id]: true }));
        
        try {
          const questions = await getMCQuestions(segment.id);
          questionsData[segment.id] = questions;
        } catch (error) {
          console.error(`Error loading questions for segment ${segment.id}:`, error);
          questionsData[segment.id] = [];
          toast.error(`Failed to load questions for segment ${Math.floor(segment.startTime / 60)}-${Math.floor(segment.endTime / 60)} minutes`);
        } finally {
          loadingStates[segment.id] = false;
          setIsLoadingQuestions(prev => ({ ...prev, [segment.id]: false }));
        }
      }
      
      setQuestionsMap(questionsData);
      
    } catch (error) {
      console.error('Error loading transcript and questions:', error);
      toast.error('Failed to load transcript. Please try again.');
    } finally {
      setIsLoadingSegments(false);
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
  
  // Handle export of questions for specific segment
  const handleExportQuestions = async (segmentId: string) => {
    try {
      if (!videoFile) return;
      
      const segment = segments.find(s => s.id === segmentId);
      const questions = questionsMap[segmentId] || [];
      
      if (questions.length === 0) {
        toast.error('No questions available for this segment');
        return;
      }

      // Create export data for this segment only
      const segmentData = {
        videoId: videoFile.id,
        segmentId: segmentId,
        timeRange: segment ? `${Math.floor(segment.startTime / 60)}-${Math.floor(segment.endTime / 60)} minutes` : 'Unknown',
        exportedAt: new Date().toISOString(),
        questions: questions.map(q => ({
          id: q.id,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          correctAnswerText: q.options[q.correctAnswer]
        }))
      };

      // Create and download JSON file
      const dataStr = JSON.stringify(segmentData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `questions_segment_${Math.floor((segment?.startTime || 0) / 60)}-${Math.floor((segment?.endTime || 0) / 60)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Segment questions exported successfully!');
    } catch (error) {
      console.error('Error exporting segment questions:', error);
      toast.error('Failed to export segment questions.');
    }
  };
  
  // Handle export of all questions
  const handleExportAllQuestions = async (format: 'json' | 'csv' = 'json') => {
    try {
      if (!videoFile) return;
      
      const exportData = await exportMCQs(videoFile.id, format);
      
      // Create and download file
      const mimeType = format === 'json' ? 'application/json' : 'text/csv';
      const extension = format === 'json' ? 'json' : 'csv';
      
      const dataBlob = new Blob([exportData], { type: mimeType });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `all_questions.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`All questions exported successfully as ${format.toUpperCase()}!`);
    } catch (error) {
      console.error('Error exporting all questions:', error);
      toast.error('Failed to export all questions.');
    }
  };

  // Handle reset/new video
  const handleReset = () => {
    setVideoFile(null);
    setSegments([]);
    setQuestionsMap({});
    setActiveSegmentId(null);
    setCurrentVideoTime(0);
    setProcessingProgress({ status: 'idle', progress: 0 });
    setIsLoadingSegments(false);
    setIsLoadingQuestions({});
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold tracking-tight">Video to MCQ Generator</h1>
          <div className="flex items-center space-x-2">
            {isAPIConnected === null ? (
              <div className="flex items-center text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                Checking connection...
              </div>
            ) : isAPIConnected ? (
              <div className="flex items-center text-green-600">
                <Wifi size={16} className="mr-1" />
                API Connected
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <WifiOff size={16} className="mr-1" />
                API Disconnected
              </div>
            )}
          </div>
        </div>
        <p className="text-gray-500">Upload a lecture video to automatically generate MCQ questions</p>
        
        {isAPIConnected === false && (
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to connect to the API server. Please ensure your backend server is running on the correct port and try refreshing the page.
            </AlertDescription>
          </Alert>
        )}
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
                disabled={
                  !isAPIConnected || 
                  (processingProgress.status !== 'idle' && processingProgress.status !== 'error')
                }
                acceptedTypes="video/mp4"
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
                      {isLoadingSegments && " (Loading segments...)"}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handleExportAllQuestions('csv')}
                      disabled={Object.keys(questionsMap).length === 0}
                    >
                      Export CSV
                    </Button>
                    <Button 
                      onClick={() => handleExportAllQuestions('json')}
                      disabled={Object.keys(questionsMap).length === 0}
                    >
                      Export JSON
                    </Button>
                  </div>
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
                          {segments.length === 0 && isLoadingSegments ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mr-3"></div>
                              Loading transcript segments...
                            </div>
                          ) : segments.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              No transcript segments available
                            </div>
                          ) : (
                            segments.map(segment => (
                              <div key={segment.id}>
                                <TranscriptSegment
                                  segment={segment}
                                  questions={questionsMap[segment.id] || []}
                                  isActive={segment.id === activeSegmentId}
                                  onSelect={() => handleSegmentSelect(segment)}
                                  onExport={() => handleExportQuestions(segment.id)}
                                />
                                {isLoadingQuestions[segment.id] && (
                                  <div className="text-center py-2 text-sm text-gray-500">
                                    Loading questions for this segment...
                                  </div>
                                )}
                                <Separator className="my-2" />
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="questions">
                      <div className="px-6 py-2">
                        <div className="max-h-[500px] overflow-y-auto">
                          {segments.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              No questions available
                            </div>
                          ) : (
                            segments.map(segment => {
                              const questions = questionsMap[segment.id] || [];
                              const isLoading = isLoadingQuestions[segment.id];
                              
                              if (questions.length === 0 && !isLoading) return null;
                              
                              return (
                                <div key={segment.id} className="mb-6">
                                  <h3 className="font-medium mb-2">
                                    {Math.floor(segment.startTime / 60)}-{Math.floor(segment.endTime / 60)} minutes
                                  </h3>
                                  
                                  {isLoading ? (
                                    <div className="flex items-center py-4">
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                                      Loading questions...
                                    </div>
                                  ) : (
                                    questions.map((question, index) => (
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
                                    ))
                                  )}
                                </div>
                              );
                            })
                          )}
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
                    <p className="text-sm">
                      {segments.length} 
                      {isLoadingSegments ? " (loading...)" : " (5-minute intervals)"}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Questions Generated</h3>
                    <p className="text-sm">
                      {Object.values(questionsMap).reduce((sum, questions) => sum + questions.length, 0)}
                      {Object.keys(isLoadingQuestions).some(key => isLoadingQuestions[key]) && " (loading...)"}
                    </p>
                  </div>
                  
                  <Separator />
    
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleReset}
                  >
                    Process New Video
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