


const axios = require("axios");

let cachedPrices = null;
let lastFetched = 0;
const CACHE_DURATION = 60000; // 1 minute

async function fetchCryptoPrices() {
  const now = Date.now();

  // ✅ Use cached prices if recent
  if (cachedPrices && (now - lastFetched) < CACHE_DURATION) {
    return cachedPrices;
  }

  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd',
      { timeout: 5000 }
    );

    const prices = {
      BTC: response.data.bitcoin.usd,
      ETH: response.data.ethereum.usd
    };

    // ✅ Cache the prices
    cachedPrices = prices;
    lastFetched = now;

    return prices;
  } catch (error) {
    console.error("❌ Error fetching crypto prices:", error.message);

    // ✅ Use previously cached prices if available
    if (cachedPrices) {
      console.warn("⚠️ Using last known prices from cache");
      return cachedPrices;
    }

    // ✅ Fallback to hardcoded defaults if no cache available
    console.warn("⚠️ Using hardcoded fallback prices");
    return {
      BTC: 30000,
      ETH: 1800
    };
  }
}

module.exports = { fetchCryptoPrices };


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
