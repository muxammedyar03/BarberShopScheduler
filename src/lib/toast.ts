let toastCallback: ((msg: string, type?: 'success' | 'error' | 'info') => void) | null = null;

export function registerToast(cb: (msg: string, type?: 'success' | 'error' | 'info') => void) {
  toastCallback = cb;
}

export function showToast(msg: string, type: 'success' | 'error' | 'info' = 'success') {
  if (toastCallback) toastCallback(msg, type);
  else console.log(`Toast [${type}]: ${msg}`);
}
