type Fn = (obj: unknown, msg?: string) => void;
const mk = (lvl: 'info' | 'warn' | 'error' | 'debug'): Fn => (obj, msg) => {
  if (lvl === 'debug') return;
  const line = typeof obj === 'string' ? obj : msg ?? '';
  (console[lvl] ?? console.log)(`[${lvl}] ${line}`, typeof obj === 'string' ? '' : obj);
};
export const logger = { info: mk('info'), warn: mk('warn'), error: mk('error'), debug: mk('debug') };
