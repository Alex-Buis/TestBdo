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

// Recherche de classe sur le hub d'accueil : filtre les cartes par nom en direct.
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('class-search-input');
  const grid = document.getElementById('class-grid');
  if (!searchInput || !grid) return;

  const cards = Array.from(grid.querySelectorAll('.hub-card'));
  const emptyMessage = document.getElementById('class-search-empty');

  // Retire les accents pour que "eveil" trouve aussi "Éveil", etc.
  const normalize = (str) => str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  searchInput.addEventListener('input', () => {
    const query = normalize(searchInput.value.trim());
    let visibleCount = 0;

    cards.forEach((card) => {
      const name = card.querySelector('h3')?.textContent || '';
      const matches = normalize(name).includes(query);
      card.classList.toggle('is-hidden', !matches);
      if (matches) visibleCount += 1;
    });

    if (emptyMessage) {
      emptyMessage.hidden = visibleCount !== 0;
    }
  });
});

// Bouton "Copier la séquence" : reconstruit la liste touche > touche > ... du combo
// et la copie dans le presse-papier.
document.querySelectorAll('.copy-btn').forEach((btn) => {
  const defaultLabel = btn.textContent;

  btn.addEventListener('click', async () => {
    const block = btn.closest('.combo-block');
    if (!block) return;

    const keys = Array.from(block.querySelectorAll('.combo-key')).map((el) => el.textContent.trim());
    const sequence = keys.join(' > ');

    try {
      await navigator.clipboard.writeText(sequence);
      btn.textContent = 'Copié !';
      btn.classList.add('is-copied');
    } catch (err) {
      btn.textContent = 'Échec de la copie';
    }

    setTimeout(() => {
      btn.textContent = defaultLabel;
      btn.classList.remove('is-copied');
    }, 1800);
  });
});