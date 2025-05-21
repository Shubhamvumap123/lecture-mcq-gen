
import { VideoFile, TranscriptSegment, MCQuestion, ProcessingProgress, ProcessingStatus } from "../types";

// Helper functions to generate mock data
const generateId = (): string => Math.random().toString(36).substring(2, 15);

const wait = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// Mock video processing service
export const mockProcessVideo = async (
  file: File, 
  onProgressUpdate: (progress: ProcessingProgress) => void
): Promise<VideoFile> => {
  // Create a URL for the uploaded file
  const url = URL.createObjectURL(file);
  
  // Simulate upload process
  onProgressUpdate({ status: 'uploading', progress: 0 });
  await wait(1000);
  onProgressUpdate({ status: 'uploading', progress: 50 });
  await wait(1000);
  onProgressUpdate({ status: 'uploading', progress: 100 });
  
  // Simulate processing
  onProgressUpdate({ status: 'processing', progress: 0, message: 'Preparing video for transcription' });
  await wait(1500);
  onProgressUpdate({ status: 'processing', progress: 100, message: 'Video processed successfully' });
  
  // Simulate transcription
  onProgressUpdate({ status: 'transcribing', progress: 0, message: 'Starting transcription' });
  await wait(2000);
  onProgressUpdate({ status: 'transcribing', progress: 30, message: 'Transcribing audio' });
  await wait(2000);
  onProgressUpdate({ status: 'transcribing', progress: 70, message: 'Finalizing transcript' });
  await wait(1000);
  onProgressUpdate({ status: 'transcribing', progress: 100, message: 'Transcript complete' });
  
  // Simulate question generation
  onProgressUpdate({ status: 'generating', progress: 0, message: 'Preparing to generate questions' });
  await wait(1500);
  onProgressUpdate({ status: 'generating', progress: 50, message: 'Generating questions from transcript' });
  await wait(1500);
  onProgressUpdate({ status: 'generating', progress: 100, message: 'Questions generated successfully' });
  
  // Complete process
  onProgressUpdate({ status: 'complete', progress: 100, message: 'Process completed successfully' });
  
  // Return a mock video file object
  const videoFile: VideoFile = {
    id: generateId(),
    name: file.name,
    size: file.size,
    type: file.type,
    url,
    uploadedAt: new Date(),
  };
  
  return videoFile;
};

// Mock transcript fetching service
export const mockGetTranscriptSegments = async (videoId: string): Promise<TranscriptSegment[]> => {
  await wait(1000); // Simulate API delay
  
  // Generate 12 segments (for a ~60 minute video with 5-min segments)
  const segments: TranscriptSegment[] = [];
  
  const loremIpsum = [
    "Welcome to our lecture on advanced algorithms and data structures. Today, we're going to explore how these concepts are implemented in modern software systems.",
    "Let's start by understanding the basics of time complexity. Big O notation is a mathematical notation that describes the limiting behavior of a function when the argument tends towards a particular value or infinity.",
    "In computer science, we use Big O to classify algorithms according to how their run time or space requirements grow as the input size grows.",
    "Moving on to data structures, a binary search tree is a node-based binary tree data structure which has the following properties: The left subtree of a node contains only nodes with keys lesser than the node's key.",
    "The right subtree of a node contains only nodes with keys greater than the node's key. The left and right subtree each must also be a binary search tree.",
    "When implementing sorting algorithms, quicksort is often the preferred choice due to its efficiency. It works by selecting a 'pivot' element and partitioning the array around the pivot.",
    "Dynamic programming is both a mathematical optimization method and a computer programming method. In both contexts it refers to simplifying a complicated problem by breaking it down into simpler sub-problems.",
    "Graph algorithms are a significant area of study. Breadth-first search (BFS) is an algorithm for traversing or searching tree or graph data structures.",
    "Dijkstra's algorithm is a popular algorithm for finding the shortest paths between nodes in a graph, which may represent road networks or computer networks.",
    "Machine learning algorithms often rely on efficient data structures. K-means clustering is a method of vector quantization that aims to partition n observations into k clusters.",
    "Neural networks are composed of layers of computational units called neurons, with connections between them. The networks can learn complex patterns using backpropagation.",
    "To conclude our lecture, understanding these algorithms and data structures is fundamental to efficient software design and implementation across various domains of computer science."
  ];
  
  for (let i = 0; i < 12; i++) {
    segments.push({
      id: generateId(),
      videoId,
      startTime: i * 300, // 5 minutes in seconds
      endTime: (i + 1) * 300,
      text: loremIpsum[i % loremIpsum.length],
    });
  }
  
  return segments;
};

// Mock questions fetching service
export const mockGetMCQuestions = async (segmentId: string): Promise<MCQuestion[]> => {
  await wait(800); // Simulate API delay
  
  // Generate 3-5 questions per segment
  const questionCount = Math.floor(Math.random() * 3) + 3;
  const questions: MCQuestion[] = [];
  
  const mockQuestions = [
    {
      question: "What notation is commonly used to describe algorithm efficiency?",
      options: ["Alpha notation", "Beta functions", "Big O notation", "Small N classification"],
      correctAnswer: 2
    },
    {
      question: "Which sorting algorithm was mentioned as often being the preferred choice due to its efficiency?",
      options: ["Bubble sort", "Merge sort", "Insertion sort", "Quicksort"],
      correctAnswer: 3
    },
    {
      question: "What is a key property of a binary search tree?",
      options: [
        "All nodes must have exactly two children", 
        "The left subtree contains only nodes with keys lesser than the node's key", 
        "The tree must be perfectly balanced", 
        "Nodes must be stored in contiguous memory"
      ],
      correctAnswer: 1
    },
    {
      question: "What programming method breaks down complex problems into simpler sub-problems?",
      options: ["Object-oriented programming", "Functional programming", "Dynamic programming", "Procedural programming"],
      correctAnswer: 2
    },
    {
      question: "Which algorithm is used for finding the shortest paths between nodes in a graph?",
      options: ["A* algorithm", "Dijkstra's algorithm", "Bellman-Ford algorithm", "Floyd-Warshall algorithm"],
      correctAnswer: 1
    },
    {
      question: "What machine learning algorithm aims to partition observations into clusters?",
      options: ["Random Forest", "Support Vector Machines", "K-means clustering", "Linear Regression"],
      correctAnswer: 2
    },
    {
      question: "What learning mechanism do neural networks typically use?",
      options: ["Forward propagation", "Lateral inhibition", "Backpropagation", "Reverse engineering"],
      correctAnswer: 2
    }
  ];
  
  // Select random questions from our pool
  const availableIndices = [...Array(mockQuestions.length).keys()];
  for (let i = 0; i < questionCount; i++) {
    if (availableIndices.length === 0) break;
    
    const randomIndex = Math.floor(Math.random() * availableIndices.length);
    const questionIndex = availableIndices[randomIndex];
    availableIndices.splice(randomIndex, 1);
    
    const mockQ = mockQuestions[questionIndex];
    
    questions.push({
      id: generateId(),
      segmentId,
      question: mockQ.question,
      options: mockQ.options,
      correctAnswer: mockQ.correctAnswer
    });
  }
  
  return questions;
};

export const exportMCQs = async (videoId: string, format: 'json' | 'csv' = 'json'): Promise<string> => {
  await wait(800);
  
  // This would typically fetch all questions and format them
  // For this mock, we'll just return a sample string
  if (format === 'json') {
    return JSON.stringify({ 
      videoId, 
      exportedAt: new Date().toISOString(),
      message: "MCQs exported successfully in JSON format" 
    }, null, 2);
  } else {
    return `videoId,questionId,question,options,correctAnswer\n${videoId},q1,"Sample question","Option 1|Option 2|Option 3|Option 4",2`;
  }
};
