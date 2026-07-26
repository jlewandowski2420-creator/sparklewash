#!/usr/bin/env node
'use strict';

const fs = require('fs');
const vm = require('vm');
const code = fs.readFileSync('js/i18n.js', 'utf8');

function makeElement(attrs = {}, initialText = '') {
  const state = { attrs: { ...attrs }, text: initialText, html: initialText };
  return {
    dataset: attrs['data-lang'] ? { lang: attrs['data-lang'] } : {},
    classList: { toggle() {} },
    addEventListener() {},
    getAttribute(name) { return state.attrs[name] ?? null; },
    setAttribute(name, value) { state.attrs[name] = String(value); },
    get textContent() { return state.text; },
    set textContent(value) { state.text = String(value); state.html = String(value); },
    get innerHTML() { return state.html; },
    set innerHTML(value) { state.html = String(value); state.text = String(value); },
    _state: state,
  };
}

function runCase({ path, search = '', saved = null, titleKey, heroKey, metaKey }) {
  const listeners = {};
  const title = makeElement({ 'data-i18n': titleKey });
  const hero = makeElement({ 'data-i18n': heroKey });
  const meta = makeElement({ 'data-i18n-content': metaKey, content: 'static' });
  const canonical = makeElement({ href: `https://sparklewash.nl${path}` });
  const buttons = ['nl', 'de', 'en', 'pl'].map(lang => makeElement({ 'data-lang': lang }));
  const store = saved ? { 'sparklewash-lang': saved } : {};
  const location = {
    origin: 'https://sparklewash.nl',
    href: `https://sparklewash.nl${path}${search}`,
    search,
  };
  const documentElement = { lang: 'nl', setAttribute(name, value) { this[name] = value; } };
  const document = {
    documentElement,
    title: '',
    addEventListener(name, cb) { listeners[name] = cb; },
    dispatchEvent() {},
    querySelectorAll(selector) {
      if (selector === '[data-i18n]') return [title, hero];
      if (selector === '[data-i18n-content]') return [meta];
      if (selector === '.lang-btn') return buttons;
      return [];
    },
    querySelector(selector) {
      if (selector === 'link[rel="canonical"]') return canonical;
      return null;
    },
  };
  Object.defineProperty(title, 'textContent', {
    get() { return title._state.text; },
    set(value) { title._state.text = String(value); title._state.html = String(value); document.title = String(value); },
  });

  const context = {
    console,
    URL,
    URLSearchParams,
    CustomEvent: function CustomEvent(name, init) { this.name = name; this.detail = init?.detail; },
    document,
    window: { location },
    history: {
      replaceState(_state, _title, next) {
        const value = String(next);
        const parsed = new URL(value, location.origin);
        location.href = parsed.href;
        location.search = parsed.search;
      },
    },
    localStorage: {
      getItem(key) { return store[key] ?? null; },
      setItem(key, value) { store[key] = String(value); },
    },
  };
  vm.createContext(context);
  vm.runInContext(code, context);
  if (!listeners.DOMContentLoaded) throw new Error('DOMContentLoaded listener missing');
  listeners.DOMContentLoaded();

  return {
    context,
    current: vm.runInContext('I18N.current', context),
    setLang: lang => vm.runInContext(`I18N.setLang(${JSON.stringify(lang)})`, context),
    title: () => document.title,
    hero: () => hero._state.text,
    meta: () => meta._state.attrs.content,
    canonical: () => canonical.href,
    htmlLang: () => documentElement.lang,
    href: () => location.href,
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const homepage = runCase({ path: '/', titleKey: 'page-title', heroKey: 'hero-title', metaKey: 'meta-desc' });
assert(homepage.current === 'nl', `homepage current=${homepage.current}`);
assert(homepage.title().includes('SparkleWash'), `homepage title=${homepage.title()}`);
assert(homepage.meta().startsWith('SparkleWash reinigt'), `homepage meta=${homepage.meta()}`);
assert(homepage.canonical() === 'https://sparklewash.nl/', `homepage canonical=${homepage.canonical()}`);
assert(homepage.htmlLang() === 'nl', `homepage html lang=${homepage.htmlLang()}`);

const german = runCase({ path: '/sofa.html', search: '?lang=de', titleKey: 'sofa-page-title', heroKey: 'sofa-hero-title', metaKey: 'sofa-meta-desc' });
assert(german.current === 'de', `German current=${german.current}`);
assert(german.title().startsWith('Sofa & Sessel'), `German title=${german.title()}`);
assert(german.hero().includes('SparkleWash'), `German H1=${german.hero()}`);
assert(german.meta().startsWith('Sofa oder Sessel'), `German meta=${german.meta()}`);
assert(german.canonical() === 'https://sparklewash.nl/sofa.html?lang=de', `German canonical=${german.canonical()}`);
assert(german.htmlLang() === 'de', `German html lang=${german.htmlLang()}`);

german.setLang('pl');
assert(german.href() === 'https://sparklewash.nl/sofa.html?lang=pl', `Polish href=${german.href()}`);
assert(german.canonical() === 'https://sparklewash.nl/sofa.html?lang=pl', `Polish canonical=${german.canonical()}`);
assert(german.title().startsWith('Pranie Sof'), `Polish title=${german.title()}`);
assert(german.htmlLang() === 'pl', `Polish html lang=${german.htmlLang()}`);

const returning = runCase({ path: '/carpet.html', saved: 'en', titleKey: 'carpet-page-title', heroKey: 'carpet-hero-title', metaKey: 'carpet-meta-desc' });
assert(returning.current === 'en', `saved-language current=${returning.current}`);
assert(returning.href() === 'https://sparklewash.nl/carpet.html?lang=en', `saved-language href=${returning.href()}`);
assert(returning.canonical() === 'https://sparklewash.nl/carpet.html?lang=en', `saved-language canonical=${returning.canonical()}`);

console.log('PASS: i18n URL selection, translated metadata, HTML lang and self-canonical behavior');
