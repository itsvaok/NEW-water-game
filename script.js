// ============================================
// Water Drop Game — script.js
// ============================================

// --- Variables to control game state ---
let gameRunning = false; // Keeps track of whether game is active or not
let dropMaker;           // Will store our timer that creates drops regularly
let collisionChecker;    // Will store our timer for collision detection

// --- Bucket dragging variables ---
let isDragging = false;
let dragStartX = 0;
let bucketX = 0;

// --- New variables needed for score + timer ---
let score = 0;            // current score, starts at 0
let timeLeft = 30;        // countdown starts at 30 seconds
let timerInterval = null; // will hold setInterval so we can stop it later

// --- Grab the score/timer display elements ---
const scoreDisplay = document.getElementById("score"); // shows the score number
const timeDisplay = document.getElementById("time");   // shows seconds left
const bucket = document.getElementById("bucket");      // grab the bucket element

// --- Messages shown when the game ends ---
// One array for winning, one for losing, as requested.
// We'll pick a random message from whichever array applies.
const winningMessages = [
  "Great job! You're a water-catching champ!",
  "Awesome reflexes! You caught a ton of drops!",
  "You crushed it! Nicely done!",
  "Splash master! That was impressive!"
];

const losingMessages = [
  "So close! Give it another shot.",
  "Not bad, but you can do better. Try again!",
  "The drops got away this time. One more round?",
  "Almost there! Try again to beat your score."
];

// --- Helper: pick a random item from an array ---
function getRandomMessage(messageArray) {
  const randomIndex = Math.floor(Math.random() * messageArray.length);
  return messageArray[randomIndex];
}

// Wait for button click to start the game
document.getElementById("start-btn").addEventListener("click", startGame);
document.getElementById("begin-btn").addEventListener("click", startGame);
document.getElementById("restart-btn").addEventListener("click", restartGame);

function startGame() {
  // Prevent multiple games from running at once
  if (gameRunning) return;

  // Hide the how-to-play screen
  const howToPlayScreen = document.getElementById("how-to-play-screen");
  howToPlayScreen.classList.add("hidden");

  // Show the restart button
  document.getElementById("restart-btn").classList.remove("hidden");

  gameRunning = true;

  // reset score and timer each time a new game starts
  score = 0;
  timeLeft = 30;
  scoreDisplay.textContent = score;
  timeDisplay.textContent = timeLeft;

  // Reset bucket position to center
  bucketX = 0;
  bucket.style.left = "50%";
  bucket.style.transform = "translateX(-50%)";

  // clear out any leftover drops or end-message from a previous round
  const gameContainer = document.getElementById("game-container");
  gameContainer.querySelectorAll(".water-drop").forEach((drop) => drop.remove());
  gameContainer.querySelectorAll(".confetti").forEach((c) => c.remove());
  gameContainer.querySelectorAll(".end-message").forEach((msg) => msg.remove());

  // Set up bucket dragging
  setupBucketDragging();

  // Create new drops every second (1000 milliseconds)
  dropMaker = setInterval(createDrop, 1000);

  // Check for collisions between drops and bucket every 50ms
  collisionChecker = setInterval(checkCollisions, 50);

  // start the 30-second countdown
  timerInterval = setInterval(updateTimer, 1000);
}

// --- Restart the game anytime ---
function restartGame() {
  gameRunning = false;

  // stop spawning new drops and stop the countdown
  clearInterval(dropMaker);
  clearInterval(timerInterval);
  clearInterval(collisionChecker);

  // Hide restart button
  document.getElementById("restart-btn").classList.add("hidden");

  // clear out any leftover drops or end-message
  const gameContainer = document.getElementById("game-container");
  gameContainer.querySelectorAll(".water-drop").forEach((drop) => drop.remove());
  gameContainer.querySelectorAll(".confetti").forEach((c) => c.remove());
  gameContainer.querySelectorAll(".end-message").forEach((msg) => msg.remove());

  // Show how-to-play screen again
  const howToPlayScreen = document.getElementById("how-to-play-screen");
  howToPlayScreen.classList.remove("hidden");

  document.getElementById("start-btn").textContent = "Start Game";
}

// --- Counts down the timer by 1 every second, ends game at 0 ---
function updateTimer() {
  timeLeft--;
  timeDisplay.textContent = timeLeft;

  if (timeLeft <= 0) {
    endGame();
  }
}

// --- Adds points to the score and updates the display ---
function updateScore(points) {
  score += points;
  scoreDisplay.textContent = score;
}

// --- Stops the game and shows a win/lose message ---
function endGame() {
  gameRunning = false;

  // Hide restart button
  document.getElementById("restart-btn").classList.add("hidden");

  // stop spawning new drops and stop the countdown
  clearInterval(dropMaker);
  clearInterval(timerInterval);
  clearInterval(collisionChecker);

  // remove any drops still falling on screen
  const gameContainer = document.getElementById("game-container");
  gameContainer.querySelectorAll(".water-drop").forEach((drop) => drop.remove());

  // decide win or lose based on final score, then pick a random message
  let resultMessage;
  let isWin = false;
  if (score >= 20) {
    resultMessage = getRandomMessage(winningMessages); // 20+ points = win
    isWin = true;
  } else {
    resultMessage = getRandomMessage(losingMessages); // under 20 points = lose
  }

  // display the message inside the game container
  const messageEl = document.createElement("div");
  messageEl.className = "end-message";
  messageEl.textContent = `${resultMessage} Final score: ${score}`;
  gameContainer.appendChild(messageEl);

  // Trigger confetti if player wins
  if (isWin) {
    createConfetti();
  }

  document.getElementById("start-btn").textContent = "Play Again";
}

function createDrop() {
  // Create a new div element that will be our water drop
  const drop = document.createElement("div");
  drop.className = "water-drop";

  // Make drops different sizes for visual variety
  const initialSize = 60;
  const sizeMultiplier = Math.random() * 0.8 + 0.5;
  const size = initialSize * sizeMultiplier;
  drop.style.width = drop.style.height = `${size}px`;

  // 30% chance to be a dirty drop (red)
  const isDirty = Math.random() < 0.3;
  if (isDirty) {
    drop.classList.add("bad-drop");
    drop.setAttribute("data-dirty", "true");
  }

  // Position the drop randomly across the game width
  // Subtract 60 pixels to keep drops fully inside the container
  const gameWidth = document.getElementById("game-container").offsetWidth;
  const xPosition = Math.random() * (gameWidth - 60);
  drop.style.left = xPosition + "px";

  // Make drops fall for 4 seconds
  drop.style.animationDuration = "4s";

  // Add the new drop to the game screen
  document.getElementById("game-container").appendChild(drop);

  // Remove drops that reach the bottom (weren't caught)
  drop.addEventListener("animationend", () => {
    drop.remove(); // Clean up drops that weren't caught
  });
}

// --- Set up bucket dragging with mouse and touch events ---
function setupBucketDragging() {
  // Mouse events - track cursor movement
  document.addEventListener("mousemove", handleCursorMove);
  
  // Touch events for mobile
  document.addEventListener("touchmove", handleCursorMove);
}

function handleCursorMove(e) {
  if (!gameRunning) return;

  const gameContainer = document.getElementById("game-container");
  const containerRect = gameContainer.getBoundingClientRect();
  
  // Get cursor position
  const cursorX = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;

  // Calculate position relative to game container
  const relativeX = cursorX - containerRect.left;

  // Get bucket dimensions
  const bucketRect = bucket.getBoundingClientRect();
  const bucketWidth = bucketRect.width;

  // Calculate how far from container center the cursor is
  const containerCenter = containerRect.width / 2;
  const offset = relativeX - containerCenter;

  // Keep bucket within container bounds
  const maxOffset = (containerRect.width - bucketWidth) / 2;
  const constrainedOffset = Math.max(-maxOffset, Math.min(maxOffset, offset));

  // Update bucket position
  bucket.style.left = (containerCenter + constrainedOffset) + "px";
  bucket.style.transform = "translateX(-50%)";
}

// --- Check for collisions between drops and bucket ---
function checkCollisions() {
  if (!gameRunning) return;

  const gameContainer = document.getElementById("game-container");
  const drops = gameContainer.querySelectorAll(".water-drop");
  const bucketRect = bucket.getBoundingClientRect();

  drops.forEach((drop) => {
    const dropRect = drop.getBoundingClientRect();
    
    // Check if drop and bucket overlap
    if (detectCollision(dropRect, bucketRect)) {
      // Check if drop is dirty
      if (drop.getAttribute("data-dirty") === "true") {
        updateScore(-1); // Subtract 1 point for dirty drop
      } else {
        updateScore(1); // Add 1 point for clean drop
      }
      drop.remove(); // Remove the caught drop
    }
  });
}

// --- Detect if two rectangles collide ---
function detectCollision(rect1, rect2) {
  return (
    rect1.left < rect2.right &&
    rect1.right > rect2.left &&
    rect1.top < rect2.bottom &&
    rect1.bottom > rect2.top
  );
}

// --- Create confetti particles for celebration ---
function createConfetti() {
  const gameContainer = document.getElementById("game-container");
  const colors = ["#FFC907", "#2E9DF7", "#4FCB53", "#FF902A", "#F5402C", "#8BD1CB"];
  
  // Create 50 confetti particles
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement("div");
    confetti.className = "confetti";
    
    // Random color
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Random starting position across the top
    const startX = Math.random() * gameContainer.offsetWidth;
    confetti.style.left = startX + "px";
    confetti.style.top = "-10px";
    
    // Random animation delay for staggered effect
    confetti.style.animationDelay = Math.random() * 0.3 + "s";
    
    // Add slight horizontal drift
    const drift = (Math.random() - 0.5) * 200;
    confetti.style.setProperty("--drift", drift + "px");
    
    gameContainer.appendChild(confetti);
    
    // Remove confetti after animation completes
    setTimeout(() => confetti.remove(), 3000);
  }
}