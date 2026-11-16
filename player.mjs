import { cards, grammarImage } from './assets.mjs';
import { scenes } from './story.mjs';
import { cardText } from './card-text.mjs';
import { appendRuby, setJapaneseText } from './ruby.mjs';
import {
  availableTargets, endingCards, explorationVerbs, explore, gate, items, itemVerbs, lastResult,
  newGame, perform, restoreGame, routeFor, saveGame, seenCards, useItem, verbs
} from './game.mjs';

const key = 'samhain-player-save-v1';
const chapters = document.getElementById('chapters');
const content = document.getElementById('content');
const warning = document.getElementById('save-warning');
const viewer = document.getElementById('viewer');
const resetDialog = document.getElementById('reset-dialog');
let state = newGame();
let saveRaw = null;
let memoryOnly = false;
let selectedTarget = '';
let selectedItem = '';
let feedback = { cards: [], message: '' };
let route = '';

function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function ja(tag, className, text) {
  return setJapaneseText(el(tag, className), text);
}

function japaneseButton(label, className, action) {
  return setJapaneseText(button('', className, action), label);
}

function usageText(text) {
  const note = el('span', 'usage-note');
  let end = 0;
  for (const match of text.matchAll(/「([^」]+)」/g)) {
    note.append(text.slice(end, match.index), '「', ja('span', '', match[1]), '」');
    end = match.index + match[0].length;
  }
  note.append(text.slice(end));
  return note;
}

function button(label, className, action) {
  const element = el('button', className, label);
  element.type = 'button';
  element.addEventListener('click', action);
  return element;
}

function reportStorage(message) {
  warning.textContent = message;
  warning.hidden = !message;
}

function loadStored() {
  let raw;
  try {
    raw = localStorage.getItem(key);
  } catch {
    memoryOnly = true;
    reportStorage('浏览器存储不可用。你可以继续本局，关闭或刷新页面后进度会丢失。');
    return false;
  }
  if (raw === saveRaw) return false;
  try {
    state = restoreGame(raw);
    saveRaw = raw;
    feedback = lastResult(state);
    return true;
  } catch {
    memoryOnly = true;
    reportStorage('旧存档无法读取。可在当前页面继续，或确认重新开始后保存新进度。');
    return false;
  }
}

function persist() {
  if (memoryOnly) return;
  try {
    const next = saveGame(state);
    localStorage.setItem(key, next);
    saveRaw = next;
  } catch {
    memoryOnly = true;
    reportStorage('进度暂时无法写入浏览器。可继续游玩，关闭或刷新页面后会恢复到上次成功保存的位置。');
  }
}

function syncBeforeAction() {
  if (memoryOnly || !loadStored()) return true;
  selectedTarget = '';
  selectedItem = '';
  feedback = { cards: [], message: '已载入此网址在另一个标签页保存的进度，请重新选择行动。' };
  render();
  return false;
}

function storyRoute() {
  return state.act === 5 ? 'ending' : `act-${state.act}`;
}

function goto(destination) {
  if (location.hash !== `#${destination}`) history.pushState(null, '', `#${destination}`);
  render();
  window.scrollTo(0, 0);
}

function apply(result, { scrollToResult = false } = {}) {
  const priorAct = state.act;
  state = result.state;
  feedback = result;
  if (result.changed) persist();
  if (state.act !== priorAct) {
    selectedTarget = '';
    selectedItem = '';
    goto(storyRoute());
    content.querySelector('h2')?.focus();
    return;
  }
  render();
  const feedbackStatus = document.getElementById('feedback');
  const showCard = scrollToResult && result.cards.length && window.matchMedia('(max-width: 720px)').matches;
  feedbackStatus?.focus({ preventScroll: !scrollToResult || showCard });
  if (showCard) document.getElementById('action-result')?.scrollIntoView({ block: 'start' });
}

function act(id) {
  if (syncBeforeAction()) apply(perform(state, id));
}

function showImage(src, title) {
  setJapaneseText(document.getElementById('image-title'), title);
  const image = document.getElementById('large-image');
  document.getElementById('card-reader').replaceChildren();
  document.getElementById('card-reader').hidden = true;
  image.hidden = false;
  image.src = src;
  image.alt = title;
  viewer.showModal();
}

function cardArt(id, className = '') {
  const art = el('span', `card-art ${className}`);
  art.setAttribute('aria-hidden', 'true');
  const image = el('img');
  image.src = cards[id].src;
  image.alt = '';
  image.loading = 'lazy';
  art.append(image);
  return art;
}

function readableCard(id) {
  const [keyword, body, note] = cardText[id];
  const card = el('article', 'readable-card');
  card.lang = 'ja';
  card.dataset.cardId = id;
  card.append(ja('p', 'card-number', `調査カード ${id}`), cardArt(id));
  const copy = el('div', 'card-copy');
  copy.append(ja('p', 'card-keyword', `調査キーワード：${keyword}`), ja('h3', '', cards[id].title));
  for (const paragraph of body.split('\n')) copy.append(ja('p', '', paragraph));
  if (note) copy.append(ja('p', 'card-hint', note));
  card.append(copy);
  return card;
}

function showCard(id) {
  setJapaneseText(document.getElementById('image-title'), cards[id].title);
  document.getElementById('large-image').hidden = true;
  const reader = document.getElementById('card-reader');
  reader.hidden = false;
  reader.replaceChildren(readableCard(id));
  viewer.showModal();
  viewer.scrollTop = 0;
}

function cardList(ids, { showFaces = false } = {}) {
  const list = el('div', 'card-list');
  for (const id of ids) {
    const card = cards[id];
    if (showFaces) {
      const face = el('section', 'card-face');
      face.append(readableCard(id), button('放大阅读', 'secondary card-open', () => showCard(id)));
      list.append(face);
      continue;
    }
    const link = button('', 'card-link', () => showCard(id));
    const title = el('span');
    title.append(ja('small', '', `調査カード ${id}`), ja('strong', '', card.title));
    link.append(cardArt(id, 'card-thumbnail'), title);
    list.append(link);
  }
  return list;
}

function feedbackPanel() {
  const panel = el('section', 'panel');
  panel.id = 'action-result';
  panel.append(el('h3', '', '行动结果'));
  const status = el('p', feedback.message ? 'status' : 'muted');
  if (feedback.sentence) {
    if (feedback.usageNote) status.append(el('span', 'attempt-label', '你选择的句子'));
    const sentence = ja('span', 'attempt-sentence', feedback.sentence);
    status.append(sentence);
  }
  if (feedback.usageNote) {
    const joke = ja('span', '', feedback.message);
    status.append(joke, usageText(feedback.usageNote));
  } else {
    if (feedback.message && /[\p{Script=Hiragana}\p{Script=Katakana}]/u.test(feedback.message)) {
      status.append(ja('span', '', feedback.message));
    } else {
      status.append(feedback.message || '选择行动后，结果会出现在这里。');
    }
  }
  status.id = 'feedback';
  status.tabIndex = -1;
  status.setAttribute('role', 'status');
  panel.append(status);
  if (feedback.cards.length) panel.append(cardList(feedback.cards, { showFaces: true }));
  return panel;
}

function keyword(name, target, interactive) {
  if (!interactive) return ja('strong', '', name);
  const control = japaneseButton(name, 'keyword', () => {
    selectedTarget = target;
    render();
    const title = document.getElementById('action-title');
    if (window.matchMedia('(max-width: 720px)').matches) {
      title.focus({ preventScroll: true });
      title.scrollIntoView({ block: 'center' });
    } else {
      title.focus();
    }
  });
  control.setAttribute('aria-pressed', String(target === selectedTarget));
  return control;
}

function storyText(scene, interactive) {
  const copy = el('div', 'story-copy');
  copy.lang = 'ja';
  const base = new Set();
  for (const text of scene.paragraphs) {
    const p = el('p');
    let end = 0;
    for (const match of text.matchAll(/【([^|]+)\|([\w-]+)】/g)) {
      const [token, name, target] = match;
      appendRuby(p, text.slice(end, match.index));
      p.append(keyword(name, target, interactive));
      end = match.index + token.length;
      base.add(target);
    }
    appendRuby(p, text.slice(end));
    copy.append(p);
  }
  if (interactive) {
    const extra = availableTargets(state).filter(({ id }) => !base.has(id));
    if (extra.length) {
      const discoveries = el('section', 'extra');
      discoveries.append(ja('h3', '', '見つけた手がかり'));
      for (const { id, name } of extra) discoveries.append(keyword(name, id, true));
      copy.append(discoveries);
    }
  }
  return copy;
}

function cover(scene) {
  const hero = el('header', 'scene');
  const image = cardArt(`${scene.act}-01`, 'cover');
  const heading = el('div', 'scene-heading');
  const title = ja('h2', '', scene.title);
  title.tabIndex = -1;
  heading.append(ja('p', 'eyebrow', `第 ${scene.act} 幕`), title, el('p', 'subtitle', scene.subtitle));
  hero.append(image, heading);
  return hero;
}

function verbButtons(choices, choose) {
  const actions = el('div', 'verb-choices');
  actions.lang = 'ja';
  for (const verb of choices) {
    actions.append(japaneseButton(verbs[verb][0], 'secondary', () => choose(verb)));
  }
  return actions;
}

function actionPanel() {
  const panel = el('section', 'panel');
  const name = availableTargets(state).find(({ id }) => id === selectedTarget)?.name;
  const title = name ? ja('h3', '', name) : el('h3', '', '选择行动');
  title.id = 'action-title';
  title.tabIndex = -1;
  panel.append(ja('div', 'panel-label', '調査 · INVESTIGATE'), title);
  if (!name) {
    panel.append(el('p', 'muted', '点击故事中的红色关键词，再选择日语动词。'));
    return panel;
  }
  panel.append(verbButtons(explorationVerbs(state.act), verb => {
    if (syncBeforeAction()) apply(explore(state, selectedTarget, verb), { scrollToResult: true });
  }));
  return panel;
}

function renderScene(actNumber) {
  const scene = scenes[actNumber - 1];
  const interactive = actNumber === state.act;
  const layout = el('div', 'layout');
  const story = el('article', 'paper');
  story.append(cover(scene), storyText(scene, interactive));
  const side = el('aside', 'paper');
  if (interactive) {
    const progress = el('section', 'panel');
    const { ready } = gate(state);
    const next = button(actNumber === 4 ? '查看结局' : '进入下一幕', 'primary', () => act(`next-${actNumber}`));
    next.disabled = !ready;
    next.setAttribute('aria-describedby', 'chapter-hint');
    const readyMessage = actNumber === 4 ? '可以查看结局。' : '可以进入下一幕。';
    const message = el('p', 'muted', ready ? readyMessage : '本幕尚未完成。');
    message.id = 'chapter-hint';
    progress.append(el('h3', '', '章节推进'), message, next);
    side.append(actionPanel(), feedbackPanel(), inventoryPanel(true), progress);
  } else {
    const archive = el('section', 'panel');
    archive.append(el('h3', '', '本幕调查记录'), el('p', 'muted', '回看已经揭示的卡片。'));
    archive.append(cardList(seenCards(state, actNumber)));
    side.append(archive, inventoryPanel(false));
  }
  layout.append(story, side);
  return layout;
}

function inventoryPanel(canUse) {
  const panel = el('section', 'panel');
  panel.id = 'story-inventory';
  panel.setAttribute('aria-labelledby', 'inventory-title');
  const title = el('h3', '', '道具栏');
  title.id = 'inventory-title';
  const count = el('span', 'inventory-count', String(state.inventory.length));
  count.setAttribute('aria-label', `${state.inventory.length} 件道具`);
  title.append(' ', count);
  panel.append(title);
  if (!state.inventory.length) {
    panel.append(el('p', 'muted', '目前还没有道具。'));
    return panel;
  }
  const list = el('ul', 'inventory-list');
  for (const item of state.inventory) {
    const [name, chinese, cardId] = items[item];
    const row = el('li');
    const label = button('', 'item-name', () => showCard(cardId));
    const japanese = ja('strong', '', name);
    label.append(japanese, el('small', '', chinese));
    row.append(label);
    if (canUse) {
      const use = button('选择使用', 'secondary', () => {
        selectedItem = item;
        render();
        document.getElementById('use-target').focus();
      });
      use.setAttribute('aria-label', `选择使用 ${chinese}`);
      row.append(use);
    }
    list.append(row);
  }
  panel.append(list);
  if (canUse && state.inventory.includes(selectedItem)) panel.append(useForm(selectedItem));
  return panel;
}

function useForm(item) {
  const form = el('div', 'use-form');
  const targets = el('fieldset', 'use-targets');
  targets.id = 'use-target';
  targets.tabIndex = -1;
  targets.append(el('legend', '', `使用 ${items[item][1]} · 选择目标`));
  const choices = el('div', 'target-choices');
  for (const { id, name } of [...availableTargets(state), { id: 'self', name: '自分' }]) {
    const label = el('label', 'target-choice');
    const option = el('input');
    option.type = 'radio';
    option.name = 'use-target';
    option.value = id;
    option.checked = id === selectedTarget;
    option.addEventListener('change', () => { selectedTarget = id; });
    label.append(option, ja('span', '', name));
    choices.append(label);
  }
  targets.append(choices);
  const hint = el('p', 'muted', '请选择目标，再选择动词。');
  hint.id = 'target-hint';
  hint.setAttribute('role', 'status');
  targets.setAttribute('aria-describedby', hint.id);
  const actions = verbButtons(itemVerbs, verb => {
    const selected = targets.querySelector('input:checked');
    if (!selected) {
      hint.textContent = '请先选择一个目标。';
      targets.querySelector('input')?.focus();
      return;
    }
    if (!syncBeforeAction()) return;
    selectedTarget = selected.value;
    apply(useItem(state, item, selectedTarget, verb), { scrollToResult: true });
  });
  form.append(targets, hint, actions);
  return form;
}

function renderGrammar() {
  const paper = el('section', 'paper panel');
  paper.append(el('h2', '', '日语文法'));
  paper.append(el('p', 'muted', '查阅游戏里常用的动词、读音和助词用法。'));
  const list = el('dl', 'grammar-list');
  for (const [word, , meaning, example] of Object.values(verbs)) {
    const entry = el('div');
    const term = ja('dt', '', word);
    const sample = ja('dd', 'grammar-example', example);
    entry.append(term, el('dd', '', meaning), sample);
    list.append(entry);
  }
  paper.append(list, el('h3', '', '行动句型图'));
  const control = button('', 'grammar-image', () => showImage(grammarImage, 'TRPGで使う 日本語文法の呪文'));
  const image = el('img');
  image.src = grammarImage;
  image.alt = 'TRPGで使う 日本語文法の呪文';
  control.append(image);
  paper.append(control);
  return paper;
}

function renderEnding() {
  const layout = el('div', 'layout');
  const ending = el('section', 'paper panel');
  const title = el('h2', '', '四幕完结 · ');
  title.append(ja('span', '', '大地の祝福'));
  title.tabIndex = -1;
  ending.append(title, el('p', '', '萨温之夜即将过去，暖意重返大地。'));
  ending.append(cardList(endingCards(state)));
  const side = el('aside', 'paper');
  side.append(inventoryPanel(false));
  layout.append(ending, side);
  return layout;
}

function render() {
  route = routeFor(location.hash, state);
  if (location.hash !== `#${route}`) history.replaceState(null, '', `#${route}`);
  const storyTab = document.getElementById('story-tab');
  storyTab.href = `#${storyRoute()}`;
  for (const [id, active] of [
    ['story-tab', route.startsWith('act-') || route === 'ending'],
    ['grammar-tab', route === 'grammar']
  ]) {
    const tab = document.getElementById(id);
    if (active) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  }
  chapters.replaceChildren();
  for (const { act } of scenes) {
    const locked = act > state.act;
    const label = el(locked ? 'span' : 'a', locked ? 'chapter locked' : 'chapter');
    label.append(ja('span', '', `第 ${act} 幕`));
    if (!locked) label.href = `#act-${act}`;
    if (route === `act-${act}`) label.setAttribute('aria-current', 'step');
    label.append(el('small', '', locked ? '未解锁' : act < state.act ? '可回看' : '进行中'));
    chapters.append(label);
  }
  if (route === 'grammar') content.replaceChildren(renderGrammar());
  else if (route === 'ending') content.replaceChildren(renderEnding());
  else content.replaceChildren(renderScene(Number(route.slice(4))));
}

document.getElementById('restart').addEventListener('click', () => {
  resetDialog.returnValue = '';
  resetDialog.showModal();
});
resetDialog.addEventListener('close', () => {
  if (resetDialog.returnValue !== 'reset') return;
  state = newGame();
  selectedTarget = '';
  selectedItem = '';
  feedback = { cards: [], message: '' };
  saveRaw = null;
  memoryOnly = false;
  reportStorage('');
  persist();
  goto('act-1');
});
window.addEventListener('hashchange', () => {
  render();
  window.scrollTo(0, 0);
});
window.addEventListener('storage', event => {
  if ((event.key === key || event.key === null) && !memoryOnly && loadStored()) render();
});

for (const element of document.querySelectorAll('[lang="ja"]')) {
  setJapaneseText(element, element.textContent);
}
loadStored();
render();
