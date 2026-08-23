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
const NAVI_BASE = 'https://tt-sensei.github.io/navi-character-/assets/web/characters/';
const NAVI_CHARS = ["riku","sora","kai","saku","tsuki","nami"];
const NAVI_NAMES = {"riku":"りく","sora":"そら","kai":"かい","saku":"さく","tsuki":"つき","nami":"なみ"};
const navImage = (name, expression) => NAVI_BASE + name + '/expressions/' + expression + '.webp';
const navPick = (index = 0) => NAVI_CHARS[index % NAVI_CHARS.length];
const STAGE_NAVI = { kuttsuki: 'saku', youon: 'kai', sokuon: 'tsuki', choon: 'nami' };
const stageNavImage = (stage) => navImage(STAGE_NAVI[stage.id] || 'saku', '01-normal-smile');
function setNavCompanion(name, expression, message) { const image = $('#nav-companion-image'); if (!image) return; image.src = navImage(name, expression); image.alt = ''; $('#nav-companion-message').textContent = message; }

const storage = new StorageManager('kanadocchi');
const eventBus = document;
const progress = new ProgressManager({ storage, storageKey: 'stage-progress', ids: STAGES.map((stage) => stage.id), eventTarget: eventBus });
const badges = new BadgeManager({ storage, storageKey: 'badges', badges: BADGES, eventTarget: eventBus });

const defaultState = () => ({
  sound: true,
  recentBadge: null,
  stats: { totalCorrect: 0, totalAnswered: 0, readAlouds: 0 },
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
let reviewIds = new Set();
let reviewCorrectCount = 0;
let locked = false;
let audioContext = null;

const $ = (selector) => document.querySelector(selector);
const screens = [...document.querySelectorAll('.screen')];

function normalizeState(saved) {
  const fresh = defaultState();
  if (!saved || typeof saved !== 'object') return fresh;
  fresh.sound = saved.sound !== false;
  fresh.recentBadge = typeof saved.recentBadge === 'string' ? saved.recentBadge : null;
  fresh.stats = {
    totalCorrect: Math.max(0, Number(saved.stats?.totalCorrect) || 0),
    totalAnswered: Math.max(0, Number(saved.stats?.totalAnswered) || 0),
    readAlouds: Math.max(0, Number(saved.stats?.readAlouds) || 0)
  };
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
      <span class="stage-icon" aria-hidden="true"><img src="${stageNavImage(stage)}" alt=""></span>
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

  const recent = badges.getDefinition(state.recentBadge);
  const recentBox = $('#recent-badge');
  recentBox.hidden = !recent;
  if (recent) {
    $('#recent-badge-image').src = recent.image;
    $('#recent-badge-image').alt = `${recent.name} バッジ`;
    $('#recent-badge-name').textContent = recent.name;
  }
  $('#collection-count').textContent = `${badges.getAwardedCount()} / ${BADGES.length}`;
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
  reviewIds = new Set(state.stages[stageId].retryIds.filter((id) => sessionIds.has(id)));
  reviewCorrectCount = 0;
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
  $('#question-instruction').textContent = currentQuestion.stage === 'kuttsuki' ? '（　）に はいる ことばは どっち？' : 'ぶんに あう ことばは どっち？';
  const nav = navPick(currentIndex); setNavCompanion(nav, currentIndex % 3 === 0 ? '03-thinking' : '07-encouraging', currentIndex === 0 ? 'まずは よく みてみよう！' : 'あせらず えらんでね！');
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
  if (result.isCorrect) { setNavCompanion(navPick(currentIndex + 1), '08-celebrating', 'せいかい！ すごいね！');
    score.correct();
    if (reviewIds.has(currentQuestion.id)) reviewCorrectCount += 1;
    selectedButton.classList.add('is-correct');
    feedback.className = 'feedback is-correct edu-pop';
    feedback.innerHTML = '<img class="feedback-nav" src="' + navImage(navPick(currentIndex + 1), '08-celebrating') + '" alt=""> <span>せいかい！</span>';
    playSound('correct', 0.16);
  } else { setNavCompanion(navPick(currentIndex + 1), '06-troubled', 'だいじょうぶ。つぎで いかそう！');
    score.wrong();
    missedIds.add(currentQuestion.id);
    selectedButton.classList.add('is-wrong', 'edu-shake');
    feedback.className = 'feedback is-wrong';
    feedback.innerHTML = '<img class="feedback-nav" src="' + navImage(navPick(currentIndex + 1), '06-troubled') + '" alt=""> <span>もういちど！ こたえは <strong>「' + correctText + '」</strong></span>';
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
  state.stats.totalCorrect += result.correct;
  state.stats.totalAnswered += result.total;
  progress.complete(currentStage.id);

  $('#result-score').textContent = result.correct;
  $('#result-stars').textContent = renderStars(stars);
  $('#result-stars').setAttribute('aria-label', `ほし ${stars}こ`);
  const perfect = result.correct === SESSION_SIZE;
  $('#result-kicker').textContent = perfect ? 'ぜんもん せいかい！' : '10もん おわったよ！';
  $('#result-title').textContent = perfect ? 'かんぺき！' : 'よく できました！';
  $('#result-message').textContent = perfect ? 'どっちも しっかり みわけられたね！' : missedIds.size ? 'まちがえた もんだいは、つぎに また でるよ。' : 'さいごまで がんばったね！';
  $('#result-burst').textContent = perfect ? '👑' : currentStage.icon;
  const resultNav = $('#result-nav-image'); if (resultNav) { resultNav.src = navImage(navPick(result.correct), perfect ? '08-celebrating' : '07-encouraging'); resultNav.alt = 'ナビキャラからのメッセージ'; }
  const resultNavMessage = $('#result-nav-message'); if (resultNavMessage) resultNavMessage.textContent = perfect ? 'かんぺき！ みんなで よろこんでいるよ！' : 'さいごまで よく がんばったね！';

  const newBadges = [];
  const award = (id, condition = true) => {
    if (condition && badges.award(id)) newBadges.push(id);
  };
  const completedCount = progress.getCompletedCount();
  const totalPlays = STAGES.reduce((sum, stage) => sum + state.stages[stage.id].plays, 0);
  award(currentStage.badge);
  award('first-step', totalPlays >= 1);
  award('two-stages', completedCount >= 2);
  award('three-stages', completedCount >= 3);
  award('moji-master', completedCount >= 4);
  award('score-five', result.correct >= 5);
  award('score-seven', result.correct >= 7);
  award('score-nine', result.correct >= 9);
  award('perfect', perfect);
  award('play-two', totalPlays >= 2);
  award('play-three', totalPlays >= 3);
  award('play-five', totalPlays >= 5);
  award('play-eight', totalPlays >= 8);
  award('play-twelve', totalPlays >= 12);
  award('play-twenty', totalPlays >= 20);
  award('correct-ten', state.stats.totalCorrect >= 10);
  award('correct-twenty-five', state.stats.totalCorrect >= 25);
  award('correct-fifty', state.stats.totalCorrect >= 50);
  award('correct-eighty', state.stats.totalCorrect >= 80);
  award('correct-one-twenty', state.stats.totalCorrect >= 120);
  award('try-again', missedIds.size > 0);
  award('review-correct', reviewCorrectCount > 0);
  award('kuttsuki-twice', currentStage.id === 'kuttsuki' && stageState.plays >= 2);
  award('youon-twice', currentStage.id === 'youon' && stageState.plays >= 2);
  award('sokuon-twice', currentStage.id === 'sokuon' && stageState.plays >= 2);
  award('choon-twice', currentStage.id === 'choon' && stageState.plays >= 2);
  saveState();

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
  if (newBadges.length) window.setTimeout(() => showBadgeOverlay(newBadges), 700);
}

function showBadgeOverlay(ids) {
  const badgeIds = Array.isArray(ids) ? ids : [ids];
  const id = badgeIds.at(-1);
  const badge = badges.getDefinition(id);
  if (!badge) return;
  state.recentBadge = id;
  saveState();
  $('#badge-overlay-image').src = badge.image;
  $('#badge-overlay-image').alt = `${badge.name} バッジ`;
  $('#badge-overlay-title').textContent = badge.name;
  $('#badge-overlay-count').textContent = badgeIds.length > 1 ? `バッジを ${badgeIds.length}こ ゲット！` : 'あたらしい バッジ！';
  $('#badge-overlay').hidden = false;
  playSound('badge', 0.18);
  $('#badge-close-button').focus();
}

function closeBadgeOverlay() {
  $('#badge-overlay').hidden = true;
}

function renderCollection() {
  const grid = $('#collection-grid');
  grid.replaceChildren();
  const awardedCount = badges.getAwardedCount();
  $('#collection-total').textContent = `${awardedCount} / ${BADGES.length}`;
  $('#collection-fill').style.width = `${Math.round((awardedCount / BADGES.length) * 100)}%`;

  BADGES.forEach((badge) => {
    const unlocked = badges.has(badge.id);
    const card = document.createElement('article');
    card.className = `collection-card ${unlocked ? 'is-unlocked' : 'is-locked'}`;
    card.innerHTML = `
      <div class="collection-image-wrap">
        <img src="${badge.image}" alt="${unlocked ? `${badge.name} バッジ` : ''}">
        ${unlocked ? '<span aria-hidden="true">✓</span>' : '<span aria-hidden="true">?</span>'}
      </div>
      <strong>${unlocked ? badge.name : '？？？'}</strong>
      <small>${unlocked ? 'ゲットしたよ！' : badge.hint}</small>`;
    grid.append(card);
  });
}

function openCollection() {
  renderCollection();
  $('#collection-overlay').hidden = false;
  $('#collection-close-button').focus();
}

function closeCollection() {
  $('#collection-overlay').hidden = true;
}

function speakCurrentQuestion() {
  if (!currentQuestion || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(currentQuestion.speak);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.78;
  utterance.pitch = 1.08;
  window.speechSynthesis.speak(utterance);
  state.stats.readAlouds += 1;
  const isNew = state.stats.readAlouds >= 3 && badges.award('listen-three');
  saveState();
  if (isNew) window.setTimeout(() => showBadgeOverlay(['listen-three']), 250);
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
$('#collection-button').addEventListener('click', openCollection);
$('#collection-close-button').addEventListener('click', closeCollection);
$('#collection-overlay').addEventListener('click', (event) => { if (event.target === $('#collection-overlay')) closeCollection(); });
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
