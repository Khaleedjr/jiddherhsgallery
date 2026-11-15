/** Where the visitor's light/dark choice is kept in their browser. */
export const THEME_STORAGE_KEY = "jg-theme";

/** Runs in <head> before the page paints, so a light-mode visitor never sees a flash of the black look. */
export const themeBootScript = `try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="light")document.documentElement.dataset.theme="light"}catch(e){}`;
