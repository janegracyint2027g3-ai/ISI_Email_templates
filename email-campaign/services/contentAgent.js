/**
 * services/contentAgent.js
 * Generates authoritative, industry-specific security and operational threat insights.
 */

const cohereService = require("./cohereService");
const { cleanGeneratedText } = require("./validatorService");

/**
 * Generates an authoritative B2B industry risk insight (2-3 sentences)
 */
async function generateInsight(lead, campaignType) {
  try {
    const resolvedCampaign = cohereService.resolveCampaignType(lead, campaignType);
    const result = await cohereService.generateEmailContent(lead, { campaignType: resolvedCampaign });
    return cleanGeneratedText(result.content.insight);
  } catch (err) {
    console.warn(`  ⚠️ Content Agent fallback for ${lead.name || "Lead"}: ${err.message}`);
    const fallback = cohereService.getFallbackContent(lead, campaignType);
    return cleanGeneratedText(fallback.insight);
  }
}

module.exports = {
  generateInsight
};
