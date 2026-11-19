import { env } from '../env';

/** Send a Telegram message as the support bot (@safwantigershopsupportbot). */
export async function supportBotSend(chatId: number | string, text: string): Promise<void> {
  const token = process.env.SUPPORT_BOT_TOKEN;
  if (!token) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch {
    // fire-and-forget: chat still lands in support_messages
  }
}

export function adminChatId(): number {
  // SUPPORT_ADMIN_CHAT_ID wins — lets you route to a different chat/group.
  return Number(process.env.SUPPORT_ADMIN_CHAT_ID ?? env.ADMIN_USER_ID);
}
