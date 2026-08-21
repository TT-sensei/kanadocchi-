import {
  EDU_EVENTS,
  QuestionPool,
  ChoiceQuestion,
  ScoreManager,
  StorageManager,
  ProgressManager,
  BadgeManager
} from 'https://tt-sensei.github.io/edu-components/index.js';
import { soundList } from 'https://tt-sensei.github.io/sounds-recipe-/sounds.js';
import { STAGES, QUESTIONS, BADGES } from './questions.js';

const SESSION_SIZE = 10;
const storage = new StorageManager('kanadocchi');
const eventBus = document;
const progress = new ProgressManager({ storage, storageKey: 'stage-progress', ids: STAGES.map((stage) => stage.id), eventTarget: eventBus });
const badges = new BadgeManager({ storage, storageKey: 'badges', badges: BADGES, eventTarget: eventBus });

const defaultState = () => ({
  sound: true,
  recentBadge: null,
  stages: Object.fromEntries(STAGES.map((stage) => [stage.id, { plays: 0, bestScore: 0, bestStars: 0, retryIds: [] }]))
});

let state = normalizeState(storage.load('state', defaultState()));
let currentStage = null;
let sessionQuestions = [];
let currentIndex = 0;
let currentQuestion = null;
let currentChoice = null;
let score = new ScoreManager();
let missedIds = new Set();
let carriedRetryIds = [];
let locked = false;
let audioContext = null;
let pendingBadgeIds = [];

const $ = (selector) => document.querySelector(selector);
const screens = [...document.querySelectorAll('.screen')];

function normalizeState(saved) {
  const fresh = defaultState();
  if (!saved || typeof saved !== 'object') return fresh;
  fresh.sound = saved.sound !== false;
  fresh.recentBadge = typeof saved.recentBadge === 'string' ? saved.recentBadge : null;
  STAGES.forEach((stage) => {
    const old = saved.stages?.[stage.id] || {};
    fresh.stages[stage.id] = {
      plays: Math.max(0, Number(old.plays) || 0),
      bestScore: Math.min(10, Math.max(0, Number(old.bestScore) || 0)),
      bestStars: Math.min(3, Math.max(0, Number(old.bestStars) || 0)),
      retryIds: Array.isArray(old.retryIds) ? old.retryIds.filter((id) => typeof id === 'string') : []
    };
  });
  return fresh;
}

function saveState() {
  storage.save('state', state);
}

function showScreen(id) {
  screens.forEach((screen) => screen.classList.toggle('is-active', screen.id === id));
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function starsFor(scoreValue) {
  if (scoreValue === 10) return 3;
  if (scoreValue >= 7) return 2;
  return 1;
}

function renderStars(count) {
  return `${'★'.repeat(count)}${'☆'.repeat(3 - count)}`;
}

function renderHome() {
  const grid = $('#stage-grid');
  grid.replaceChildren();

  STAGES.forEach((stage) => {
    const stageState = state.stages[stage.id];
    const completed = progress.isCompleted(stage.id);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'stage-card edu-card edu-card-hover edu-hover-lift edu-press';
    button.style.setProperty('--stage-color', stage.color);
    button.setAttribute('aria-label', `${stage.name}。${completed ? `ほし ${stageState.bestStars}こ` : 'まだ ちょうせんしていません'}`);
    button.innerHTML = `
      <span class="stage-icon" aria-hidden="true">${stage.icon}</span>
      <span class="stage-copy">
        <small>${stage.short}</small>
        <strong>${stage.name}</strong>
        <span>${stage.description}</span>
      </span>
      <span class="stage-progress ${completed ? 'is-complete' : ''}">
        ${completed ? `<span class="mini-stars" aria-hidden="true">${renderStars(stageState.bestStars)}</span><span>${stageState.bestScore}/10</span>` : '<span>はじめる</span><span aria-hidden="true">→</span>'}
      </span>`;
    button.addEventListener('click', () => startStage(stage.id));
    grid.append(button);
  });

  const master = STAGES.every((stage) => progress.isCompleted(stage.id));
  $('#master-title').hidden = !master;

  const recent = badges.getDefinition(state.recentBadge);
  const recentBox = $('#recent-badge');
  recentBox.hidden = !recent;
  if (recent) {
    $('#recent-badge-image').src = recent.image;
    $('#recent-badge-image').alt = `${recent.name} バッジ`;
    $('#recent-badge-name').textContent = recent.name;
  }
  updateSoundButton();
}

function buildSession(stageId) {
  const stageQuestions = QUESTIONS.filter((item) => item.stage === stageId);
  const retryIds = state.stages[stageId].retryIds;
  const retryQuestions = retryIds.map((id) => stageQuestions.find((item) => item.id === id)).filter(Boolean);
  const retryPool = new QuestionPool(retryQuestions, { mode: 'random' });
  const review = retryPool.take(Math.min(4, retryQuestions.length));
  const reviewSet = new Set(review.map((item) => item.id));
  const available = stageQuestions.filter((item) => !reviewSet.has(item.id));
  const firstPlay = state.stages[stageId].plays === 0;
  const mainPool = new QuestionPool(available, { mode: firstPlay ? 'sequential' : 'random' });
  return [...review, ...mainPool.take(SESSION_SIZE - review.length)];
}

async function startStage(stageId) {
  currentStage = STAGES.find((stage) => stage.id === stageId);
  if (!currentStage) return;
  await playSound('start', 0.16);
  sessionQuestions = buildSession(stageId);
  const sessionIds = new Set(sessionQuestions.map((item) => item.id));
  carriedRetryIds = state.stages[stageId].retryIds.filter((id) => !sessionIds.has(id));
  currentIndex = 0;
  score.reset();
  missedIds = new Set();
  locked = false;
  $('#play-stage-icon').textContent = currentStage.icon;
  $('#play-stage-name').textContent = currentStage.name;
  document.documentElement.style.setProperty('--active-stage', currentStage.color);
  showScreen('play-screen');
  showQuestion();
}

function showQuestion() {
  locked = false;
  currentQuestion = sessionQuestions[currentIndex];
  const answerText = currentQuestion.choices[currentQuestion.answer];
  currentChoice = new ChoiceQuestion(
    { ...currentQuestion, answer: answerText },
    { shuffle: true, eventTarget: eventBus }
  );

  $('#question-count').textContent = `${currentIndex + 1} / ${SESSION_SIZE}`;
  $('#correct-count').textContent = `〇 ${score.correctCount}`;
  $('#progress-fill').style.width = `${(currentIndex / SESSION_SIZE) * 100}%`;
  $('#picture').textContent = currentQuestion.image || '🔤';
  $('#question-text').textContent = currentQuestion.question;
  $('#question-instruction').textContent = currentQuestion.stage === 'kuttsuki' ? '（　）に はいる もじは どっち？' : 'えを みて、ただしい ほうを えらぼう';
  $('#feedback').textContent = '';
  $('#feedback').className = 'feedback';

  const area = $('#choice-area');
  area.replaceChildren();
  currentChoice.getChoices().forEach((choice, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice-button edu-answer-pop edu-press';
    button.dataset.choice = choice;
    button.innerHTML = `<span class="choice-number" aria-hidden="true">${index + 1}</span><strong>${choice}</strong>`;
    button.addEventListener('click', () => answer(choice, button));
    area.append(button);
  });

  $('#question-card').classList.remove('question-enter');
  requestAnimationFrame(() => $('#question-card').classList.add('question-enter'));
  area.querySelector('button')?.focus({ preventScroll: true });
}

function answer(choice, selectedButton) {
  if (locked) return;
  locked = true;
  const result = currentChoice.choose(choice);
  if (result.ignored) return;

  const correctText = currentQuestion.choices[currentQuestion.answer];
  const buttons = [...document.querySelectorAll('.choice-button')];
  buttons.forEach((button) => {
    button.disabled = true;
    if (button.dataset.choice === correctText) button.classList.add('is-correct');
  });

  const feedback = $('#feedback');
  if (result.isCorrect) {
    score.correct();
    selectedButton.classList.add('is-correct');
    feedback.className = 'feedback is-correct edu-pop';
    feedback.innerHTML = '<span aria-hidden="true">〇</span> せいかい！';
    playSound('correct', 0.16);
  } else {
    score.wrong();
    missedIds.add(currentQuestion.id);
    selectedButton.classList.add('is-wrong', 'edu-shake');
    feedback.className = 'feedback is-wrong';
    feedback.innerHTML = `おしい！ こたえは <strong>「${correctText}」</strong>`;
    playSound('softFail', 0.13);
  }
  $('#correct-count').textContent = `〇 ${score.correctCount}`;
  $('#progress-fill').style.width = `${((currentIndex + 1) / SESSION_SIZE) * 100}%`;

  window.setTimeout(() => {
    currentIndex += 1;
    if (currentIndex < SESSION_SIZE) showQuestion();
    else finishStage();
  }, result.isCorrect ? 720 : 1300);
}

function finishStage() {
  const result = score.getResult();
  const stageState = state.stages[currentStage.id];
  const stars = starsFor(result.correct);
  stageState.plays += 1;
  stageState.bestScore = Math.max(stageState.bestScore, result.correct);
  stageState.bestStars = Math.max(stageState.bestStars, stars);
  stageState.retryIds = [...new Set([...carriedRetryIds, ...missedIds])];
  progress.complete(currentStage.id);
  saveState();

  $('#result-score').textContent = result.correct;
  $('#result-stars').textContent = renderStars(stars);
  $('#result-stars').setAttribute('aria-label', `ほし ${stars}こ`);
  const perfect = result.correct === SESSION_SIZE;
  $('#result-kicker').textContent = perfect ? 'ぜんもん せいかい！' : '10もん おわったよ！';
  $('#result-title').textContent = perfect ? 'かんぺき！' : 'よく できました！';
  $('#result-message').textContent = perfect ? 'どっちも しっかり みわけられたね！' : missedIds.size ? 'まちがえた もんだいは、つぎに また でるよ。' : 'さいごまで がんばったね！';
  $('#result-burst').textContent = perfect ? '👑' : currentStage.icon;

  const newBadges = [];
  if (badges.award(currentStage.badge)) newBadges.push(currentStage.badge);
  if (perfect && badges.award('perfect')) newBadges.push('perfect');
  if (STAGES.every((stage) => progress.isCompleted(stage.id)) && badges.award('moji-master')) newBadges.push('moji-master');

  const stageBadge = badges.getDefinition(currentStage.badge);
  const badgeBox = $('#result-badge');
  badgeBox.hidden = !stageBadge;
  if (stageBadge) {
    $('#result-badge-image').src = stageBadge.image;
    $('#result-badge-image').alt = `${stageBadge.name} バッジ`;
    $('#result-badge-name').textContent = stageBadge.name;
  }

  showScreen('result-screen');
  playSound(perfect ? 'allclear' : 'stageClear', 0.17);
  pendingBadgeIds = newBadges;
  if (pendingBadgeIds.length) window.setTimeout(showNextBadge, 700);
}

function showNextBadge() {
  const id = pendingBadgeIds.shift();
  if (id) showBadgeOverlay(id);
}

function showBadgeOverlay(id) {
  const badge = badges.getDefinition(id);
  if (!badge) return;
  state.recentBadge = id;
  saveState();
  $('#badge-overlay-image').src = badge.image;
  $('#badge-overlay-image').alt = `${badge.name} バッジ`;
  $('#badge-overlay-title').textContent = badge.name;
  $('#badge-overlay').hidden = false;
  playSound('badge', 0.18);
  $('#badge-close-button').focus();
}

function closeBadgeOverlay() {
  $('#badge-overlay').hidden = true;
  if (pendingBadgeIds.length) window.setTimeout(showNextBadge, 220);
}

function speakCurrentQuestion() {
  if (!currentQuestion || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(currentQuestion.speak);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.78;
  utterance.pitch = 1.08;
  window.speechSynthesis.speak(utterance);
}

async function playSound(id, volume = 0.16) {
  if (!state.sound) return false;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;
    audioContext ||= new AudioContextClass();
    if (audioContext.state === 'suspended') await audioContext.resume();
    const recipe = soundList.find((item) => item.id === id);
    if (!recipe) return false;
    recipe.play(audioContext, volume);
    return true;
  } catch {
    return false;
  }
}

function updateSoundButton() {
  const button = $('#sound-button');
  button.setAttribute('aria-pressed', String(state.sound));
  button.setAttribute('aria-label', state.sound ? 'おとを けす' : 'おとを だす');
  button.querySelector('[aria-hidden]').textContent = state.sound ? '🔊' : '🔇';
}

function toggleSound() {
  state.sound = !state.sound;
  saveState();
  updateSoundButton();
  if (state.sound) playSound('soundOn', 0.12);
}

eventBus.addEventListener(EDU_EVENTS.BADGE, (event) => {
  const id = event.detail?.id;
  if (!id || id === currentStage?.badge) return;
  state.recentBadge = id;
  saveState();
});

$('#sound-button').addEventListener('click', toggleSound);
$('#quit-button').addEventListener('click', () => { window.speechSynthesis?.cancel(); renderHome(); showScreen('home-screen'); });
$('#speak-button').addEventListener('click', speakCurrentQuestion);
$('#retry-button').addEventListener('click', () => startStage(currentStage.id));
$('#home-button').addEventListener('click', () => { renderHome(); showScreen('home-screen'); });
$('#badge-close-button').addEventListener('click', closeBadgeOverlay);
$('#badge-overlay').addEventListener('click', (event) => { if (event.target === $('#badge-overlay')) closeBadgeOverlay(); });
document.addEventListener('keydown', (event) => {
  if (!$('#play-screen').classList.contains('is-active') || locked) return;
  if (event.key === '1' || event.key === '2') document.querySelectorAll('.choice-button')[Number(event.key) - 1]?.click();
});

renderHome();
