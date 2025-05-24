import { VideoFile, TranscriptSegment, MCQuestion, ProcessingProgress } from "../types";

// API base URL - adjust according to your backend setup
const API_BASE_URL = (import.meta.env.REACT_APP_API_URL || 'http://localhost:5000') as string;

// Helper function for API calls
const apiCall = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${response.statusText}`);
  }

  return response.json();
};

// Upload file and start processing
export const processVideo = async (
  file: File, 
  onProgressUpdate: (progress: ProcessingProgress) => void
): Promise<VideoFile> => {
  try {
    // Step 1: Upload file
    onProgressUpdate({ status: 'uploading', progress: 0, message: 'Starting upload...' });
    
    const formData = new FormData();
    formData.append('video', file);
console.log('file', file)
    const uploadResponse = await fetch(`${API_BASE_URL}/api/files/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error('File upload failed');
    }
    console.log("uploadResult",uploadResponse)

    const uploadResult = await uploadResponse.json();
    const fileId = uploadResult.file.id;
    onProgressUpdate({ status: 'uploading', progress: 100, message: 'Upload complete' });

    // Step 2: Poll for processing status
    let processingComplete = false;
    let currentStatus = 'processing';
    let progressValue = 0;

    while (!processingComplete) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Poll every 2 seconds
      
      try {
        const statusResponse = await apiCall(`/api/files/${fileId}`);
        
        switch (statusResponse.status) {
          case 'uploaded':
            onProgressUpdate({ 
              status: 'processing', 
              progress: 10, 
              message: 'Processing video...' 
            });
            break;
          case 'transcribing':
            onProgressUpdate({ 
              status: 'transcribing', 
              progress: 40, 
              message: 'Transcribing audio...' 
            });
            currentStatus = 'transcribing';
            break;
          case 'generating':
            onProgressUpdate({ 
              status: 'generating', 
              progress: 70, 
              message: 'Generating questions...' 
            });
            currentStatus = 'generating';
            break;
          case 'completed':
            onProgressUpdate({ 
              status: 'complete', 
              progress: 100, 
              message: 'Processing complete!' 
            });
            processingComplete = true;
            break;
          case 'error':
            throw new Error('Processing failed on server');
          default:
            // Continue polling
            progressValue = Math.min(progressValue + 5, 95);
            onProgressUpdate({ 
              status: currentStatus as any, 
              progress: progressValue, 
              message: 'Processing in progress...' 
            });
        }
      } catch (error) {
        console.error('Error polling status:', error);
        // Continue polling unless it's a critical error
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Step 3: Return video file object
    const videoFile: VideoFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file), // Create local URL for video playback
      uploadedAt: new Date(uploadResult.file.uploadedAt),
    };

    return videoFile;

  } catch (error) {
    console.error('Error processing video:', error);
    onProgressUpdate({ 
      status: 'error', 
      progress: 0, 
      message: 'Processing failed. Please try again.' 
    });
    throw error;
  }
};

// Get transcript segments for a video
export const getTranscriptSegments = async (videoId: string): Promise<TranscriptSegment[]> => {
  try {
    const transcriptionResponse = await apiCall(`/api/transcription/file/${videoId}`);
    
    if (!transcriptionResponse.segments || transcriptionResponse.segments.length === 0) {
      return [];
    }

    // Convert API response to our format
    const segments: TranscriptSegment[] = transcriptionResponse.segments.map((segment: any) => ({
      id: `${videoId}_segment_${segment.segmentIndex}`,
      videoId: videoId,
      startTime: segment.startTime,
      endTime: segment.endTime,
      text: segment.text,
    }));

    return segments;
  } catch (error) {
    console.error('Error fetching transcript segments:', error);
    throw new Error('Failed to fetch transcript segments');
  }
};

// Get questions for a specific segment
export const getMCQuestions = async (segmentId: string): Promise<MCQuestion[]> => {
  try {
    // Extract videoId and segmentIndex from segmentId
    const parts = segmentId.split('_segment_');
    if (parts.length !== 2) {
      throw new Error('Invalid segment ID format');
    }
    
    const [videoId, segmentIndexStr] = parts;
    const segmentIndex = parseInt(segmentIndexStr, 10);
    
    // First get transcription ID
    const transcriptionResponse = await apiCall(`/api/transcription/file/${videoId}`);
    const transcriptionId = transcriptionResponse._id;
    
    if (!transcriptionId) {
      throw new Error('Transcription not found');
    }

    // Get questions for this segment
    const questionsResponse = await apiCall(`/api/questions/transcription/${transcriptionId}/segment/${segmentIndex}`);
    
    if (!Array.isArray(questionsResponse)) {
      return [];
    }

    // Convert API response to our format
    const questions: MCQuestion[] = questionsResponse.map((q: any) => ({
      id: q._id,
      segmentId: segmentId,
      question: q.question,
      options: q.options.map((opt: any) => opt.text),
      correctAnswer: q.options.findIndex((opt: any) => opt.isCorrect),
    }));

    return questions;
  } catch (error) {
    console.error('Error fetching questions:', error);
    // Return empty array instead of throwing to maintain UI stability
    return [];
  }
};

// Get all questions for a video (for export functionality)
export const getAllQuestions = async (videoId: string): Promise<MCQuestion[]> => {
  try {
    // First get transcription ID
    const transcriptionResponse = await apiCall(`/api/transcription/file/${videoId}`);
    const transcriptionId = transcriptionResponse._id;
    
    if (!transcriptionId) {
      throw new Error('Transcription not found');
    }

    // Get all questions for this transcription
    const questionsResponse = await apiCall(`/api/questions/transcription/${transcriptionId}`);
    
    if (!Array.isArray(questionsResponse)) {
      return [];
    }

    // Convert API response to our format
    const questions: MCQuestion[] = questionsResponse.map((q: any) => ({
      id: q._id,
      segmentId: `${videoId}_segment_${q.segmentIndex}`,
      question: q.question,
      options: q.options.map((opt: any) => opt.text),
      correctAnswer: q.options.findIndex((opt: any) => opt.isCorrect),
    }));

    return questions;
  } catch (error) {
    console.error('Error fetching all questions:', error);
    return [];
  }
};

// Export questions in specified format
export const exportMCQs = async (videoId: string, format: 'json' | 'csv' = 'json'): Promise<string> => {
  try {
    const questions = await getAllQuestions(videoId);
    
    if (format === 'json') {
      const exportData = {
        videoId,
        exportedAt: new Date().toISOString(),
        totalQuestions: questions.length,
        questions: questions.map(q => ({
          id: q.id,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          correctAnswerText: q.options[q.correctAnswer]
        }))
      };
      
      return JSON.stringify(exportData, null, 2);
    } else {
      // CSV format
      let csvContent = 'Question ID,Question,Option A,Option B,Option C,Option D,Correct Answer\n';
      
      questions.forEach(q => {
        const options = [...q.options];
        // Pad options to 4 if less than 4
        while (options.length < 4) {
          options.push('');
        }
        
        const row = [
          q.id,
          `"${q.question.replace(/"/g, '""')}"`, // Escape quotes
          `"${options[0].replace(/"/g, '""')}"`,
          `"${options[1].replace(/"/g, '""')}"`,
          `"${options[2].replace(/"/g, '""')}"`,
          `"${options[3].replace(/"/g, '""')}"`,
          String.fromCharCode(65 + q.correctAnswer) // A, B, C, D
        ].join(',');
        
        csvContent += row + '\n';
      });
      
      return csvContent;
    }
  } catch (error) {
    console.error('Error exporting questions:', error);
    throw new Error('Failed to export questions');
  }
};

// Health check function to verify API connectivity
export const checkAPIHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      timeout: 5000
    } as any);
    return response.ok;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};