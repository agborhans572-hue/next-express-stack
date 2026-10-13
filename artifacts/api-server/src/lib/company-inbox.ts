import { escapeHtml } from "./security";

export const COMPANY_INBOX = "info@shiprion.com";

/** Operational enquiries never depend on a stale support-address setting. */
export function companyInboxEmail(
  subject: string,
  fields: Record<string, string>,
) {
  return {
    toEmail: COMPANY_INBOX,
    subject: `Shiprion - ${subject}`,
    html: `<div style="font-family:sans-serif"><h2>${escapeHtml(subject)}</h2>${Object.entries(
      fields,
    )
      .map(
        ([label, value]) =>
          `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value).replaceAll("\n", "<br>")}</p>`,
      )
      .join("")}</div>`,
  };
}
