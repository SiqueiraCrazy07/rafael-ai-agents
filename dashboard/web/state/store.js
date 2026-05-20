const listeners = new Set();

const state = {
  loading: true,
  error: null,
  data: null,
  config: {
    apiBase: '/api/v1',
    apiKey: ''
  }
};

export function getState() {
  return state;
}

export function setState(patch) {
  Object.assign(state, patch);
  for (const listener of listeners) {
    listener(state);
  }
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function loadConfigFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const storedBase = window.localStorage.getItem('dashboard.apiBase');
  const storedKey = window.localStorage.getItem('dashboard.apiKey');
  const apiBase = params.get('apiBase') || storedBase || '/api/v1';
  const apiKey = params.get('apiKey') || storedKey || '';

  state.config = {
    apiBase,
    apiKey
  };

  return state.config;
}

export function persistConfig(config) {
  window.localStorage.setItem('dashboard.apiBase', config.apiBase || '/api/v1');
  if (config.apiKey) {
    window.localStorage.setItem('dashboard.apiKey', config.apiKey);
  }
  state.config = config;
}
