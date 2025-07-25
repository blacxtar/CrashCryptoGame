const axios = require('axios');

let cachedPrices = null;
let lastFetched = 0;
const CACHE_DURATION = 10 * 1000; // 10 seconds

async function fetchCryptoPrices() {
  const now = Date.now();

  // Return cached prices if within 10s
  if (cachedPrices && (now - lastFetched) < CACHE_DURATION) {
    return cachedPrices;
  }

  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd'
    );

    const prices = {
      BTC: response.data.bitcoin.usd,
      ETH: response.data.ethereum.usd
    };

    cachedPrices = prices;
    lastFetched = now;

    return prices;
  } catch (error) {
    console.error("❌ Error fetching crypto prices:", error.message);
    // Fallback to last known prices
    if (cachedPrices) return cachedPrices;
    throw new Error("Failed to fetch crypto prices and no cache available");
  }
}

function convertUsdToCrypto(usdAmount, currency, prices) {
  if (!prices || !prices[currency]) {
    throw new Error(`Invalid price data for ${currency}`);
  }
  return usdAmount / prices[currency];
}

function convertCryptoToUsd(cryptoAmount, currency, prices) {
  if (!prices || !prices[currency]) {
    throw new Error(`Invalid price data for ${currency}`);
  }
  return cryptoAmount * prices[currency];
}

module.exports = {
  fetchCryptoPrices,
  convertUsdToCrypto,
  convertCryptoToUsd
};
