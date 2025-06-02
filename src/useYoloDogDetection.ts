import { useState, useEffect } from "react";
import * as tf from '@tensorflow/tfjs';

type DetectionResult = {
  frameBlob: Blob;
  timestamp: number;
  confidence: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
};

// YOLO 모델의 클래스 이름들
const CLASSES = ['dog', 'cat', 'person', /* ... other classes */];

export function useYoloDogDetection(file: File | null, onComplete: () => void) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedFrames, setDetectedFrames] = useState([] as DetectionResult[]);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<tf.GraphModel | null>(null);

  // 모델 로드
  useEffect(() => {
    async function loadModel() {
      try {
        // YOLOv5 모델 로드 (모델은 public/model 폴더에 있다고 가정)
        const loadedModel = await tf.loadGraphModel('/model/model.json');
        setModel(loadedModel);
        console.log("YOLO model loaded successfully");
      } catch (err) {
        console.error("Error loading YOLO model:", err);
        setError("모델 로딩 중 오류가 발생했습니다.");
      }
    }
    loadModel();
  }, []);

  // 이미지 전처리
  const preprocess = async (imageData: ImageData): Promise<tf.Tensor> => {
    const tensor = tf.browser.fromPixels(imageData);
    // YOLO 입력 크기로 리사이즈 (예: 640x640)
    const resized = tf.image.resizeBilinear(tensor, [640, 640]);
    // 정규화 [0, 1]
    const normalized = tf.div(resized, 255);
    // 배치 차원 추가
    const batched = tf.expandDims(normalized, 0);
    tensor.dispose();
    resized.dispose();
    normalized.dispose();
    return batched;
  };

  // 후처리 (바운딩 박스 처리)
  const postprocess = (prediction: tf.Tensor, confidence_threshold = 0.25) => {
    const [boxes, scores, classes] = tf.split(prediction, [4, 1, -1], -1);
    const validDetections = [];

    // CPU로 데이터 이동
    const boxesData = boxes.arraySync() as number[][];
    const scoresData = scores.arraySync() as number[][];
    const classesData = classes.arraySync() as number[][];

    for (let i = 0; i < boxesData.length; i++) {
      const score = scoresData[i][0];
      const classId = classesData[i][0];
      
      if (score > confidence_threshold && CLASSES[classId] === 'dog') {
        validDetections.push({
          bbox: boxesData[i],
          confidence: score,
          class: CLASSES[classId]
        });
      }
    }

    return validDetections;
  };

  // 비디오 처리
  useEffect(() => {
    if (!file || !model) return;

    let isCancelled = false;
    let videoURL: string | null = null;

    async function processVideo() {
      try {
        setIsProcessing(true);
        setError(null);

        if (!file) {
          throw new Error('No file selected');
        }
        videoURL = URL.createObjectURL(file);
        console.log("Processing video...");

        const video = document.createElement("video");
        video.src = videoURL;
        video.crossOrigin = "anonymous";
        video.muted = true;
        video.playsInline = true;

        await new Promise((resolve) => {
          video.onloadeddata = () => resolve(true);
        });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const results: DetectionResult[] = [];
        const frameInterval = 500; // 0.5초 간격

        const processFrame = async () => {
          if (isCancelled) return;

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // 이미지 전처리
          const input = await preprocess(imageData);
          
          // 예측 수행
          if (!model) {
            throw new Error('Model is not loaded');
          }
          const prediction = model.predict(input) as tf.Tensor;
          
          // 후처리
          const detections = postprocess(prediction);
          
          // 텐서 정리
          input.dispose();
          prediction.dispose();

          if (detections.length > 0) {
            console.log(`강아지 감지! (${Math.round(video.currentTime)}초)`);
            const bestDetection = detections.reduce((prev, current) => 
              current.confidence > prev.confidence ? current : prev
            );

            const blob = await new Promise<Blob>((resolve) => {
              canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.8);
            });

            results.push({
              frameBlob: blob,
              timestamp: video.currentTime,
              confidence: bestDetection.confidence,
              bbox: bestDetection.bbox as [number, number, number, number]
            });
          }

          if (video.currentTime < video.duration) {
            video.currentTime = Math.min(
              video.currentTime + frameInterval / 1000,
              video.duration
            );
          } else {
            console.log(`분석 완료! ${results.length}개의 프레임에서 강아지 감지`);
            setDetectedFrames(results);
            setIsProcessing(false);
            onComplete();
            if (videoURL) URL.revokeObjectURL(videoURL);
          }
        };

        video.onseeked = processFrame;
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
  }, [file, model, onComplete]);

  return { isProcessing, detectedFrames, error };
} 