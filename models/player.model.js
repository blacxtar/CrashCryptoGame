const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  wallet: {
    BTC: {
      type: Number,
      default: 0
    },
    ETH: {
      type: Number,
      default: 0
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Player', playerSchema);
