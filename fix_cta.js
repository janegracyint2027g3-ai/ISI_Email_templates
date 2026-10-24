const fs = require('fs');
const path = require('path');

const BASE_DIR = __dirname;

// The standard CTA block we want in EVERY template
const CONTACT_BTN = `<td align="center" bgcolor="#003366" style="border-radius: 4px;"><a class="btn" href="https://www.isisecurity.in/contact" style="display: inline-block; padding: 16px 32px; font-family: Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 4px;" target="_blank">Contact Us</a></td>`;
const SPACER = `<td width="20"></td>`;
const WHATSAPP_BTN = `<td align="center" bgcolor="#25D366" style="border-radius: 4px;"><a class="btn" href="https://wa.me/917708887878?text=Hello%20ISI%20Security!%20I%20would%20like%20to%20know%20more%20about%20your%20security%20solutions." style="display: inline-block; padding: 16px 32px; font-family: Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 4px;" target="_blank">&#128;WhatsApp Us</a></td>`;

// Standardised CTA table row (replaces everything inside existing <tr> inside .btn table)
const STANDARD_CTA_ROW = `\n<tr>\n${CONTACT_BTN}\n${SPACER}\n${WHATSAPP_BTN}\n</tr>`;

// Regex to find existing CTA button table rows
// We look for the <table ... margin: 0 auto ...> ... </table> wrapping the buttons
const ctaTableRegex = /<table[^>]*margin[^>]*0 auto[^>]*>[\s\S]*?<\/table>/gi;

function fixTemplate(filePath) {
    let html = fs.readFileSync(filePath, 'utf8');

    // Replace ALL existing CTA rows (the <tr> blocks inside the button table) with standard ones
    // Strategy: find <table ...margin: 0 auto...>...</table> and rebuild its inner <tr>
    let changed = false;

    const newHtml = html.replace(ctaTableRegex, (match) => {
        // Only touch if it contains an <a class="btn"
        if (!match.includes('class="btn"')) return match;
        
        // Replace inner content with our standard CTA row
        const replacement = `<table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">${STANDARD_CTA_ROW}\n</table>`;
        changed = true;
        return replacement;
    });

    if (changed) {
        fs.writeFileSync(filePath, newHtml, 'utf8');
        console.log(`✅ Updated: ${filePath.replace(BASE_DIR + path.sep, '')}`);
    } else {
        console.log(`⚠️  No CTA table found: ${filePath.replace(BASE_DIR + path.sep, '')}`);
    }
}

// Find all HTML files except index.html
function getAllHtmlFiles(dir) {
    const results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== 'raw' && entry.name !== 'node_modules') {
            results.push(...getAllHtmlFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.html') && entry.name !== 'index.html') {
            results.push(fullPath);
        }
    }
    return results;
}

const files = getAllHtmlFiles(BASE_DIR);
console.log(`\nFound ${files.length} template files. Updating CTAs...\n`);
files.forEach(fixTemplate);
console.log(`\nDone! All templates updated.`);
