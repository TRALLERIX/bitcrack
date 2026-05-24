require('dotenv').config();
const { ethers } = require('ethers');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

// ─── RPC POOL: 3 parallella providers för max throughput ─────────────────────
const RPC = process.env.RPC_URL || process.env.ALCHEMY_HTTP_URL;
const PROVIDERS = [
  new ethers.JsonRpcProvider(RPC),
  new ethers.JsonRpcProvider(RPC),
  new ethers.JsonRpcProvider(RPC),
];
let _provIdx = 0;
function getProvider() { return PROVIDERS[_provIdx++ % PROVIDERS.length]; }

const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, PROVIDERS[0]);

const safe = a => ethers.getAddress(a.toLowerCase());

// ─── NONCE MANAGER (BETTER) ──────────────────────────────────────────────────
let _nonce = null;
let _nonceInFlight = 0;

async function getNonce() {
  if (_nonce === null) {
    _nonce = await PROVIDERS[0].getTransactionCount(wallet.address, 'latest');
  }
  return _nonce + (_nonceInFlight++);
}

function resetNonce() {
  _nonce = null;
  _nonceInFlight = 0;
}

// ─── TOKENS ───────────────────────────────────────────────────────────────────
const USDC = { addr: safe('0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'), dec: 6 };
const TOKENS = [
  { symbol:'WMATIC', addr:safe('0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'), dec:18, oracleAddr:safe('0xAB594600376Ec9fD91F8e885dADF0CE036862dE0') },
  { symbol:'WETH',   addr:safe('0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'), dec:18, oracleAddr:safe('0xF9680D99D6C9589e2a93a78A04A279e509205945') },
  { symbol:'WBTC',   addr:safe('0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6'), dec:8,  oracleAddr:safe('0xc907E116054Ad103354f2D350FD2514433D57F6f') },
  { symbol:'LINK',   addr:safe('0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39'), dec:18, oracleAddr:safe('0xd9FFdb71EbE7496cC440152d43986Aae0AB76665') },
  { symbol:'AAVE',   addr:safe('0xD6DF932A45C0f2334443796191D93a33904030d7'), dec:18, oracleAddr:safe('0x72484B12719E23115761D5DA1646945632979bB6') },
  { symbol:'UNI',    addr:safe('0xb33EaAd8d922B1083446DC23f610c2567fB5180f'), dec:18, oracleAddr:safe('0xdf0Fb4e4F928d2dCB76f438575fDD8682386e13C') },
  { symbol:'DAI',    addr:safe('0x8f3Cf7ad29050398306C912D41297F167739e7E5'), dec:18, oracleAddr:safe('0x4746DeC9e833A82EC7C2C1356372CcF2cfcD2F3D') },
  { symbol:'CRV',    addr:safe('0x172370d5Cd63279eFa2d502Ab2917793b4B1b2a5'), dec:18, oracleAddr:safe('0x336584C8E6Dc19637A5b36206B1c79923111b405') },
  { symbol:'GHST',   addr:safe('0x385aFEc5BBc52F56783C5ce5938964Ee09107103'), dec:18, oracleAddr:null },
  { symbol:'SAND',   addr:safe('0xBbba073C31Ff03069F7C8522299cf5D2F8DEef41'), dec:18, oracleAddr:null },
  { symbol:'MANA',   addr:safe('0xA1c349232D03F0f6831E940109748C010975e011'), dec:18, oracleAddr:null },
];

// ─── DEX CONFIG ───────────────────────────────────────────────────────────────
const DEXES_V2 = [
  { name:'QuickSwap', router:safe('0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff') },
  { name:'ApeSwap',   router:safe('0xC0788A3aD43d79aa53B09c2EaCc313A787d1d607') },
  { name:'Polycat',   router:safe('0x94930a328162957FF1dd48900aF67B5439336cBD') },
  { name:'JetSwap',   router:safe('0x5C6EC38fb0e2609672BDf628B1fD605A523E5923') },
];
const QUOTER_V3   = safe('0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6');
const ROUTER_V3   = safe('0xE592427A0AEce92De3Edee1F18E0157C05861564');
const MC3_ADDR    = safe('0xcA11bde05977b3631167028862bE2a173976CA11');
const ORACLE_MATIC = safe('0xAB594600376Ec9fD91F8e885dADF0CE036862dE0');
const V3_FEES     = [500, 3000, 10000];

// ─── ABIs ─────────────────────────────────────────────────────────────────────
const MC3_ABI       = ['function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) view returns (tuple(bool success, bytes returnData)[] returnData)'];
const V2_IFACE      = new ethers.Interface(['function getAmountsOut(uint256,address[]) view returns (uint256[])']);
const Q3_IFACE      = new ethers.Interface(['function quoteExactInputSingle(address,address,uint24,uint256,uint160) external returns (uint256)']);
const SWAP_V2_ABI   = ['function swapExactTokensForTokens(uint,uint,address[],address,uint) external returns (uint[])'];
const SWAP_V3_ABI   = ['function exactInputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 deadline,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)'];
const ERC20_ABI     = ['function balanceOf(address) view returns (uint256)', 'function allowance(address,address) view returns (uint256)', 'function approve(address,uint256) external returns (bool)', 'function transfer(address,uint256) external returns (bool)'];
const ORACLE_ABI    = ['function latestRoundData() external view returns (uint80,int256,uint256,uint256,uint80)'];

// ─── TX TIMEOUT ───────────────────────────────────────────────────────────────
async function waitForTx(tx, ms = 60000) {
  return Promise.race([
    tx.wait(),
    new Promise((_,r) => setTimeout(() => r(new Error('TX_TIMEOUT')), ms))
  ]);
}

// ─── LIKVIDITETSFILTER ───────────────────────────────────────────────────────
function filterLiquidity(entries) {
  if (entries.length < 2) return entries;
  const vals = entries.map(e => e.tokenAmt).sort((a,b) => a-b);
  const median = vals[Math.floor(vals.length / 2)];
  return entries.filter(e => e.tokenAmt >= median * 0.40);
}

// ─── ORACLE CACHE ─────────────────────────────────────────────────────────────
const oracleCache = {};
async function getOraclePrice(token) {
  if (!token.oracleAddr) return null;
  const c = oracleCache[token.symbol];
  if (c && Date.now() - c.ts < 15000) return c.v;
  try {
    const feed = new ethers.Contract(token.oracleAddr, ORACLE_ABI, getProvider());
    const [, ans, , upd] = await feed.latestRoundData();
    if (Date.now()/1000 - Number(upd) > 3600) return null;
    const price = Number(ans) / 1e8;
    oracleCache[token.symbol] = { v: price, ts: Date.now() };
    return price;
  } catch(_) { return null; }
}

// ─── MULTICALL SCAN (ALLA DEX × TOKENS I EN CALL) ────────────────────────────
function buildMulticallBatch(amtInRaw) {
  const calls = [];
  const meta  = [];
  for (const token of TOKENS) {
    for (const dex of DEXES_V2) {
      calls.push({ target: dex.router, allowFailure: true,
        callData: V2_IFACE.encodeFunctionData('getAmountsOut', [amtInRaw, [USDC.addr, token.addr]]) });
      meta.push({ type:'v2', sym: token.symbol, dec: token.dec, dex: dex.name });
    }
    for (const fee of V3_FEES) {
      calls.push({ target: QUOTER_V3, allowFailure: true,
        callData: Q3_IFACE.encodeFunctionData('quoteExactInputSingle', [USDC.addr, token.addr, fee, amtInRaw, 0]) });
      meta.push({ type:'v3', sym: token.symbol, dec: token.dec, dex: 'UniswapV3', fee });
    }
  }
  return { calls, meta };
}

async function multicallScan(amtInRaw, provider) {
  const { calls, meta } = buildMulticallBatch(amtInRaw);
  const mc3 = new ethers.Contract(MC3_ADDR, MC3_ABI, provider);
  const results = await mc3.aggregate3(calls);

  const raw = {};
  for (let i = 0; i < results.length; i++) {
    const m = meta[i];
    const r = results[i];
    if (!r.success || !r.returnData || r.returnData.length < 66) continue;
    try {
      let tokenAmt;
      if (m.type === 'v2') {
        const dec = V2_IFACE.decodeFunctionResult('getAmountsOut', r.returnData);
        tokenAmt = parseFloat(ethers.formatUnits(dec[0][1], m.dec));
      } else {
        const dec = Q3_IFACE.decodeFunctionResult('quoteExactInputSingle', r.returnData);
        tokenAmt = parseFloat(ethers.formatUnits(dec[0], m.dec));
      }
      if (!tokenAmt || tokenAmt <= 0 || !isFinite(tokenAmt)) continue;
      if (!raw[m.sym]) raw[m.sym] = {};
      if (!raw[m.sym][m.dex] || tokenAmt > raw[m.sym][m.dex]) raw[m.sym][m.dex] = tokenAmt;
    } catch(_) {}
  }
  return raw;
}

// ─── SPREAD BERÄKNING (ORACLE WARNING OPTIONAL) ──────────────────────────────
async function calcOpportunities(raw, amtInUSDC, maticUSD) {
  const gasCostUSDC = 600000 * 300e-9 * maticUSD;
  const results = [];

  for (const token of TOKENS) {
    const dexMap = raw[token.symbol];
    if (!dexMap) continue;

    let entries = Object.entries(dexMap).map(([dex, tokenAmt]) => ({ dex, tokenAmt }));
    entries = filterLiquidity(entries);
    if (entries.length < 2) continue;

    entries.sort((a,b) => b.tokenAmt - a.tokenAmt);
    const best  = entries[0];
    const worst = entries[entries.length - 1];
    
    // Oracle check — LOG it but DON'T BLOCK trades
    let oracleWarning = null;
    const oracleUSD = await getOraclePrice(token);
    if (oracleUSD && oracleUSD > 0) {
      const dexPrice  = amtInUSDC / best.tokenAmt;
      const oracleDiff = Math.abs(dexPrice - oracleUSD) / oracleUSD * 100;
      if (oracleDiff > 10) oracleWarning = 'Avviker ' + oracleDiff.toFixed(1) + '% från Oracle';
    }

    const spreadPct     = (best.tokenAmt - worst.tokenAmt) / worst.tokenAmt * 100;
    const slipFac       = 1 - settings.slippage / 100;
    const grossProfit   = amtInUSDC * (spreadPct / 100);
    const afterSlip     = grossProfit * slipFac * slipFac;
    const netProfit     = afterSlip - gasCostUSDC;

    results.push({
      symbol:       token.symbol,
      buyDex:       best.dex,
      sellDex:      worst.dex,
      buyTokenAmt:  best.tokenAmt.toFixed(6),
      sellTokenAmt: worst.tokenAmt.toFixed(6),
      spreadPct:    spreadPct.toFixed(3),
      grossProfit:  grossProfit.toFixed(4),
      afterSlip:    afterSlip.toFixed(4),
      gasCost:      gasCostUSDC.toFixed(4),
      netProfit:    netProfit.toFixed(4),
      oracleUSD:    oracleUSD ? oracleUSD.toFixed(4) : null,
      oracleWarning,
      dexCount:     entries.length,
      allPrices:    entries.map(e => ({ dex:e.dex, tokenAmt:e.tokenAmt.toFixed(6) })),
    });
  }
  return results;
}

// ─── APPROVE ─────────────────────────────────────────────────────────────────
async function ensureApprove(tokenAddr, spender, amount) {
  const erc20 = new ethers.Contract(tokenAddr, ERC20_ABI, wallet);
  const alw   = await erc20.allowance(wallet.address, spender);
  if (alw < amount) {
    const tx = await erc20.approve(spender, ethers.MaxUint256, {
      gasLimit: 100000, gasPrice: ethers.parseUnits('300', 'gwei'), nonce: await getNonce()
    });
    await waitForTx(tx);
  }
}

// ─── BUY / SELL ───────────────────────────────────────────────────────────────
function getDexRouterAndType(dexName) {
  const v2 = DEXES_V2.find(d => d.name === dexName);
  if (v2) return { type:'v2', router: v2.router };
  return { type:'v3', router: ROUTER_V3 };
}

async function swapBuy(dexName, tokenInfo, amtInRaw) {
  const { type, router } = getDexRouterAndType(dexName);
  const deadline = Math.floor(Date.now()/1000) + 180;
  await ensureApprove(USDC.addr, router, amtInRaw);

  if (type === 'v3') {
    let bestFee = 3000, bestOut = 0n;
    const q = new ethers.Contract(QUOTER_V3, ['function quoteExactInputSingle(address,address,uint24,uint256,uint160) external returns (uint256)'], PROVIDERS[0]);
    for (const fee of V3_FEES) {
      try {
        const o = await q.quoteExactInputSingle.staticCall(USDC.addr, tokenInfo.addr, fee, amtInRaw, 0);
        if (o > bestOut) { bestOut = o; bestFee = fee; }
      } catch(_) {}
    }
    const r = new ethers.Contract(router, SWAP_V3_ABI, wallet);
    return r.exactInputSingle({
      tokenIn: USDC.addr, tokenOut: tokenInfo.addr, fee: bestFee,
      recipient: wallet.address, deadline,
      amountIn: amtInRaw, amountOutMinimum: 0n, sqrtPriceLimitX96: 0n
    }, { gasLimit: 450000, gasPrice: ethers.parseUnits('300', 'gwei'), nonce: await getNonce() });
  } else {
    const r = new ethers.Contract(router, SWAP_V2_ABI, wallet);
    return r.swapExactTokensForTokens(
      amtInRaw, 0n, [USDC.addr, tokenInfo.addr], wallet.address, deadline,
      { gasLimit: 450000, gasPrice: ethers.parseUnits('300', 'gwei'), nonce: await getNonce() }
    );
  }
}

async function swapSell(dexName, tokenInfo, tokenAmtRaw) {
  const { type, router } = getDexRouterAndType(dexName);
  const deadline = Math.floor(Date.now()/1000) + 180;
  await ensureApprove(tokenInfo.addr, router, tokenAmtRaw);

  if (type === 'v3') {
    let bestFee = 3000, bestOut = 0n;
    const q = new ethers.Contract(QUOTER_V3, ['function quoteExactInputSingle(address,address,uint24,uint256,uint160) external returns (uint256)'], PROVIDERS[0]);
    for (const fee of V3_FEES) {
      try {
        const o = await q.quoteExactInputSingle.staticCall(tokenInfo.addr, USDC.addr, fee, tokenAmtRaw, 0);
        if (o > bestOut) { bestOut = o; bestFee = fee; }
      } catch(_) {}
    }
    const r = new ethers.Contract(router, SWAP_V3_ABI, wallet);
    return r.exactInputSingle({
      tokenIn: tokenInfo.addr, tokenOut: USDC.addr, fee: bestFee,
      recipient: wallet.address, deadline,
      amountIn: tokenAmtRaw, amountOutMinimum: 0n, sqrtPriceLimitX96: 0n
    }, { gasLimit: 450000, gasPrice: ethers.parseUnits('300', 'gwei'), nonce: await getNonce() });
  } else {
    const r = new ethers.Contract(router, SWAP_V2_ABI, wallet);
    return r.swapExactTokensForTokens(
      tokenAmtRaw, 0n, [tokenInfo.addr, USDC.addr], wallet.address, deadline,
      { gasLimit: 450000, gasPrice: ethers.parseUnits('300', 'gwei'), nonce: await getNonce() }
    );
  }
}

// ─── STATE ────────────────────────────────────────────────────────────────────
let settings    = { minSpread:5, maxSpread:80, slippage:10, minNetProfit:0.2 };
let scanning    = false;
let inTrade     = false;  // NEW: Better trade lock
let scanLoop    = null;
let totalProfit = 0;
let totalTrades = 0;
let scanCount   = 0;
let lastMaticUSD = 0.40;
let scanRates   = [];

// ─── MAIN SCAN ────────────────────────────────────────────────────────────────
async function runScan() {
  if (inTrade) {
    console.log('⏳ Still in trade, skipping scan');
    return;
  }
  
  scanning = true;
  const t0 = Date.now();
  scanCount++;
  try {
    const [balRaw, maticAnswer] = await Promise.all([
      new ethers.Contract(USDC.addr, ERC20_ABI, getProvider()).balanceOf(wallet.address),
      new ethers.Contract(ORACLE_MATIC, ORACLE_ABI, getProvider()).latestRoundData()
        .then(([,,ans]) => Number(ans) / 1e8).catch(() => lastMaticUSD)
    ]);
    lastMaticUSD = maticAnswer || lastMaticUSD;
    const balUSDC  = parseFloat(ethers.formatUnits(balRaw, 6));
    const tradeAmt = balUSDC * 0.5;
    const amtInRaw = balRaw / 2n;

    if (balUSDC < 2) {
      bc({ type:'LOG', msg:'⚠️ USDC too low: ' + balUSDC.toFixed(4) });
      scanning = false;
      return;
    }

    bc({ type:'BALANCE', balance:balUSDC.toFixed(4), tradeAmt:tradeAmt.toFixed(4), maticUSD:lastMaticUSD.toFixed(4) });

    const raw     = await multicallScan(amtInRaw, getProvider());
    const results = await calcOpportunities(raw, tradeAmt, lastMaticUSD);

    const scanMs = Date.now() - t0;
    scanRates.push(scanMs);
    if (scanRates.length > 20) scanRates.shift();
    const avgMs = scanRates.reduce((a,b)=>a+b,0)/scanRates.length;

    // FIXED: Don't block on oracle warning
    const opps = results.filter(r => {
      const s  = parseFloat(r.spreadPct);
      const np = parseFloat(r.netProfit);
      return s >= settings.minSpread && s <= settings.maxSpread && np >= settings.minNetProfit;
    });

    bc({ type:'SCAN', results, opps, scanCount,
         scanMs, avgMs: avgMs.toFixed(0),
         stats:{ scanned:results.length, opps:opps.length,
                 totalProfit:totalProfit.toFixed(4), totalTrades,
                 balance:balUSDC.toFixed(4), tradeAmt:tradeAmt.toFixed(4),
                 maticUSD:lastMaticUSD.toFixed(4) }
    });

    if (opps.length > 0 && !inTrade) {
      const best = [...opps].sort((a,b) => parseFloat(b.netProfit)-parseFloat(a.netProfit))[0];
      console.log(`\n🔥 OPPORTUNITY: ${best.symbol} | Spread: ${best.spreadPct}% | Profit: ${best.netProfit} USDC\n`);
      await executeTrade(best, amtInRaw, tradeAmt);
    }
  } catch(e) {
    console.error('Scan error:', e.message);
    bc({ type:'ERROR', msg:'Scan: ' + e.message.slice(0,120) });
  }
  scanning = false;
}

// ─── EXECUTE TRADE (WITH PROPER LOCK) ─────────────────────────────────────────
async function executeTrade(opp, amtInRaw, tradeAmt) {
  inTrade = true;
  bc({ type:'EXECUTING', opp, tradeAmt:tradeAmt.toFixed(4) });

  const tokenInfo = TOKENS.find(t => t.symbol === opp.symbol);
  if (!tokenInfo) {
    bc({ type:'TRADE_FAIL', opp, error:'Token not found in config' });
    inTrade = false;
    return;
  }

  try {
    // ═══ BUY ═══
    console.log(`[BUY] ${tradeAmt.toFixed(4)} USDC → ${opp.symbol} on ${opp.buyDex}`);
    const buyTx = await swapBuy(opp.buyDex, tokenInfo, amtInRaw);
    bc({ type:'TX_SENT', opp, hash:buyTx.hash, tradeAmt:tradeAmt.toFixed(4), step:'BUY' });
    console.log(`[BUY TX] ${buyTx.hash}`);

    const buyRcpt = await waitForTx(buyTx);
    if (buyRcpt.status !== 1) throw new Error('BUY reverted on-chain');
    console.log(`✅ BUY confirmed in block ${buyRcpt.blockNumber}`);

    // Get actual token balance
    const tokenErc = new ethers.Contract(tokenInfo.addr, ERC20_ABI, PROVIDERS[0]);
    const tokenBal = await tokenErc.balanceOf(wallet.address);
    if (tokenBal === 0n) throw new Error('0 tokens received');

    const tokenAmtFormatted = ethers.formatUnits(tokenBal, tokenInfo.dec);
    console.log(`Got ${tokenAmtFormatted} ${opp.symbol}`);

    // ═══ SELL ═══
    console.log(`[SELL] ${tokenAmtFormatted} ${opp.symbol} → USDC on ${opp.sellDex}`);
    const sellTx = await swapSell(opp.sellDex, tokenInfo, tokenBal);
    bc({ type:'TX_SENT', opp, hash:sellTx.hash, tradeAmt:tradeAmt.toFixed(4), step:'SELL' });
    console.log(`[SELL TX] ${sellTx.hash}`);

    const sellRcpt = await waitForTx(sellTx);
    if (sellRcpt.status !== 1) throw new Error('SELL reverted on-chain');
    console.log(`✅ SELL confirmed in block ${sellRcpt.blockNumber}`);

    // Final balance
    const usdcAfterRaw = await new ethers.Contract(USDC.addr, ERC20_ABI, PROVIDERS[0]).balanceOf(wallet.address);
    const usdcAfter    = parseFloat(ethers.formatUnits(usdcAfterRaw, 6));
    const profit       = parseFloat(opp.netProfit);
    totalProfit += profit;
    totalTrades++;

    bc({ type:'TRADE_SUCCESS', opp, hash:sellRcpt.hash, buyHash:buyRcpt.hash,
         profit:profit.toFixed(4), totalProfit:totalProfit.toFixed(4),
         totalTrades, tradeAmt:tradeAmt.toFixed(4),
         blockNumber:sellRcpt.blockNumber, usdcBalance:usdcAfter.toFixed(4) });
    console.log(`\n✅✅ TRADE SUCCESS: ${opp.symbol} +${profit.toFixed(4)} USDC | Balance: ${usdcAfter.toFixed(4)}\n`);

  } catch(e) {
    console.error('Trade error:', e.message);
    resetNonce();
    bc({ type:'TRADE_FAIL', opp, error: e.message.slice(0,250) });
    
    // FALLBACK: sell remaining tokens
    try {
      const tokenErc = new ethers.Contract(tokenInfo.addr, ERC20_ABI, PROVIDERS[0]);
      const left = await tokenErc.balanceOf(wallet.address);
      if (left > 0n) {
        console.log(`⚠️ FALLBACK: selling remaining ${opp.symbol}...`);
        bc({ type:'LOG', msg:`⚠️ FALLBACK selling ${opp.symbol}...` });
        const fbTx = await swapSell(opp.sellDex, tokenInfo, left);
        await waitForTx(fbTx);
        bc({ type:'LOG', msg:'✅ FALLBACK completed' });
      }
    } catch(fe) {
      console.error('Fallback error:', fe.message);
      bc({ type:'ERROR', msg:'FALLBACK FAIL: ' + fe.message.slice(0,80) });
    }
  } finally {
    inTrade = false;  // ALWAYS unlock
    console.log('Trade lock released\n');
  }
}

// ─── WS + EXPRESS ─────────────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);
const wss    = new WebSocket.Server({ server });

function bc(data) {
  const m = JSON.stringify(data);
  wss.clients.forEach(c => { if (c.readyState === 1) c.send(m); });
}

function applySettings(d) {
  if (d.minSpread    != null) settings.minSpread    = +d.minSpread    || 5;
  if (d.maxSpread    != null) settings.maxSpread    = +d.maxSpread    || 80;
  if (d.slippage     != null) settings.slippage     = +d.slippage     || 10;
  if (d.minNetProfit != null) settings.minNetProfit = +d.minNetProfit || 0.2;
}

wss.on('connection', ws => {
  ws.send(JSON.stringify({ type:'CONNECTED', settings }));
  ws.on('message', raw => {
    try {
      const d = JSON.parse(raw);
      if (d.type === 'START') {
        applySettings(d);
        if (!scanLoop) {
          console.log('🚀 Starting scan engine...');
          runScan();
          scanLoop = setInterval(() => { if (!scanning && !inTrade) runScan(); }, 50);
        }
      }
      if (d.type === 'STOP') {
        if(scanLoop) { clearInterval(scanLoop); scanLoop = null; }
        console.log('⏹️ Scan engine stopped');
      }
      if (d.type === 'SETTINGS') applySettings(d);
    } catch(_) {}
  });
});

app.use(express.json());
app.get('/',       (req,res) => { res.setHeader('Content-Type','text/html'); res.end(HTML); });
app.get('/wallet', (req,res) => res.json({ address: wallet.address }));

// ─── WITHDRAW ─────────────────────────────────────────────────────────────────
app.post('/withdraw', async (req, res) => {
  try {
    const to = req.body && req.body.to ? req.body.to.trim() : null;
    if (!to || !ethers.isAddress(to)) return res.status(400).json({ ok:false, error:'Invalid address' });
    const erc20  = new ethers.Contract(USDC.addr, ERC20_ABI, wallet);
    const balRaw = await erc20.balanceOf(wallet.address);
    if (balRaw === 0n) return res.status(400).json({ ok:false, error:'No USDC' });
    const balFmt = ethers.formatUnits(balRaw, 6);
    bc({ type:'LOG', msg:'⏳ WITHDRAW: ' + balFmt + ' USDC → ' + to.slice(0,10) + '...' });
    const tx = await erc20.transfer(to, balRaw, {
      gasLimit: 120000, gasPrice: ethers.parseUnits('300', 'gwei'), nonce: await getNonce()
    });
    const receipt = await waitForTx(tx);
    bc({ type:'WITHDRAW_DONE', to, amount:balFmt, hash:receipt.hash });
    res.json({ ok:true, hash:receipt.hash, amount:balFmt });
  } catch(e) {
    bc({ type:'ERROR', msg:'WITHDRAW ERROR: ' + e.message.slice(0,120) });
    res.status(500).json({ ok:false, error:e.message.slice(0,200) });
  }
});

const PORT = process.env.PORT || 3020;
server.listen(PORT, () => console.log('\n🚀 3080 HFT: http://localhost:' + PORT + '\n'));
