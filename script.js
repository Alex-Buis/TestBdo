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