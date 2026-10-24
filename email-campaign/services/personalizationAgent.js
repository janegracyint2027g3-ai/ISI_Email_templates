/**
 * services/personalizationAgent.js
 * Tailors personalized opening hook and CTA note for ISI Security email campaigns.
 */

const cohereService = require("./cohereService");
const { cleanGeneratedText } = require("./validatorService");

/**
 * Generates a personalized opening hook (1-2 sentences)
 */
async function generateHook(lead, campaignType) {
  try {
    const resolvedCampaign = cohereService.resolveCampaignType(lead, campaignType);
    const result = await cohereService.generateEmailContent(lead, { campaignType: resolvedCampaign });
    return cleanGeneratedText(result.content.hook);
  } catch (err) {
    console.warn(`  ⚠️ Personalization Hook fallback for ${lead.name || "Lead"}: ${err.message}`);
    const fallback = cohereService.getFallbackContent(lead, campaignType);
    return cleanGeneratedText(fallback.hook);
  }
}

/**
 * Generates a tailored, professional CTA text (1-2 sentences)
 * Note: Prohibits unverified claims like 2-hour callback guarantee.
 */
async function generateCtaText(lead, campaignType) {
  try {
    const resolvedCampaign = cohereService.resolveCampaignType(lead, campaignType);
    const result = await cohereService.generateEmailContent(lead, { campaignType: resolvedCampaign });
    return cleanGeneratedText(result.content.ctaNote);
  } catch (err) {
    console.warn(`  ⚠️ Personalization CTA fallback for ${lead.name || "Lead"}: ${err.message}`);
    const fallback = cohereService.getFallbackContent(lead, campaignType);
    return cleanGeneratedText(fallback.ctaNote);
  }
}

/**
 * Generates the full set of personalized content slots in a single coordinated call
 */
async function generatePersonalizedPackage(lead, campaignType) {
  const resolvedCampaign = cohereService.resolveCampaignType(lead, campaignType);
  return cohereService.generateEmailContent(lead, { campaignType: resolvedCampaign });
}

module.exports = {
  generateHook,
  generateCtaText,
  generatePersonalizedPackage
};
