
export async function sendWebhook(event: string, data: any) {
    const webhookUrl = process.env.WEBHOOK_URL;
    if (!webhookUrl) return; // silently skip if not set
  
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event,
          data,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error("Failed to send webhook:", error);
    }
  }
  