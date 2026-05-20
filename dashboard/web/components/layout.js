import { qs } from './render-utils.js';

export function setupNavigation() {
  const links = [...document.querySelectorAll('[data-view-link]')];
  const views = [...document.querySelectorAll('[data-view]')];

  function activate(viewName) {
    links.forEach((link) => link.classList.toggle('active', link.dataset.viewLink === viewName));
    views.forEach((view) => view.classList.toggle('active', view.dataset.view === viewName));
  }

  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const viewName = link.dataset.viewLink;
      window.location.hash = viewName;
      activate(viewName);
    });
  });

  activate((window.location.hash || '#summary').replace('#', '') || 'summary');
}

export function setBanner(state, message) {
  const banner = qs('#system-banner');
  banner.dataset.state = state;
  banner.textContent = message;
}
