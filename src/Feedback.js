// Feedback.js
import React, { useState } from 'react';
import './Feedback.css';
import feedbackImage from './feedback-img.png';


const Feedback = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [completed, setCompleted] = useState(false);

  const [neutral, setNeutral] = useState(20);
  const [anger, setAnger] = useState(20);
  const [happiness, setHappiness] = useState(20);
  const [sadness, setSadness] = useState(20);

  const handleEditClick = () => {
    if (!completed) {
      setIsEditing(true);
    }
  };

  const handleCompleteClick = () => {
    setIsEditing(false);
    setCompleted(true);
  };

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
            src={feedbackImage}
            alt="Dog"
            className="feedback-image"
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
