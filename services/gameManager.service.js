const crypto = require('crypto');
const GameRound = require('../models/gameRound.model');
// const { io } = require('../websocket/socket');
const {getIO} = require("../websocket/socket")

let roundNumber = 1;
let currentMultiplier = 1.0;
let crashPoint = 0;
let multiplierInterval = null;
let roundInterval = null;
const GROWTH_RATE = 0.01; // growth factor per 100ms



function generateCrashPoint(seed, roundNum) {
  const hash = crypto.createHash('sha256').update(seed + roundNum).digest('hex');
  const numeric = parseInt(hash.substring(0, 8), 16); // take first 8 hex digits
  return (numeric % 10000) / 100 + 1; // gives between 1.00x to 101.00x
}

async function startNewRound() {
  currentMultiplier = 1.0;
  const seed = 'crypto_crash_seed';
  crashPoint = generateCrashPoint(seed, roundNumber);

  // Save new round to DB
  const round = await GameRound.create({
    roundNumber,
    crashPoint,
    status: 'running'
  });
  console.log("Created Round:", round);
  const io = getIO()

  io.emit('round_start', {
    roundNumber,
    crashPointHash: crypto.createHash('sha256').update(seed + roundNumber).digest('hex'),
    message: `Round ${roundNumber} started!`
  });

  console.log(`🎮 Round ${roundNumber} started. Will crash at ${crashPoint.toFixed(2)}x`);

  // Begin multiplier updates every 100ms
  multiplierInterval = setInterval(async () => {
    currentMultiplier += currentMultiplier * GROWTH_RATE;

    if (currentMultiplier >= crashPoint) {
      clearInterval(multiplierInterval);
      multiplierInterval = null
      await GameRound.updateOne({ roundNumber }, { $set: { status: 'crashed' } });

      io.emit('round_crash', {
        roundNumber,
        finalMultiplier: crashPoint
      });

      console.log(`💥 Round ${roundNumber} crashed at ${crashPoint.toFixed(2)}x`);

      roundNumber += 1;
    } else {
      io.emit('multiplier_update', {
        multiplier: currentMultiplier.toFixed(2)
      });
    }
  }, 100);
}

function runGameLoop() {
  console.log(`Saving round ${roundNumber} to DB with status 'running'`);

  startNewRound(); // run first round immediately

  // Schedule next round every 10s
  roundInterval = setInterval(() => {
    if (!multiplierInterval) {
      console.log("Starting new round")
      startNewRound();
    }
  }, 10000);
}

module.exports = {
  runGameLoop,
  getCurrentMultiplier: () => currentMultiplier,
  getCurrentRound: () => roundNumber,
  getCrashPoint: () => crashPoint
};
