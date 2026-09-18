// Gestion générique des groupes d'onglets.
// Chaque groupe d'onglets : boutons [data-tab-target] dans un conteneur [data-tab-group],
// et panneaux correspondants [data-tab-panel] portant le même id que la target.
document.querySelectorAll('[data-tab-group]').forEach((group) => {
  const buttons = group.querySelectorAll('.tab-btn');
  const targetIds = Array.from(buttons).map((b) => b.getAttribute('data-tab-target'));

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab-target');
      const panelScope = document.querySelector(group.getAttribute('data-panel-scope') || 'body');

      buttons.forEach((b) => b.setAttribute('aria-selected', 'false'));
      btn.setAttribute('aria-selected', 'true');

      // On ne touche qu'aux panneaux qui appartiennent à CE groupe d'onglets,
      // pour ne pas écraser l'état des groupes imbriqués (ex: Base/Sacramentum/Purgatum
      // à l'intérieur du panneau PvE).
      panelScope.querySelectorAll('[data-tab-panel]').forEach((panel) => {
        if (!targetIds.includes(panel.id)) return;
        panel.classList.toggle('is-active', panel.id === targetId);
      });

      // Bascule le thème de fond de page (ange / démon) si le bouton le déclare.
      if (btn.dataset.formTheme) {
        document.body.dataset.formTheme = btn.dataset.formTheme;
      }
    });
  });
});

// Arrivée depuis un lien externe (ex: page d'accueil) avec #sacramentum ou #purgatum :
// on active directement le bon onglet de forme au chargement de la page Combos.
document.addEventListener('DOMContentLoaded', () => {
  const hashToForm = {
    '#sacramentum': 'form-sacra',
    '#purgatum': 'form-purga',
    '#succession': 'form-succ',
    '#eveil': 'form-eveil',
  };
  const targetForm = hashToForm[window.location.hash];
  if (!targetForm) return;

  const btn = document.querySelector(`.tab-btn[data-tab-target="${targetForm}"]`);
  if (!btn) return;

  btn.click();
});

// Recherche de classe sur le hub d'accueil : filtre les cartes par nom et par statut.
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('class-search-input');
  const grid = document.getElementById('class-grid');
  if (!searchInput || !grid) return;

  const cards = Array.from(grid.querySelectorAll('.hub-card'));
  const emptyMessage = document.getElementById('class-search-empty');
  const statusButtons = Array.from(document.querySelectorAll('.status-filter button'));
  let activeStatus = 'all';

  // Retire les accents pour que "eveil" trouve aussi "Éveil", etc.
  const normalize = (str) => str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  function refresh() {
    const query = normalize(searchInput.value.trim());
    let visibleCount = 0;

    cards.forEach((card) => {
      const name = card.querySelector('h3')?.textContent || '';
      const matchesSearch = normalize(name).includes(query);
      const matchesStatus = activeStatus === 'all' || card.dataset.status === activeStatus;
      const visible = matchesSearch && matchesStatus;
      card.classList.toggle('is-hidden', !visible);
      if (visible) visibleCount += 1;
    });

    if (emptyMessage) {
      emptyMessage.hidden = visibleCount !== 0;
    }
  }

  searchInput.addEventListener('input', refresh);

  statusButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      activeStatus = btn.dataset.statusFilter;
      statusButtons.forEach((b) => b.classList.toggle('is-active', b === btn));
      refresh();
    });
  });

  refresh();
});

// Bouton "Copier la séquence" : reconstruit la liste touche > touche > ... du combo
// et la copie dans le presse-papier. Libellés adaptés à la langue active.
const COPY_LABELS = {
  fr: { default: 'Copier la séquence', done: 'Copié !', fail: 'Échec de la copie' },
  en: { default: 'Copy sequence', done: 'Copied!', fail: 'Copy failed' },
};

// Libellés du bouton "Copier tout le combo" (copie tous les blocs visibles de la page).
const COPY_ALL_LABELS = {
  fr: { default: 'Copier tout le combo', done: 'Copié !', fail: 'Échec de la copie' },
  en: { default: 'Copy full combo', done: 'Copied!', fail: 'Copy failed' },
};

document.querySelectorAll('.copy-btn').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const block = btn.closest('.combo-block');
    if (!block) return;

    const keys = Array.from(block.querySelectorAll('.combo-key')).map((el) => el.textContent.trim());
    const sequence = keys.join(' > ');
    const lang = document.documentElement.getAttribute('data-lang') || 'fr';
    const labels = COPY_LABELS[lang] || COPY_LABELS.fr;

    try {
      await navigator.clipboard.writeText(sequence);
      btn.textContent = labels.done;
      btn.classList.add('is-copied');
    } catch (err) {
      btn.textContent = labels.fail;
    }

    setTimeout(() => {
      btn.textContent = labels.default;
      btn.classList.remove('is-copied');
    }, 1800);
  });
});

// ===== Bouton "Copier tout le combo" (copie tous les blocs combo VISIBLES de la page) =====
document.querySelectorAll('[data-copy-all]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const blocks = Array.from(document.querySelectorAll('.combo-block')).filter((b) => b.offsetParent !== null);
    const sequence = blocks
      .map((block) => Array.from(block.querySelectorAll('.combo-key')).map((el) => el.textContent.trim()).join(' > '))
      .filter(Boolean)
      .join('  |  ');
    const lang = document.documentElement.getAttribute('data-lang') || 'fr';
    const labels = COPY_ALL_LABELS[lang] || COPY_ALL_LABELS.fr;

    try {
      await navigator.clipboard.writeText(sequence);
      btn.textContent = labels.done;
      btn.classList.add('is-copied');
    } catch (err) {
      btn.textContent = labels.fail;
    }

    setTimeout(() => {
      btn.textContent = labels.default;
      btn.classList.remove('is-copied');
    }, 1800);
  });
});

// ===== Sélecteur de langue (FR/EN) =====
(function () {
  const STORAGE_KEY = 'bdo-lang';
  const savedLang = localStorage.getItem(STORAGE_KEY) || 'fr';

  function applyLang(lang) {
    document.documentElement.setAttribute('data-lang', lang);
    document.querySelectorAll('.lang-switch button').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.lang === lang);
    });
    // Traduit aussi les attributs placeholder / aria-label si présents.
    document.querySelectorAll('[data-i18n-placeholder-fr]').forEach((el) => {
      el.placeholder = lang === 'en'
        ? el.getAttribute('data-i18n-placeholder-en')
        : el.getAttribute('data-i18n-placeholder-fr');
    });
    document.querySelectorAll('[data-i18n-aria-fr]').forEach((el) => {
      el.setAttribute('aria-label', lang === 'en'
        ? el.getAttribute('data-i18n-aria-en')
        : el.getAttribute('data-i18n-aria-fr'));
    });
    // Remet à jour le libellé par défaut des boutons "copier" non actifs.
    const labels = COPY_LABELS[lang] || COPY_LABELS.fr;
    document.querySelectorAll('.copy-btn:not([data-copy-all]):not(.is-copied)').forEach((btn) => {
      btn.textContent = labels.default;
    });
    const allLabels = COPY_ALL_LABELS[lang] || COPY_ALL_LABELS.fr;
    document.querySelectorAll('[data-copy-all]:not(.is-copied)').forEach((btn) => {
      btn.textContent = allLabels.default;
    });
  }

  document.querySelectorAll('.lang-switch button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      localStorage.setItem(STORAGE_KEY, lang);
      applyLang(lang);
    });
  });

  applyLang(savedLang);
})();

// ===== Navigation rapide (boutons Combo / Add-ons / Rabam) =====
// Scrolle vers le premier bloc VISIBLE du type demandé (tient compte des onglets
// PvE/PvP et Succession/Éveil actifs, puisque les panneaux inactifs sont en display:none).
(function () {
  const selectorMap = {
    combo: '.combo-block',
    addons: '.addon-block',
    rabam: '.rabam-block',
  };

  document.querySelectorAll('[data-scroll-to]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const selector = selectorMap[btn.dataset.scrollTo];
      if (!selector) return;
      const target = Array.from(document.querySelectorAll(selector))
        .find((el) => el.offsetParent !== null);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();

// ===== Sélecteur de disposition clavier (QWERTY/AZERTY) =====
// Les touches affichées (.combo-key) sont mémorisées à leur valeur QWERTY d'origine
// puis remappées à la volée (Q<->A, W<->Z) en AZERTY, avec persistance du choix.
(function () {
  const STORAGE_KEY = 'bdo-keyboard';
  const TO_AZERTY = { Q: 'A', A: 'Q', W: 'Z', Z: 'W' };
  const keyEls = document.querySelectorAll('.combo-key');
  const switches = document.querySelectorAll('.kb-switch');
  if (!keyEls.length || !switches.length) return;

  keyEls.forEach((el) => {
    if (!el.dataset.qwerty) el.dataset.qwerty = el.textContent;
  });

  function toAzerty(text) {
    return text.replace(/\b[QAWZ]\b/g, (m) => TO_AZERTY[m] || m);
  }

  function applyKeyboard(layout) {
    keyEls.forEach((el) => {
      el.textContent = layout === 'azerty' ? toAzerty(el.dataset.qwerty) : el.dataset.qwerty;
    });
    document.querySelectorAll('.kb-switch button').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.kb === layout);
    });
  }

  document.querySelectorAll('.kb-switch button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const layout = btn.dataset.kb;
      localStorage.setItem(STORAGE_KEY, layout);
      applyKeyboard(layout);
    });
  });

  applyKeyboard(localStorage.getItem(STORAGE_KEY) || 'qwerty');
})();

// ===== Lazy-load des vidéos YouTube (facade) =====
// Affiche une miniature cliquable à la place de l'iframe YouTube : la vidéo (et
// tous les scripts qu'elle charge) n'est insérée dans la page qu'au clic, ce qui
// accélère nettement le chargement initial des pages avec vidéo.
document.querySelectorAll('.yt-facade').forEach((facade) => {
  const load = () => {
    const id = facade.dataset.ytId;
    const title = facade.dataset.ytTitle || 'Vidéo YouTube';
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;
    iframe.title = title;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    facade.replaceWith(iframe);
  };
  facade.addEventListener('click', load);
});

// ===== Protection basique des images (dissuasive, pas une vraie sécurité) =====
// Empêche le glisser-déposer et le menu clic-droit "Enregistrer l'image" sur les
// icônes/artworks du site. Ne touche pas à la sélection du texte des guides.
(function () {
  document.querySelectorAll('img').forEach((img) => {
    img.setAttribute('draggable', 'false');
    img.addEventListener('contextmenu', (e) => e.preventDefault());
  });
})();
