
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  currentTime?: number;
  onTimeUpdate?: (time: number) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  currentTime,
  onTimeUpdate
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentProgress, setCurrentProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && currentTime !== undefined) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      setCurrentProgress(current);
      
      if (onTimeUpdate) {
        onTimeUpdate(current);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSliderChange = (value: number[]) => {
    const newTime = value[0];
    setCurrentProgress(newTime);
    
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full">
      <CardContent className="p-0 relative">
        <video
          ref={videoRef}
          className="w-full rounded-t-lg"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          src={videoUrl}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-4 py-2">
          <div className="flex items-center mb-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20 h-8 w-8"
              onClick={togglePlayPause}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </Button>
            <div className="flex-1 mx-2">
              <Slider
                value={[currentProgress]}
                max={duration || 100}
                step={1}
                onValueChange={handleSliderChange}
                className="cursor-pointer"
              />
            </div>
            <span className="text-white text-xs min-w-[80px] text-right">
              {formatTime(currentProgress)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoPlayer;
