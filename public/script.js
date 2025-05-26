// 요소 선택
const fileInput = document.getElementById("file-input");
const uploadBox = document.getElementById("upload-box");
const loadingArea = document.getElementById("loading");
const ball = document.querySelector(".ball");
const dogHead = document.querySelector(".dog-head");
const p = document.getElementById("analyze");

// 파일 업로드 시 이벤트
fileInput.addEventListener("change", () => {
  if (fileInput.files.length > 0) {
    uploadBox.style.display = 'none';
    loadingArea.style.display = "block"; // 로딩 화면 보이기
    p.style.display = "block";
  }
});

// 페이지 로드 시 실행
document.addEventListener("DOMContentLoaded", () => {
  const ball = document.querySelector("#loading .ball");
  const dogHead = document.querySelector("#loading .dog-head");

  if (!ball || !dogHead) return;

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  const ballRect = ball.getBoundingClientRect();
  const ballWidth = ballRect.width;
  const ballHeight = ballRect.height;

  // 공을 드래그 시작
  ball.addEventListener("mousedown", (e) => {
    isDragging = true;
    const ballRectNow = ball.getBoundingClientRect();
    offsetX = e.clientX - ballRectNow.left;
    offsetY = e.clientY - ballRectNow.top;
    e.preventDefault();
  });

  // 공을 드래그 중
document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  let x = e.clientX - offsetX;
  let y = e.clientY - offsetY;

  const maxX = window.innerWidth - ballWidth;
  const maxY = window.innerHeight - ballHeight;
  x = Math.min(Math.max(0, x), maxX);
  y = Math.min(Math.max(0, y), maxY);

  ball.style.position = "fixed";
  ball.style.left = `${x}px`;
  ball.style.top = `${y}px`;

  // 공 중심 대신 공의 약간 왼쪽 아래 지점을 기준으로 고개를 돌리기
  const ballCenterX = x + ballWidth / 2 - 20;  // 왼쪽으로 10px 보정
  const ballCenterY = y + ballHeight / 2 + 100;  // 아래로 5px 보정

  rotateDogHead(ballCenterX, ballCenterY);
});


  // 드래그 종료
  document.addEventListener("mouseup", () => {
    isDragging = false;
  });

  let currentAngle = 0;
  let targetAngle = 0;

  // 강아지 고개 회전 함수 (타겟 각도 설정만)
function rotateDogHead(ballCenterX, ballCenterY) {
  const dogHeadRect = dogHead.getBoundingClientRect();
  const dogCenterX = dogHeadRect.left + dogHeadRect.width / 2;
  const dogCenterY = dogHeadRect.top + dogHeadRect.height / 2;

  const dx = ballCenterX - dogCenterX;
  const dy = ballCenterY - dogCenterY;

  const angle = Math.atan2(dy, dx);
  let degrees = angle * (180 / Math.PI);

  const offset = -82;
  const desiredAngle = degrees + offset;

  // 회전 가능한 각도 범위
  const minAngle = -120;
  const maxAngle = 120;

  // 공과 머리 사이 거리
  const distance = Math.sqrt(dx * dx + dy * dy);

  const maxDistance = 300;
  const distanceRatio = Math.min(distance / maxDistance, 1);

  // 제한 범위를 벗어나면 회전하지 않음
  if (desiredAngle >= minAngle && desiredAngle <= maxAngle) {
    targetAngle = desiredAngle;
  }
  // else 블록 없음 → 제한 바깥이면 targetAngle 유지
}



// 애니메이션 루프에서 transform-origin 조정
function animateRotation() {
  // 거리 기반 보간 비율 (멀수록 빠르게)
  const lerpFactor = 0.05 + 0.15 * (Math.abs(targetAngle - currentAngle) / 180); // 0.05~0.2 범위
  currentAngle += (targetAngle - currentAngle) * lerpFactor;

  dogHead.style.transform = `rotate(${currentAngle}deg)`;
  dogHead.style.transformOrigin = "60% 40%";

  requestAnimationFrame(animateRotation);
}

  // 애니메이션 시작
  animateRotation();

});
