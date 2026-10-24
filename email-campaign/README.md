# ISI Security Email Campaign

Node.js email campaign source for **Industrial Security & Intelligence (I) Pvt. Ltd.**

## Setup

```bash
cd email-campaign
npm install
npm test
```

## Environment Variables (`.env`)

```
COHERE_API_KEY=your_cohere_key
EMAIL=your_gmail_address
APP_PASSWORD=your_gmail_app_password
```

> Use a Gmail **App Password** (not your account password). Enable 2FA on the Google account first, then create an App Password at https://myaccount.google.com/apppasswords.

## Structure

- `send.js` — entry point, iterates leads and orchestrates send
- `config/email.js` — SMTP + company config (loads `.env`)
- `services/cohereService.js` — Cohere AI content generation with fallback
- `services/templateService.js` — HTML template renderer
- `services/emailService.js` — Nodemailer transport
- `templates/customercentric.html` — concise, customer-focused email layout
- `data/` — copy the `.csv.example` files to create local recipient lists
- `logs/` — send log is created locally when the campaign runs

## Notes

- Recipient lists, `.env` credentials, generated previews, and send logs are intentionally not included in this public repository. Do not commit them.
- Configure valid credentials in a local `.env` before running `npm start`; the command sends real email to the recipients in your local CSV files.
- Failures for one lead do not stop the campaign; every send is logged locally.

Copy `data/existing_customers.csv.example` and `data/new_customers.csv.example` to the matching `.csv` filenames, then add your recipients locally. CSV files use the headers `Name,Email,Type,Industry`. Keep recipient data private.

## AI email brief

The Cohere content generator uses `services/cohereService.js` to build a segment- and campaign-specific brief. Lead records may include these optional fields:

- `marketSegment` or `customerSegment`, `icp` or `icpDescription`, and `role` or `title`
- `campaignObjective`, `ctaObjective`, `specificService` or `service`
- `primaryPain` or `pain`, `businessImpact` or `impact`, and `impactKpi` or `kpi`
- `validatedImpactMetrics` or `impactEvidence` (include the evidence source), `differentiator` or `uvp`, and `proofPoints` or `evidence`
- `criticalEvent` or `whyNow`, and verified `personalizationFacts`

The model returns five subject options, a selected subject, a sub-125-word SPICED email, the exact sentence-to-SPICED mapping, and a campaign strategy with evidence gaps. Unsupported metrics, results, deadlines, and proof points must not be invented. Missing optional fields are treated as unknown rather than inferred. Existing template fields (`subject`, `hook`, `insight`, and `ctaNote`) remain available to the email renderer.

Campaigns use the concise `templates/customercentric.html` layout by default, with the generated body rendered as short paragraphs and a reply-oriented CTA. To intentionally use a different existing HTML design for a specific lead, set its `templateFile` field to a template path relative to `templates/`.

Run the offline content checks with `npm test`.
