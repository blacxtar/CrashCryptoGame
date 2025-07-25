const mongoose = require('mongoose');

const gameRoundSchema = new mongoose.Schema({
  roundNumber: {
    type: Number,
    required: true
  },
  crashPoint: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'running', 'crashed'],
    default: 'waiting'
  },
  bets: [{
    playerId: mongoose.Schema.Types.ObjectId,
    usdAmount: Number,
    cryptoAmount: Number,
    currency: String,
    priceAtTime: Number,
    timestamp: Date
  }],
  cashouts: [{
    playerId: mongoose.Schema.Types.ObjectId,
    payoutCrypto: Number,
    payoutUSD: Number,
    atMultiplier: Number,
    timestamp: Date
  }]
}, { timestamps: true });

module.exports = mongoose.model('GameRound', gameRoundSchema);
