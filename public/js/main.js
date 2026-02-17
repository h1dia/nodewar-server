const CONFIG = { BH: 21, INTV: 5000 };
let state = { timerData: [], serverOffset: 0, lastCheckData: "", delaySeconds: 0, nextUpdateTimestamp: 0, audioEnabled: true };
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

// Initialize Audio Context on first user interaction
const initAudioContext = () => {
    if (!audioCtx) audioCtx = new AudioCtx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    // Remove listener after first interaction
    document.removeEventListener('click', initAudioContext);
    document.removeEventListener('touchstart', initAudioContext);
};

document.addEventListener('click', initAudioContext);
document.addEventListener('touchstart', initAudioContext);

function toggleAudio() {
    if (!audioCtx) {
        audioCtx = new AudioCtx();
        if (audioCtx.state === 'suspended') audioCtx.resume();
    }
    state.audioEnabled = !state.audioEnabled;
    const btn = document.getElementById('audio-control');
    btn.textContent = state.audioEnabled ? "🔊" : "🔇";
    btn.classList.toggle('off', !state.audioEnabled);
    if (state.audioEnabled) playNotifySound();
}

// Make toggleAudio available globally for onclick handler
window.toggleAudio = toggleAudio;

function playNotifySound() {
    if (!state.audioEnabled || !audioCtx) return;
    try {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(880, audioCtx.currentTime);
        o.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1);
        g.gain.setValueAtTime(0.1, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        o.connect(g); g.connect(audioCtx.destination);
        o.start(); o.stop(audioCtx.currentTime + 0.2);
    } catch (e) { }
}

const updateStatus = (text) => {
    const el = document.getElementById('status-text');
    if (el) el.textContent = text.toUpperCase();
};

async function fetchApiData() {
    updateStatus('syncing');
    try {
        const response = await fetch('/api/data');
        const data = await response.json();

        document.getElementById('warning-area').classList.remove('show');
        state.delaySeconds = parseInt(data.delaySeconds, 10) || 0;
        document.getElementById('delay-display').textContent = `遅延: +${state.delaySeconds}s`;

        const now = new Date(Date.now() + state.serverOffset);
        let processed = [];

        const startTarget = new Date(Date.now() + state.serverOffset);
        startTarget.setHours(CONFIG.BH, 0, 0, 0);
        startTarget.setSeconds(startTarget.getSeconds() + state.delaySeconds);

        if (startTarget > now) {
            processed.push({
                id: "start-timer",
                label: "戦闘開始まで",
                targetDate: startTarget,
                isFinished: false,
                type: "start"
            });
        }

        if (data.timers && Array.isArray(data.timers)) {
            data.timers.forEach((t, index) => {
                const minutesToAdd = parseInt(t.minutes, 10);
                const target = getDestructionTime(CONFIG.BH, minutesToAdd);
                processed.push({
                    id: `timer-${index}`,
                    label: t.label,
                    targetDate: target,
                    isFinished: target <= now,
                    type: "normal"
                });
            });
        }
        renderTimers(processed);
        updateStatus('active');
    } catch (e) {
        console.error(e);
        updateStatus('offline');
        document.getElementById('warning-area').classList.add('show');
    }
}

function getDestructionTime(baseHour, minutesToAdd) {
    const t = new Date(Date.now() + state.serverOffset);
    t.setHours(baseHour, 0, 0, 0);
    t.setMinutes(t.getMinutes() + minutesToAdd + 1);
    t.setSeconds(t.getSeconds() + state.delaySeconds);
    return t;
}

function renderTimers(newData) {
    const json = JSON.stringify(newData.map(d => ({ l: d.label, t: d.targetDate.getTime() })));
    if (json === state.lastCheckData) return;
    state.lastCheckData = json;

    const container = document.getElementById('timer-container');
    state.timerData = newData;
    container.innerHTML = '';
    newData.sort((a, b) => (a.isFinished !== b.isFinished) ? (a.isFinished ? 1 : -1) : (a.targetDate - b.targetDate));

    newData.forEach(item => {
        const card = document.createElement('div');
        card.id = `card-${item.id}`;
        card.className = `timer-card ${item.isFinished ? 'finished' : ''}`;
        card.innerHTML = `<p class="label">${item.label}</p><div id="${item.id}" class="display">${item.isFinished ? formatTimeHtml('00:00:00') : formatTimeHtml('--:--:--')}</div>`;
        container.appendChild(card);
    });
}

function reorderCards() {
    const container = document.getElementById('timer-container');
    const cards = [...container.children];
    cards.sort((a, b) => a.classList.contains('finished') - b.classList.contains('finished'));
    cards.forEach(card => container.appendChild(card));
}

function formatTimeHtml(timeStr) {
    return timeStr.split('').map(char => {
        return (char === ':') ? ':' : `<span class="digit">${char}</span>`;
    }).join('');
}

function updateDisplay() {
    const now = new Date(Date.now() + state.serverOffset);
    document.getElementById('current-time').innerHTML = formatTimeHtml(now.toTimeString().split(' ')[0]);
    const nextSec = Math.max(0, Math.ceil((state.nextUpdateTimestamp - Date.now()) / 1000));
    document.getElementById('update-countdown').textContent = `${nextSec}S`;

    let hasNewFinished = false;
    state.timerData.forEach(item => {
        if (item.isFinished) return;
        const diff = item.targetDate - now;
        const el = document.getElementById(item.id);
        if (!el) return;

        if (diff <= 0) {
            item.isFinished = true;
            playNotifySound();
            const card = document.getElementById(`card-${item.id}`);

            if (item.type === "start") {
                card.style.opacity = '0';
                setTimeout(() => card.remove(), 600);
            } else {
                card.classList.add('finished');
                el.innerHTML = formatTimeHtml("00:00:00");
                hasNewFinished = true;
            }
        } else {
            const s = Math.ceil(diff / 1000);
            const timeStr = [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map(v => String(v).padStart(2, '0')).join(':');
            el.innerHTML = formatTimeHtml(timeStr);
        }
    });
    if (hasNewFinished) reorderCards();
}

async function syncServerTime() {
    try {
        const res = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=Asia/Tokyo');
        const data = await res.json();
        state.serverOffset = new Date(data.dateTime).getTime() - Date.now();
    } catch (e) { state.serverOffset = 0; }
}

function scheduleNext() {
    state.nextUpdateTimestamp = Date.now() + CONFIG.INTV;
    setTimeout(() => { fetchApiData(); scheduleNext(); }, CONFIG.INTV);
}

async function init() {
    setInterval(updateDisplay, 100);
    updateDisplay();
    await syncServerTime();
    await fetchApiData();
    scheduleNext();
}

// Start only if in browser
if (typeof window !== 'undefined') {
    init();
}
