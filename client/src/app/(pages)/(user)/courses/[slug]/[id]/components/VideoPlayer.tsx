"use client"

import type React from "react"
import { useRef, useState, useEffect } from "react"
import ReactPlayer from "react-player"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface VideoPlayerProps {
  videoUrl: string | null
  isLoading: boolean
  onProgress: (progress: {
    played: number
    playedSeconds: number
    loaded: number
    loadedSeconds: number
  }) => void
  onDuration: (duration: number) => void
  onEnded: () => void
  className?: string
  initialProgress?: number
  isCompleted?: boolean
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  isLoading,
  onProgress,
  onDuration,
  onEnded,
  className,
  initialProgress = 0,
  isCompleted = false
}) => {
  const playerRef = useRef<ReactPlayer>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [duration, setDuration] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (playerRef.current && initialProgress > 0 && !hasStarted) {
      playerRef.current.seekTo(initialProgress, "seconds")
      setHasStarted(true)
    }
  }, [initialProgress, hasStarted])

  const handleProgress = (state: {
    played: number
    playedSeconds: number
    loaded: number
    loadedSeconds: number
  }) => {
    setProgress((state.playedSeconds / duration) * 100)
    onProgress(state)
  }

  const handleDuration = (duration: number) => {
    setDuration(duration)
    onDuration(duration)
  }

  const handleEnded = () => {
    if (progress >= 80 || isCompleted) {
      onEnded()
    } else {
      toast.error("Please watch at least 80% of the video to complete this chapter")
      if (playerRef.current) {
        playerRef.current.seekTo(0)
      }
    }
  }

  return (
    <div className={cn("relative aspect-video", className)}>
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
          <span className="text-gray-500">Loading video...</span>
        </div>
      ) : (
        <ReactPlayer
          ref={playerRef}
          url={videoUrl || ""}
          width="100%"
          height="100%"
          controls
          playing={isPlaying}
          onProgress={handleProgress}
          onDuration={handleDuration}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          config={{
            youtube: {
              playerVars: {
                modestbranding: 1,
                rel: 0,
              },
            },
          }}
        />
      )}
    </div>
  )
}

export default VideoPlayer

