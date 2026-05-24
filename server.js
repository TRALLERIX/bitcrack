require('dotenv').config();
const { ethers } = require('ethers');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

// ═══════════════════════════════════════════════════════════════════════════════
// ✅ HTML CONSTANT FIRST (BEFORE EXPRESS SETUP)
// ═══════════════════════════════════════════════════════════════════════════════

const HTML = `<!DOCTYPE html>
<html lang="sv">
<head>
<meta charset="UTF-8">
<title>3080 HFT COMMAND CENTER</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#05050a;--p:#09090f;--b:#13131c;--b2:#1a1a26;--g:#00ff88;--g2:#00cc66;--r:#ff3355;--y:#ffd000;--bl:#00aaff;--text:#7878a0;--dim:#252538}
html,body{height:100%;overflow:hidden}
body{background:var(--bg);color:var(--text);font-family:'Consolas','Courier New',monospace;display:flex;flex-direction:column}
#top{display:flex;align-items:center;gap:14px;padding:9px 20px;background:var(--p);border-bottom:1px solid var(--b2);flex-shrink:0}
h1{font-size:12px;letter-spacing:5px;color:var(--g)}
.chip{font-size:9px;padding:3px 9px;border-radius:10px;border:1px solid var(--b2);color:#3a3a55;letter-spacing:1px}
.chip b{color:var(--g)}.chip.y b{color:var(--y)}.chip.r b{color:var(--r)}.chip.bl b{color:var(--bl)}
#dot{font-size:9px;padding:4px 13px;border-radius:10px;background:#100008;color:var(--r);border:1px solid #3a0015;transition:all .4s;letter-spacing:1px}
#dot.on{background:#001508;color:var(--g);border-color:#00401a;box-shadow:0 0 10px #00ff8820}
#dot.exec{background:#120800;color:var(--y);border-color:#3a2000}
#dot.pause{background:#00070f;color:var(--bl);border-color:#00254a}
.ml{margin-left:auto}
#clock{font-size:9px;color:#2a2a3a;letter-spacing:1px}
#spd{font-size:9px;color:#00ff8844;letter-spacing:1px;min-width:120px;text-align:right}
#wbar{display:flex;align-items:center;gap:16px;padding:5px 20px;background:#07070d;border-bottom:1px solid var(--b);flex-shrink:0;font-size:10px}
.wi{display:flex;align-items:center;gap:6px;color:#2a2a3a;letter-spacing:1px}
.wi .v{font-size:12px;font-weight:bold}
.wi .v.g{color:var(--g)}.wi .v.y{color:var(--y)}.wi .v.bl{color:var(--bl)}
#waddr{font-size:9px;color:#1a1a2a;margin-left:auto}
#waddr a{color:#222235;text-decoration:none;transition:color .2s}
#waddr a:hover{color:var(--bl)}
#sbar{display:flex;align-items:center;gap:9px;padding:6px 20px;background:#07070d;border-bottom:1px solid var(--b);flex-shrink:0;flex-wrap:wrap}
.sg{display:flex;align-items:center;gap:5px;font-size:9px;color:#2a2a3a;letter-spacing:1px}
input[type=number]{background:#000;border:1px solid var(--dim);color:var(--g);padding:4px 7px;width:66px;font-family:'Consolas',monospace;font-size:11px;border-radius:2px}
input[type=number]:focus{outline:none;border-color:var(--g)}
input.y{color:var(--y)}input.y:focus{border-color:var(--y)}
.vd{width:1px;height:16px;background:var(--b2);margin:0 2px}
button{padding:6px 20px;font-family:'Consolas',monospace;font-size:10px;font-weight:bold;cursor:pointer;border:none;border-radius:2px;letter-spacing:2px;transition:all .2s}
#bStart{background:var(--g);color:#000}#bStart:hover{box-shadow:0 0 14px #00ff8870}
#bStop{background:var(--r);color:#fff;display:none}#bStop:hover{box-shadow:0 0 14px #ff335570}
#bWithdraw{background:transparent;color:#ffd000;border:1px solid #ffd000;padding:6px 18px}
#bWithdraw:hover{background:#ffd00015;box-shadow:0 0 12px #ffd00040}
#wModal{display:none;position:fixed;inset:0;background:#000000cc;z-index:999;align-items:center;justify-content:center}
#wModal.show{display:flex}
#wBox{background:#0a0a12;border:1px solid #ffd000;padding:28px 32px;min-width:380px;border-radius:4px;font-family:'Consolas',monospace}
#wBox h3{color:#ffd000;font-size:12px;letter-spacing:3px;margin-bottom:18px}
#wBox .wrow{font-size:11px;color:#555;margin-bottom:6px}
#wBox .wbal{font-size:22px;font-weight:bold;color:var(--g);margin-bottom:18px}
#wAddrIn{background:#000;border:1px solid #333;color:#ffd000;padding:10px;width:100%;font-family:'Consolas',monospace;font-size:11px;border-radius:2px;margin-bottom:14px;box-sizing:border-box}
#wAddrIn:focus{outline:none;border-color:#ffd000}
#wBtns{display:flex;gap:10px}
#wConfirm{flex:1;padding:11px;background:#ffd000;color:#000;font-weight:bold;font-family:'Consolas',monospace;font-size:11px;border:none;cursor:pointer;letter-spacing:2px;border-radius:2px}
#wConfirm:hover{box-shadow:0 0 14px #ffd00060}
#wCancel{padding:11px 18px;background:transparent;color:#555;border:1px solid #222;font-family:'Consolas',monospace;font-size:11px;cursor:pointer;border-radius:2px}
#wStatus{margin-top:12px;font-size:10px;color:#555;min-height:16px;word-break:break-all}
#srow{display:grid;grid-template-columns:repeat(8,1fr);gap:1px;background:var(--b);flex-shrink:0}
.sc{background:var(--p);padding:7px 14px}
.sl{font-size:7px;letter-spacing:2px;color:#1e1e2e;text-transform:uppercase;margin-bottom:3px}
.sv{font-size:18px;font-weight:bold;color:#555;transition:all .3s}
.sv.g{color:var(--g)}.sv.y{color:var(--y)}.sv.bl{color:var(--bl)}.sv.r{color:var(--r)}
.sv.sm{font-size:9px;padding-top:5px;letter-spacing:1px}
#main{display:grid;grid-template-columns:1fr 380px;gap:1px;background:var(--b);flex:1;min-height:0}
.pn{background:var(--p);display:flex;flex-direction:column;overflow:hidden}
.ph{padding:8px 14px;font-size:8px;font-weight:bold;letter-spacing:3px;color:var(--g);border-bottom:1px solid var(--b2);background:#06060c;flex-shrink:0;display:flex;justify-content:space-between;align-items:center}
.ph em{color:var(--dim);font-style:normal;font-size:8px;letter-spacing:1px}
.pb{flex:1;overflow-y:auto;padding:7px}
#tg{display:grid;grid-template-columns:repeat(auto-fill,minmax(153px,1fr));gap:4px}
.tc{background:#000;border:1px solid #0c0c18;padding:8px 10px;border-radius:3px;transition:all .25s}
.tc.hot{border-color:var(--g);background:#001a0a01;box-shadow:0 0 8px #00ff8810}
.tc.warm{border-color:var(--y)}
.tc.new{animation:pop .2s}
@keyframes pop{0%{transform:scale(1.04)}100%{transform:none}}
.ts{font-size:10px;font-weight:bold;color:#aaa;margin-bottom:3px;display:flex;justify-content:space-between}
.ts small{font-size:7px;color:#1e1e2e;padding:1px 4px;border:1px solid #151524;border-radius:8px}
.tsp{font-size:19px;font-weight:bold;line-height:1.1}
.hot .tsp{color:var(--g)}.warm .tsp{color:var(--y)}.tc:not(.hot):not(.warm) .tsp{color:#1a1a28}
.td{font-size:7px;color:#222232;margin-top:2px;letter-spacing:.3px}
.tp{font-size:8px;margin-top:4px;padding-top:3px;border-top:1px solid #0c0c18}
.hot .tp{color:var(--g2)}.warm .tp{color:#998800}.tc:not(.hot):not(.warm) .tp{color:#141420}
.tor{font-size:7px;margin-top:2px;color:#1a3a2a}.hot .tor{color:#00552a}
.warn-badge{font-size:6px;color:var(--r);margin-top:2px;opacity:.7}
.opp{background:#000;border:1px solid var(--g);padding:11px 13px;margin-bottom:7px;border-radius:3px;animation:fi .3s}
@keyframes fi{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
.ot{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.os{font-size:13px;font-weight:bold;color:var(--g)}.osp{font-size:15px;font-weight:bold;color:var(--g)}
.or2{display:flex;justify-content:space-between;font-size:9px;color:#333;margin-top:2px}
.or2 b{color:#777}
.dps{display:flex;gap:3px;flex-wrap:wrap;margin-top:6px}
.dp{font-size:7px;padding:2px 6px;border-radius:8px;background:#0a0a10;border:1px solid #111120;color:#252535}
.dp.best{border-color:var(--g);color:var(--g)}.dp.low{border-color:#0d0d1a}
.obox{margin-top:7px;border-top:1px solid #0e0e1a;padding-top:6px}
.orow{display:flex;justify-content:space-between;font-size:9px;margin-top:2px}
.orow .k{color:#333;letter-spacing:.5px}.orow .v{font-weight:bold}
.orow .v.g{color:var(--g)}.orow .v.y{color:var(--y)}.orow .v.r{color:var(--r)}.orow .v.w{color:#888}
.te{padding:10px 12px;margin-bottom:7px;border-radius:3px;animation:fi .3s;font-size:9px}
.te.ok{background:#001408;border:1px solid #005522;color:var(--g2)}
.te.sent{background:#0a0700;border:1px solid #332200;color:var(--y)}
.te.fail{background:#140005;border:1px solid #440011;color:#993344}
.te.info{background:#000a10;border:1px solid #003344;color:#00aaff}
.te-h{font-size:10px;font-weight:bold;margin-bottom:4px;letter-spacing:.5px}
.te-row{display:flex;justify-content:space-between;margin-top:2px}
.te-row b{color:#aaa}.te-row.profit b{color:var(--g)}
.th{font-size:8px;color:#222;word-break:break-all;margin-top:5px;padding-top:4px;border-top:1px solid #0a0a14}
.th a{color:#1a3050;text-decoration:none}.th a:hover{color:var(--bl)}
.exec-b{background:#100800;border:1px solid #443300;padding:10px 12px;margin-bottom:7px;border-radius:3px;color:var(--y);font-size:9px;animation:pulse 1.2s infinite;letter-spacing:.5px}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
#emp{color:#111120;font-size:10px;padding:40px;text-align:center;letter-spacing:3px;line-height:2.5}
::-webkit-scrollbar{width:2px}::-webkit-scrollbar-track{background:#000}::-webkit-scrollbar-thumb{background:#1a1a2a}
</style>
</head>
<body>
<div id="top">
  <h1>⚡ 3080 HFT // COMMAND CENTER</h1>
  <div class="chip">TOKENS <b>11</b></div>
  <div class="chip">DEX <b>5</b></div>
  <div class="chip bl">MULTICALL3</div>
  <div class="chip r">CHAINLINK</div>
  <div id="dot">● OFFLINE</div>
  <div class="ml"></div>
  <div id="spd">-- ms/scan</div>
  <div id="clock">--:--:--</div>
</div>
<div id="wbar">
  <div class="wi">USDC <span class="v g" id="wBal">-.-</span></div>
  <div class="vd"></div>
  <div class="wi">TRADE 50% <span class="v y" id="wAmt">-.-</span></div>
  <div class="vd"></div>
  <div class="wi">MATIC <span class="v bl" id="wMatic">-.-</span></div>
  <div class="vd"></div>
  <div class="wi">GAS EST <span class="v" id="wGas" style="color:#555">-.-</span></div>
  <div id="waddr">WALLET: <a id="wLink" href="#" target="_blank">...</a></div>
</div>
<div id="sbar">
  <div class="sg">MIN SPREAD % <input type="number" id="iMin" value="5" step="0.5" min="0.1"></div>
  <div class="vd"></div>
  <div class="sg">MAX SPREAD % <input type="number" id="iMax" value="80" step="1" min="1"></div>
  <div class="vd"></div>
  <div class="sg">SLIPPAGE % <input type="number" id="iSlip" value="10" step="0.5" min="0.1"></div>
  <div class="vd"></div>
  <div class="sg">MIN NETTO $ <input class="y" type="number" id="iMinNet" value="0.2" step="0.05" min="0"></div>
  <div class="vd"></div>
  <button id="bStart" onclick="startEngine()">▶ BOOT</button>
  <button id="bStop"  onclick="stopEngine()">■ HALT</button>
  <div class="vd"></div>
  <button id="bWithdraw" onclick="openWithdraw()">⬇ WITHDRAW</button>
</div>
<div id="wModal">
  <div id="wBox">
    <h3>⬇ WITHDRAW USDC</h3>
    <div class="wrow">AVAILABLE BALANCE</div>
    <div class="wbal" id="wModalBal">... USDC</div>
    <div class="wrow">RECIPIENT ADDRESS (Polygon)</div>
    <input type="text" id="wAddrIn" placeholder="0x..." autocomplete="off" spellcheck="false">
    <div id="wBtns">
      <button id="wCancel" onclick="closeWithdraw()">CANCEL</button>
      <button id="wConfirm" onclick="doWithdraw()">⚡ SEND ALL</button>
    </div>
    <div id="wStatus"></div>
  </div>
</div>
<div id="srow">
  <div class="sc"><div class="sl">Scan #</div><div class="sv bl" id="stN">0</div></div>
  <div class="sc"><div class="sl">Scanned</div><div class="sv" id="stSc">0</div></div>
  <div class="sc"><div class="sl">Opps</div><div class="sv y" id="stOp">0</div></div>
  <div class="sc"><div class="sl">Trades</div><div class="sv" id="stTr">0</div></div>
  <div class="sc"><div class="sl">Total Profit</div><div class="sv g" id="stPr">0.0000</div></div>
  <div class="sc"><div class="sl">Trade Amt</div><div class="sv y" id="stAm">-.--</div></div>
  <div class="sc"><div class="sl">ms/scan</div><div class="sv bl" id="stMs">--</div></div>
  <div class="sc"><div class="sl">Status</div><div class="sv sm" id="stSt">OFFLINE</div></div>
</div>
<div id="main">
  <div class="pn">
    <div class="ph">LIVE SCANNER — MULTICALL3 — 5 DEX — LIQUIDITY FILTERED <em id="tick">SCAN #0</em></div>
    <div class="pb"><div id="tg"></div></div>
  </div>
  <div class="pn">
    <div class="ph">🔥 OPPORTUNITIES & TRADE LOG <em id="oc">0 ACTIVE</em></div>
    <div class="pb" id="side"><div id="emp">⚡ CLICK BOOT TO START</div></div>
  </div>
</div>
<script>
var ws = null, cards = {};
setInterval(function(){ document.getElementById('clock').textContent = new Date().toLocaleTimeString('en-US'); }, 1000);
fetch('/wallet').then(function(r){return r.json();}).then(function(d){
  var el=document.getElementById('wLink'); el.textContent=d.address.slice(0,8)+'...'+d.address.slice(-4); el.href='https://polygonscan.com/address/'+d.address;
}).catch(function(){});
function dot(t,c){ var e=document.getElementById('dot'); e.innerHTML='● '+t; e.className=c||''; }
function hashLink(h){ if(!h)return '-'; return '<a href="https://polygonscan.com/tx/'+h+'" target="_blank">'+h.slice(0,10)+'...'+h.slice(-6)+'</a>'; }
function ins(el){
  var side=document.getElementById('side');
  var emp=document.getElementById('emp'); if(emp)emp.remove();
  side.insertBefore(el, side.firstChild);
  while(side.children.length>60) side.removeChild(side.lastChild);
}
function rmClass(cls){ document.querySelectorAll('.'+cls).forEach(function(e){e.remove();}); }
function connectWS(){
  ws = new WebSocket('ws://'+location.host);
  ws.onopen  = function(){ dot('LIVE','on'); document.getElementById('stSt').textContent='LIVE'; };
  ws.onclose = function(){ dot('OFFLINE',''); document.getElementById('stSt').textContent='RECONNECTING'; setTimeout(connectWS,3000); };
  ws.onmessage = function(e){
    var d; try{ d=JSON.parse(e.data); }catch(err){ return; }

    if(d.type==='CONNECTED'){
      document.getElementById('iMin').value   = d.settings.minSpread;
      document.getElementById('iMax').value   = d.settings.maxSpread;
      document.getElementById('iSlip').value  = d.settings.slippage;
      document.getElementById('iMinNet').value= d.settings.minNetProfit;
    }
    if(d.type==='BALANCE'){
      document.getElementById('wBal').textContent  = d.balance+' USDC';
      document.getElementById('wAmt').textContent  = d.tradeAmt+' USDC';
      document.getElementById('wMatic').textContent= '$'+d.maticUSD;
      document.getElementById('wGas').textContent  = '$'+(600000*300e-9*parseFloat(d.maticUSD)).toFixed(4);
    }
    if(d.type==='PARTIAL'){ updateCard(d.result); }
    if(d.type==='SCAN'){
      document.getElementById('stN').textContent  = d.scanCount;
      document.getElementById('stSc').textContent = d.stats.scanned;
      document.getElementById('stOp').textContent = d.stats.opps;
      document.getElementById('stPr').textContent = d.stats.totalProfit+' USDC';
      document.getElementById('stAm').textContent = d.stats.tradeAmt+' USDC';
      document.getElementById('stTr').textContent = d.stats.totalTrades;
      document.getElementById('stMs').textContent = d.avgMs+'ms';
      document.getElementById('tick').textContent  = 'SCAN #'+d.scanCount+' | '+d.scanMs+'ms';
      document.getElementById('spd').textContent   = d.avgMs+'ms/scan (~'+(1000/parseFloat(d.avgMs)).toFixed(1)+'/s)';
      if(d.results) d.results.forEach(updateCard);
      if(d.opps && d.opps.length) renderOpps(d.opps);
    }
    if(d.type==='EXECUTING'){
      dot('EXECUTING','exec'); document.getElementById('stSt').textContent='EXECUTING';
      rmClass('exec-b');
      var el=document.createElement('div'); el.className='exec-b';
      el.innerHTML='⚡ EXECUTING: '+d.opp.symbol+' | '+d.tradeAmt+' USDC | '+d.opp.buyDex+' → '+d.opp.sellDex;
      ins(el);
    }
    if(d.type==='TX_SENT'){
      var label = d.step==='SELL' ? '→ SELLING' : '← BUYING';
      var dex   = d.step==='SELL' ? d.opp.sellDex : d.opp.buyDex;
      var el=document.createElement('div'); el.className='te sent';
      el.innerHTML='<div class="te-h">⏱ '+label+' '+d.opp.symbol+'</div>'+
        '<div class="te-row"><span>Amount</span><b>'+d.tradeAmt+' USDC</b></div>'+
        '<div class="te-row"><span>DEX</span><b>'+dex+'</b></div>'+
        '<div class="th">TX: '+hashLink(d.hash)+'</div>';
      ins(el);
    }
    if(d.type==='TRADE_SUCCESS'){
      dot('SCANNING','on'); document.getElementById('stSt').textContent='SCANNING';
      rmClass('exec-b');
      document.getElementById('stTr').textContent=d.totalTrades;
      document.getElementById('stPr').textContent=d.totalProfit+' USDC';
      var el=document.createElement('div'); el.className='te ok';
      el.innerHTML='<div class="te-h">✓ SETTLED: '+d.opp.symbol+'</div>'+
        '<div class="te-row"><span>Spread</span><b>'+d.opp.spreadPct+'%</b></div>'+
        '<div class="te-row"><span>Amount</span><b>'+d.tradeAmt+' USDC</b></div>'+
        '<div class="te-row profit"><span>Net Profit</span><b>+'+d.profit+' USDC</b></div>'+
        '<div class="te-row"><span>Total Profit</span><b>'+d.totalProfit+' USDC</b></div>'+
        '<div class="te-row"><span>Balance</span><b>'+d.usdcBalance+' USDC</b></div>'+
        '<div class="te-row"><span>Block</span><b>#'+d.blockNumber+'</b></div>'+
        '<div class="th">BUY: '+hashLink(d.buyHash)+'</div>'+
        '<div class="th">SELL: '+hashLink(d.hash)+'</div>';
      ins(el);
    }
    if(d.type==='TRADE_FAIL'){
      dot('SCANNING','on'); document.getElementById('stSt').textContent='SCANNING';
      rmClass('exec-b');
      var el=document.createElement('div'); el.className='te fail';
      el.innerHTML='<div class="te-h">✗ FAIL: '+d.opp.symbol+'</div>'+
        '<div style="font-size:8px;color:#aa3344;margin-top:4px;word-break:break-all">'+d.error+'</div>';
      ins(el);
    }
    if(d.type==='LOG'){
      var el=document.createElement('div'); el.className='te info';
      el.innerHTML='<div style="font-size:9px">'+d.msg+'</div>';
      ins(el);
    }
    if(d.type==='ERROR'){
      var el=document.createElement('div'); el.className='te fail';
      el.innerHTML='<div class="te-h" style="color:#ff3355">⚠ ERROR</div>'+
        '<div style="font-size:8px;color:#aa3344;margin-top:3px;word-break:break-all">'+d.msg+'</div>';
      ins(el);
      dot('ERROR',''); setTimeout(function(){dot('SCANNING','on'); document.getElementById('stSt').textContent='SCANNING';},5000);
    }
    if(d.type==='WITHDRAW_DONE'){
      document.getElementById('wStatus').style.color='#00ff88';
      document.getElementById('wStatus').innerHTML='✓ '+d.amount+' USDC sent!<br><a href="https://polygonscan.com/tx/'+d.hash+'" target="_blank" style="color:#00aaff">'+d.hash.slice(0,14)+'... ↗</a>';
      document.getElementById('wConfirm').disabled=false;
      document.getElementById('wConfirm').textContent='⚡ SEND ALL';
      document.getElementById('wBal').textContent='0.0000 USDC';
    }
  };
}
connectWS();
function startEngine(){
  if(!ws||ws.readyState!==1) return;
  document.getElementById('bStart').style.display='none';
  document.getElementById('bStop').style.display='block';
  document.getElementById('stSt').textContent='STARTING';
  ws.send(JSON.stringify({type:'START',minSpread:+document.getElementById('iMin').value,maxSpread:+document.getElementById('iMax').value,slippage:+document.getElementById('iSlip').value,minNetProfit:+document.getElementById('iMinNet').value}));
}
function stopEngine(){
  if(!ws||ws.readyState!==1) return;
  document.getElementById('bStop').style.display='none';
  document.getElementById('bStart').style.display='block';
  document.getElementById('stSt').textContent='STOPPED';
  dot('STOPPED','');
  ws.send(JSON.stringify({type:'STOP'}));
}
function updateCard(r){
  var s=parseFloat(r.spreadPct), np=parseFloat(r.netProfit);
  var mn=+document.getElementById('iMin').value||5, mx=+document.getElementById('iMax').value||80, mnet=+document.getElementById('iMinNet').value||0.2;
  var inRange=s>=mn&&s<=mx&&np>=mnet&&!r.oracleWarning;
  var warm=s>=mn*0.5&&!inRange;
  var cls=inRange?'tc hot':(warm?'tc warm':'tc');
  var c=cards[r.symbol];
  if(!c){ c=document.createElement('div'); c.id='tc-'+r.symbol; document.getElementById('tg').appendChild(c); cards[r.symbol]=c; }
  if(c.className.indexOf('hot')<0&&inRange) cls+=' new';
  c.className=cls;
  c.innerHTML='<div class="ts"><span>'+r.symbol+'</span><small>'+r.dexCount+' DEX</small></div>'+
    '<div class="tsp">'+r.spreadPct+'%</div>'+
    '<div class="td">B: '+r.buyDex+'</div><div class="td">S: '+r.sellDex+'</div>'+
    '<div class="tp">Net: '+(np>=0?'+':'')+r.netProfit+' USDC</div>'+
    (r.oracleUSD?'<div class="tor">ORACLE: $'+r.oracleUSD+'</div>':'<div class="tor">ORACLE: N/A</div>')+
    (r.oracleWarning?'<div class="warn-badge">⚠ '+r.oracleWarning+'</div>':'');
}
function renderOpps(opps){
  document.getElementById('oc').textContent=opps.length+' ACTIVE';
  opps.sort(function(a,b){return parseFloat(b.netProfit)-parseFloat(a.netProfit);});
  opps.forEach(function(o){
    var old=document.getElementById('opp-'+o.symbol); if(old)old.remove();
    var el=document.createElement('div'); el.className='opp'; el.id='opp-'+o.symbol;
    var dpsHtml=o.allPrices.map(function(p){return '<div class="dp '+(p.dex===o.buyDex?'best':'low')+'">'+p.dex+': '+p.tokenAmt+'</div>';}).join('');
    el.innerHTML='<div class="ot"><span class="os">⚡ '+o.symbol+'</span><span class="osp">+'+o.spreadPct+'%</span></div>'+
      '<div class="or2"><span>BUY → <b>'+o.buyDex+'</b></span><span>'+o.buyTokenAmt+'</span></div>'+
      '<div class="or2"><span>SELL → <b>'+o.sellDex+'</b></span><span>'+o.sellTokenAmt+'</span></div>'+
      '<div class="dps">'+dpsHtml+'</div>'+
      '<div class="obox">'+
        '<div class="orow"><span class="k">GROSS</span><span class="v y">+'+o.grossProfit+' USDC</span></div>'+
        '<div class="orow"><span class="k">AFTER SLIPPAGE</span><span class="v w">'+o.afterSlip+' USDC</span></div>'+
        '<div class="orow"><span class="k">GAS</span><span class="v r">-'+o.gasCost+' USDC</span></div>'+
        '<div class="orow"><span class="k">NET</span><span class="v g">+'+o.netProfit+' USDC</span></div>'+
      '</div>';
    ins(el);
  });
}
function openWithdraw(){ document.getElementById('wModalBal').textContent=document.getElementById('wBal').textContent; document.getElementById('wAddrIn').value=''; document.getElementById('wStatus').textContent=''; document.getElementById('wConfirm').disabled=false; document.getElementById('wConfirm').textContent='⚡ SEND ALL'; document.getElementById('wModal').classList.add('show'); }
function closeWithdraw(){ document.getElementById('wModal').classList.remove('show'); }
function doWithdraw(){
  var addr=document.getElementById('wAddrIn').value.trim();
  if(!addr||addr.length<10){ document.getElementById('wStatus').style.color='#ff3355'; document.getElementById('wStatus').textContent='Enter valid address'; return; }
  document.getElementById('wConfirm').disabled=true; document.getElementById('wConfirm').textContent='⏳ SENDING...';
  document.getElementById('wStatus').style.color='#ffd000'; document.getElementById('wStatus').textContent='Waiting for confirmation...';
  fetch('/withdraw',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({to:addr})})
    .then(function(r){return r.json();}).then(function(d){
      if(d.ok){ document.getElementById('wStatus').style.color='#00ff88'; document.getElementById('wStatus').innerHTML='✓ '+d.amount+' USDC!<br><a href="https://polygonscan.com/tx/'+d.hash+'" target="_blank" style="color:#00aaff">'+d.hash.slice(0,14)+'... ↗</a>'; }
      else{ document.getElementById('wStatus').style.color='#ff3355'; document.getElementById('wStatus').textContent='ERROR: '+d.error; document.getElementById('wConfirm').disabled=false; document.getElementById('wConfirm').textContent='⚡ SEND ALL'; }
    }).catch(function(){document.getElementById('wStatus').style.color='#ff3355'; document.getElementById('wStatus').textContent='Network error'; document.getElementById('wConfirm').disabled=false;});
}
</script></body></html>`;

// ═══════════════════════════════════════════════════════════════════════════════
// RPC POOL & WALLET
// ═══════════════════════════════════════════════════════════════════════════════

const RPC = process.env.RPC_URL || process.env.ALCHEMY_HTTP_URL;
if (!RPC) {
  console.error('❌ ERROR: RPC_URL not set in .env');
  process.exit(1);
}

const PROVIDERS = [
  new ethers.JsonRpcProvider(RPC),
  new ethers.JsonRpcProvider(RPC),
  new ethers.JsonRpcProvider(RPC),
];
let _provIdx = 0;
function getProvider() { return PROVIDERS[_provIdx++ % PROVIDERS.length]; }

if (!process.env.PRIVATE_KEY) {
  console.error('❌ ERROR: PRIVATE_KEY not set in .env');
  process.exit(1);
}

const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, PROVIDERS[0]);
console.log(`\n✅ Wallet: ${wallet.address}\n`);

const safe = a => ethers.getAddress(a.toLowerCase());

// ═══════════════════════════════════════════════════════════════════════════════
// NONCE MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════════
// TOKENS & DEX CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════════
// ABIs
// ═══════════════════════════════════════════════════════════════════════════════

const MC3_ABI       = ['function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) view returns (tuple(bool success, bytes returnData)[] returnData)'];
const V2_IFACE      = new ethers.Interface(['function getAmountsOut(uint256,address[]) view returns (uint256[])']);
const Q3_IFACE      = new ethers.Interface(['function quoteExactInputSingle(address,address,uint24,uint256,uint160) external returns (uint256)']);
const SWAP_V2_ABI   = ['function swapExactTokensForTokens(uint,uint,address[],address,uint) external returns (uint[])'];
const SWAP_V3_ABI   = ['function exactInputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 deadline,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)'];
const ERC20_ABI     = ['function balanceOf(address) view returns (uint256)', 'function allowance(address,address) view returns (uint256)', 'function approve(address,uint256) external returns (bool)', 'function transfer(address,uint256) external returns (bool)'];
const ORACLE_ABI    = ['function latestRoundData() external view returns (uint80,int256,uint256,uint256,uint80)'];

// ═══════════════════════════════════════════════════════════════════════════════
// TX UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

async function waitForTx(tx, ms = 60000) {
  return Promise.race([
    tx.wait(),
    new Promise((_,r) => setTimeout(() => r(new Error('TX_TIMEOUT')), ms))
  ]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIQUIDITY FILTER
// ═══════════════════════════════════════════════════════════════════════════════

function filterLiquidity(entries) {
  if (entries.length < 2) return entries;
  const vals = entries.map(e => e.tokenAmt).sort((a,b) => a-b);
  const median = vals[Math.floor(vals.length / 2)];
  return entries.filter(e => e.tokenAmt >= median * 0.40);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ORACLE CACHE
// ═══════════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════════
// MULTICALL SCAN
// ═══════════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATE OPPORTUNITIES
// ═══════════════════════════════════════════════════════════════════════════════

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
    
    let oracleWarning = null;
    const oracleUSD = await getOraclePrice(token);
    if (oracleUSD && oracleUSD > 0) {
      const dexPrice  = amtInUSDC / best.tokenAmt;
      const oracleDiff = Math.abs(dexPrice - oracleUSD) / oracleUSD * 100;
      if (oracleDiff > 10) oracleWarning = 'Diverges ' + oracleDiff.toFixed(1) + '% from Oracle';
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

// ═══════════════════════════════════════════════════════════════════════════════
// APPROVE
// ═══════════════════════════════════════════════════════════════════════════════

async function ensureApprove(tokenAddr, spender, amount) {
  const erc20 = new ethers.Contract(tokenAddr, ERC20_ABI, wallet);
  const alw   = await erc20.allowance(wallet.address, spender);
  if (alw < amount) {
    console.log(`  ✓ Approving ${spender.slice(0,8)}...`);
    const tx = await erc20.approve(spender, ethers.MaxUint256, {
      gasLimit: 100000, gasPrice: ethers.parseUnits('300', 'gwei'), nonce: await getNonce()
    });
    await waitForTx(tx);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SWAP BUY/SELL
// ═══════════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════════

let settings    = { minSpread:5, maxSpread:80, slippage:10, minNetProfit:0.2 };
let scanning    = false;
let inTrade     = false;
let scanLoop    = null;
let totalProfit = 0;
let totalTrades = 0;
let scanCount   = 0;
let lastMaticUSD = 0.40;
let scanRates   = [];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SCAN
// ═══════════════════════════════════════════════════════════════════════════════

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
      bc({ type:'LOG', msg:'⚠ USDC too low: ' + balUSDC.toFixed(4) });
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
    console.error('❌ Scan error:', e.message);
    bc({ type:'ERROR', msg:'Scan: ' + e.message.slice(0,120) });
  }
  scanning = false;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXECUTE TRADE
// ═══════════════════════════════════════════════════════════════════════════════

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
    console.error('❌ Trade error:', e.message);
    resetNonce();
    bc({ type:'TRADE_FAIL', opp, error: e.message.slice(0,250) });
    
    // FALLBACK: sell remaining tokens
    try {
      const tokenErc = new ethers.Contract(tokenInfo.addr, ERC20_ABI, PROVIDERS[0]);
      const left = await tokenErc.balanceOf(wallet.address);
      if (left > 0n) {
        console.log(`⚠ FALLBACK: selling remaining ${opp.symbol}...`);
        bc({ type:'LOG', msg:`⚠ FALLBACK selling ${opp.symbol}...` });
        const fbTx = await swapSell(opp.sellDex, tokenInfo, left);
        await waitForTx(fbTx);
        bc({ type:'LOG', msg:'✅ FALLBACK completed' });
      }
    } catch(fe) {
      console.error('❌ Fallback error:', fe.message);
      bc({ type:'ERROR', msg:'FALLBACK FAIL: ' + fe.message.slice(0,80) });
    }
  } finally {
    inTrade = false;
    console.log('Trade lock released\n');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPRESS + WEBSOCKET
// ═══════════════════════════════════════════════════════════════════════════════

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
        console.log('⏹ Scan engine stopped');
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
server.listen(PORT, () => console.log(`\n🚀 3080 HFT: http://localhost:${PORT}\n`));
