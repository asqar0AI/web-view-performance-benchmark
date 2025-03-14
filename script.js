const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Array of ball image file paths
const ballImageFiles = [
  'ball1.png',
  'ball2.png',
  'ball3.png',
  'ball4.png',
  'ball5.png',
  'ball6.png'
];
const ballImages = [];
// Preload images
for (let i = 0; i < ballImageFiles.length; i++) {
  const img = new Image();
  img.src = ballImageFiles[i];
  ballImages.push(img);
}

const balls = [];
let lastTime = performance.now();
let fps = 0;

// For smoothing FPS calculation
let smoothedDelta = 16;
const smoothingFactor = 0.9;

const gravity = 0.5; // Gravity acceleration

const windowMargin = 20;  // Margin from browser window edges
const bounceMargin = 10;  // Clear margin inside canvas for ball bouncing

// Critical load: game stops if FPS drops below this value.
const CRITICAL_FPS = 4;
// Delay (in ms) before starting FPS critical check after game start.
const CRITICAL_FPS_DELAY = 2000;
let gameStartTime = 0; // Will be set when game starts

let isGameOver = false;

// Variables for FPS display update timing (update twice a second)
let lastFpsDisplayUpdate = 0;
const FPS_UPDATE_INTERVAL = 500; // in milliseconds

// Variables for holding function
let isHolding = false;
let holdX = 0;
let holdY = 0;
let spawnInterval = null;
let holdTimeout = null;
let holdingActivated = false;

// Resize the canvas to fill the window with a clear margin around all sides
function resizeCanvas() {
  canvas.width = window.innerWidth - windowMargin * 2;
  canvas.height = window.innerHeight - windowMargin * 2;
  canvas.style.margin = `${windowMargin}px`;
}

// Spawn a single ball at the given (x, y) position and update the ball count
function spawnBall(x, y) {
  if (isGameOver) return;
  
  // Randomly select one of the 6 ball images
  const randomIndex = Math.floor(Math.random() * ballImages.length);
  const selectedImg = ballImages[randomIndex];
  
  balls.push({
    x: x,
    y: y,
    // Increase horizontal speed: range from -5 to +5
    vx: Math.random() * 10 - 5,
    vy: Math.random() * 5 - 2.5,
    img: selectedImg
  });
  document.getElementById('ballCount').textContent = 'Balls: ' + balls.length;
}

// Helper function: spawn a random number (7–11) of balls at current hold position
function spawnRandomBallsAtHold() {
  if (isGameOver) return;
  
  const count = Math.floor(Math.random() * 5) + 7; // yields 7,8,9,10,11
  for (let i = 0; i < count; i++) {
    spawnBall(holdX, holdY);
  }
}

// Update ball positions with gravity and bounce physics
function update(delta) {
  balls.forEach(ball => {
    // Apply gravity
    ball.vy += gravity;
    ball.x += ball.vx;
    ball.y += ball.vy;
    
    // Horizontal boundaries: reverse velocity when hitting side margins
    if (ball.x < bounceMargin) {
      ball.x = bounceMargin;
      ball.vx *= -1;
    }
    if (ball.x + ball.img.width > canvas.width - bounceMargin) {
      ball.x = canvas.width - bounceMargin - ball.img.width;
      ball.vx *= -1;
    }
    
    // Bottom boundary: Bounce with random energy to reach between 5% and 95% of canvas height
    if (ball.y + ball.img.height > canvas.height - bounceMargin) {
      ball.y = canvas.height - bounceMargin - ball.img.height;
      // Random fraction between 0.05 and 0.95 of the canvas height
      let bounceFraction = Math.random() * (0.95 - 0.05) + 0.05;
      // Calculate upward velocity needed: v = sqrt(2 * g * (desiredHeight))
      ball.vy = -Math.sqrt(2 * gravity * (bounceFraction * canvas.height));
    }
    
    // Top boundary: Bounce downward
    if (ball.y < bounceMargin) {
      ball.y = bounceMargin;
      ball.vy = Math.abs(ball.vy);
    }
  });
}

// Draw balls on the canvas
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  balls.forEach(ball => {
    ctx.drawImage(ball.img, ball.x, ball.y);
  });
}

// Game Over function: stops the game and displays final score
function gameOver() {
  isGameOver = true;
  clearTimeout(holdTimeout);
  clearInterval(spawnInterval);
  document.getElementById('gameOverScreen').style.display = 'block';
  document.getElementById('finalScore').textContent = 'Final Score: ' + balls.length + ' balls';
}

// Main game loop with FPS smoothing and delayed FPS display update
function gameLoop(time) {
  if (isGameOver) return; // Stop updating once game is over
  
  const delta = time - lastTime;
  lastTime = time;
  
  smoothedDelta = smoothedDelta * smoothingFactor + delta * (1 - smoothingFactor);
  fps = Math.round(1000 / smoothedDelta);
  
  // Update FPS display only twice a second (every 500ms)
  if (time - lastFpsDisplayUpdate >= FPS_UPDATE_INTERVAL) {
    document.getElementById('fps').textContent = 'FPS: ' + fps;
    lastFpsDisplayUpdate = time;
  }
  
  update(delta);
  draw();
  
  // Only check for critical FPS after the delay has passed
  if (time - gameStartTime > CRITICAL_FPS_DELAY && fps < CRITICAL_FPS) {
    gameOver();
    return;
  }
  
  requestAnimationFrame(gameLoop);
}

// --- Event Handlers ---

// Mouse events
canvas.addEventListener('mousedown', function(event) {
  if (isGameOver) return;
  isHolding = true;
  const rect = canvas.getBoundingClientRect();
  holdX = event.clientX - rect.left;
  holdY = event.clientY - rect.top;
  holdingActivated = false;
  // If held longer than 200ms, activate continuous spawn
  holdTimeout = setTimeout(() => {
    if (isHolding) {
      holdingActivated = true;
      spawnInterval = setInterval(spawnRandomBallsAtHold, 50); // spawn more frequently
    }
  }, 200);
});
canvas.addEventListener('mousemove', function(event) {
  if (isHolding && !isGameOver) {
    const rect = canvas.getBoundingClientRect();
    holdX = event.clientX - rect.left;
    holdY = event.clientY - rect.top;
  }
});
canvas.addEventListener('mouseup', function(event) {
  if (isGameOver) return;
  if (!holdingActivated) {
    // If not held long enough, treat as a click and spawn 7-11 balls once.
    spawnRandomBallsAtHold();
  }
  isHolding = false;
  clearTimeout(holdTimeout);
  clearInterval(spawnInterval);
});
canvas.addEventListener('mouseleave', function() {
  isHolding = false;
  clearTimeout(holdTimeout);
  clearInterval(spawnInterval);
});

// Touch events for mobile devices
canvas.addEventListener('touchstart', function(event) {
  if (isGameOver) return;
  isHolding = true;
  const touch = event.touches[0];
  const rect = canvas.getBoundingClientRect();
  holdX = touch.clientX - rect.left;
  holdY = touch.clientY - rect.top;
  holdingActivated = false;
  holdTimeout = setTimeout(() => {
    if (isHolding) {
      holdingActivated = true;
      spawnInterval = setInterval(spawnRandomBallsAtHold, 50);
    }
  }, 200);
});
canvas.addEventListener('touchmove', function(event) {
  if (isHolding && !isGameOver) {
    const touch = event.touches[0];
    const rect = canvas.getBoundingClientRect();
    holdX = touch.clientX - rect.left;
    holdY = touch.clientY - rect.top;
  }
});
canvas.addEventListener('touchend', function() {
  if (isGameOver) return;
  if (!holdingActivated) {
    spawnRandomBallsAtHold();
  }
  isHolding = false;
  clearTimeout(holdTimeout);
  clearInterval(spawnInterval);
});

// Start button to initialize game loop
const startButton = document.getElementById('startButton');
startButton.addEventListener('click', () => {
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('stats').style.display = 'block';
  document.getElementById('gameCanvas').style.display = 'block';
  
  resizeCanvas(); // Set initial canvas size
  gameStartTime = performance.now(); // Record game start time for critical FPS delay
  requestAnimationFrame(gameLoop);
});

// Restart button to reload the page
document.getElementById('restartButton').addEventListener('click', () => {
  location.reload();
});

window.addEventListener('resize', resizeCanvas);
