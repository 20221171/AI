// useFrameDogDetection.ts
import { useState, useEffect } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

type DetectionResult = {
  frameBlob: Blob;
  timestamp: number;
  confidence: number;
};

export function useFrameDogDetection(file: File | null, onComplete: () => void) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedFrames, setDetectedFrames] = useState([] as DetectionResult[]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;

    let isCancelled = false;
    let videoURL: string | null = null;

    async function processVideo() {
      try {
        setIsProcessing(true);
        setError(null);

        console.log("Loading TensorFlow model...");
        const model = await cocoSsd.load({
          base: 'mobilenet_v2'  // 더 빠르고 가벼운 모델 사용
        });
        console.log("TensorFlow model loaded successfully");

        videoURL = URL.createObjectURL(file);
        console.log("Video URL created:", videoURL);

        const video = document.createElement("video");
        video.src = videoURL;
        video.crossOrigin = "anonymous";
        video.muted = true;
        video.playsInline = true;

        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Video loading timeout"));
          }, 10000);

          video.onloadedmetadata = () => {
            clearTimeout(timeout);
            console.log("Video metadata loaded. Duration:", video.duration);
            resolve(true);
          };

          video.onerror = (e) => {
            clearTimeout(timeout);
            reject(new Error(`Video loading failed: ${video.error?.message || 'Unknown error'}`));
          };
        });

        await new Promise((resolve, reject) => {
          video.onloadeddata = () => {
            console.log("Video data loaded. Size:", video.videoWidth, "x", video.videoHeight);
            resolve(true);
          };
          video.onerror = (e) => {
            reject(new Error(`Video data loading failed: ${video.error?.message || 'Unknown error'}`));
          };
        });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const results: DetectionResult[] = [];
        const frameInterval = 500; // 0.5초 간격으로 변경
        let totalFramesProcessed = 0;
        let dogFramesDetected = 0;

        const processFrame = async () => {
          if (isCancelled) return;

          try {
            totalFramesProcessed++;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const predictions = await model.detect(canvas, 20, 0.2); // 최대 20개 객체, 신뢰도 0.2 이상
            
            // 모든 예측 결과 로깅
            if (predictions.length > 0) {
              console.log("Detected objects:", predictions.map(p => `${p.class} (${Math.round(p.score * 100)}%)`));
            }

            const dogPredictions = predictions.filter(p => 
              p.class === "dog" || p.class === "cat" || // 고양이도 포함 (가끔 강아지를 고양이로 인식)
              p.class.includes("dog") || p.class.includes("puppy") // 다른 강아지 관련 클래스도 포함
            );
            
            const hasDog = dogPredictions.length > 0;

            if (hasDog) {
              dogFramesDetected++;
              const bestPrediction = dogPredictions.reduce((prev, current) => 
                (current.score > prev.score) ? current : prev
              );
              
              console.log(`강아지 감지! (${Math.round(video.currentTime)}초, 확률: ${Math.round(bestPrediction.score * 100)}%, 위치: ${JSON.stringify(bestPrediction.bbox)})`);
              
              const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob((b) => {
                  if (b) resolve(b);
                  else reject(new Error("Failed to create blob from canvas"));
                }, "image/jpeg", 0.8); // JPEG 품질 0.8로 설정
              });
              
              results.push({ 
                frameBlob: blob, 
                timestamp: video.currentTime,
                confidence: bestPrediction.score
              });
            } else {
              console.log(`${Math.round(video.currentTime)}초: 강아지 미감지`);
            }

            if (video.currentTime < video.duration) {
              video.currentTime = Math.min(
                video.currentTime + frameInterval / 1000,
                video.duration
              );
            } else {
              console.log(`분석 완료! 총 ${totalFramesProcessed}개 프레임 중 ${dogFramesDetected}개에서 강아지 감지됨 (${Math.round(dogFramesDetected/totalFramesProcessed * 100)}%)`);
              setDetectedFrames(results);
              setIsProcessing(false);
              onComplete();
              if (videoURL) URL.revokeObjectURL(videoURL);
            }
          } catch (err) {
            console.error("Frame processing error:", err);
            throw err;
          }
        };

        video.onseeked = async () => {
          try {
            await processFrame();
          } catch (err) {
            console.error("Error in frame processing:", err);
            setError("프레임 처리 중 오류가 발생했습니다.");
            setIsProcessing(false);
          }
        };

        video.currentTime = 0;

      } catch (error) {
        console.error("Video processing error:", error);
        setError(error instanceof Error ? error.message : "비디오 처리 중 오류가 발생했습니다.");
        setIsProcessing(false);
        if (videoURL) URL.revokeObjectURL(videoURL);
      }
    }

    processVideo();

    return () => {
      isCancelled = true;
      if (videoURL) URL.revokeObjectURL(videoURL);
    };
  }, [file, onComplete]);

  return { isProcessing, detectedFrames, error };
}
