/* =========================================================
   Unplugged — shared data & storage layer
   Persists essays, settings, and admin credentials to localStorage.
   ========================================================= */

(function (global) {
  'use strict';

  const STORAGE_KEY     = 'unplugged:v1';
  const SESSION_KEY     = 'unplugged:session';
  const PASSWORD_KEY    = 'unplugged:pw';
  const THEME_KEY       = 'unplugged:theme';
  const VID_KEY         = 'unplugged:vid';
  const ADMIN_TOKEN_KEY = 'unplugged:admintoken';

  /* ── Defaults ─────────────────────────────────────────── */

  const DEFAULT_SETTINGS = {
    siteTitle: 'Unplugged',
    tagline: 'A slow journal',
    masthead: {
      issue: 'Vol. 01  ·  Residue 001',
      season: 'Spring Issue  ·  April, 2026',
      archiveNote: 'An ongoing archive',
      english:
        "Essays on <em>humanities</em>, the art of <em>building</em>, the rooms technology leaves behind, and the long history of what we have already loved. Written slowly. Read with time."
    },
    atmosphereCity: 'seoul',
    atmosphereTemp: '6°c',
    spotifyUri: 'spotify:playlist:37i9dQZF1DX4sWSpwq3LiO',
    spotifyLabel: 'Peaceful Piano',
    epigraph: {
      lines: [
        'Until the day I die,',
        'looking up to the heavens,',
        'may there be not a single speck',
        'of shame.'
      ],
      source: 'Yoon Dong-ju  ·  Prologue, 1941'
    },
    pullQuote: {
      lines: [
        'The piano note does not end.',
        'It rejoins the silence',
        'from which it came.'
      ],
      source: 'from  On the Afterlife of Sound'
    },
    notes: [
      { date: '17 April, night',
        body: 'Rain against the glass of the fifth floor. A line from Bachelard: <em>the house protects the dreamer</em>. I don\'t think it protects the dreamer so much as it forgets them, gently, and this is a kind of love.' },
      { date: '15 April, 04:47',
        body: 'The last thing Sakamoto did was teach us how to end. Not dramatically. Not with a coda. But with a single note given permission to fade.' },
      { date: '11 April, dawn',
        body: 'Every startup I admire has a ghost in it: some earlier form, some refused opportunity, some doorway the founder had to close. You can hear it in the way they write product notes.' },
      { date: '03 April, 07:10',
        body: "In Lee Jung-seop's letters from Jeju, the children are always drawn from above, as if seen by someone already leaving. He loved them, and he knew." }
    ],
    categories: [
      { id: 'on-beauty',         name: 'On Beauty',         color: '#a4401a' },
      { id: 'on-sound',          name: 'On Sound',          color: '#3a5060' },
      { id: 'on-building',       name: 'On Building',       color: '#6e6454' },
      { id: 'on-technology',     name: 'On Technology',     color: '#3a5060' },
      { id: 'on-history',        name: 'On History',        color: '#a4401a' },
      { id: 'on-making',         name: 'On Making',         color: '#6e6454' },
      { id: 'on-thought',        name: 'On Thought',        color: '#3a5060' },
      { id: 'on-business',       name: 'On Business',       color: '#a4401a' },
      { id: 'on-memory',         name: 'On Memory',         color: '#6e6454' },
      { id: 'on-aesthetics',     name: 'On Aesthetics',     color: '#c99a55' },
      { id: 'on-craft',          name: 'On Craft',          color: '#6e6454' },
      { id: 'on-korean-thought', name: 'On Korean Thought', color: '#a4401a' },
      { id: 'on-art',            name: 'On Art',            color: '#c99a55' }
    ]
  };

  const DEFAULT_ESSAYS = [
    {
      id: '047',
      number: '047',
      category: 'On Beauty · On Sound',
      title: 'On the Afterlife of Sound',
      titleHtml: 'On the <em>Afterlife</em> of Sound',
      dek: "Ryuichi Sakamoto's final album <em>12</em> is not music about endings. It is music that listens to its own disappearance — and leaves a room slightly warmer for having been played.",
      body:
        "There is a kind of listening that can only happen in a room emptied of urgency. Sakamoto knew this in the last years of his life. He recorded short piano pieces — the shortest a minute, the longest no more than twelve — and numbered them like days on a calendar. Each one begins almost apologetically. Each one ends before it has quite become anything. And yet each one remains, stubbornly, in the air of the room where it was heard first. There is a theory that the piano note does not end at all; it simply rejoins the silence from which it came. The whole of <em>12</em> is an argument for that theory.",
      marginalia:
        'Sakamoto once said the piano is the most resistant instrument to entropy — its tuning fights the weather of a room. <em>12</em> is what happens when you stop fighting.',
      author: 'S. Lee',
      date: '2026-04-09',
      readTime: '14 min · deliberate',
      featured: true,
      published: true
    },
    {
      id: '046', number: '046', category: 'On Building',
      title: 'Why founders should read Yoon Dong-ju before they read Paul Graham',
      titleHtml: 'Why founders should read <em>Yoon Dong-ju</em> before they read Paul Graham',
      dek: 'A startup is a small, public claim about what is worth making. Poetry teaches the same restraint — but earlier, and without the funding round to soften the question.',
      body: '', author: 'S. Lee',
      date: '2026-04-04', readTime: '11 min', featured: false, published: true, wide: true
    },
    {
      id: '045', number: '045', category: 'On Technology',
      title: 'The glass house of modern tech',
      titleHtml: 'The glass house of modern tech',
      dek: "Apple's campus is a ring of glass. So is the feeling of being surveilled by your own phone. A note on transparency as aesthetic and as alibi.",
      body: '', author: 'S. Lee',
      date: '2026-03-28', readTime: '9 min', featured: false, published: true
    },
    {
      id: '044', number: '044', category: 'On History',
      title: "Lee Jung-seop's stolen postcards",
      titleHtml: "Lee Jung-seop's stolen <em>postcards</em>",
      dek: 'He painted bulls, children, fish, and love letters on tin foil. What survived the war was not the paintings themselves, but the tenderness they carried between islands.',
      body: '', author: 'S. Lee',
      date: '2026-03-21', readTime: '13 min', featured: false, published: true
    },
    {
      id: '043', number: '043', category: 'On Making',
      title: 'A slower inbox',
      titleHtml: 'A slower <em>inbox</em>',
      dek: "Three small experiments in reducing the tempo of one's own work without lying about the urgency of anyone else's. Mostly successful.",
      body: '', author: 'S. Lee',
      date: '2026-03-14', readTime: '6 min', featured: false, published: true
    },
    {
      id: '042', number: '042', category: 'On Thought',
      title: 'Reading Yi O-young at three in the morning',
      titleHtml: 'Reading <em>Yi O-young</em> at three in the morning',
      dek: "On the Korean critic's lifelong project of teaching things to mean more than themselves — and why it reads, now, like the last generous theory of culture we have.",
      body: '', author: 'S. Lee',
      date: '2026-03-07', readTime: '15 min', featured: false, published: true
    },
    {
      id: '041', number: '041', category: 'On Business',
      title: 'Three companies that built cathedrals',
      titleHtml: 'Three companies that built <em>cathedrals</em>',
      dek: 'Patagonia, Shopify, and the quieter example of Leica. What happens when a company decides its time horizon is longer than its founders.',
      body: '', author: 'S. Lee',
      date: '2026-02-29', readTime: '12 min', featured: false, published: true
    },
    { id: '040', number: '040', category: 'On Memory',         title: 'The last bookshop in Shinjuku',                      titleHtml: 'The last bookshop in Shinjuku',                      dek: '', body: '', author: 'S. Lee', date: '2026-02-22', readTime: '10 min', featured: false, published: true },
    { id: '039', number: '039', category: 'On Aesthetics',     title: 'Pine and steel: on Japanese modernism',              titleHtml: 'Pine and steel: on Japanese modernism',              dek: '', body: '', author: 'S. Lee', date: '2026-02-15', readTime: '14 min', featured: false, published: true },
    { id: '038', number: '038', category: 'On Craft',          title: 'The morning rituals of dead writers',                titleHtml: 'The morning rituals of dead writers',                dek: '', body: '', author: 'S. Lee', date: '2026-02-08', readTime: '8 min',  featured: false, published: true },
    { id: '037', number: '037', category: 'On Technology',     title: 'A winter without algorithms',                        titleHtml: 'A winter without algorithms',                        dek: '', body: '', author: 'S. Lee', date: '2026-02-01', readTime: '9 min',  featured: false, published: true },
    { id: '036', number: '036', category: 'On Korean Thought', title: 'What Yi O-young saw in a single persimmon',          titleHtml: 'What Yi O-young saw in a single persimmon',          dek: '', body: '', author: 'S. Lee', date: '2026-01-25', readTime: '12 min', featured: false, published: true },
    { id: '035', number: '035', category: 'On Building',       title: 'Against the urgency startup',                        titleHtml: 'Against the urgency startup',                        dek: '', body: '', author: 'S. Lee', date: '2026-01-18', readTime: '11 min', featured: false, published: true },
    { id: '034', number: '034', category: 'On Art',            title: "Hammershøi's rooms, and what their quietness asks of us",  titleHtml: "Hammershøi's rooms, and what their quietness asks of us", dek: '', body: '', author: 'S. Lee', date: '2026-01-11', readTime: '9 min',  featured: false, published: true },
    { id: '033', number: '033', category: 'On History',        title: 'The Joseon scholars who wrote only to the future',   titleHtml: 'The Joseon scholars who wrote only to the future',   dek: '', body: '', author: 'S. Lee', date: '2026-01-04', readTime: '16 min', featured: false, published: true },
    { id: '032', number: '032', category: 'On Sound',          title: "Hosono's kitchen, and the grammar of a small record", titleHtml: "Hosono's kitchen, and the grammar of a small record", dek: '', body: '', author: 'S. Lee', date: '2025-12-28', readTime: '7 min',  featured: false, published: true }
  ];

  const DEFAULT_DATA = {
    settings: DEFAULT_SETTINGS,
    essays:   DEFAULT_ESSAYS
  };

  /* ── Core IO ──────────────────────────────────────────── */

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return clone(DEFAULT_DATA);
      const parsed = JSON.parse(raw);
      const settings = Object.assign({}, DEFAULT_SETTINGS, parsed.settings || {});
      // Defensive nested fallbacks so partial saves never leave required
      // subfields (like `epigraph.lines`) undefined.
      settings.masthead  = Object.assign({}, DEFAULT_SETTINGS.masthead,  settings.masthead  || {});
      settings.epigraph  = Object.assign({}, DEFAULT_SETTINGS.epigraph,  settings.epigraph  || {});
      settings.pullQuote = Object.assign({}, DEFAULT_SETTINGS.pullQuote, settings.pullQuote || {});
      if (!Array.isArray(settings.notes))      settings.notes      = DEFAULT_SETTINGS.notes.slice();
      if (!Array.isArray(settings.categories)) settings.categories = DEFAULT_SETTINGS.categories.slice();
      return {
        settings,
        essays: Array.isArray(parsed.essays) ? parsed.essays : DEFAULT_ESSAYS
      };
    } catch (e) {
      console.warn('[Unplugged] store load failed, using defaults:', e);
      return clone(DEFAULT_DATA);
    }
  }

  function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ── Settings ─────────────────────────────────────────── */

  function getSettings() {
    return loadData().settings;
  }

  function updateSettings(partial) {
    const data = loadData();
    // Merge nested objects against the CURRENT saved values before the
    // top-level replace, so callers can omit unrelated fields without
    // losing them.
    const merged = Object.assign({}, partial);
    if (partial.masthead)  merged.masthead  = Object.assign({}, data.settings.masthead,  partial.masthead);
    if (partial.epigraph)  merged.epigraph  = Object.assign({}, data.settings.epigraph,  partial.epigraph);
    if (partial.pullQuote) merged.pullQuote = Object.assign({}, data.settings.pullQuote, partial.pullQuote);
    data.settings = Object.assign({}, data.settings, merged);
    saveData(data);
    return data.settings;
  }

  function updateNotes(notes) {
    const data = loadData();
    data.settings.notes = notes;
    saveData(data);
    return data.settings.notes;
  }

  /* ── Categories ───────────────────────────────────────── */

  function getCategories() {
    return (loadData().settings.categories || []).slice();
  }

  function getCategory(id) {
    return getCategories().find(c => c.id === id) || null;
  }

  function getCategoryByName(name) {
    if (!name) return null;
    const needle = String(name).trim().toLowerCase();
    return getCategories().find(c => c.name.toLowerCase() === needle) || null;
  }

  function slugifyCategory(name) {
    return String(name || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 40)
      || ('cat-' + Date.now());
  }

  function saveCategory(cat) {
    const data = loadData();
    const list = (data.settings.categories || []).slice();
    const incoming = {
      id:    cat.id || slugifyCategory(cat.name),
      name:  String(cat.name || '').trim(),
      color: cat.color || '#6e6454'
    };
    if (!incoming.name) return null;

    const idx = list.findIndex(c => c.id === incoming.id);
    if (idx === -1) list.unshift(incoming);
    else list[idx] = incoming;

    data.settings.categories = list;
    saveData(data);
    return incoming;
  }

  function deleteCategory(id) {
    const data = loadData();
    data.settings.categories = (data.settings.categories || []).filter(c => c.id !== id);
    saveData(data);
  }

  function updateCategories(list) {
    const data = loadData();
    data.settings.categories = list;
    saveData(data);
  }

  function countCategoryUsage(categoryName) {
    if (!categoryName) return 0;
    const needle = String(categoryName).toLowerCase();
    return loadData().essays.filter(e =>
      (e.category || '').toLowerCase().split('·').map(s => s.trim()).includes(needle)
    ).length;
  }

  /* ── Image helper (resize + convert to data URL) ─────── */

  function readImageFile(file, opts) {
    opts = opts || {};
    const maxWidth = opts.maxWidth || 1600;
    const quality  = opts.quality  || 0.85;
    return new Promise((resolve, reject) => {
      if (!file || !/^image\//.test(file.type)) return reject(new Error('not an image'));
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('read failed'));
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error('decode failed'));
        img.onload  = () => {
          const scale = Math.min(1, maxWidth / img.width);
          const w = Math.round(img.width  * scale);
          const h = Math.round(img.height * scale);
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          try {
            const mime = /png|webp/i.test(file.type) ? 'image/jpeg' : 'image/jpeg';
            resolve(canvas.toDataURL(mime, quality));
          } catch (err) { reject(err); }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* ── Theme (day / evening) ─────────────────────────── */

  const THEME_META_DAY     = '#efe8d6';
  const THEME_META_EVENING = '#161412';

  function getStoredTheme() {
    const t = localStorage.getItem(THEME_KEY);
    return (t === 'light' || t === 'dark') ? t : null;
  }

  function setStoredTheme(t) {
    if (t === 'light' || t === 'dark') localStorage.setItem(THEME_KEY, t);
    else localStorage.removeItem(THEME_KEY);
  }

  function systemTheme() {
    return (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }

  function resolvedTheme() {
    return getStoredTheme() || systemTheme();
  }

  function applyTheme(t) {
    if (t !== 'light' && t !== 'dark') t = resolvedTheme();
    document.documentElement.setAttribute('data-theme', t);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? THEME_META_EVENING : THEME_META_DAY);
    return t;
  }

  function toggleTheme() {
    const next = resolvedTheme() === 'dark' ? 'light' : 'dark';
    setStoredTheme(next);
    applyTheme(next);
    return next;
  }

  /** Wire one or more toggle buttons so they flip between day / evening.
   *  Accepts a CSS selector string, an array of elements, or a single element.
   */
  function initThemeToggle(selector) {
    let buttons;
    if (typeof selector === 'string') buttons = Array.from(document.querySelectorAll(selector));
    else if (Array.isArray(selector)) buttons = selector.filter(Boolean);
    else if (selector) buttons = [selector];
    else buttons = [];
    if (!buttons.length) return;

    const updateAll = () => {
      const cur = resolvedTheme();
      buttons.forEach(btn => {
        btn.setAttribute('aria-pressed', cur === 'dark' ? 'true' : 'false');
        btn.setAttribute('aria-label', cur === 'dark' ? 'Switch to morning' : 'Switch to evening');
        const dayGlyph = btn.querySelector('.glyph-day');
        const evGlyph  = btn.querySelector('.glyph-evening');
        if (dayGlyph && evGlyph) {
          dayGlyph.style.opacity = cur === 'dark' ? '0' : '1';
          evGlyph.style.opacity  = cur === 'dark' ? '1' : '0';
        }
        const lbl = btn.querySelector('.theme-label');
        if (lbl) lbl.textContent = cur === 'dark' ? 'morning edition' : 'evening edition';
      });
    };

    buttons.forEach(btn => {
      btn.addEventListener('click', () => { toggleTheme(); updateAll(); });
    });

    // Follow system if user hasn't picked explicitly
    if (window.matchMedia) {
      const mql = matchMedia('(prefers-color-scheme: dark)');
      const handler = () => { if (!getStoredTheme()) { applyTheme(); updateAll(); } };
      if (mql.addEventListener) mql.addEventListener('change', handler);
      else if (mql.addListener) mql.addListener(handler);
    }

    updateAll();
  }

  function storageUsage() {
    try {
      let bytes = 0;
      for (let k in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, k)) {
          bytes += (localStorage[k].length + k.length) * 2;
        }
      }
      return {
        bytes,
        kb: Math.round(bytes / 1024),
        mb: (bytes / 1024 / 1024).toFixed(2),
        // rough approximation; most browsers allow ~5MB
        percent: Math.min(100, Math.round((bytes / (5 * 1024 * 1024)) * 100))
      };
    } catch (e) {
      return { bytes: 0, kb: 0, mb: '0.00', percent: 0 };
    }
  }

  /* ── Essays ───────────────────────────────────────────── */

  function getEssays() {
    return loadData().essays
      .slice()
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }

  function getPublishedEssays() {
    return getEssays().filter(e => e.published);
  }

  function getFeatured() {
    return getPublishedEssays().find(e => e.featured) || getPublishedEssays()[0] || null;
  }

  function getRecent(limit) {
    const feat = getFeatured();
    const list = getPublishedEssays().filter(e => !feat || e.id !== feat.id);
    return typeof limit === 'number' ? list.slice(0, limit) : list;
  }

  function getArchive(offset) {
    const list = getPublishedEssays();
    return list.slice(offset || 0);
  }

  function getEssay(id) {
    return loadData().essays.find(e => e.id === id) || null;
  }

  function saveEssay(essay) {
    const data = loadData();
    const idx = data.essays.findIndex(e => e.id === essay.id);

    // If this one is being made featured, un-feature all others.
    if (essay.featured) {
      data.essays.forEach(e => { if (e.id !== essay.id) e.featured = false; });
    }

    if (idx === -1) data.essays.unshift(essay);
    else data.essays[idx] = essay;

    saveData(data);
    return essay;
  }

  function deleteEssay(id) {
    const data = loadData();
    data.essays = data.essays.filter(e => e.id !== id);
    saveData(data);
  }

  function nextEssayNumber() {
    const nums = loadData().essays.map(e => parseInt(e.number, 10)).filter(n => !isNaN(n));
    const max = nums.length ? Math.max.apply(null, nums) : 0;
    return String(max + 1).padStart(3, '0');
  }

  function newEssayTemplate() {
    const n = nextEssayNumber();
    return {
      id: n,
      number: n,
      category: 'On Thought',
      title: 'Untitled',
      titleHtml: 'Untitled',
      dek: '',
      body: '',
      marginalia: '',
      author: 'S. Lee',
      date: new Date().toISOString().slice(0, 10),
      readTime: '— min',
      featured: false,
      published: false,
      image: '',
      imageAlt: '',
      imageCaption: '',
      layout: 'standard',
      featuredLayout: 'editorial'
    };
  }

  function resetAll() {
    localStorage.removeItem(STORAGE_KEY);
  }

  /* ── Auth (local, client-only) ────────────────────────── */

  function hashPassword(pw) {
    // intentionally simple: this is a personal, client-local admin gate
    return btoa(unescape(encodeURIComponent('unplugged·' + pw + '·salt')));
  }

  function setPassword(pw) {
    if (!pw || pw.length < 4) return false;
    localStorage.setItem(PASSWORD_KEY, hashPassword(pw));
    sessionStorage.setItem(SESSION_KEY, '1');
    return true;
  }

  function hasPassword() {
    return !!localStorage.getItem(PASSWORD_KEY);
  }

  function checkPassword(pw) {
    return localStorage.getItem(PASSWORD_KEY) === hashPassword(pw);
  }

  function login(pw) {
    if (checkPassword(pw)) {
      sessionStorage.setItem(SESSION_KEY, '1');
      return true;
    }
    return false;
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  function isLoggedIn() {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  }

  /* ── Utilities ────────────────────────────────────────── */

  /** Convert a Spotify URI or URL to the public embed URL. */
  function spotifyUriToEmbed(input) {
    if (!input) return null;
    const s = String(input).trim();
    if (!s) return null;

    let type = null, id = null;

    const uriMatch = s.match(/^spotify:(track|album|playlist|episode|show):([A-Za-z0-9]+)/);
    if (uriMatch) { type = uriMatch[1]; id = uriMatch[2]; }

    if (!type) {
      const urlMatch = s.match(/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(track|album|playlist|episode|show)\/([A-Za-z0-9]+)/);
      if (urlMatch) { type = urlMatch[1]; id = urlMatch[2]; }
    }

    if (!type || !id) return null;
    return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
  }

  /** Format ISO date (2026-04-09) as "09 Apr 2026". */
  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return iso;
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const dd = String(d.getDate()).padStart(2, '0');
    return `${dd} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  function formatDateLong(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return iso;
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  /* ── Visitor ID (anonymous, per-browser) ──────────────── */

  function getVisitorId() {
    let v = localStorage.getItem(VID_KEY);
    if (!v || v.length < 6) {
      const rand = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : (Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
      v = rand.replace(/[^A-Za-z0-9._-]/g, '').slice(0, 64);
      localStorage.setItem(VID_KEY, v);
    }
    return v;
  }

  /* ── Admin token (moderation) ─────────────────────────── */

  function getAdminToken() {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY) || '';
  }
  function setAdminToken(t) {
    if (t) sessionStorage.setItem(ADMIN_TOKEN_KEY, t);
    else sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  }

  /* ── API ─────────────────────────────────────────────── */

  async function apiJson(url, opts = {}) {
    const init = Object.assign({ headers: { 'content-type': 'application/json' } }, opts);
    if (init.body && typeof init.body !== 'string') init.body = JSON.stringify(init.body);
    const r = await fetch(url, init);
    let data = null;
    try { data = await r.json(); } catch { /* may be empty */ }
    if (!r.ok) {
      const err = new Error((data && data.error) || `HTTP ${r.status}`);
      err.status = r.status;
      err.data = data;
      throw err;
    }
    return data || {};
  }

  const api = {
    likes: {
      get: (ids) => {
        const list = Array.isArray(ids) ? ids : [ids];
        const q = new URLSearchParams({ ids: list.join(','), vid: getVisitorId() });
        return apiJson(`/api/likes?${q.toString()}`);
      },
      toggle: (id) =>
        apiJson(`/api/likes?id=${encodeURIComponent(id)}`, {
          method: 'POST',
          body: { vid: getVisitorId() },
        }),
    },
    comments: {
      list: (id) =>
        apiJson(`/api/comments?id=${encodeURIComponent(id)}`),
      post: (id, { name, body }) =>
        apiJson(`/api/comments?id=${encodeURIComponent(id)}`, {
          method: 'POST',
          body: { name, body },
        }),
    },
    admin: {
      listComments: () =>
        apiJson('/api/admin/comments', {
          headers: { 'content-type': 'application/json', authorization: `Bearer ${getAdminToken()}` },
        }),
      deleteComment: (cid) =>
        apiJson(`/api/admin/comments?id=${encodeURIComponent(cid)}`, {
          method: 'DELETE',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${getAdminToken()}` },
        }),
      toggleHide: (cid, hidden) =>
        apiJson(`/api/admin/comments?id=${encodeURIComponent(cid)}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${getAdminToken()}` },
          body: { hidden: !!hidden },
        }),
    },
  };

  /* ── Export ───────────────────────────────────────────── */

  global.UnpluggedStore = {
    // data
    loadData, saveData, resetAll,
    // settings
    getSettings, updateSettings, updateNotes,
    // essays
    getEssays, getPublishedEssays, getFeatured, getRecent, getArchive,
    getEssay, saveEssay, deleteEssay, nextEssayNumber, newEssayTemplate,
    // categories
    getCategories, getCategory, getCategoryByName,
    saveCategory, deleteCategory, updateCategories, countCategoryUsage,
    slugifyCategory,
    // images
    readImageFile, storageUsage,
    // theme
    getStoredTheme, setStoredTheme, resolvedTheme, applyTheme, toggleTheme, initThemeToggle,
    // community
    getVisitorId, getAdminToken, setAdminToken, api,
    // auth
    hasPassword, setPassword, checkPassword, login, logout, isLoggedIn,
    // utils
    spotifyUriToEmbed, formatDate, formatDateLong
  };

})(window);
