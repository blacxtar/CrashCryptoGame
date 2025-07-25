const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  usdAmount: {
    type: Number,
    required: true
  },
  cryptoAmount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    enum: ['BTC', 'ETH'],
    required: true
  },
  transactionType: {
    type: String,
    enum: ['bet', 'cashout'],
    required: true
  },
  priceAtTime: {
    type: Number,
    required: true
  },
  transactionHash: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
