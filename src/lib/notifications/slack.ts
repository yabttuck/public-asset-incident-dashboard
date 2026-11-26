import "server-only";

type SlackIncident = {
  id: string;
  incident_number: string;
  title: string;
  priority: string;
  location_snapshot: string | null;
};

export async function notifySlackIncident(incident: SlackIncident) {
  const webhookUrl = process.env.SLACK_INCIDENT_WEBHOOK_URL?.trim();
  if (!webhookUrl) return;

  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()?.replace(/\/$/, "");
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  const appUrl = configuredAppUrl || (vercelHost ? `https://${vercelHost}` : "https://public-asset-incident-dashboard.vercel.app");
  if (!appUrl) {
    console.error("Slack incident notification skipped: NEXT_PUBLIC_APP_URL is missing.");
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: [
          `새 긴급 신고 ${incident.incident_number}`,
          `우선순위: ${incident.priority}`,
          `제목: ${incident.title}`,
          `위치: ${incident.location_snapshot || "미지정"}`,
          `상세: ${appUrl}/ops/incidents/${encodeURIComponent(incident.id)}`,
        ].join("\n"),
        unfurl_links: false,
        unfurl_media: false,
      }),
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) console.error("Slack incident notification failed:", response.status);
  } catch (error) {
    console.error("Slack incident notification failed:", error instanceof Error ? error.message : "unknown error");
  }
}
