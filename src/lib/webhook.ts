
interface WebhookPayload<T = unknown> {
  event: string;
  data: T;
  timestamp: string;
}

export async function sendWebhook<T = Record<string, unknown>>(
  event: string, 
  data: T
): Promise<void> {
  const webhookUrl = process.env.WEBHOOK_URL;
  if (!webhookUrl) return; // silently skip if not set

  const payload: WebhookPayload<T> = {
    event,
    data,
    timestamp: new Date().toISOString(),
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to send webhook:', error);
    // Consider adding error logging or retry logic here
  }
}
  