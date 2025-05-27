import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // 추가: React Router의 useNavigate 훅 임포트
import './Home.css';

function Home() {
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [imageFile, setImageFile] = useState(null); // 추가: 업로드된 파일을 저장하기 위한 상태
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

  const navigate = useNavigate(); // 추가: 페이지 이동을 위한 useNavigate 훅 초기화

  // Handle file upload
  const handleFileChange = useCallback(() => {
    if (fileInputRef.current?.files?.length > 0) {
      console.log('File uploaded, showing loading area');
      const file = fileInputRef.current.files[0];
      console.log('File uploaded:', file.name);
      setImageFile(file); // 추가: 업로드된 파일을 imageFile 상태에 저장
      setIsFileUploaded(true);
    }
  }, []);

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
      console.log('Initializing ball, rect:', ballRect);
      setBallDimensions({ width: ballRect.width, height: ballRect.height });
      // 중앙에 공 배치
      const loadingRect = loadingRef.current.getBoundingClientRect();
      const initialX = loadingRect.width / 2 - ballRect.width / 2;
      const initialY = loadingRect.height / 2 - ballRect.height / 2 + 50; // 약간 아래로 조정
      ballRef.current.style.position = 'absolute';
      ballRef.current.style.left = `${initialX}px`;
      ballRef.current.style.top = `${initialY}px`;
      console.log('Ball initial position set to:', initialX, initialY);
      console.log('Dog head ref:', dogHeadRef.current);
      const tongue = document.querySelector('.dog-tongue');
      const muzzle = document.querySelector('.dog-muzzle');
      console.log('Tongue z-index:', tongue ? getComputedStyle(tongue).zIndex : 'Not found');
      console.log('Muzzle z-index:', muzzle ? getComputedStyle(muzzle).zIndex : 'Not found');
    } else {
      console.log('Refs not set:', {
        ballRef: !!ballRef.current,
        loadingRef: !!loadingRef.current,
        dogHeadRef: !!dogHeadRef.current
      });
    }
  }, [isFileUploaded]);

  // Handle drag start
  const handleMouseDown = useCallback((e) => {
    if (ballRef.current) {
      const ballRect = ballRef.current.getBoundingClientRect();
      console.log('Mouse down - Ball rect:', ballRect);
      console.log('Mouse position:', e.clientX, e.clientY);
      const offsetX = e.clientX - ballRect.left;
      const offsetY = e.clientY - ballRect.top;
      console.log('Offset:', offsetX, offsetY);
      setOffset({ x: offsetX, y: offsetY });
      setIsDragging(true);
      e.preventDefault();
    } else {
      console.log('Ball ref not set on mousedown');
    }
  }, []);

  // Handle drag movement
  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !ballRef.current || !dogHeadRef.current) {
      console.log('Drag stopped:', {
        isDragging,
        ballRef: !!ballRef.current,
        dogHeadRef: !!dogHeadRef.current
      });
      return;
    }

    let x = e.clientX - offset.x;
    let y = e.clientY - offset.y;

    const maxX = window.innerWidth - ballDimensions.width;
    const maxY = window.innerHeight - ballDimensions.height;
    x = Math.min(Math.max(0, x), maxX);
    y = Math.min(Math.max(0, y), maxY);

    console.log('Setting ball position to:', x, y);
    ballRef.current.style.position = 'fixed';
    ballRef.current.style.left = `${x}px`;
    ballRef.current.style.top = `${y}px`;
    ballRef.current.style.transform = 'none';

    const ballCenterX = x + ballDimensions.width / 2 - 20;
    const ballCenterY = y + ballDimensions.height / 2 + 100;

    const dogHeadRect = dogHeadRef.current.getBoundingClientRect();
    const dogCenterX = dogHeadRect.left + dogHeadRect.width / 2;
    const dogCenterY = dogHeadRect.top + dogHeadRect.height / 2;

    console.log('Centers:', { ballCenterX, ballCenterY, dogCenterX, dogCenterY });

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

    console.log('Rotation calc:', { degrees, desiredAngle, distance, distanceRatio });

    if (desiredAngle >= minAngle && desiredAngle <= maxAngle) {
      setTargetAngle(desiredAngle);
      console.log('Target angle set to:', desiredAngle);
    } else {
      console.log('Desired angle out of range:', desiredAngle);
    }
  }, [isDragging, offset, ballDimensions]);

  // Handle drag end
  const handleMouseUp = useCallback(() => {
    console.log('Mouse up, dragging stopped');
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
          console.log('Dog head rotated to:', newAngle);
        } else {
          console.log('Dog head ref not set in animation');
        }
        return newAngle;
      });

      animationFrameId = requestAnimationFrame(animateRotation);
    };

    if (isFileUploaded) {
      console.log('Starting rotation animation');
      animateRotation();
    }

    return () => {
      console.log('Cleaning up animation');
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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="text-left p-4 text-2xl font-bold text-gray-800 border-b border-gray-300 bg-white">
        Wish4 AI
      </header>

      <main className="flex-grow flex flex-col items-center justify-center text-center p-8 bg-gray-50 border-t border-gray-300">
        <h1 className="text-5xl font-bold mb-4 text-gray-900">puppySense</h1>
        <p className="text-base text-gray-700 my-1">아래에 이미지나 동영상을 업로드하면</p>
        <p className="text-base text-gray-700 my-1">강아지의 표정을 퍼센트로 알려드릴 수 있습니다.</p>
        <p className="text-sm text-gray-500 mt-2 note">동영상은 이미지보다 오랜 시간이 걸릴 수 있습니다.</p>

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
      </main>
	<div id="analyze" ref={analyzeRef} className="mt-4 text-center z-0">
          <div>분석 중입니다... 잠시만 기다려 주세요!</div>
          <div>그동안 공을 드래그해서 강아지와 놀아주세요!</div>
	  <button
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              onClick={handleAnalyzeComplete}
            >
              분석 완료
           </button>
         </div>
      <footer className="text-center text-sm text-gray-500 py-4">
        © 2025 PuppySense™ · A Wish4Pup Team Project
      </footer>
    </div>
  );
}

export default Home;
