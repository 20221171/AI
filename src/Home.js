// Home.js
import React, { useState } from 'react';
import './Home.css';

function Home() {
  const [loading, setLoading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploaded(true);
      setLoading(true);

      setTimeout(() => {
        setLoading(false);
        alert('AI 분석 완료!');
      }, 3000);
    }
  };

  return (
    <div className="home-container">
      <header>Wish4 AI</header>

      <main>
        <h1>puppySense</h1>
        <p>아래에 이미지나 동영상을 업로드하면</p>
        <p>강아지의 표정을 퍼센트로 알려드릴 수 있습니다.</p>
        <p className="info-small">동영상은 이미지보다 오랜 시간이 걸릴 수 있습니다.</p>

        {!uploaded && (
          <label className="upload-box" htmlFor="file-input">
            <p className="upload-title">Click here to upload</p>
            <p>an image or video file</p>
            <span className="button">select file</span>
            <input
              type="file"
              id="file-input"
              accept="image/*,video/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </label>
        )}

        {loading && (
          <div id="loading">
            <div className="spinner"></div>
            분석 중입니다... 잠시만 기다려 주세요.
          </div>
        )}
      </main>

      <footer>© 2025 PuppySense™ · A Wish4Pup Team Project</footer>
    </div>
  );
}

export default Home;
