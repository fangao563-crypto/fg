const currentTimeEl = document.getElementById('currentTime');
const nextChimeEl = document.getElementById('nextChime');
const statusEl = document.getElementById('status');
const testBtn = document.getElementById('testChime');
const speechCheckbox = document.getElementById('enableSpeech');

let lastAnnouncedHour = null;

function pad(num) {
  return String(num).padStart(2, '0');
}

function formatTime(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatHour(date) {
  return `${pad(date.getHours())}:00`;
}

function calcNextTopOfHour(now) {
  const next = new Date(now);
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  return next;
}

function beep() {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
  gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.5);
}

function speakHour(date) {
  if (!speechCheckbox.checked || !('speechSynthesis' in window)) {
    return;
  }

  const hour = pad(date.getHours());
  const text = `现在是 ${hour} 点整`;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function announce(now, source = '自动') {
  beep();
  speakHour(now);
  statusEl.textContent = `${source}报时：${formatHour(now)}`;
}

function tick() {
  const now = new Date();
  currentTimeEl.textContent = formatTime(now);

  const next = calcNextTopOfHour(now);
  nextChimeEl.textContent = formatHour(next);

  const isTopOfHour = now.getMinutes() === 0 && now.getSeconds() === 0;
  if (isTopOfHour && lastAnnouncedHour !== now.getHours()) {
    lastAnnouncedHour = now.getHours();
    announce(now);
  }
}

testBtn.addEventListener('click', async () => {
  const now = new Date();
  try {
    await (window.AudioContext ? Promise.resolve() : Promise.reject(new Error('不支持音频')));
    announce(now, '手动测试');
  } catch (error) {
    statusEl.textContent = `报时失败：${error.message}`;
  }
});

speechCheckbox.addEventListener('change', () => {
  statusEl.textContent = speechCheckbox.checked ? '语音播报已启用。' : '语音播报已关闭。';
});

tick();
setInterval(tick, 1000);
