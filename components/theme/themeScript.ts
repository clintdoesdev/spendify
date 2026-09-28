/**
 * Runs before first paint (inlined in <head>): applies the saved or system theme so there's
 * no light/dark flash, and marks the document as JS-enabled so scroll reveals can start hidden.
 */
export const THEME_STORAGE_KEY = "spendify-theme";

export const themeScript = `(function(){var d=document.documentElement;d.classList.add('js');try{var t=localStorage.getItem('${THEME_STORAGE_KEY}')||'system';var dark=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);d.dataset.theme=dark?'dark':'light';}catch(e){d.dataset.theme='light';}})();`;
