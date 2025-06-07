import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // 추가: React Router의 useNavigate 훅 임포트
import './Home.css';
import { useDogFaceDetection } from "./useDogFaceDetection.ts";
import * as tf from '@tensorflow/tfjs';

// 지원되는 비디오 포맷 체크
const SUPPORTED_VIDEO_FORMATS = [
  'video/mp4',
  'video/webm',
  'video/ogg'
];

function Home() {
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [imageFile, setImageFile] = useState(null); // 추가: 업로드된 파일을 저장하기 위한 상태
  const [inputFile, setInputFile] = useState(null);
  const [frameFile, setFrameFile] = useState(null);
  const [localIsProcessing, setLocalIsProcessing] = useState(false);
  const fileInputRef = useRef(null);
  const uploadBoxRef = useRef(null);
  const loadingRef = useRef(null);
  const ballRef = useRef(null);
  const dogHeadRef = useRef(null);
  const analyzeRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [currentAngle, setCurrentAngle] = useState(0);
  const [targetAngle, setTargetAngle] = useState(0);
  const [ballDimensions, setBallDimensions] = useState({ width: 32, height: 32 });
  const [error, setError] = useState(null);
  const [currentFormat, setCurrentFormat] = useState('');
  const [currentFrame, setCurrentFrame] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null); // 선택된 이미지 인덱스

  const navigate = useNavigate(); // 추가: 페이지 이동을 위한 useNavigate 훅 초기화

  
// 타입 선언 없이 null로 초기화

//동영상 분석 완료시
const handleAnalysisComplete = useCallback(() => {
  console.log("분석 완료!");
  setLocalIsProcessing(false);
  setCurrentFrame(0); // 프레임 카운터 리셋
}, []);

// 프레임 처리 콜백 추가
const handleFrameProcessing = useCallback((frameNumber) => {
  setCurrentFrame(frameNumber);
}, []);

// 동영상 강아지 얼굴 분석
const { isProcessing, detectedFrames, error: frameError } = useDogFaceDetection(
  frameFile,
  handleAnalysisComplete,
  handleFrameProcessing // 프레임 처리 콜백 전달
);

  // 비디오 파일 포맷 체크
  const checkVideoFormat = useCallback((file) => {
    if (!file.type.startsWith('video/')) return true; // 이미지 파일은 통과
    return SUPPORTED_VIDEO_FORMATS.includes(file.type);
  }, []);

  // 비디오 파일 변환
  const convertVideo = useCallback(async (file) => {
    try {
      setCurrentFormat(file.type); // 현재 파일 형식 저장
      // MediaRecorder API를 사용하여 비디오를 WebM 형식으로 변환
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.src = url;
      video.muted = true;

      await new Promise((resolve) => {
        video.onloadedmetadata = () => resolve();
      });

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      const stream = canvas.captureStream();
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm'
      });

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const convertedFile = new File([blob], 'converted-video.webm', { type: 'video/webm' });
        setFrameFile(convertedFile);
        URL.revokeObjectURL(url);
      };

      video.onplay = () => {
        const drawFrame = () => {
          if (video.ended || video.paused) {
            mediaRecorder.stop();
            return;
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          requestAnimationFrame(drawFrame);
        };
        drawFrame();
      };

      mediaRecorder.start();
      video.play();
    } catch (error) {
      console.error('Video conversion error:', error);
      throw new Error('비디오 변환 중 오류가 발생했습니다.');
    }
  }, []);

  // 파일 변경 핸들러 수정
  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setInputFile(file);
    setCurrentFormat(file.type);

    if (file.type.startsWith("image/")) {
      // 이미지도 잠깐의 로딩 상태 표시
      setLocalIsProcessing(true);
      setImageFile(file);
      setFrameFile(file);
      setIsFileUploaded(true);
      
      // 1초 후에 로딩 상태 해제
      setTimeout(() => {
        setLocalIsProcessing(false);
      }, 1000);
    } else if (file.type.startsWith("video/")) {
      // 비디오 처리 (기존과 동일)
      setLocalIsProcessing(true);
      const processVideo = async () => {
        try {
          if (!checkVideoFormat(file)) {
            await convertVideo(file);
          } else {
            setFrameFile(file);
          }
          setIsFileUploaded(true);
        } catch (error) {
          console.error('File processing error:', error);
          setLocalIsProcessing(false);
          setError(error.message);
        }
      };
      processVideo();
    }
  }, [checkVideoFormat, convertVideo]);

//////////////////여기서 동영상과 이미지 처리를 다르게 하는 로직이 끝남//////////////////////////



  // 추가: 분석 완료 시 Feedback.js로 이동하는 함수
  const handleAnalyzeComplete = useCallback(() => {
    if (imageFile) {
      navigate('/feedback', { state: { imageFile } }); // 추가: imageFile을 Feedback.js로 전달하며 페이지 이동
    } else {
      alert('이미지를 먼저 업로드해주세요!'); // 추가: 파일이 없을 경우 경고 표시
    }
  }, [imageFile, navigate]);

  // Initialize ball position and verify refs
  useEffect(() => {
    if (isFileUploaded && ballRef.current && loadingRef.current && dogHeadRef.current) {
      const ballRect = ballRef.current.getBoundingClientRect();
      setBallDimensions({ width: ballRect.width, height: ballRect.height });
      // 중앙에 공 배치
      const loadingRect = loadingRef.current.getBoundingClientRect();
      const initialX = loadingRect.width / 2 - ballRect.width / 2;
      const initialY = loadingRect.height / 2 - ballRect.height / 2 + 50; // 약간 아래로 조정
      ballRef.current.style.position = 'absolute';
      ballRef.current.style.left = `${initialX}px`;
      ballRef.current.style.top = `${initialY}px`;
    }
  }, [isFileUploaded]);

  // Handle drag start
  const handleMouseDown = useCallback((e) => {
    if (ballRef.current) {
      const ballRect = ballRef.current.getBoundingClientRect();
      const offsetX = e.clientX - ballRect.left;
      const offsetY = e.clientY - ballRect.top;
      setOffset({ x: offsetX, y: offsetY });
      setIsDragging(true);
      e.preventDefault();
    }
  }, []);

  // Handle drag movement
  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !ballRef.current || !dogHeadRef.current) return;

    let x = e.clientX - offset.x;
    let y = e.clientY - offset.y;

    const maxX = window.innerWidth - ballDimensions.width;
    const maxY = window.innerHeight - ballDimensions.height;
    x = Math.min(Math.max(0, x), maxX);
    y = Math.min(Math.max(0, y), maxY);

    ballRef.current.style.position = 'fixed';
    ballRef.current.style.left = `${x}px`;
    ballRef.current.style.top = `${y}px`;
    ballRef.current.style.transform = 'none';

    const ballCenterX = x + ballDimensions.width / 2 - 20;
    const ballCenterY = y + ballDimensions.height / 2 + 100;

    const dogHeadRect = dogHeadRef.current.getBoundingClientRect();
    const dogCenterX = dogHeadRect.left + dogHeadRect.width / 2;
    const dogCenterY = dogHeadRect.top + dogHeadRect.height / 2;

    const dx = ballCenterX - dogCenterX;
    const dy = ballCenterY - dogCenterY;

    const angle = Math.atan2(dy, dx);
    let degrees = angle * (180 / Math.PI);
    const offsetAngle = -82;
    const desiredAngle = degrees + offsetAngle;

    const minAngle = -120;
    const maxAngle = 120;

    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 300;
    const distanceRatio = Math.min(distance / maxDistance, 1);

    if (desiredAngle >= minAngle && desiredAngle <= maxAngle) {
      setTargetAngle(desiredAngle);
    }
  }, [isDragging, offset, ballDimensions]);

  // Handle drag end
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Animation loop for smooth rotation
  useEffect(() => {
    let animationFrameId;

    const animateRotation = () => {
      const lerpFactor = 0.05 + 0.15 * (Math.abs(targetAngle - currentAngle) / 180);
      setCurrentAngle(prev => {
        const newAngle = prev + (targetAngle - prev) * lerpFactor;
        if (dogHeadRef.current) {
          dogHeadRef.current.style.transform = `rotate(${newAngle}deg)`;
          dogHeadRef.current.style.transformOrigin = '60% 40%';
        }
        return newAngle;
      });

      animationFrameId = requestAnimationFrame(animateRotation);
    };

    if (isFileUploaded) {
      animateRotation();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [currentAngle, targetAngle, isFileUploaded]);

  // Add mouse event listeners
  useEffect(() => {
    if (isFileUploaded) {
      console.log('Adding mouse event listeners');
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      console.log('Removing mouse event listeners');
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isFileUploaded, handleMouseMove, handleMouseUp]);

  // Update visibility of upload box and loading area
  useEffect(() => {
    if (isFileUploaded) {
	//chang backgroundColor
      document.querySelector('main').style.backgroundColor = '#  background-color: #d2ff9f';
      if (uploadBoxRef.current) {
        uploadBoxRef.current.style.display = 'none';
        console.log('Upload box hidden');
      }
      if (loadingRef.current) {
        loadingRef.current.style.display = 'flex';
        console.log('Loading area displayed');
      }
      if (analyzeRef.current) {
        analyzeRef.current.style.display = 'block';
        console.log('Analyze area displayed');
      }
    } else {
      if (uploadBoxRef.current) {
        uploadBoxRef.current.style.display = 'block';
        console.log('Upload box displayed');
      }
      if (loadingRef.current) {
        loadingRef.current.style.display = 'none';
        console.log('Loading area hidden');
      }
      if (analyzeRef.current) {
        analyzeRef.current.style.display = 'none';
        console.log('Analyze area hidden');
      }
    }
  }, [isFileUploaded]);



  /////////////////여기서 개 공 애니메이션 로직이 끝남////////////////////////

  // 이미지 선택 핸들러 추가
  const handleImageSelect = useCallback((index) => {
    setSelectedImage(index);
  }, []);

  // 선택된 이미지 업로드 핸들러
  const handleImageUpload = useCallback(async () => {
    if (selectedImage === null) {
      alert('이미지를 선택해주세요!');
      return;
    }

    const selectedFrame = detectedFrames[selectedImage];
    if (!selectedFrame) {
      alert('선택된 이미지를 찾을 수 없습니다.');
      return;
    }

    // 실제 백엔드 API 엔드포인트로 변경
    const API_ENDPOINT = 'http://34.22.94.152:5000/predict';

    try {
      const formData = new FormData();
      formData.append('image', selectedFrame.frameBlob); // 파일 이름 인자 제거
      formData.append('confidence', selectedFrame.confidence.toString());
      formData.append('timestamp', selectedFrame.timestamp.toString());

      // 실제 API 호출
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('업로드 실패: ' + response.statusText);
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        // JSON 파싱 실패 시 텍스트로 대체
        data = await response.text();
      }
      console.log('업로드 성공:', data);
      alert('이미지가 성공적으로 업로드되었습니다! 결과: ' + JSON.stringify(data));
    } catch (error) {
      console.error('Upload error:', error);
      alert('업로드 중 오류가 발생했습니다.');
    }
  }, [selectedImage, detectedFrames]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="text-left p-4 text-2xl font-bold text-gray-800 border-b border-gray-300 bg-white">
        Wish4 <img src="/puppy.png" alt="Puppy Logo" className="header-image" /> AI
      </header>

      <main className="flex-grow flex flex-col items-center justify-center text-center p-8 bg-gray-50 border-t border-gray-300">
        <h1 className="text-5xl font-bold mb-4 text-gray-900">puppySense</h1>
        <p className="text-base text-gray-700 my-1">아래에 이미지나 동영상을 업로드하면</p>
        <p className="text-base text-gray-700 my-1">강아지의 표정을 퍼센트로 알려드릴 수 있습니다.</p>
        <p className="text-sm text-gray-500 mt-2 note">동영상은 이미지보다 오랜 시간이 걸릴 수 있습니다.</p>

        {(error || frameError) && (
          <div className="mt-4 p-4 bg-red-100 rounded-lg">
            <p className="text-red-800">오류가 발생했습니다: {error || frameError}</p>
            <button
              className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              onClick={() => window.location.reload()}
            >
              다시 시도
            </button>
          </div>
        )}

        {(isProcessing || localIsProcessing) && inputFile?.type.startsWith('video/') && !(error || frameError) && (
          <div className="mt-4 p-4 bg-blue-100 rounded-lg">
            {!SUPPORTED_VIDEO_FORMATS.includes(currentFormat) ? (
              <div>
                <p className="text-sm text-red-600 mt-1">'{currentFormat}' 형식은 지원되지 않습니다.</p>
                <p className="text-sm text-blue-600">지원되는 형식은 다음과 같습니다:</p>
                <p className="text-sm text-blue-600 mt-1">• MP4 (.mp4)</p>
                <p className="text-sm text-blue-600">• WebM (.webm)</p>
                <p className="text-sm text-blue-600">• OGG (.ogg)</p>
              </div>
            ) : (
              currentFrame > 0 && (
                <p className="text-blue-800">
                  동영상 분석 중입니다... (프레임 {currentFrame} 처리 중)
                </p>
              )
            )}
          </div>
        )}

        {(isProcessing || localIsProcessing) && !(error || frameError) && (
          <>
            <div id="loading" ref={loadingRef} className="flex flex-col items-center justify-center w-full">
              <div className="relative flex justify-center items-center w-64 h-64">
                <div className="dog relative w-24 h-24">
                  <div className="dog-body">
                    <div className="dog-tail">
                      <div className="dog-tail">
                        <div className="dog-tail">
                          <div className="dog-tail">
                            <div className="dog-tail">
                              <div className="dog-tail">
                                <div className="dog-tail"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="dog-torso"></div>
                  <div className="dog-head" ref={dogHeadRef}>
                    <div className="dog-ears">
                      <div className="dog-ear"></div>
                      <div className="dog-ear"></div>
                    </div>
                    <div className="dog-eyes">
                      <div className="dog-eye"></div>
                      <div className="dog-eye"></div>
                    </div>
                    <div className="dog-muzzle">
                      <div className="dog-tongue"></div>
                    </div>
                  </div>
                  <div
                    className="ball cursor-move absolute"
                    ref={ballRef}
                    onMouseDown={handleMouseDown}
                    tabIndex={0}
                  ></div>
                </div>
              </div>
            </div>
            <div id="analyze" ref={analyzeRef}>
              <div className="message">분석 중입니다... 잠시만 기다려 주세요!</div>
              <div>그동안 공을 드래그해서 강아지와 놀아주세요!</div>
            </div>
          </>
        )}

        {!isFileUploaded && (
          <label
            htmlFor="file-input"
            className="mt-8 p-12 border-2 border-dashed border-gray-400 rounded-2xl bg-white cursor-pointer hover:bg-gray-100 upload-box"
            ref={uploadBoxRef}
          >
            <p className="text-lg font-medium upload-title">Click here to upload</p>
            <p>an image or video file</p>
            <span className="inline-block mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 button">
              select file
            </span>
            <input
              type="file"
              id="file-input"
              accept="image/*,video/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </label>
        )}

{(!isProcessing && !localIsProcessing && detectedFrames.length > 0) && (
  <div className="mt-4 w-full max-w-4xl">
    <h3 className="text-lg font-semibold mb-2">
      감지된 강아지 얼굴: {detectedFrames.length}개
      {detectedFrames.length > 0 &&
        ` (${Math.round(detectedFrames[0].timestamp)}초 ~ ${Math.round(
          detectedFrames[detectedFrames.length - 1].timestamp
        )}초)`}
    </h3>
    <div className="video-tuning-img">
      {detectedFrames.map((frame, index) => (
        <div
          key={index}
          className="border rounded-lg p-2 bg-white shadow-sm transition-all cursor-pointer hover:shadow-md hover:brightness-90"
          onClick={() => handleImageSelect(index)}
        >
          <div className="relative puppy-tuning-img-wrap">
            <p className="puppy-tuning-img-p text-sm font-medium text-gray-900">
              {index + 1}
            </p>
            <div className="relative">
              <img
                src={URL.createObjectURL(frame.frameBlob)}
                alt={`강아지 얼굴 프레임 ${index + 1}`}
                style={{
                  width: '70px',
                  height: '70px',
                  display: 'inline-block',
                  objectFit: 'cover',
                }}
                className={`rounded ${selectedImage === index ? 'selected-image' : ''}`}
                onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
              />
              <div
                className="absolute border-2 border-blue-500"
                style={{
                  left: `${(frame.faceBox.topLeft[0] / frame.frameBlob.size) * 100}%`,
                  top: `${(frame.faceBox.topLeft[1] / frame.frameBlob.size) * 100}%`,
                  width: `${((frame.faceBox.bottomRight[0] - frame.faceBox.topLeft[0]) / frame.frameBlob.size) * 100}%`,
                  height: `${((frame.faceBox.bottomRight[1] - frame.faceBox.topLeft[1]) / frame.frameBlob.size) * 100}%`,
                }}
              />
            </div>
          </div>
          <div className="puppy-tuning-img-time-wrap">
            {selectedImage === index && (
              <svg
                className="check-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
            <div className="frame-info">
              <span className="confidence">{Math.round(frame.confidence * 100)}%</span>
              <span className="timestamp">{Math.round(frame.timestamp)}초</span>
            </div>
          </div>
        </div>
      ))}
    </div>
    <div className="action-buttons">
      <div className="message">분석할 1개의 이미지를 선택해주세요</div>
      <div className="button-group">
        <button
          className={`upload-button ${selectedImage !== null ? '' : 'disabled'}`}
          onClick={handleImageUpload}
          disabled={selectedImage === null}
        >
          선택한 이미지 업로드
        </button>
        <button
          className="retry-button"
          onClick={() => {
            window.location.reload();
          }}
        >
         <svg
            className="retry-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
)}

      </main>
      <footer className="text-center text-sm text-gray-500 py-4">
        © 2025 PuppySense™ · A Wish4Pup Team Project
      </footer>
    </div>
  );
}

export default Home;
