# ISI Email Templates Review Portal

Static portal for browsing the general and industry-specific ISI email templates.

## GitHub Pages

The `main` branch is deployed to GitHub Pages by the workflow in `.github/workflows/pages.yml`.
After the first push, select **GitHub Actions** as the Pages build and deployment source in the
repository's **Settings → Pages** if Pages is not already enabled.

The site is served from the repository root. The workflow runs `build-index.js` before deployment
so the navigation reflects the templates present in the repository.

Run `npm run refine-templates` to regenerate the general and industry email examples using the
customer-focused, evidence-safe copy framework. The examples emphasize the buyer's operational
context, a measurable KPI to review, a conditional reason to review controls, and a low-friction CTA.
They do not assert unverified customer results or numerical improvements.

## Local preview

Run `npm run preview` from this directory, then open the local URL printed by the server.
