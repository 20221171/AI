import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Feedback.css';

interface LocationState {
  imageFile: File;
}

const Feedback: React.FC = () => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [completed, setCompleted] = useState<boolean>(false);
  const [neutral, setNeutral] = useState<number>(20);
  const [anger, setAnger] = useState<number>(20);
  const [happiness, setHappiness] = useState<number>(20);
  const [sadness, setSadness] = useState<number>(20);

  const location = useLocation();
  const navigate = useNavigate();
  const imageFile = (location.state as LocationState)?.imageFile;

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
          <img
            src={imageURL}
            alt="Uploaded Dog"
            className="feedback-image"
            style={{ maxWidth: '100%' }}
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