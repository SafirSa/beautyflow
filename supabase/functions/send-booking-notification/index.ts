import "@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type BookingNotificationRequest = {
  to?: string;
  businessName?: string;
  clientName?: string;
  clientPhone?: string;
  serviceName?: string;
  bookingDate?: string;
  bookingTime?: string;
  notes?: string;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function validateRequiredFields(body: BookingNotificationRequest) {
  const requiredFields: Array<keyof BookingNotificationRequest> = [
    "to",
    "businessName",
    "clientName",
    "clientPhone",
    "serviceName",
    "bookingDate",
    "bookingTime",
  ];

  return requiredFields.filter((field) => !body[field]);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, 405);
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  if (!resendApiKey) {
    return jsonResponse(
      { success: false, error: "Email service is not configured" },
      500,
    );
  }

  let body: BookingNotificationRequest;

  try {
    body = await req.json();
  } catch {
    return jsonResponse({ success: false, error: "Invalid JSON body" }, 400);
  }

  const missingFields = validateRequiredFields(body);

  if (missingFields.length > 0) {
    return jsonResponse(
      {
        success: false,
        error: `Missing required fields: ${missingFields.join(", ")}`,
      },
      400,
    );
  }

  const notesHtml = body.notes
    ? `
      <tr>
        <td style="padding: 10px 0; color: #777;">Notes</td>
        <td style="padding: 10px 0; color: #111; font-weight: 600;">${escapeHtml(body.notes)}</td>
      </tr>
    `
    : "";

  const html = `
    <div style="font-family: Arial, sans-serif; background: #fff7f8; padding: 32px;">
      <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #f6d7dd; border-radius: 20px; padding: 28px;">
        <p style="margin: 0 0 8px; color: #e45c7a; font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">
          BeautyFlow
        </p>
        <h1 style="margin: 0 0 20px; color: #111111; font-size: 26px; line-height: 1.25;">
          New booking request
        </h1>
        <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
          <tr>
            <td style="padding: 10px 0; color: #777;">Client name</td>
            <td style="padding: 10px 0; color: #111; font-weight: 600;">${escapeHtml(body.clientName!)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #777;">Client phone</td>
            <td style="padding: 10px 0; color: #111; font-weight: 600;">${escapeHtml(body.clientPhone!)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #777;">Service</td>
            <td style="padding: 10px 0; color: #111; font-weight: 600;">${escapeHtml(body.serviceName!)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #777;">Date</td>
            <td style="padding: 10px 0; color: #111; font-weight: 600;">${escapeHtml(body.bookingDate!)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #777;">Time</td>
            <td style="padding: 10px 0; color: #111; font-weight: 600;">${escapeHtml(body.bookingTime!)}</td>
          </tr>
          ${notesHtml}
        </table>
        <p style="margin: 24px 0 0; color: #555; font-size: 15px; line-height: 1.6;">
          Log in to your BeautyFlow dashboard to approve or reject this request.
        </p>
      </div>
    </div>
  `;

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "BeautyFlow <onboarding@resend.dev>",
      to: body.to,
      subject: `New booking request for ${body.businessName}`,
      html,
    }),
  });

  if (!resendResponse.ok) {
    const resendError = await resendResponse.text();

    return jsonResponse(
      {
        success: false,
        error: resendError || "Failed to send notification email",
      },
      500,
    );
  }

  return jsonResponse({ success: true });
});
