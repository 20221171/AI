// Feedback.js
import React, { useState } from 'react';
import './Feedback.css';

const Feedback = () => {
  const [completed, setCompleted] = useState(false);

  const handleCompleteClick = () => {
    setCompleted(true);
  };

  return (
    <div className="feedback-container">
      <header>Wish4 AI</header>

      <main>
        <h1>puppySense</h1>
        <p>Upload a photo or video of your dog below.</p>
        <p>We'll show you its facial expression in percentages.</p>

        <div className="card">
          <img
            src={completed ? 'complete-image-url.png' : 'feedback-image-url.png'}
            alt="Dog"
            className="feedback-image"
          />

          {!completed ? (
            <>
              <p>This puppy is showing a happy expression! 🐶</p>
              <div className="expression">
                <strong>Neutral 😐:</strong> 20%<br />
                <strong>Anger 😈:</strong> 20%<br />
                <strong>Happiness 😊:</strong> 20%<br />
                <strong>Sadness 🥺:</strong> 20%
              </div>
              <button className="edit-button" onClick={handleCompleteClick}>
                Edit & Feedback
              </button>
            </>
          ) : (
            <>
              <p>This puppy is showing a happy expression! 🐶</p>
              <div className="expression">
                <strong>Neutral 😐:</strong> 20%<br />
                <strong>Anger 😈:</strong> 20%<br />
                <strong>Happiness 😊:</strong> 20%<br />
                <strong>Sadness 🥺:</strong> 20%
              </div>
              <button className="complete-button" onClick={handleCompleteClick}>
                complete
              </button>
            </>
          )}
        </div>
      </main>

      <footer>© 2025 PuppySense™ · A Wish4Pup Team Project</footer>
    </div>
  );
};

export default Feedback;
