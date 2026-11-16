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

export const verbs = {
  inspect: ['調べます', 'しらべます', '查看、调查', '地図を調べます。'],
  talk: ['話しかけます', 'はなしかけます', '主动跟某人搭话', '駅員に話しかけます。'],
  pick: ['拾います', 'ひろいます', '捡起地上的东西', '落とした鍵を拾います。'],
  harvest: ['収穫します', 'しゅうかくします', '收获成熟的作物', '畑で野菜を収穫します。'],
  extract: ['取り出します', 'とりだします', '从里面取出', 'かばんから本を取り出します。'],
  head: ['向かいます', 'むかいます', '朝某个方向前往', '駅へ向かいます。'],
  detach: ['外します', 'はずします', '取下、解开', 'かばんから名札を外します。'],
  receive: ['受け取ります', 'うけとります', '接收别人递来的东西', '友達から手紙を受け取ります。'],
  step: ['踏みます', 'ふみます', '踩、踏', 'ペダルを踏みます。'],
  recall: ['思い出します', 'おもいだします', '想起', '昔の約束を思い出します。'],
  call: ['呼びます', 'よびます', '呼叫、喊名字', '友達の名前を呼びます。'],
  put: ['入れます', 'いれます', '放进里面', '手紙を封筒に入れます。'],
  give: ['渡します', 'わたします', '交给对方', '受付の人に書類を渡します。'],
  return: ['返します', 'かえします', '归还给原主人', '友達に本を返します。'],
  eat: ['食べます', 'たべます', '吃', '朝ごはんにパンを食べます。'],
  offer: ['ささげます', 'ささげます', '献上、奉献', '神様に花をささげます。'],
  place: ['置きます', 'おきます', '放置在某处', 'テーブルに本を置きます。']
};

const sceneVerbs = {
  1: ['inspect', 'talk', 'pick', 'extract'],
  2: ['inspect', 'talk', 'pick', 'harvest', 'head'],
  3: ['inspect', 'talk', 'pick', 'detach'],
  4: ['inspect', 'talk', 'receive', 'step', 'recall', 'call']
};
export const itemVerbs = ['put', 'give', 'return', 'eat', 'offer', 'place'];
const inspect = 'inspect';
const talk = 'talk';
const take = 'pick';
const noEffect = 'その行動では、状況は変わりませんでした。';
const notReady = '今はその行動を進められませんでした。';
const awkwardActions = {
  pick: {
    objects: ['square', 'fork', 'plain'],
    message: '持ち帰りですか？ もう少し大きな袋がいりそうです。',
    usageNote: '「拾います」通常用于捡起掉在地上的东西。'
  },
  talk: {
    objects: ['apple-a', 'apple-b', 'apple-c'],
    message: '返事はありません。聞き役としては優秀です。',
    usageNote: '「話しかけます」表示主动向能交流的对象搭话，通常用助词「に」标出对方。'
  },
  harvest: {
    objects: ['sign', 'pumpkin', 'turnip', 'jack-lantern'],
    message: '種をまいても、同じものは育ちそうにありません。',
    usageNote: '「収穫します」用于收获成熟的作物。'
  },
  eat: {
    objects: ['ember', 'lantern', 'spear', 'ring', 'weapon', 'lit-lantern'],
    message: 'ひと口で歯医者に行くことになりそうです。',
    usageNote: '「食べます」表示吃，通常用「食物＋を＋食べます」。'
  }
};
const rules = new Map();
const targets = new Map();
const itemActions = new Map();

function register(act, id, target, verb, cards, effects = {}) {
  const rule = { act, id, target, verb, cards, ...effects };
  rules.set(id, rule);
  if (!verb) return;
  for (const choice of [verb, ...(rule.alternatives ?? [])]) {
    if (rule.item) {
      itemActions.set(`${act}/${rule.item}/${target}/${choice}`, id);
    } else {
      const key = `${act}/${target}/${choice}`;
      if (!targets.has(key)) targets.set(key, []);
      targets.get(key).push(rule);
    }
  }
}

function ordinary(act, entries) {
  for (const [target, card, verb = inspect] of entries) {
    register(act, card, target, verb, [card]);
  }
}

ordinary(1, [
  ['square', '1-01'], ['fire', '1-02'], ['blue', '1-03', talk],
  ['apple-a', '1-04'], ['apple-b', '1-05'], ['apple-c', '1-06'],
  ['rat', '1-07'], ['stone', '1-08'], ['box', '1-10']
]);
register(1, 'take-apple', 'apple-c', take, ['1-06'], { add: 'apple' });
register(1, 'take-ember', 'ember', 'extract', ['1-09'], {
  needs: ['1-08'], add: 'ember', sentence: '石の下から赤い火種を取り出します。'
});
register(1, 'offer-apple', 'fire', 'put', ['1-11'], {
  item: 'apple', remove: 'apple', alternatives: ['offer']
});

ordinary(2, [
  ['fork', '2-01'], ['pumpkin', '2-02'], ['turnip', '2-03'],
  ['beans', '2-05'], ['cranberry', '2-06'], ['potato', '2-07'],
  ['cabbage', '2-09'], ['barley', '2-10'], ['blight', '2-11'],
  ['bat', '2-12', talk], ['jack', '2-13', talk], ['sign', '2-18']
]);
register(2, 'take-lantern', 'turnip', take, ['2-03'], { add: 'lantern' });
register(2, 'take-corn', 'corn', 'harvest', ['2-04'], { add: 'corn' });
register(2, 'take-oats', 'oats', 'harvest', ['2-08'], { add: 'oats' });
register(2, 'give-lantern', 'jack', 'give', ['2-14'], {
  item: 'lantern', remove: 'lantern', needs: ['2-13']
});
register(2, '2-15', 'jack', talk, ['2-15'], { needs: ['give-lantern'] });
register(2, 'light-jack', 'jack-lantern', 'put', ['2-16'], {
  item: 'ember', remove: 'ember', needs: ['2-15']
});
register(2, '2-17', 'jack', talk, ['2-17'], { needs: ['light-jack'] });
register(2, 'choose-ireland', 'ireland', 'head', [], {
  needs: ['2-17', '2-18'], message: 'ジャックはうなずきました。'
});

ordinary(3, [
  ['plain', '3-01'], ['man', '3-02', talk], ['mask-a', '3-03', talk],
  ['mask-b', '3-04', talk], ['mask-c', '3-05'], ['crow', '3-06', talk],
  ['spear', '3-07'], ['weapon', '3-09']
]);
register(3, 'take-spear', 'spear', take, ['3-07'], { add: 'spear' });
register(3, 'take-ring', 'ring', 'detach', ['3-08'], {
  needs: ['3-07'], add: 'ring', sentence: '槍から金の指輪を外します。'
});
register(3, 'take-weapon', 'weapon', take, ['3-09'], { add: 'weapon' });
register(3, '3-10', 'scathach', inspect, ['3-10'], { needs: ['3-07'] });
register(3, '3-11', 'hero', inspect, ['3-11'], { needs: ['3-07'] });
register(3, 'return-spear', 'man', 'return', ['3-12'], {
  item: 'spear', remove: 'spear', needs: ['take-ring'], alternatives: ['give']
});
register(3, 'return-weapon', 'mask-b', 'return', ['3-13'], {
  item: 'weapon', remove: 'weapon', alternatives: ['give']
});
register(3, 'return-ring', 'mask-a', 'return', ['3-14'], {
  item: 'ring', remove: 'ring', alternatives: ['give']
});
register(3, '3-15', 'sisters', inspect, ['3-15'], {
  needs: ['return-spear'], sentence: 'モリガンの三姉妹の名前を調べます。'
});

ordinary(4, [
  ['square', '4-01'], ['mask-a', '4-02', talk], ['masks', '4-04'],
  ['rat', '4-10', talk],
  ['bat', '4-11', talk], ['crow', '4-12', talk], ['fire', '4-13']
]);
register(4, '4-08', 'white-cow', talk, ['4-08'], { alternatives: [inspect] });
register(4, '4-09', 'brown-cow', talk, ['4-09'], { alternatives: [inspect] });
register(4, 'take-pie', 'pie', 'receive', ['4-02', '4-03'], { add: 'pie' });
register(4, '4-05', 'grass', 'step', ['4-05']);
register(4, 'eat-pie', 'self', 'eat', ['4-06'], {
  item: 'pie', remove: 'pie', needs: ['4-05']
});
register(4, '4-07', 'blight', inspect, ['4-07'], { needs: ['eat-pie'] });
register(4, '4-14', 'blue', inspect, ['4-14'], { needs: ['4-13'] });
register(4, '4-15', 'ember', 'recall', ['4-15'], {
  needs: ['4-13'], sentence: '赤い火種の行方を思い出します。'
});
register(4, 'recover-lantern', 'jack', 'receive', [], {
  needs: ['4-15'], add: 'lit-lantern',
  sentence: 'ジャックからランタンを受け取ります。',
  message: '霧の向こうからジャックが戻ってきます。「おかげで故郷にたどり着けたよ。今度は、この灯りを君が使う番だ。」'
});
register(4, 'relight-fire', 'fire', 'place', ['4-16'], {
  item: 'lit-lantern', remove: 'lit-lantern', needs: ['4-08'], alternatives: ['put']
});
register(4, 'blocked-offering', 'fire', '', ['4-17'], {
  needs: ['relight-fire', 'eat-pie'], message: '動物たちにさえぎられました。オート麦は手元にあります。'
});
register(4, 'blessing', 'sisters', 'call', ['4-18'], {
  needs: ['blocked-offering', '3-15'], sentence: '三姉妹の名を呼びます。'
});
register(4, 'offer-oats', 'fire', 'offer', ['4-19'], {
  item: 'oats', remove: 'oats', needs: ['blessing'], alternatives: ['put']
});

const discovered = {
  1: [['ember', '赤い火種', '1-08']],
  2: [
    ['jack-lantern', 'ジャックのランタン', 'give-lantern'],
    ['ireland', 'アイルランド', '2-18'], ['america', 'アメリカ', '2-18']
  ],
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
  1: ['offer-apple', 'take-ember'],
  2: ['give-lantern', 'light-jack', '2-17', 'choose-ireland', 'take-oats'],
  3: ['return-spear', 'return-weapon', 'return-ring', '3-15'],
  4: ['eat-pie', 'relight-fire', 'blessing', 'offer-oats']
};

const transitionCards = { 1: [], 2: ['2-19'], 3: ['3-16'], 4: [] };
for (let act = 1; act <= 4; act++) {
  register(act, `next-${act}`, '', '', transitionCards[act], {
    needs: gates[act], next: act + 1
  });
}

export function newGame() {
  return { act: 1, events: [], inventory: [] };
}

function includesAll(events, required = []) {
  return required.every(id => events.includes(id));
}

export function gate(state) {
  return { ready: state.act < 5 && includesAll(state.events, gates[state.act]) };
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

export function explorationVerbs(act) {
  return sceneVerbs[act] ?? [];
}

function reject(state, message) {
  return { state, cards: [], message, changed: false };
}

function unmatchedAction(state, verb, object) {
  const entry = awkwardActions[verb];
  if (!entry?.objects.includes(object)) return reject(state, noEffect);
  return { ...reject(state, entry.message), usageNote: entry.usageNote };
}

export function perform(state, id) {
  if (id === 'choose-america' && state.act === 2 && state.events.includes('2-18')) {
    return reject(state, 'ジャックは足を止めました。');
  }
  const rule = rules.get(id);
  if (!rule || state.act !== rule.act) return reject(state, '今はその行動ができません。');
  if (state.events.includes(id)) {
    return { ...reject(state, 'すでに確認した結果です。'), cards: rule.cards };
  }
  if (!includesAll(state.events, rule.needs)) {
    return reject(state, notReady);
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

export function explore(state, target, verb) {
  const name = availableTargets(state).find(option => option.id === target)?.name;
  if (!name || !explorationVerbs(state.act).includes(verb)) return reject(state, noEffect);

  const particle = verb === 'talk' ? 'に' : verb === 'head' ? 'へ' : 'を';
  const candidates = targets.get(`${state.act}/${target}/${verb}`) ?? [];
  const rule = candidates.filter(candidate => includesAll(state.events, candidate.needs)).at(-1);
  const sentence = rule?.sentence ?? `${name}${particle}${verbs[verb][0]}。`;
  const id = state.act === 2 && target === 'america' && verb === 'head' ? 'choose-america' : rule?.id;
  if (id) return { ...perform(state, id), sentence };
  const result = candidates.length ? reject(state, notReady) : unmatchedAction(state, verb, target);
  return { ...result, sentence };
}

export function useItem(state, item, target, verb) {
  if (!state.inventory.includes(item)) return reject(state, 'その道具は持っていません。');
  const name = target === 'self' ? '自分' : availableTargets(state).find(option => option.id === target)?.name;
  if (!name || !itemVerbs.includes(verb)) return reject(state, noEffect);
  const sentence = verb === 'eat' ? `${items[item][0]}を食べます。` : `${items[item][0]}を${name}に${verbs[verb][0]}。`;
  const id = itemActions.get(`${state.act}/${item}/${target}/${verb}`);
  if (!id) return { ...unmatchedAction(state, verb, item), sentence };
  let result;
  if (id === 'offer-oats' && !state.events.includes('blessing')) {
    result = state.events.includes('blocked-offering')
      ? reject(state, '動物たちはまだ道をふさいでいます。')
      : perform(state, 'blocked-offering');
  } else {
    result = perform(state, id);
  }
  return { ...result, sentence };
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
  if (route === 'grammar') return route;
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
