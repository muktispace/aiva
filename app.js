const STORAGE_KEY = 'mathquest-kids-v1';
const defaultState = {
  profile: { gradeBand: 'Class 1-3', confidence: 50 },
  path: [],
  level: 1,
  stars: 0,
  coins: 0,
  xp: 0,
  streak: 0,
  lastCheckIn: null,
  sessions: [],
  badges: ['🌱 Starter'],
};

let state = loadState();
let practiceQueue = [];
let questionIndex = 0;
let correct = 0;
let sessionTimer;
let seconds = 600;
let deferredPrompt;

function loadState() {
  try {
    return { ...defaultState, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return defaultState;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function byId(id) {
  return document.getElementById(id);
}

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function generateQuestion(skill) {
  if (skill === 'addition') {
    const a = randomInt(20) + 1;
    const b = randomInt(20) + 1;
    return { text: `${a} + ${b} = ?`, answer: a + b };
  }
  if (skill === 'subtraction') {
    const a = randomInt(30) + 10;
    const b = randomInt(10) + 1;
    return { text: `${a} - ${b} = ?`, answer: a - b };
  }
  const a = randomInt(6) + 2;
  const b = randomInt(6) + 2;
  return { text: `${a} × ${b} = ?`, answer: a * b };
}

function renderSkillCheckQuestion(step = 0, score = 0) {
  const checks = [
    { q: '7 + 6', a: 13 },
    { q: '14 - 8', a: 6 },
    { q: '5 + 9', a: 14 },
    { q: '18 - 9', a: 9 },
    { q: '4 × 3', a: 12 },
  ];

  if (step >= checks.length) {
    personalizePath(score);
    return;
  }

  const area = byId('skillCheckArea');
  area.innerHTML = `
    <div class="question">
      <strong>Q${step + 1}:</strong> ${checks[step].q}
      <input id="skillAnswer" type="number" placeholder="Your answer" />
    </div>
    <button id="nextSkillCheck" class="primary">Next</button>
  `;

  byId('nextSkillCheck').onclick = () => {
    const ans = Number(byId('skillAnswer').value);
    renderSkillCheckQuestion(step + 1, score + (ans === checks[step].a ? 1 : 0));
  };
}

function personalizePath(score) {
  const path = [];
  if (score <= 2) {
    path.push('addition', 'subtraction');
    state.profile.confidence = 40;
  } else if (score <= 4) {
    path.push('subtraction', 'word-problems', 'multiplication');
    state.profile.confidence = 60;
  } else {
    path.push('multiplication', 'mixed-challenges', 'speed-rounds');
    state.profile.confidence = 75;
  }
  state.path = path;
  saveState();

  byId('pathCard').classList.remove('hidden');
  byId('sessionCard').classList.remove('hidden');
  byId('pathSummary').textContent = `We built a path for ${state.profile.gradeBand}. Estimated daily play time: 10–15 min.`;
  byId('pathList').innerHTML = state.path.map((s) => `<li>${s}</li>`).join('');

  setupPracticeQueue();
  renderPracticeQuestion();
  renderDashboard();
}

function setupPracticeQueue() {
  const skill = state.path[0] || 'addition';
  practiceQueue = Array.from({ length: 10 }, () => generateQuestion(skill));
  questionIndex = 0;
  correct = 0;
  seconds = 600;
  clearInterval(sessionTimer);
  sessionTimer = setInterval(() => {
    seconds -= 1;
    byId('timer').textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    if (seconds <= 0) {
      clearInterval(sessionTimer);
      completeSession();
    }
  }, 1000);
}

function renderPracticeQuestion() {
  if (!practiceQueue.length || questionIndex >= practiceQueue.length) {
    completeSession();
    return;
  }
  const q = practiceQueue[questionIndex];
  byId('gameArea').innerHTML = `
    <div class="question"><strong>Round ${questionIndex + 1}/10:</strong> ${q.text}</div>
    <input id="gameAnswer" type="number" placeholder="Type answer" />
    <button id="submitAnswer" class="primary">Submit</button>
  `;
  byId('submitAnswer').onclick = () => {
    const ans = Number(byId('gameAnswer').value);
    if (ans === q.answer) {
      correct += 1;
      state.stars += 1;
      state.coins += 5;
      state.xp += 12;
    } else {
      state.xp += 4;
    }
    questionIndex += 1;
    byId('levelProgress').value = Math.min(100, (state.xp % 100));
    renderPracticeQuestion();
  };
}

function completeSession() {
  clearInterval(sessionTimer);
  const accuracy = Math.round((correct / 10) * 100);
  if (state.xp >= state.level * 100) {
    state.level += 1;
    state.badges.push(`🏅 Level ${state.level}`);
  }

  const today = new Date().toISOString().slice(0, 10);
  const confidence = Math.min(95, Math.max(35, state.profile.confidence + (accuracy >= 70 ? 5 : -2)));
  state.profile.confidence = confidence;
  state.sessions.push({ date: today, accuracy, confidence, minutes: 10 + randomInt(6) });
  state.sessions = state.sessions.slice(-30);

  state.badges = [...new Set(state.badges)];
  byId('gameArea').innerHTML = `<p>Great work! Accuracy today: <strong>${accuracy}%</strong>. Come back tomorrow for a new challenge.</p>`;
  saveState();
  renderDashboard();
}

function mentorMessage() {
  const s = state.streak;
  if (s >= 7) return 'Amazing discipline! A full week streak earned a super badge! 🌟';
  if (s >= 3) return 'You are building momentum. Keep the chain alive today!';
  return 'Consistency beats intensity. Just 10 minutes today counts!';
}

function updateStreak() {
  const today = new Date();
  const iso = today.toISOString().slice(0, 10);
  if (state.lastCheckIn === iso) return;

  if (state.lastCheckIn) {
    const previous = new Date(`${state.lastCheckIn}T00:00:00Z`);
    const days = Math.floor((today - previous) / (1000 * 60 * 60 * 24));
    state.streak = days === 1 ? state.streak + 1 : 1;
  } else {
    state.streak = 1;
  }

  state.lastCheckIn = iso;
  if (state.streak > 0 && state.streak % 7 === 0) state.badges.push(`🔥 ${state.streak}-day streak`);
  saveState();
  renderDashboard();
}

function weeklyStats() {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const week = state.sessions.filter((s) => new Date(s.date).getTime() >= cutoff);
  if (!week.length) {
    return { accuracy: 0, confidence: state.profile.confidence, minutes: 0, consistency: 0, rows: [] };
  }
  const sum = (arr, key) => arr.reduce((a, b) => a + b[key], 0);
  return {
    accuracy: Math.round(sum(week, 'accuracy') / week.length),
    confidence: Math.round(sum(week, 'confidence') / week.length),
    minutes: sum(week, 'minutes'),
    consistency: Math.round((week.length / 7) * 100),
    rows: week,
  };
}

function renderDashboard() {
  const stats = weeklyStats();
  byId('levelValue').textContent = state.level;
  byId('starsValue').textContent = state.stars;
  byId('coinsValue').textContent = state.coins;
  byId('streakValue').textContent = `${state.streak} days`;
  byId('disciplineValue').textContent = `${stats.consistency}%`;
  byId('mentorMessage').textContent = mentorMessage();
  byId('badges').innerHTML = state.badges.slice(-6).map((b) => `<li>${b}</li>`).join('');

  byId('weeklySummary').innerHTML = `
    <strong>This week:</strong> ${stats.accuracy}% accuracy, confidence ${stats.confidence}%,
    ${stats.minutes} total practice minutes, consistency ${stats.consistency}%.
  `;
  byId('reportBody').innerHTML = stats.rows
    .slice()
    .reverse()
    .map((r) => `<tr><td>${r.date}</td><td>${r.accuracy}%</td><td>${r.confidence}%</td><td>${r.minutes}</td></tr>`)
    .join('');
}

byId('startSkillCheck').onclick = () => renderSkillCheckQuestion();
byId('checkInBtn').onclick = updateStreak;
document.querySelectorAll('[data-jump]').forEach((btn) => {
  btn.onclick = () => byId(btn.dataset.jump).scrollIntoView({ behavior: 'smooth' });
});

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  byId('installBtn').classList.remove('hidden');
});

byId('installBtn').onclick = async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  byId('installBtn').classList.add('hidden');
};

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
}

if (state.path.length) {
  byId('pathCard').classList.remove('hidden');
  byId('sessionCard').classList.remove('hidden');
  byId('pathSummary').textContent = `Current path: ${state.path.join(' → ')}.`;
  byId('pathList').innerHTML = state.path.map((s) => `<li>${s}</li>`).join('');
}
renderDashboard();
