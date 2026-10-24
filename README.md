# ISI Email Templates Review Portal

Static portal for browsing the general and industry-specific ISI email templates.

## GitHub Pages

The `main` branch is deployed to GitHub Pages by the workflow in `.github/workflows/pages.yml`.
After the first push, select **GitHub Actions** as the Pages build and deployment source in the
repository's **Settings → Pages** if Pages is not already enabled.

The site is served from the repository root. The workflow runs `build-index.js` before deployment
so the navigation reflects the templates present in the repository.

## Local preview

Run `npm run preview` from this directory, then open the local URL printed by the server.
