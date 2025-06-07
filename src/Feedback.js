import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Feedback.css';

const Feedback = () => {
  // 상태 초기값을 API 응답 데이터로 설정
  const location = useLocation();
  const navigate = useNavigate();
  const { imageFile, emotions, prediction } = location.state || {};

  // 감정 상태 초기화: API 응답 데이터로 설정하거나 기본값 사용
  const [isEditing, setIsEditing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [neutral, setNeutral] = useState(emotions?.neutral || 20);
  const [anger, setAnger] = useState(emotions?.anger || 20);
  const [happiness, setHappiness] = useState(emotions?.happiness || 20);
  const [sadness, setSadness] = useState(emotions?.sadness || 20);

  // 이미지 URL 메모리 누수 방지
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

  // imageFile 또는 emotions가 없는 경우 에러 처리
  if (!imageFile || !emotions || !prediction) {
    return (
      <div className="feedback-container">
        <p>데이터가 전달되지 않았습니다. 다시 시도해주세요.</p>
        <button
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          onClick={() => navigate('/')}
        >
          홈으로
        </button>
      </div>
    );
  }

  const imageURL = URL.createObjectURL(imageFile);

  return (
    <div className="feedback-container">
      <header className="text-left p-4 text-2xl font-bold text-gray-800 border-b border-gray-300 bg-white">
        Wish4<img src="/puppy.png" alt="Puppy Logo" className="header-image" />AI
      </header>

      <main>
        <h1>puppySense</h1>
        <p>아래에 이미지나 동영상을 업로드하면</p>
        <p>강아지의 표정을 퍼센트로 알려드릴 수 있습니다.</p>
        <p className="info-small">동영상은 이미지보다 오랜 시간이 걸릴 수 있습니다.</p>

        <div className="card">
          <img
            src={imageURL}
            alt="Uploaded Dog"
            className="feedback-image"
            style={{ maxWidth: '100%' }}
          />

          {/* 예측 결과 동적 표시 */}
          <p>This puppy is showing a {prediction} expression! 🐶</p>

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