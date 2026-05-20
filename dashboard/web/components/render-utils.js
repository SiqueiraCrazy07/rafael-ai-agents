export function qs(selector) {
  return document.querySelector(selector);
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function emptyState(message) {
  return `<div class="empty">${escapeHtml(message)}</div>`;
}

export function badge(text, tone = '') {
  return `<span class="badge ${tone}">${escapeHtml(text)}</span>`;
}

export function numberValue(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '0';
  }
  return String(value);
}

export function percent(value) {
  const normalized = Math.max(0, Math.min(100, Math.round(Number(value || 0) * 100)));
  return `${normalized}%`;
}
