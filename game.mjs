import { scenes } from './story.mjs';

export const items = {
  apple: ['赤いリンゴ', '红苹果', '1-06'],
  ember: ['赤い火種', '红色火种', '1-09'],
  lantern: ['カブのランタン', '芜菁灯', '2-03'],
  corn: ['トウモロコシ', '玉米', '2-04'],
  oats: ['オート麦', '燕麦', '2-08'],
  spear: ['ゲイ・ボルグ', '英雄的长矛', '3-07'],
  ring: ['金の指輪', '金戒指', '3-08'],
  weapon: ['古い武器', '旧武器', '3-09'],
  pie: ['アップルパイ', '苹果派', '4-03'],
  'lit-lantern': ['火のともったカブのランタン', '点亮的芜菁灯', '2-16']
};

const inspect = '調べます';
const talk = '話しかけます';
const take = '拾います';
const rules = new Map();
const targets = new Map();
const itemActions = new Map();

function register(act, id, target, label, cards, effects = {}) {
  const rule = { act, id, target, label, cards, ...effects };
  rules.set(id, rule);
  if (rule.item) {
    itemActions.set(`${act}/${rule.item}/${target}`, id);
  } else {
    const key = `${act}/${target}`;
    if (!targets.has(key)) targets.set(key, []);
    targets.get(key).push(rule);
  }
}

function ordinary(act, entries) {
  for (const [target, card, label = inspect] of entries) {
    register(act, card, target, label, [card]);
  }
}

ordinary(1, [
  ['square', '1-01'], ['fire', '1-02'], ['blue', '1-03', talk],
  ['apple-a', '1-04'], ['apple-b', '1-05'], ['apple-c', '1-06'],
  ['rat', '1-07'], ['stone', '1-08'], ['box', '1-10']
]);
register(1, 'take-apple', 'apple-c', take, ['1-06'], { add: 'apple' });
register(1, 'take-ember', 'ember', '火種を取ります', ['1-09'], { needs: ['1-08'], add: 'ember' });
register(1, 'offer-apple', 'fire', '', ['1-11'], { item: 'apple', remove: 'apple' });

ordinary(2, [
  ['fork', '2-01'], ['pumpkin', '2-02'], ['turnip', '2-03'],
  ['beans', '2-05'], ['cranberry', '2-06'], ['potato', '2-07'],
  ['cabbage', '2-09'], ['barley', '2-10'], ['blight', '2-11'],
  ['bat', '2-12', talk], ['jack', '2-13', talk], ['sign', '2-18']
]);
register(2, 'take-lantern', 'turnip', take, ['2-03'], { add: 'lantern' });
register(2, 'take-corn', 'corn', take, ['2-04'], { add: 'corn' });
register(2, 'take-oats', 'oats', take, ['2-08'], { add: 'oats' });
register(2, 'give-lantern', 'jack', '', ['2-14'], {
  item: 'lantern', remove: 'lantern', needs: ['2-13'],
  hint: 'まずジャックに話しかけてみましょう。'
});
register(2, '2-15', 'jack', 'もう一度話しかけます', ['2-15'], { needs: ['give-lantern'], showAfter: ['give-lantern'] });
register(2, 'light-jack', 'jack-lantern', '', ['2-16'], {
  item: 'ember', remove: 'ember', needs: ['2-15'],
  hint: 'ジャックの話を聞いてみましょう。'
});
register(2, '2-17', 'jack', '灯りをともしたあとで話します', ['2-17'], { needs: ['light-jack'], showAfter: ['light-jack'] });
register(2, 'choose-ireland', 'sign', 'アイルランドの道を選びます', [], {
  needs: ['2-17', '2-18'], showAfter: ['2-18'], message: 'アイルランドへの道を選びました。',
  hint: '道しるべを読み、ジャックが何を探しているか聞いてみましょう。'
});

ordinary(3, [
  ['plain', '3-01'], ['man', '3-02', talk], ['mask-a', '3-03', talk],
  ['mask-b', '3-04', talk], ['mask-c', '3-05'], ['crow', '3-06', talk],
  ['spear', '3-07'], ['weapon', '3-09']
]);
register(3, 'take-spear', 'spear', take, ['3-07'], { add: 'spear' });
register(3, 'take-ring', 'ring', '槍から指輪を外します', ['3-08'], { needs: ['3-07'], add: 'ring' });
register(3, 'take-weapon', 'weapon', take, ['3-09'], { add: 'weapon' });
register(3, '3-10', 'scathach', inspect, ['3-10'], { needs: ['3-07'] });
register(3, '3-11', 'hero', inspect, ['3-11'], { needs: ['3-07'] });
register(3, 'return-spear', 'man', '', ['3-12'], {
  item: 'spear', remove: 'spear', needs: ['take-ring'],
  hint: '槍に、まだ何かついているようです。'
});
register(3, 'return-weapon', 'mask-b', '', ['3-13'], { item: 'weapon', remove: 'weapon' });
register(3, 'return-ring', 'mask-a', '', ['3-14'], { item: 'ring', remove: 'ring' });
register(3, '3-15', 'sisters', '三人の名前を調べます', ['3-15'], { needs: ['return-spear'] });

ordinary(4, [
  ['square', '4-01'], ['mask-a', '4-02', talk], ['masks', '4-04'],
  ['white-cow', '4-08'], ['brown-cow', '4-09'], ['rat', '4-10', talk],
  ['bat', '4-11', talk], ['crow', '4-12', talk], ['fire', '4-13']
]);
register(4, 'take-pie', 'pie', '受け取ります', ['4-03'], { add: 'pie', cards: ['4-02', '4-03'] });
register(4, '4-05', 'grass', '草を踏みます', ['4-05']);
register(4, 'eat-pie', 'self', '', ['4-06'], {
  item: 'pie', remove: 'pie', needs: ['4-05'],
  hint: '今はまだお腹が空いていません。パイは取っておきましょう。'
});
register(4, '4-07', 'blight', inspect, ['4-07'], { needs: ['eat-pie'] });
register(4, '4-14', 'blue', inspect, ['4-14'], { needs: ['4-13'] });
register(4, '4-15', 'ember', '火種の行方を思い出します', ['4-15'], { needs: ['4-13'] });
register(4, 'recover-lantern', 'jack', 'ランタンを受け取ります', [], {
  needs: ['4-15'], add: 'lit-lantern',
  message: '霧の向こうからジャックが戻ってきます。「おかげで故郷にたどり着けたよ。今度は、この灯りを君が使う番だ。」'
});
register(4, 'relight-fire', 'fire', '', ['4-16'], {
  item: 'lit-lantern', remove: 'lit-lantern', needs: ['4-08'],
  hint: '火を戻す前に、争っている牛のことを調べましょう。'
});
register(4, 'blocked-offering', 'fire', '', ['4-17'], {
  needs: ['relight-fire', 'eat-pie'], message: '動物たちにさえぎられました。オート麦は手元にあります。'
});
register(4, 'blessing', 'sisters', 'バズヴ、マハ、モリガンの名を呼び、祝福を願います', ['4-18'], {
  needs: ['blocked-offering', '3-15']
});
register(4, 'offer-oats', 'fire', '', ['4-19'], { item: 'oats', remove: 'oats', needs: ['blessing'] });

const discovered = {
  1: [['ember', '赤い火種', '1-08']],
  2: [['jack-lantern', 'ジャックのランタン', 'give-lantern']],
  3: [
    ['ring', '金の指輪', '3-07'], ['scathach', 'スカアハ', '3-07'],
    ['hero', 'クー・フーリン', '3-07'], ['sisters', 'モリガンの三姉妹', 'return-spear']
  ],
  4: [
    ['blight', '病気のジャガイモ', 'eat-pie'], ['blue', '青い炎', '4-13'],
    ['ember', '赤い火種', '4-13'], ['jack', 'ジャック', '4-15'],
    ['sisters', 'モリガンの三姉妹', 'blocked-offering']
  ]
};

const gates = {
  1: [
    ['offer-apple', '青い炎の声と、地面のリンゴを調べてみましょう。'],
    ['take-ember', '広場の端に、まだ確かめていない小さな光がありそうです。']
  ],
  2: [
    ['give-lantern', 'ジャックが探しているものを聞いてみましょう。'],
    ['light-jack', 'ジャックの灯りは、まだ暗いままです。'],
    ['2-17', '灯りを見つめているジャックと、もう一度話してみましょう。'],
    ['choose-ireland', '道しるべとジャックの故郷を照らし合わせてみましょう。'],
    ['take-oats', '旅立つ前に、故郷の道に育つ穀物を探してみましょう。']
  ],
  3: [
    ['return-spear', '荒野に落ちている品と、泣いている男を調べましょう。'],
    ['return-weapon', '古い武器の持ち主を探しましょう。'],
    ['return-ring', '小さな信物の持ち主を探しましょう。'],
    ['3-15', '男が語った三人について調べましょう。']
  ],
  4: [
    ['eat-pie', '仮面のそばに広がる草と、差し出された食べ物が気になります。'],
    ['relight-fire', '消えたたき火を調べ、以前の火種の行方を思い出しましょう。'],
    ['blessing', '茶色い牛の話と、荒野で聞いた三人の名前を思い出しましょう。'],
    ['offer-oats', '祝福を受けた今なら、故郷の穀物をささげられそうです。']
  ]
};

const transitionCards = { 1: [], 2: ['2-19'], 3: ['3-16'], 4: [] };
for (let act = 1; act <= 4; act++) {
  register(act, `next-${act}`, '', '', transitionCards[act], {
    needs: gates[act].map(([id]) => id), next: act + 1
  });
}

export function newGame() {
  return { act: 1, events: [], inventory: [] };
}

function includesAll(events, required = []) {
  return required.every(id => events.includes(id));
}

export function gate(state) {
  const missing = gates[state.act]?.find(([id]) => !state.events.includes(id));
  return { ready: state.act < 5 && !missing, hint: missing?.[1] ?? '' };
}

export function availableTargets(state, act = state.act) {
  const scene = scenes[act - 1];
  if (!scene) return [];
  const base = scene.paragraphs.flatMap(paragraph =>
    Array.from(paragraph.matchAll(/【([^|]+)\|([\w-]+)】/g), ([, name, id]) => ({ id, name }))
  );
  const extra = discovered[act]
    .filter(([, , event]) => state.events.includes(event))
    .map(([id, name]) => ({ id, name }));
  return [...base, ...extra];
}

export function targetActions(state, target) {
  const available = (targets.get(`${state.act}/${target}`) ?? [])
    .filter(rule => includesAll(state.events, rule.showAfter))
    .map(({ id, label }) => ({ id, label }));
  if (state.act === 2 && target === 'sign' && state.events.includes('2-18')) {
    available.push({ id: 'choose-america', label: 'アメリカの道を選びます' });
  }
  return available;
}

function reject(state, message) {
  return { state, cards: [], message, changed: false };
}

export function perform(state, id) {
  if (id === 'choose-america' && state.act === 2 && state.events.includes('2-18')) {
    return reject(state, 'ジャックは足を止めました。もう一度、道しるべを確認しましょう。');
  }
  const rule = rules.get(id);
  if (!rule || state.act !== rule.act) return reject(state, '今はその行動ができません。');
  if (state.events.includes(id)) {
    return { ...reject(state, 'すでに確認した結果です。'), cards: rule.cards };
  }
  if (!includesAll(state.events, rule.needs)) {
    return reject(state, rule.next ? gate(state).hint : rule.hint ?? '先に周りを調べてみましょう。');
  }
  if (rule.item && !state.inventory.includes(rule.item)) return reject(state, 'その道具は持っていません。');
  if (id === 'blocked-offering' && !state.inventory.includes('oats')) {
    return reject(state, 'オート麦を持っていません。');
  }
  const inventory = state.inventory.filter(item => item !== rule.remove);
  if (rule.add) inventory.push(rule.add);
  const cards = id === 'next-4' ? endingCards(state) : rule.cards;
  const feedback = rule.add ? `入手 · ${items[rule.add][0]}`
    : rule.remove ? `道具欄から移動 · ${items[rule.remove][0]}` : '';
  return {
    state: { act: rule.next ?? state.act, events: [...state.events, id], inventory },
    cards,
    message: [rule.message, feedback].filter(Boolean).join('　') || '結果を確認できます。',
    changed: true
  };
}

export function useItem(state, item, target) {
  if (!state.inventory.includes(item)) return reject(state, 'その道具は持っていません。');
  if (state.act === 4 && item === 'oats' && target === 'fire' && !state.events.includes('blessing')) {
    if (state.events.includes('blocked-offering')) return reject(state, '動物たちはまだ道をふさいでいます。');
    if (!state.events.includes('relight-fire')) return reject(state, 'たき火には、まだ火がありません。');
    if (!state.events.includes('eat-pie')) return reject(state, 'まずは強い空腹をしずめましょう。');
    return perform(state, 'blocked-offering');
  }
  const id = itemActions.get(`${state.act}/${item}/${target}`);
  return id ? perform(state, id) : reject(state, 'ここでは、その道具は使えません。');
}

export function endingCards(state) {
  return state.inventory.includes('corn') ? ['4-19', '4-20'] : ['4-19'];
}

export function seenCards(state, act) {
  return [...new Set(state.events.flatMap(id => rules.get(id)?.cards ?? []))]
    .filter(id => id.startsWith(`${act}-`));
}

export function lastResult(state) {
  const id = state.events.at(-1);
  if (!id) return { cards: [], message: '' };
  const rule = rules.get(id);
  return {
    cards: id === 'next-4' ? endingCards(state) : rule.cards,
    message: rule.message ?? ''
  };
}

export function routeFor(hash, state) {
  const route = hash.replace(/^#/, '');
  if (route === 'grammar' || route === 'inventory') return route;
  const match = /^act-([1-4])$/.exec(route);
  if (match && Number(match[1]) <= state.act) return route;
  return state.act === 5 ? 'ending' : `act-${state.act}`;
}

export function saveGame(state) {
  return JSON.stringify({ version: 1, ...state });
}

export function restoreGame(raw) {
  if (raw === null) return newGame();
  const saved = JSON.parse(raw);
  if (saved?.version !== 1 || !Array.isArray(saved.events) || saved.events.length > rules.size) {
    throw new Error('Invalid save');
  }
  // Rebuild inventory and chapter from validated events instead of trusting saved summaries.
  let state = newGame();
  for (const id of saved.events) {
    const result = perform(state, id);
    if (!result.changed) throw new Error('Invalid saved event sequence');
    state = result.state;
  }
  return state;
}
