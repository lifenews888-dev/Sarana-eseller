/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
export const sent: Array<{ userId: string; title: string; body: string }> = [];
export async function notifyUser(userId: string, p: { title: string; body: string }) { sent.push({ userId, title: p.title, body: p.body }); }
