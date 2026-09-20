// ===== Créateur de combo (bêta) =====
// Base de données de sorts par classe (liste partielle pour l'instant),
// interface de composition d'un combo + bonus + rabam, et partage via URL
// (l'état complet est encodé dans le lien, pas besoin de serveur/compte).

(function () {
  const CLASS_DATA = {
    guardian: {
      label: { fr: 'Gardienne', en: 'Guardian' },
      theme: 'guardian',
      skills: [
        { id: 'cleansing-flame', name: 'Cleansing Flame', icon: 'assets/guardian/icones/hotbar-cleasing-flame.png' },
        { id: 'fireborne-rupture', name: 'Fireborne Rupture', icon: 'assets/guardian/icones/hotbar-fireborne-rupture.png' },
        { id: 'flow-to-ashes', name: 'Flow: To Ashes', icon: 'assets/guardian/icones/hotbar-flow-to-ashes.png' },
        { id: 'god-incinerator', name: 'God Incinerator', icon: 'assets/guardian/icones/hotbar-god-incinerator.png' },
        { id: 'mountains-echo', name: "Mountain's Echo", icon: 'assets/guardian/icones/hotbar-mountains-echo.png' },
        { id: 'dragons-maw', name: "Dragon's Maw", icon: 'assets/guardian/icones/addon-dragonsmaw.png' },
        { id: 'glorious-advance', name: 'Glorious Advance', icon: 'assets/guardian/icones/addon-gloriousadvance.png' },
      ],
      addons: [
        { id: 'addon-cleansingflame', name: 'Cleansing Flame', icon: 'assets/guardian/icones/addon-cleansingflame.png' },
        { id: 'addon-dragonsmaw', name: "Dragon's Maw", icon: 'assets/guardian/icones/addon-dragonsmaw.png' },
        { id: 'addon-firebornerupture', name: 'Fireborne Rupture', icon: 'assets/guardian/icones/addon-firebornerupture.png' },
        { id: 'addon-flowtoashes', name: 'Flow: To Ashes', icon: 'assets/guardian/icones/addon-flowtoashes.png' },
        { id: 'addon-gloriousadvance', name: 'Glorious Advance', icon: 'assets/guardian/icones/addon-gloriousadvance.png' },
        { id: 'addon-godincinerator', name: 'God Incinerator', icon: 'assets/guardian/icones/addon-godincinerator.png' },
      ],
      rabam: [
        { id: 'rabam-fireborne-rupture', name: 'Fireborne Rupture', icon: 'assets/guardian/icones/hotbar-fireborne-rupture.png' },
        { id: 'rabam-god-incinerator', name: 'God Incinerator', icon: 'assets/guardian/icones/hotbar-god-incinerator.png' },
        { id: 'rabam-mountains-echo', name: "Mountain's Echo", icon: 'assets/guardian/icones/hotbar-mountains-echo.png' },
      ],
    },
    maehwa: {
      label: { fr: 'Maehwa', en: 'Maehwa' },
      theme: 'succ',
      skills: [
        { id: 'carver', name: 'Carver I', icon: 'assets/maehwa/icones/addon-succ-carver.png' },
        { id: 'divider', name: 'Whirlwind Cut I', icon: 'assets/maehwa/icones/addon-succ-divider.png' },
        { id: 'blooming', name: 'Blooming', icon: 'assets/maehwa/icones/addon-succ-blooming.png' },
        { id: 'blindthrust', name: 'Blind Thrust I', icon: 'assets/maehwa/icones/addon-succ-blindthrust.png' },
        { id: 'chaosredmoon', name: 'Chaos: Red Moon I', icon: 'assets/maehwa/icones/addon-succ-chaosredmoon.png' },
        { id: 'decapitation', name: 'Maehwa: Decapitation I', icon: 'assets/maehwa/icones/addon-succ-decapitation.png' },
      ],
      addons: [
        { id: 'addon-succ-carver', name: 'Carver I', icon: 'assets/maehwa/icones/addon-succ-carver.png' },
        { id: 'addon-succ-divider', name: 'Whirlwind Cut I', icon: 'assets/maehwa/icones/addon-succ-divider.png' },
        { id: 'addon-succ-blooming', name: 'Blooming', icon: 'assets/maehwa/icones/addon-succ-blooming.png' },
        { id: 'addon-succ-blindthrust', name: 'Blind Thrust I', icon: 'assets/maehwa/icones/addon-succ-blindthrust.png' },
        { id: 'addon-succ-chaosredmoon', name: 'Chaos: Red Moon I', icon: 'assets/maehwa/icones/addon-succ-chaosredmoon.png' },
        { id: 'addon-succ-decapitation', name: 'Maehwa: Decapitation I', icon: 'assets/maehwa/icones/addon-succ-decapitation.png' },
      ],
      rabam: [
        { id: 'rabam-succ-crimsongust', name: 'Chaos: Crimson Gust', icon: 'assets/maehwa/icones/rabam-succ-crimsongust.png' },
        { id: 'rabam-succ-bloomingstep', name: 'Blooming Step', icon: 'assets/maehwa/icones/rabam-succ-bloomingstep.png' },
        { id: 'rabam-succ-decapitatingdragon', name: 'Decapitating Dragon', icon: 'assets/maehwa/icones/rabam-succ-decapitatingdragon.png' },
      ],
    },
  };

  const CLASS_IDS = Object.keys(CLASS_DATA);
  const STORAGE_KEY = 'bdo-builder-state';

  const els = {
    classSelect: document.getElementById('builder-class-select'),
    palette: document.getElementById('builder-palette'),
    sequence: document.getElementById('builder-sequence'),
    emptyMsg: document.getElementById('builder-empty-msg'),
    addons: document.getElementById('builder-addons'),
    rabam: document.getElementById('builder-rabam'),
    clearBtn: document.getElementById('builder-clear'),
    shareBtn: document.getElementById('builder-share'),
  };

  if (!els.classSelect) return; // pas sur la page builder

  let state = { classId: 'guardian', steps: [], addons: [], rabam: [] };

  function encodeState(s) {
    try {
      return btoa(encodeURIComponent(JSON.stringify(s)));
    } catch (err) {
      return '';
    }
  }

  function decodeState(str) {
    try {
      return JSON.parse(decodeURIComponent(atob(str)));
    } catch (err) {
      return null;
    }
  }

  function loadInitialState() {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('s');
    if (fromUrl) {
      const decoded = decodeState(fromUrl);
      if (decoded && CLASS_DATA[decoded.classId]) return decoded;
    }
    try {
      const fromStorage = localStorage.getItem(STORAGE_KEY);
      if (fromStorage) {
        const decoded = JSON.parse(fromStorage);
        if (decoded && CLASS_DATA[decoded.classId]) return decoded;
      }
    } catch (err) { /* ignore */ }
    return { classId: 'guardian', steps: [], addons: [], rabam: [] };
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) { /* ignore */ }
  }

  function currentClass() {
    return CLASS_DATA[state.classId];
  }

  function skillById(id) {
    return currentClass().skills.find((sk) => sk.id === id);
  }

  function renderClassSelect() {
    els.classSelect.innerHTML = '';
    CLASS_IDS.forEach((id) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.class = id;
      btn.textContent = CLASS_DATA[id].label.fr;
      btn.dataset.i18nFr = CLASS_DATA[id].label.fr;
      btn.dataset.i18nEn = CLASS_DATA[id].label.en;
      if (id === state.classId) btn.classList.add('is-active');
      btn.addEventListener('click', () => {
        if (state.classId === id) return;
        state = { classId: id, steps: [], addons: [], rabam: [] };
        persist();
        renderAll();
      });
      els.classSelect.appendChild(btn);
    });
  }

  function renderPalette() {
    els.palette.innerHTML = '';
    currentClass().skills.forEach((sk) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'builder-skill-btn';
      btn.innerHTML = `<span class="combo-icon"><img src="${sk.icon}" alt="${sk.name}" loading="lazy"></span><span>${sk.name}</span>`;
      btn.addEventListener('click', () => {
        state.steps.push({ skillId: sk.id, key: '' });
        persist();
        renderSequence();
      });
      els.palette.appendChild(btn);
    });
  }

  function renderSequence() {
    els.sequence.innerHTML = '';
    els.emptyMsg.hidden = state.steps.length !== 0;
    const theme = currentClass().theme || 'base';

    state.steps.forEach((step, idx) => {
      const sk = skillById(step.skillId);
      if (!sk) return;

      const wrap = document.createElement('div');
      wrap.className = `combo-step ${theme} builder-step`;

      const iconHtml = `<span class="combo-icon"><img src="${sk.icon}" alt="${sk.name}" loading="lazy"></span>`;
      const keyInput = document.createElement('input');
      keyInput.type = 'text';
      keyInput.className = 'builder-key-input';
      keyInput.placeholder = 'Touche';
      keyInput.value = step.key || '';
      keyInput.addEventListener('input', () => {
        state.steps[idx].key = keyInput.value;
        persist();
      });

      wrap.innerHTML = `
        <div class="builder-step-controls">
          <button type="button" class="builder-mini-btn" data-act="up" aria-label="Monter">&uarr;</button>
          <button type="button" class="builder-mini-btn" data-act="down" aria-label="Descendre">&darr;</button>
          <button type="button" class="builder-mini-btn builder-mini-remove" data-act="remove" aria-label="Retirer">&times;</button>
        </div>
        ${iconHtml}
        <span class="combo-name">${sk.name}</span>
      `;
      wrap.querySelector('.combo-name').after(keyInput);

      wrap.querySelector('[data-act="up"]').addEventListener('click', () => {
        if (idx === 0) return;
        [state.steps[idx - 1], state.steps[idx]] = [state.steps[idx], state.steps[idx - 1]];
        persist();
        renderSequence();
      });
      wrap.querySelector('[data-act="down"]').addEventListener('click', () => {
        if (idx === state.steps.length - 1) return;
        [state.steps[idx + 1], state.steps[idx]] = [state.steps[idx], state.steps[idx + 1]];
        persist();
        renderSequence();
      });
      wrap.querySelector('[data-act="remove"]').addEventListener('click', () => {
        state.steps.splice(idx, 1);
        persist();
        renderSequence();
      });

      els.sequence.appendChild(wrap);

      if (idx < state.steps.length - 1) {
        const arrow = document.createElement('span');
        arrow.className = 'combo-arrow';
        arrow.textContent = '>';
        els.sequence.appendChild(arrow);
      }
    });
  }

  function renderAddons() {
    els.addons.innerHTML = '';
    currentClass().addons.forEach((a) => {
      const card = document.createElement('div');
      card.className = 'addon-card builder-toggle-card';
      if (state.addons.includes(a.id)) card.classList.add('is-selected');
      card.innerHTML = `<span class="combo-icon"><img src="${a.icon}" alt="${a.name}" loading="lazy"></span><h4>${a.name}</h4>`;
      card.addEventListener('click', () => {
        const i = state.addons.indexOf(a.id);
        if (i === -1) state.addons.push(a.id);
        else state.addons.splice(i, 1);
        persist();
        card.classList.toggle('is-selected');
      });
      els.addons.appendChild(card);
    });
  }

  function renderRabam() {
    els.rabam.innerHTML = '';
    currentClass().rabam.forEach((r) => {
      const pick = document.createElement('div');
      pick.className = 'rabam-pick builder-toggle-card';
      if (state.rabam.includes(r.id)) pick.classList.add('is-selected');
      pick.innerHTML = `<span class="combo-icon"><img src="${r.icon}" alt="${r.name}" loading="lazy"></span><div><span class="combo-name">${r.name}</span></div>`;
      pick.addEventListener('click', () => {
        const i = state.rabam.indexOf(r.id);
        if (i === -1) state.rabam.push(r.id);
        else state.rabam.splice(i, 1);
        persist();
        pick.classList.toggle('is-selected');
      });
      els.rabam.appendChild(pick);
    });
  }

  function renderAll() {
    renderClassSelect();
    renderPalette();
    renderSequence();
    renderAddons();
    renderRabam();
  }

  els.clearBtn.addEventListener('click', () => {
    state.steps = [];
    persist();
    renderSequence();
  });

  const shareBtnOriginalHtml = els.shareBtn.innerHTML;

  els.shareBtn.addEventListener('click', async () => {
    const encoded = encodeState(state);
    const url = `${window.location.origin}${window.location.pathname}?s=${encoded}`;
    try {
      await navigator.clipboard.writeText(url);
      const lang = document.documentElement.getAttribute('data-lang') || 'fr';
      els.shareBtn.textContent = lang === 'en' ? 'Copied!' : 'Copié !';
      els.shareBtn.classList.add('is-copied');
    } catch (err) {
      window.prompt('Copie ce lien :', url);
    }
    setTimeout(() => {
      els.shareBtn.innerHTML = shareBtnOriginalHtml;
      els.shareBtn.classList.remove('is-copied');
    }, 1800);
    // met aussi à jour l'URL affichée, pour que rafraîchir la page garde l'état
    window.history.replaceState(null, '', `?s=${encoded}`);
  });

  state = loadInitialState();
  renderAll();
})();
