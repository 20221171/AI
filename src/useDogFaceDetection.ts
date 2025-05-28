import { useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

interface DetectedFrame {
  frameBlob: Blob;
  confidence: number;
  timestamp: number;
  faceBox: {
    topLeft: [number, number];
    bottomRight: [number, number];
  };
}

export const useDogFaceDetection = (
  file: File | null,
  onComplete: () => void,
  onFrameProcessing: (frameNumber: number) => void
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedFrames, setDetectedFrames] = useState<DetectedFrame[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;

    const detectFaces = async () => {
      try {
        setIsProcessing(true);
        setError(null);

        // Load BlazeFace model
        const model = await blazeface.load();

        if (file.type.startsWith('image/')) {
          onFrameProcessing(1); // 이미지 처리 시작
          // Handle image file
          const imageUrl = URL.createObjectURL(file);
          const img = new Image();
          img.src = imageUrl;
          await new Promise((resolve) => (img.onload = resolve));

          // Create canvas and get image data
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Could not get canvas context');
          ctx.drawImage(img, 0, 0);
          
          // Convert to tensor
          const imageTensor = tf.browser.fromPixels(canvas);
          
          // Detect faces
          const predictions = await model.estimateFaces(imageTensor as unknown as tf.Tensor3D, false);
          
          if (predictions.length > 0) {
            // Convert canvas to blob
            const blob = await new Promise<Blob>((resolve) =>
              canvas.toBlob((b) => resolve(b || new Blob()))
            );

            setDetectedFrames([
              {
                frameBlob: blob,
                confidence: predictions[0].probability[0],
                timestamp: 0,
                faceBox: {
                  topLeft: predictions[0].topLeft as [number, number],
                  bottomRight: predictions[0].bottomRight as [number, number],
                },
              },
            ]);
          }

          // Cleanup
          URL.revokeObjectURL(imageUrl);
          imageTensor.dispose();
          onFrameProcessing(0); // 이미지 처리 완료

        } else if (file.type.startsWith('video/')) {
          // Handle video file
          const video = document.createElement('video');
          video.src = URL.createObjectURL(file);
          video.muted = true;

          await new Promise((resolve) => {
            video.onloadedmetadata = resolve;
          });

          const duration = Math.min(30, video.duration); // 최대 30초까지 분석
          const frameRate = 1; // 초당 1프레임 추출
          const totalFrames = Math.floor(duration * frameRate);
          const MAX_DETECTED_FRAMES = 10; // 최대 10개의 감지된 프레임만 저장

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Could not get canvas context');

          const detectedFrames: DetectedFrame[] = [];
          
          // 진행 상황을 콘솔에 표시
          console.log(`비디오 분석 시작: 총 ${totalFrames}프레임 중 강아지 얼굴 ${MAX_DETECTED_FRAMES}개 찾기`);

          try {
            for (let i = 0; i < totalFrames && detectedFrames.length < MAX_DETECTED_FRAMES; i++) {
              onFrameProcessing(i + 1); // 현재 처리 중인 프레임 번호 전달
              const timestamp = i / frameRate;
              video.currentTime = timestamp;

              await new Promise((resolve) => {
                video.onseeked = resolve;
              });

              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              ctx.drawImage(video, 0, 0);

              const imageTensor = tf.browser.fromPixels(canvas);
              const predictions = await model.estimateFaces(imageTensor as unknown as tf.Tensor3D, false);

              if (predictions.length > 0) {
                const blob = await new Promise<Blob>((resolve) =>
                  canvas.toBlob((b) => resolve(b || new Blob()))
                );

                detectedFrames.push({
                  frameBlob: blob,
                  confidence: predictions[0].probability[0],
                  timestamp,
                  faceBox: {
                    topLeft: predictions[0].topLeft as [number, number],
                    bottomRight: predictions[0].bottomRight as [number, number],
                  },
                });
                
                // 진행 상황 로깅
                console.log(`강아지 얼굴 감지! (${detectedFrames.length}/${MAX_DETECTED_FRAMES}) - ${Math.round(timestamp)}초`);
              }

              // 현재 진행 상황 로깅
              if (i % 5 === 0) { // 5프레임마다 진행상황 표시
                console.log(`프레임 분석 중: ${i + 1}/${totalFrames} (${Math.round(timestamp)}초)`);
              }

              imageTensor.dispose();
            }

            console.log(`분석 완료: ${detectedFrames.length}개의 강아지 얼굴 감지됨`);

            // 모든 프레임 처리가 완료된 후에 결과 설정
            setDetectedFrames(detectedFrames);
            URL.revokeObjectURL(video.src);
            
            onFrameProcessing(0); // 처리 완료
            onComplete();
          } catch (err) {
            console.error('Video processing error:', err);
            throw err;
          }
        }

      } catch (err) {
        console.error('Face detection error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsProcessing(false);
      }
    };

    detectFaces();
  }, [file, onComplete, onFrameProcessing]);

  return { isProcessing, detectedFrames, error };
}; 