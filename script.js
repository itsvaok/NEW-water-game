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
let timeLeft = 30;        // countdown starts at 30 seconds (overwritten by difficulty)
let timerInterval = null; // will hold setInterval so we can stop it later

// --- Difficulty settings ---
// Each difficulty sets its own time, win score, drop speed, dirty drop
// chance, and how often new drops spawn. Default is "easy" until the
// player picks something on the how-to-play screen.
let selectedDifficulty = "easy";

const difficultySettings = {
  easy: {
    timeLimit: 60,       // how many seconds the player has to win
    winScore: 30,        // how many points needed to win
    dropDuration: 4,     // how many seconds a drop takes to fall (higher = slower)
    dirtyChance: 0.30,   // chance a drop is dirty, 0.10 = 10%
    spawnRate: 800,      // milliseconds between each new drop (lower = more drops)
  },
  normal: {
    timeLimit: 45,       // less time than easy
    winScore: 25,        // more points needed than easy
    dropDuration: 3.5,   // drops fall faster than easy
    dirtyChance: 0.25,   // 25% of drops are dirty
    spawnRate: 900,      // slightly fewer drops than easy
  },
  hard: {
    timeLimit: 30,       // least amount of time
    winScore: 25,        // most points needed to win
    dropDuration: 1,     // drops fall the fastest
    dirtyChance: 0.19,   // nearly half the drops are dirty
    spawnRate: 800,     // fewest drops spawning, so catching clean ones is harder
  },
};

// --- Grab the score/timer display elements ---
const scoreDisplay = document.getElementById("score"); // shows the score number
const timeDisplay = document.getElementById("time");   // shows seconds left
const bucket = document.getElementById("bucket");      // grab the bucket element

// --- Messages shown when the game ends ---
// One array for winning, one for losing.
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
  "Almost there! Try again to reach the score goal."
];

// --- Helper: pick a random item from an array ---
function getRandomMessage(messageArray) {
  const randomIndex = Math.floor(Math.random() * messageArray.length);
  return messageArray[randomIndex];
}

// --- Difficulty button selection ---
// When a difficulty button is clicked, mark it active and save the choice.
// The actual settings don't apply until Begin is clicked.
document.querySelectorAll(".difficulty-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    // remove "active" from whichever button currently has it
    document.querySelectorAll(".difficulty-btn").forEach((b) => b.classList.remove("active"));
    // mark this button as the chosen one
    btn.classList.add("active");
    // save the difficulty name from the button's data attribute
    selectedDifficulty = btn.getAttribute("data-difficulty");
  });
});

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

  // Look up the settings for whichever difficulty was selected
  const settings = difficultySettings[selectedDifficulty];

  // Show the difficulty badge inside the game container during play
  const badge = document.getElementById("difficulty-badge");
  badge.textContent = selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1);
  badge.className = `difficulty-badge ${selectedDifficulty}`; // applies color via CSS

  gameRunning = true;

  // Reset score and apply this difficulty's time limit
  score = 0;
  timeLeft = settings.timeLimit;   // use difficulty's time, not a hardcoded 30
  scoreDisplay.textContent = score;
  timeDisplay.textContent = timeLeft;
  document.getElementById("win-score-display").textContent = settings.winScore; // updates goal based on difficulty

  // Reset bucket position to center
  bucketX = 0;
  bucket.style.left = "50%";
  bucket.style.transform = "translateX(-50%)";

  // Clear out any leftover drops or end-message from a previous round
  const gameContainer = document.getElementById("game-container");
  gameContainer.querySelectorAll(".water-drop").forEach((drop) => drop.remove());
  gameContainer.querySelectorAll(".confetti").forEach((c) => c.remove());
  gameContainer.querySelectorAll(".end-message").forEach((msg) => msg.remove());
  gameContainer.querySelectorAll(".end-message").forEach((msg) => msg.remove());
  shownMilestones.clear(); 
// reset milestones so they show again on a new round


  // Set up bucket dragging
  setupBucketDragging();

  // Spawn drops using this difficulty's spawn rate
  dropMaker = setInterval(createDrop, settings.spawnRate);

  // Check for collisions between drops and bucket every 50ms
  collisionChecker = setInterval(checkCollisions, 50);

  // Start the countdown
  timerInterval = setInterval(updateTimer, 1000);
}

// --- Restart the game anytime ---
function restartGame() {
  gameRunning = false;

  // Stop spawning new drops and stop the countdown
  clearInterval(dropMaker);
  clearInterval(timerInterval);
  clearInterval(collisionChecker);

  // Hide restart button
  document.getElementById("restart-btn").classList.add("hidden");

  // Clear out any leftover drops or end-message
  const gameContainer = document.getElementById("game-container");
  gameContainer.querySelectorAll(".water-drop").forEach((drop) => drop.remove());
  gameContainer.querySelectorAll(".confetti").forEach((c) => c.remove());
  gameContainer.querySelectorAll(".end-message").forEach((msg) => msg.remove());

  // Show how-to-play screen again so player can re-pick difficulty
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

// --- Adds or subtracts points from the score and updates the display ---
function updateScore(points) {
  score += points;
  scoreDisplay.textContent = score;
  checkMilestones(); // check if player just hit a milestone score
}

// --- Milestone messages shown during gameplay as player hits certain scores ---
// Each milestone is a fraction of the win score so they scale across difficulties.
// e.g. 0.25 of winScore 20 = triggers at 5 pts; 0.25 of winScore 30 = triggers at 7 pts
const milestones = [
  { fraction: 0.25, message: "Great start! Keep catching! 💧" },  // 25% of win score
  { fraction: 0.50, message: "Halfway there! 🙌" },               // 50% of win score
  { fraction: 0.75, message: "So close! Just a few more! ⚡" },   // 75% of win score
  { fraction: 0.90, message: "Almost there! One last push! 🔥" }, // 90% of win score
];

// Tracks which milestones have already been shown so they don't repeat
const shownMilestones = new Set();

function checkMilestones() {
  const settings = difficultySettings[selectedDifficulty];

  milestones.forEach((milestone) => {
    // Calculate the score this milestone triggers at for the current difficulty
    const triggerScore = Math.floor(milestone.fraction * settings.winScore);

    // Show the message if player just reached or passed this score and hasn't seen it yet
    if (score >= triggerScore && !shownMilestones.has(milestone.fraction)) {
      shownMilestones.add(milestone.fraction); // mark as shown so it doesn't repeat
      showMilestoneMessage(milestone.message);
    }
  });
}

function showMilestoneMessage(message) {
  const gameContainer = document.getElementById("game-container");

  const el = document.createElement("div");
  el.className = "milestone-message";
  el.textContent = message;
  gameContainer.appendChild(el);

  // Remove the message after the CSS animation finishes (2 seconds)
  setTimeout(() => el.remove(), 2000);
}

// --- Stops the game and shows a win/lose message ---
function endGame() {
  gameRunning = false;

  // Hide restart button
  document.getElementById("restart-btn").classList.add("hidden");

  // Stop spawning new drops and stop the countdown
  clearInterval(dropMaker);
  clearInterval(timerInterval);
  clearInterval(collisionChecker);

  // Remove any drops still falling on screen
  const gameContainer = document.getElementById("game-container");
  gameContainer.querySelectorAll(".water-drop").forEach((drop) => drop.remove());

  // Look up the win score for the difficulty that was played
  const settings = difficultySettings[selectedDifficulty];

  // Decide win or lose based on whether score meets this difficulty's goal
  let resultMessage;
  let isWin = false;
  if (score >= settings.winScore) {         // use difficulty's win score, not hardcoded 20
    resultMessage = getRandomMessage(winningMessages);
    isWin = true;
  } else {
    resultMessage = getRandomMessage(losingMessages);
  }

  // Display the message inside the game container
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
  drop.innerHTML = `<img src="img/water.png" alt="water drop" style="width:100%;height:100%;object-fit:contain;">`;

  // Look up dirty chance and fall speed for the current difficulty
  const settings = difficultySettings[selectedDifficulty];

  // Make drops different sizes for visual variety
 const minSize = 70;   // smallest a drop can be
 const maxSize = 110;  // biggest a drop can be
 const size = Math.random() * (maxSize - minSize) + minSize;
 drop.style.width = drop.style.height = `${size}px`;

  // Use this difficulty's dirty drop chance (e.g. 0.50 on Hard = 50%)
  const isDirty = Math.random() < settings.dirtyChance;
if (isDirty) {
    drop.classList.add("bad-drop");
    drop.setAttribute("data-dirty", "true");
    drop.innerHTML = `<img src="img/dirtywater.png" alt="dirty water drop" style="width:100%;height:100%;object-fit:contain;">`;
} else {
    drop.innerHTML = `<img src="img/water.png" alt="water drop" style="width:100%;height:100%;object-fit:contain;">`;
}

  // Position the drop randomly across the game width
  const gameWidth = document.getElementById("game-container").offsetWidth;
  const xPosition = Math.random() * (gameWidth - 60);
  drop.style.left = xPosition + "px";

  // Use this difficulty's fall duration (shorter = faster drops)
  drop.style.animationDuration = settings.dropDuration + "s";

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

  // Calculate how far from container center the cursor is
  const containerCenter = containerRect.width / 2;
  const offset = relativeX - containerCenter;

  // Keep bucket within container bounds
  const bucketWidth = bucket.getBoundingClientRect().width;
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

  // Shrink the hitbox by 20px on each side so it's smaller than the visible image
  const fullRect = bucket.getBoundingClientRect();
  const bucketRect = {
    left:   fullRect.left   + 40,  // shrink from the left
    right:  fullRect.right  - 40,  // shrink from the right
    top:    fullRect.top    + 30,  // shrink from the top
    bottom: fullRect.bottom - 20,  // shrink from the bottom
    //Higher number = smaller hitbox (harder to catch drops)
  };

  drops.forEach((drop) => {
    const dropRect = drop.getBoundingClientRect();
    
    // Check if drop and bucket overlap
    if (detectCollision(dropRect, bucketRect)) {
      // Check if drop is dirty
      if (drop.getAttribute("data-dirty") === "true") {
        updateScore(-1); // Subtract 1 point for dirty drop
      } else {
        updateScore(1);  // Add 1 point for clean drop
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