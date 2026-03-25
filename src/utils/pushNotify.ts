/** Dispara push notification via Netlify Function (fire-and-forget). */
export function pushNotify(toUserId: string, title: string, body: string) {
  fetch('/.netlify/functions/send-notification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toUserId, title, body }),
  }).catch(() => {});
}
