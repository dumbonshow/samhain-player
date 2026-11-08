import { cards, grammarImage, storyImages } from './assets.mjs';
import { scenes } from './story.mjs';
import {
  availableTargets, endingCards, gate, items, lastResult, newGame, perform, restoreGame,
  routeFor, saveGame, seenCards, targetActions, useItem
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

function apply(result) {
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
  document.getElementById('feedback')?.focus({ preventScroll: true });
}

function act(id) {
  if (syncBeforeAction()) apply(perform(state, id));
}

function showImage(src, title) {
  document.getElementById('image-title').textContent = title;
  const image = document.getElementById('large-image');
  image.src = src;
  image.alt = title;
  viewer.showModal();
}

function cardList(ids) {
  const list = el('div', 'card-list');
  for (const id of ids) {
    const card = cards[id];
    const link = button('', 'card-link', () => showImage(card.src, card.title));
    const image = el('img');
    image.src = card.src;
    image.alt = '';
    image.loading = 'lazy';
    const title = el('span');
    title.append(el('small', '', `調査カード ${id}`), el('strong', '', card.title));
    title.lastChild.lang = 'ja';
    link.append(image, title);
    list.append(link);
  }
  return list;
}

function feedbackPanel() {
  const panel = el('section', 'panel');
  panel.append(el('h3', '', '行动结果'));
  const status = el('p', feedback.message ? 'status' : 'muted', feedback.message || '选择行动后，结果会出现在这里。');
  status.id = 'feedback';
  status.tabIndex = -1;
  status.setAttribute('role', 'status');
  panel.append(status);
  if (feedback.cards.length) panel.append(cardList(feedback.cards));
  return panel;
}

function keyword(name, target, interactive) {
  if (!interactive) return el('strong', '', name);
  const control = button(name, 'keyword', () => {
    selectedTarget = target;
    render();
    document.getElementById('action-title').focus();
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
      p.append(text.slice(end, match.index), keyword(name, target, interactive));
      end = match.index + token.length;
      base.add(target);
    }
    p.append(text.slice(end));
    copy.append(p);
  }
  if (interactive) {
    const extra = availableTargets(state).filter(({ id }) => !base.has(id));
    if (extra.length) {
      const discoveries = el('section', 'extra');
      discoveries.append(el('h3', '', '見つけた手がかり'));
      for (const { id, name } of extra) discoveries.append(keyword(name, id, true));
      copy.append(discoveries);
    }
  }
  return copy;
}

function cover(scene) {
  const hero = el('header', 'scene');
  const image = el('img', 'cover');
  image.src = storyImages[scene.act - 1];
  image.alt = '';
  const heading = el('div', 'scene-heading');
  const title = el('h2', '', scene.title);
  title.lang = 'ja';
  title.tabIndex = -1;
  heading.append(el('p', 'eyebrow', `第 ${scene.act} 幕`), title, el('p', 'subtitle', scene.subtitle));
  hero.append(image, heading);
  return hero;
}

function actionPanel() {
  const panel = el('section', 'panel');
  const name = availableTargets(state).find(({ id }) => id === selectedTarget)?.name;
  const title = el('h3', '', name || '选择行动');
  title.id = 'action-title';
  title.tabIndex = -1;
  if (name) title.lang = 'ja';
  panel.append(el('div', 'panel-label', '調査 · INVESTIGATE'), title);
  if (!name) {
    panel.append(el('p', 'muted', '点击故事中的红色关键词，选择要做的日语行动。'));
    return panel;
  }
  const actions = el('div', 'action-row');
  actions.lang = 'ja';
  for (const option of targetActions(state, selectedTarget)) {
    actions.append(button(option.label, 'secondary', () => act(option.id)));
  }
  if (actions.childElementCount) panel.append(actions);
  else panel.append(el('p', 'muted', '可以从道具栏选择物品，再选这里作为使用对象。'));
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
    const { ready, hint } = gate(state);
    const next = button(actNumber === 4 ? '查看结局' : '进入下一幕', 'primary', () => act(`next-${actNumber}`));
    next.disabled = !ready;
    next.setAttribute('aria-describedby', 'chapter-hint');
    const message = el('p', 'muted', ready ? '本幕条件已齐，可以继续。' : hint);
    message.id = 'chapter-hint';
    if (!ready) message.lang = 'ja';
    progress.append(el('h3', '', '章节推进'), message, next);
    side.append(actionPanel(), feedbackPanel(), progress);
  } else {
    const archive = el('section', 'panel');
    archive.append(el('h3', '', '本幕调查记录'), el('p', 'muted', '回看已经揭示的卡片。'));
    archive.append(cardList(seenCards(state, actNumber)));
    side.append(archive);
  }
  layout.append(story, side);
  return layout;
}

function inventoryPanel() {
  const layout = el('div', 'layout');
  const paper = el('section', 'paper panel');
  paper.append(el('h2', '', '道具栏'), el('p', 'muted', '点击道具名称可查看卡片，也可以选择使用目标。'));
  if (!state.inventory.length) paper.append(el('p', '', '目前还没有道具。'));
  const list = el('ul', 'inventory-list');
  for (const item of state.inventory) {
    const [name, chinese, cardId] = items[item];
    const row = el('li');
    const label = button('', 'item-name', () => showImage(cards[cardId].src, name));
    const japanese = el('strong', '', name);
    japanese.lang = 'ja';
    label.append(japanese, el('small', '', chinese));
    row.append(label);
    if (state.act < 5) {
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
  if (list.childElementCount) paper.append(list);
  if (state.act < 5 && state.inventory.includes(selectedItem)) paper.append(useForm(selectedItem));
  const result = el('aside', 'paper');
  result.append(feedbackPanel());
  layout.append(paper, result);
  return layout;
}

function useForm(item) {
  const form = el('form', 'use-form');
  const label = el('label', '', `使用 ${items[item][1]} · 选择目标`);
  label.htmlFor = 'use-target';
  const select = el('select');
  select.id = 'use-target';
  select.required = true;
  const placeholder = el('option', '', '请选择目标');
  placeholder.value = '';
  select.append(placeholder);
  for (const { id, name } of [...availableTargets(state), { id: 'self', name: '自分' }]) {
    const option = el('option', '', name);
    option.value = id;
    option.lang = 'ja';
    select.append(option);
  }
  if ([...select.options].some(option => option.value === selectedTarget)) select.value = selectedTarget;
  const submit = el('button', 'primary', '使用します');
  submit.type = 'submit';
  submit.lang = 'ja';
  const actions = el('div', 'action-row');
  actions.append(submit);
  form.append(label, select, actions);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!syncBeforeAction()) return;
    selectedTarget = select.value;
    apply(useItem(state, item, selectedTarget));
  });
  return form;
}

function renderGrammar() {
  const paper = el('section', 'paper panel');
  paper.append(el('h2', '', '日语文法'));
  paper.append(el('p', 'muted', '查阅常用的日语行动句型。点击图片放大。'));
  const control = button('', 'grammar-image', () => showImage(grammarImage, 'TRPGで使う 日本語文法の呪文'));
  const image = el('img');
  image.src = grammarImage;
  image.alt = 'TRPGで使う 日本語文法の呪文';
  control.append(image);
  paper.append(control);
  return paper;
}

function renderEnding() {
  const ending = el('section', 'paper panel ending');
  const title = el('h2', '', '四幕完结 · 大地の祝福');
  title.tabIndex = -1;
  ending.append(title, el('p', '', '萨温之夜即将过去，暖意重返大地。'));
  ending.append(cardList(endingCards(state)));
  return ending;
}

function render() {
  route = routeFor(location.hash, state);
  if (location.hash !== `#${route}`) history.replaceState(null, '', `#${route}`);
  document.getElementById('item-count').textContent = state.inventory.length;
  const storyTab = document.getElementById('story-tab');
  storyTab.href = `#${storyRoute()}`;
  for (const [id, active] of [
    ['story-tab', route.startsWith('act-') || route === 'ending'],
    ['grammar-tab', route === 'grammar'], ['inventory-tab', route === 'inventory']
  ]) {
    const tab = document.getElementById(id);
    if (active) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  }
  chapters.replaceChildren();
  for (const { act } of scenes) {
    const locked = act > state.act;
    const label = el(locked ? 'span' : 'a', locked ? 'chapter locked' : 'chapter', `第 ${act} 幕`);
    if (!locked) label.href = `#act-${act}`;
    if (route === `act-${act}`) label.setAttribute('aria-current', 'step');
    label.append(el('small', '', locked ? '未解锁' : act < state.act ? '可回看' : '进行中'));
    chapters.append(label);
  }
  if (route === 'inventory') content.replaceChildren(inventoryPanel());
  else if (route === 'grammar') content.replaceChildren(renderGrammar());
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

loadStored();
render();
