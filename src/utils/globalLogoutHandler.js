let logoutFunction = null;
let lastLogoutTrigger = 0;
const LOGOUT_DEBOUNCE_MS = 2000; // Prevent redundant logouts within 2 seconds

export const setLogoutFunction = (fn) => {
  logoutFunction = fn;
};

export const triggerGlobalLogout = () => {
  const now = Date.now();
  if (now - lastLogoutTrigger < LOGOUT_DEBOUNCE_MS) {
    // console.log('DEBUG: triggerGlobalLogout ignored (debounced)');
    return;
  }

  if (logoutFunction) {
    // console.log('DEBUG: triggerGlobalLogout executing...');
    lastLogoutTrigger = now;
    logoutFunction();
  } else {
    console.warn('DEBUG: triggerGlobalLogout called but no function set');
  }
};
