/**
 * services/websitePersonalizationAgent.js
 * Scrapes publicly accessible prospect websites and synthesizes personalized opening hooks.
 * Uses native fetch (Node 18+) without requiring external libraries.
 */

const { CohereClient } = require("cohere-ai");
const config = require("../config/email");
const { cleanGeneratedText } = require("./validatorService");

const cohere = new CohereClient({ token: config.cohereApiKey });

async function scrape(url) {
  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    return null;
  }
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) return null;
    const html = await response.text();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
    const description = descMatch ? descMatch[1].trim() : '';

    // Strip scripts, styles, and tags
    const text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 2000);

    return {
      title,
      description,
      content: text
    };
  } catch (err) {
    console.warn(`  ⚠ Website scrape failed for ${url}: ${err.message}`);
    return null;
  }
}

async function generate(url, lead) {
  if (!url) return null;

  console.log(`  → Inspecting website: ${url}...`);
  const scrapedData = await scrape(url);
  if (!scrapedData || !scrapedData.content) return null;

  console.log(`  → Synthesizing tailored hook from website context...`);

  const prompt = `You are a B2B sales development representative for Industrial Security & Intelligence (I) Pvt. Ltd. (ISI Security).
You are writing a cold email to ${lead.name || 'a decision-maker'}, whose role is ${lead.role || 'a leader'} at ${lead.company || 'their organization'}.
Here is context retrieved from their public website:
Title: ${scrapedData.title}
Description: ${scrapedData.description}
Content excerpt: ${scrapedData.content.substring(0, 800)}

Write EXACTLY ONE opening sentence for an email.
It must reference something specific found on their website (e.g. facility footprint, core service, or operational focus) and connect it naturally to operational stability or facility safety.
Do NOT include greetings like "Dear [Name]" or sign-offs. Do NOT make unverified promises or guarantees.
Output ONLY the single sentence plain text.`;

  try {
    const res = await cohere.chat({
      model: config.cohereModel,
      message: prompt,
      temperature: 0.25
    });
    return cleanGeneratedText(res.text);
  } catch (err) {
    console.warn(`  ⚠ Website personalization failed: ${err.message}`);
    return null;
  }
}

module.exports = { generate, scrape };
