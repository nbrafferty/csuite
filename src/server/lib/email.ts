/**
 * Transactional email via Resend (https://resend.com).
 *
 * Configured with RESEND_API_KEY and EMAIL_FROM (e.g. "Central Creative
 * <hello@centralcreative.co>" — the domain must be verified in Resend).
 * When unconfigured, emails are logged to the console instead of sent, so
 * every flow keeps working in development and fails soft in production.
 */

export function isEmailConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<{ sent: boolean }> {
  const to = Array.isArray(opts.to) ? opts.to : [opts.to];

  if (!isEmailConfigured()) {
    // Log the links so flows like password reset stay testable without a provider
    const links = Array.from(opts.html.matchAll(/href="([^"]+)"/g), (m) => m[1]);
    console.log(
      `[email] Not configured (RESEND_API_KEY / EMAIL_FROM) — would send "${opts.subject}" to ${to.join(", ")}${links.length ? ` | links: ${links.join(" ")}` : ""}`
    );
    return { sent: false };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to,
        subject: opts.subject,
        html: opts.html,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[email] Resend responded ${res.status} for "${opts.subject}": ${body}`);
      return { sent: false };
    }
    return { sent: true };
  } catch (err) {
    // Email must never take down the action that triggered it
    console.error(`[email] Failed to send "${opts.subject}":`, err);
    return { sent: false };
  }
}

/** Base URL for links in emails (AUTH_URL is already required for NextAuth). */
export function appBaseUrl(): string {
  return (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** Active CCC staff emails — the audience for inbound-work notifications. */
export async function staffEmails(): Promise<string[]> {
  const { prisma } = await import("@/server/db/prisma");
  const staff = await prisma.user.findMany({
    where: { role: "CCC_STAFF", status: "ACTIVE" },
    select: { email: true },
  });
  return staff.map((s) => s.email);
}

/** Active client-admin emails for a company — the default notification audience. */
export async function clientAdminEmails(companyId: string): Promise<string[]> {
  const { prisma } = await import("@/server/db/prisma");
  const admins = await prisma.user.findMany({
    where: { companyId, role: "CLIENT_ADMIN", status: "ACTIVE" },
    select: { email: true },
  });
  return admins.map((a) => a.email);
}

// ─── Templates ─────────────────────────────────────────────────────

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;padding:32px;">
          <tr><td>
            <p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#e85d4c;">Central Creative Co.</p>
            <h1 style="margin:0 0 16px;font-size:20px;color:#18181b;">${title}</h1>
            ${bodyHtml}
            <p style="margin:24px 0 0;font-size:12px;color:#a1a1aa;">If you weren't expecting this email, you can safely ignore it.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background-color:#e85d4c;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;margin:8px 0 16px;">${label}</a>`;
}

export function passwordResetEmail(resetUrl: string) {
  return {
    subject: "Reset your C-Suite password",
    html: layout(
      "Reset your password",
      `<p style="margin:0 0 16px;font-size:14px;color:#3f3f46;">Click the button below to choose a new password. This link expires in 1 hour and can only be used once.</p>
       ${button(resetUrl, "Reset Password")}
       <p style="margin:0;font-size:12px;color:#71717a;">Or paste this link into your browser:<br>${resetUrl}</p>`
    ),
  };
}

export function inviteEmail(opts: {
  companyName: string;
  inviteCode: string;
  registerUrl: string;
}) {
  return {
    subject: `You're invited to ${opts.companyName}'s portal on C-Suite`,
    html: layout(
      `Join ${opts.companyName} on C-Suite`,
      `<p style="margin:0 0 16px;font-size:14px;color:#3f3f46;">You've been invited to the Central Creative client portal. Create your account with this invite code:</p>
       <p style="margin:0 0 16px;font-size:20px;font-weight:700;letter-spacing:0.05em;color:#18181b;background-color:#f4f4f5;border-radius:8px;padding:12px 16px;text-align:center;">${opts.inviteCode}</p>
       ${button(opts.registerUrl, "Create Account")}`
    ),
  };
}

export function reorderRequestEmail(opts: {
  companyName: string;
  quoteTitle: string;
  quoteUrl: string;
}) {
  return {
    subject: `Reorder request from ${opts.companyName}`,
    html: layout(
      "New reorder request",
      `<p style="margin:0 0 16px;font-size:14px;color:#3f3f46;"><strong>${opts.companyName}</strong> submitted a reorder: <strong>${opts.quoteTitle}</strong>. The draft quote is ready for review and pricing.</p>
       ${button(opts.quoteUrl, "Review Draft Quote")}`
    ),
  };
}

export function quoteSentEmail(opts: {
  quoteNumber: string;
  quoteTitle: string;
  quoteUrl: string;
}) {
  return {
    subject: `New quote ${opts.quoteNumber}: ${opts.quoteTitle}`,
    html: layout(
      "You have a new quote",
      `<p style="margin:0 0 16px;font-size:14px;color:#3f3f46;"><strong>${opts.quoteNumber}</strong> — ${opts.quoteTitle} is ready for your review. You can approve it or request changes right from the portal.</p>
       ${button(opts.quoteUrl, "Review Quote")}`
    ),
  };
}

export function invoiceSentEmail(opts: {
  invoiceNumber: string;
  amountDue: string;
  invoiceUrl: string;
}) {
  return {
    subject: `Invoice ${opts.invoiceNumber} from Central Creative`,
    html: layout(
      "You have a new invoice",
      `<p style="margin:0 0 16px;font-size:14px;color:#3f3f46;">Invoice <strong>${opts.invoiceNumber}</strong> for <strong>${opts.amountDue}</strong> is ready. You can pay online or view the details in the portal.</p>
       ${button(opts.invoiceUrl, "View & Pay Invoice")}`
    ),
  };
}
