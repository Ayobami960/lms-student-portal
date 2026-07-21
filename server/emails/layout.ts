// A single responsive HTML shell every email renders through, so every
// notification looks consistent and only needs to supply a title + body.
export function renderEmailLayout(opts: { title: string; bodyHtml: string; ctaLabel?: string; ctaUrl?: string }): string {
  const { title, bodyHtml, ctaLabel, ctaUrl } = opts;
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:linear-gradient(135deg,#4f46e5,#4338ca);padding:24px 32px;">
                <span style="color:#ffffff;font-size:18px;font-weight:700;">LMS Platform</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#111827;font-size:15px;line-height:1.6;">
                <h1 style="margin:0 0 16px;font-size:20px;color:#111827;">${title}</h1>
                ${bodyHtml}
                ${
                  ctaLabel && ctaUrl
                    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                        <tr><td style="border-radius:8px;background-color:#4f46e5;">
                          <a href="${ctaUrl}" style="display:inline-block;padding:12px 24px;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;border-radius:8px;">${ctaLabel}</a>
                        </td></tr>
                      </table>`
                    : ""
                }
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:#f9fafb;color:#9ca3af;font-size:12px;">
                You're receiving this because you have an account on LMS Platform. If this wasn't you, you can safely ignore this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
