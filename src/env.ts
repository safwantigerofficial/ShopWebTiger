// Server-side env shim mirroring the bot's env names. Web-only: no bot token by default.
export const env = {
  SUPABASE_URL: process.env.SUPABASE_URL!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  ADMIN_USER_ID: Number(process.env.ADMIN_USER_ID ?? '0'),
  TELEGRAM_LOGIN_BOT_TOKEN: process.env.TELEGRAM_LOGIN_BOT_TOKEN ?? '',
  TELEGRAM_LOGIN_BOT_USERNAME: process.env.TELEGRAM_LOGIN_BOT_USERNAME ?? '',
  MAIN_BOT_USERNAME: process.env.MAIN_BOT_USERNAME ?? '',
  CRYPTOBOT_API_TOKEN: process.env.CRYPTOBOT_API_TOKEN ?? '',
  CRYPTOBOT_API_BASE_URL: process.env.CRYPTOBOT_API_BASE_URL ?? 'https://pay.crypt.bot',
  TUNVN_API_KEY: process.env.TUNVN_API_KEY ?? '',
  TUNVN_BASE_URL: process.env.TUNVN_BASE_URL ?? '',
  SESSION_SECRET: process.env.SESSION_SECRET ?? '',
  SITE_URL: process.env.SITE_URL ?? '',
};
