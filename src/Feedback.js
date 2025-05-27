import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // 추가: React Router의 useLocation, useNavigate 임포트
import './Feedback.css';
// import feedbackImage from './feedback-img.png'; // 제거: 정적 이미지 임포트 제거

const Feedback = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [neutral, setNeutral] = useState(20);
  const [anger, setAnger] = useState(20);
  const [happiness, setHappiness] = useState(20);
  const [sadness, setSadness] = useState(20);

  // 추가: useLocation으로 Home.js에서 전달된 imageFile 가져오기
  const location = useLocation();
  // 추가: useNavigate으로 홈으로 이동 처리
  const navigate = useNavigate();
  // 추가: 전달된 imageFile 추출
  const imageFile = location.state?.imageFile;

  // 추가: 메모리 누수 방지를 위해 URL 해제
  useEffect(() => {
    if (imageFile) {
      const imageURL = URL.createObjectURL(imageFile);
      return () => {
        URL.revokeObjectURL(imageURL);
        console.log('Image URL revoked');
      };
    }
  }, [imageFile]);

  const handleEditClick = () => {
    if (!completed) {
      setIsEditing(true);
    }
  };

  const handleCompleteClick = () => {
    setIsEditing(false);
    setCompleted(true);
  };

  // 추가: imageFile이 없을 경우 에러 메시지와 홈으로 버튼 표시
  if (!imageFile) {
    return (
      <div className="feedback-container">
        <p>이미지가 전달되지 않았습니다. 다시 시도해주세요.</p>
        <button
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          onClick={() => navigate('/')}
        >
          홈으로
        </button>
      </div>
    );
  }

  // 추가: 동적으로 생성된 이미지 URL
  const imageURL = URL.createObjectURL(imageFile);

  return (
    <div className="feedback-container">
      <header>Wish4 AI</header>

      <main>
        <h1>puppySense</h1>
        <p>아래에 이미지나 동영상을 업로드하면</p>
        <p>강아지의 표정을 퍼센트로 알려드릴 수 있습니다.</p>
        <p className="info-small">동영상은 이미지보다 오랜 시간이 걸릴 수 있습니다.</p>

        <div className="card">
          {/* 수정: 정적 feedbackImage 대신 동적 imageURL 사용 */}
          <img
            src={imageURL}
            alt="Uploaded Dog"
            className="feedback-image"
            style={{ maxWidth: '100%' }} // 추가: 이미지 크기 조정을 위한 스타일
          />

          <p>This puppy is showing a happy expression! 🐶</p>

          <div className="expression">
            {isEditing ? (
              <>
                <label>
                  <strong>Neutral 😐:</strong>
                  <input
                    type="number"
                    value={neutral}
                    onChange={(e) => setNeutral(Number(e.target.value))}
                    min="0"
                    max="100"
                    className="percent-input"
                  />
                  %
                </label><br />
                <label>
                  <strong>Anger 😈:</strong>
                  <input
                    type="number"
                    value={anger}
                    onChange={(e) => setAnger(Number(e.target.value))}
                    min="0"
                    max="100"
                    className="percent-input"
                  />
                  %
                </label><br />
                <label>
                  <strong>Happiness 😊:</strong>
                  <input
                    type="number"
                    value={happiness}
                    onChange={(e) => setHappiness(Number(e.target.value))}
                    min="0"
                    max="100"
                    className="percent-input"
                  />
                  %
                </label><br />
                <label>
                  <strong>Sadness 🥺:</strong>
                  <input
                    type="number"
                    value={sadness}
                    onChange={(e) => setSadness(Number(e.target.value))}
                    min="0"
                    max="100"
                    className="percent-input"
                  />
                  %
                </label>
              </>
            ) : (
              <>
                <strong>Neutral 😐:</strong> {neutral}%<br />
                <strong>Anger 😈:</strong> {anger}%<br />
                <strong>Happiness 😊:</strong> {happiness}%<br />
                <strong>Sadness 🥺:</strong> {sadness}%
              </>
            )}
          </div>

          <div className="button-group">
            {!isEditing && !completed && (
              <button className="edit-button" onClick={handleEditClick}>
                Edit & Feedback
              </button>
            )}

            {isEditing && (
              <button className="complete-button" onClick={handleCompleteClick}>
                Complete
              </button>
            )}
          </div>
        </div>
      </main>

      <footer>© 2025 PuppySense™ · A Wish4Pup Team Project</footer>
    </div>
  );
};

export default Feedback;
