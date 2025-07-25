const express = require('express');
const router = express.Router();
const Player = require('../models/player.model');
const GameRound = require('../models/gameRound.model');
const Transaction = require('../models/transaction.model');
const { fetchCryptoPrices, convertUsdToCrypto } = require('../services/crypto.service');
const { getCurrentRound, getCrashPoint } = require('../services/gameManager.service');
const { v4: uuidv4 } = require('uuid');




router.post('/players', async (req, res) => {
  try {
    const { name, initialBTC = 10, initialETH = 10 } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const player = await Player.create({
      name,
      wallet: {
        BTC: parseFloat(initialBTC),
        ETH: parseFloat(initialETH)
      }
    });

    res.status(201).json({
      message: 'Player created successfully',
      playerId: player._id,
      name: player.name,
      wallet: player.wallet
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create player' });
  }
});

router.post('/bet', async (req, res) => {
  try {
    const { playerId, usdAmount, currency } = req.body;

    if (!['BTC', 'ETH'].includes(currency)) {
      return res.status(400).json({ error: 'Invalid currency' });
    }

    if (usdAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const player = await Player.findById(playerId);
    
    if (!player) return res.status(404).json({ error: 'Player not found' });

    const prices = await fetchCryptoPrices();
    const cryptoAmount = convertUsdToCrypto(usdAmount, currency, prices);
    const walletBalance = player.wallet[currency];

    if (walletBalance < cryptoAmount) {
      return res.status(400).json({ error: 'Insufficient wallet balance' });
    }
    const roundNumber = getCurrentRound()
    const round = await GameRound.findOne({ status: "running" }).sort({ roundNumber: -1 });


    if (!round || round.status !== 'running') {
      return res.status(400).json({ error: 'Betting not allowed. No active round.' });
    }

    // Update Player Wallet
    player.wallet[currency] -= cryptoAmount;
    await player.save();

    // Add Bet to Round
    round.bets.push({
      playerId: player._id,
      usdAmount,
      cryptoAmount,
      currency,
      priceAtTime: prices[currency],
      timestamp: new Date()
    });
    await round.save();

    // Log Transaction
    await Transaction.create({
      playerId: player._id,
      usdAmount,
      cryptoAmount,
      currency,
      transactionType: 'bet',
      priceAtTime: prices[currency],
      transactionHash: uuidv4()
    });

    res.json({ message: 'Bet placed successfully', cryptoAmount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.post('/cashout', async (req, res) => {
  try {
    const { playerId } = req.body;
    const player = await Player.findById(playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    const roundNumber = getCurrentRound();
    const round = await GameRound.findOne({ status: "running" }).sort({ roundNumber: -1 });


    if (!round || round.status !== 'running') {
      return res.status(400).json({ error: 'No active round to cashout' });
    }

    const bet = round.bets.find(b => b.playerId.toString() === playerId);
    if (!bet) {
      return res.status(400).json({ error: 'No active bet found' });
    }

    const crashPoint = getCrashPoint();
    const currentMultiplier = require('../services/gameManager.service').getCurrentMultiplier();

    if (currentMultiplier >= crashPoint) {
      return res.status(400).json({ error: 'Too late! Game already crashed.' });
    }

    const payoutCrypto = bet.cryptoAmount * currentMultiplier;
    const payoutUSD = bet.usdAmount * currentMultiplier;

    // Update wallet
    player.wallet[bet.currency] += payoutCrypto;
    await player.save();

    // Add to cashout list
    round.cashouts.push({
      playerId: player._id,
      payoutCrypto,
      payoutUSD,
      atMultiplier: currentMultiplier,
      timestamp: new Date()
    });
    await round.save();

    // Log transaction
    await Transaction.create({
      playerId: player._id,
      usdAmount: payoutUSD,
      cryptoAmount: payoutCrypto,
      currency: bet.currency,
      transactionType: 'cashout',
      priceAtTime: bet.priceAtTime,
      transactionHash: uuidv4()
    });

    // Broadcast to WebSocket
    const { getIO } = require('../websocket/socket');
    const io = getIO()
    io.emit('player_cashout', {
      playerId,
      payoutCrypto,
      payoutUSD,
      atMultiplier: currentMultiplier.toFixed(2)
    });

    res.json({ message: 'Cashout successful', payoutCrypto, payoutUSD });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const { convertCryptoToUsd } = require('../services/crypto.service');

router.get('/wallet/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const player = await Player.findById(playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    const prices = await fetchCryptoPrices();
    const btcBalance = player.wallet.BTC || 0;
    const ethBalance = player.wallet.ETH || 0;

    const wallet = {
      BTC: {
        amount: btcBalance,
        usdValue: convertCryptoToUsd(btcBalance, 'BTC', prices)
      },
      ETH: {
        amount: ethBalance,
        usdValue: convertCryptoToUsd(ethBalance, 'ETH', prices)
      }
    };

    res.json({ wallet });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/round-history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const rounds = await GameRound.find({})
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      rounds: rounds.map(r => ({
        roundNumber: r.roundNumber,
        crashPoint: r.crashPoint.toFixed(2),
        totalBets: r.bets.length,
        totalCashouts: r.cashouts.length,
        status: r.status
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



module.exports = router;
