type Meta = Record<string, unknown>;
const write = (level: string, meta: Meta | string, msg?: string) => {
  const line = typeof meta === 'string' ? meta : msg;
  const payload = { level, msg: line, ...(typeof meta === 'object' ? meta : {}) };
  if (level === 'error' || level === 'warn') console.error(JSON.stringify(payload));
  else console.log(JSON.stringify(payload));
};
export const logger = {
  info: (m: Meta | string, msg?: string) => write('info', m, msg),
  warn: (m: Meta | string, msg?: string) => write('warn', m, msg),
  error: (m: Meta | string, msg?: string) => write('error', m, msg),
  debug: (m: Meta | string, msg?: string) => write('debug', m, msg),
};
