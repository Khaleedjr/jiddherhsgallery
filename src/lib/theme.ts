/** Where the visitor's light/dark choice is kept in their browser. */
export const THEME_STORAGE_KEY = "jg-theme";

/** Light mode is the default; the server renders <html data-theme="light">. */
export const DEFAULT_THEME = "light";

/** Runs in <head> before the page paints, so a visitor who chose dark mode never sees a flash of the light look. */
export const themeBootScript = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`;
