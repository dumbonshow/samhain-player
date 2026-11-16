import { readings } from './ruby-readings.mjs';

const wordsByStart = new Map();
for (const [word, reading] of Object.entries(readings)) {
  const words = wordsByStart.get(word[0]) ?? [];
  words.push([word, reading]);
  wordsByStart.set(word[0], words);
}
for (const words of wordsByStart.values()) words.sort((a, b) => b[0].length - a[0].length);

// Keep matching kana outside the ruby, including a verb's okurigana. Match the
// whole word first: 行く and 行動 have different readings for the same kanji.
function wordParts(word, reading) {
  let start = 0;
  let end = word.length;
  let readingEnd = reading.length;
  while (start < end && !/[\p{Script=Han}々〆ヶ]/u.test(word[start]) && word[start] === reading[start]) start++;
  while (end > start && !/[\p{Script=Han}々〆ヶ]/u.test(word[end - 1]) && word[end - 1] === reading[readingEnd - 1]) {
    end--;
    readingEnd--;
  }
  return [
    { text: word.slice(0, start) },
    { text: word.slice(start, end), reading: reading.slice(start, readingEnd) },
    { text: word.slice(end) }
  ].filter(part => part.text);
}

export function rubyParts(text) {
  const parts = [];
  let plain = '';
  for (let offset = 0; offset < text.length;) {
    const match = wordsByStart.get(text[offset])?.find(([word]) => text.startsWith(word, offset));
    if (!match) {
      plain += text[offset++];
      continue;
    }
    if (plain) parts.push({ text: plain });
    plain = '';
    parts.push(...wordParts(...match));
    offset += match[0].length;
  }
  if (plain) parts.push({ text: plain });
  return parts;
}

export function appendRuby(parent, text) {
  const doc = parent.ownerDocument;
  for (const part of rubyParts(text)) {
    if (!part.reading) {
      parent.append(doc.createTextNode(part.text));
      continue;
    }
    const ruby = doc.createElement('ruby');
    const before = doc.createElement('rp');
    before.textContent = '（';
    const rt = doc.createElement('rt');
    rt.textContent = part.reading;
    const after = doc.createElement('rp');
    after.textContent = '）';
    ruby.append(doc.createTextNode(part.text), before, rt, after);
    parent.append(ruby);
  }
}

// Native option controls cannot consistently display ruby. The visible target
// controls use radio labels instead, so kana remains available when choosing.
export function setJapaneseText(element, text) {
  element.lang = 'ja';
  element.replaceChildren();
  appendRuby(element, text);
  return element;
}
