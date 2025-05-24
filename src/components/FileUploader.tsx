
import React, { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  acceptedTypes?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  disabled = false,
  acceptedTypes = 'video/mp4'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndUpload(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndUpload(file);
    }
  };

  const validateAndUpload = (file: File) => {
    console.log('Selected file:', file.type);
    console.log('Selected acceptedTypes:', acceptedTypes);
    if (!file.type.match(acceptedTypes)) {
      toast.error('Invalid file type. Please upload an MP4 video file.');
      return;
    }
    
    // 500MB limit for demo purposes
    if (file.size > 500 * 1024 * 1024) {
      toast.error('File is too large. Maximum size is 500MB.');
      return;
    }
    
    onFileSelect(file);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div
          className={`file-drop-area ${isDragging ? 'active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={disabled ? undefined : triggerFileInput}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept={acceptedTypes}
            disabled={disabled}
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center">
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Upload Lecture Video</h3>
            <p className="text-gray-500 mb-4">Drag and drop an MP4 file here, or click to select</p>
            <Button disabled={disabled} variant="outline">
              Select Video
            </Button>
            <p className="text-xs text-gray-400 mt-4">Max file size: 500MB. MP4 format only.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUploader;
