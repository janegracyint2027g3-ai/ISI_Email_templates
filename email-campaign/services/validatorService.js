/**
 * services/validatorService.js
 * Rule-based content quality validation & scoring rubric for ISI Security email campaigns.
 */

const config = require("../config/email");

// Prohibited terms, buzzwords, and hallucinated claims
const PROHIBITED_PATTERNS = [
  /\b(?:unlock|transform|accelerate|synergy|game[\s-]changer|delve)\b/i,
  /2[- ]hour callback guarantee/i,
  /guarantee(?:d)? (?:savings|roi|reduction)/i,
  /cut costs by \d+%/i,
  /save \d+%/i,
  /100% guarantee/i,
  /world[- ]class leading/i,
  /cutting[- ]edge revolutionary/i,
  /here is (?:the|your) (?:email|copy|response)/i,
  /as an ai/i,
  /dear (?:client|customer|prospect|sir|madam),?/i
];

const UNRESOLVED_TAG_REGEX = /\{\{[A-Z0-9_]+\}\}/;
const MARKDOWN_LEAK_REGEX = /(\*\*|__|```|###|^#\s|\[.*?\]\(.*?\))/m;
const UNSAFE_HTML_REGEX = /<\s*(script|style|iframe|object|embed|form|input|button)[\s>]/i;

/**
 * Validates generated content items (subject, hook, insight, ctaNote, body).
 * Returns { isValid: boolean, errors: string[], warnings: string[] }
 */
function validateContent(content, lead = {}, campaignType = "general") {
  const errors = [];
  const warnings = [];

  if (!content) {
    return { isValid: false, errors: ["Content object is completely missing"], warnings: [] };
  }

  // 1. Subject validation
  if (!content.subject || typeof content.subject !== "string" || content.subject.trim().length === 0) {
    errors.push("Subject line is missing or empty.");
  } else {
    const s = content.subject.trim();
    if (s.length > 90) warnings.push(`Subject line is relatively long (${s.length} chars). Preferred < 75 chars.`);
    if (s.length < 10) errors.push("Subject line is too short (< 10 chars).");
    if (s === s.toUpperCase() && s.length > 15) errors.push("Subject line must not be ALL CAPS.");
    if ((s.match(/!/g) || []).length > 1) warnings.push("Subject line contains multiple exclamation marks.");
    if (/free|urgent|guarantee|risk-free|100%|act now/i.test(s)) {
      warnings.push("Subject line contains spam-triggering words (e.g. Free, Urgent, Guarantee).");
    }
  }

  const subjectLines = content.subjectLines;
  const metricEvidence = `${lead.validatedImpactMetrics || ""} ${lead.impactEvidence || ""}`.trim();
  if (!Array.isArray(subjectLines) || subjectLines.length !== 5) {
    errors.push("Exactly five subject line variations are required.");
  } else {
    const categories = subjectLines.map((item) => item && item.category);
    const directCount = categories.filter((category) =>
      category === "direct_metric" || category === "direct_pain"
    ).length;
    const peerCount = categories.filter((category) => category === "peer_to_peer").length;
    const triggerCount = categories.filter((category) =>
      category === "trigger" || category === "operational_question"
    ).length;

    if (directCount !== 2 || peerCount !== 2 || triggerCount !== 1) {
      errors.push("Subject lines must include two direct, two peer-to-peer, and one trigger or operational question.");
    }
    if (categories.includes("direct_metric") && !metricEvidence) {
      errors.push("Metric-led subject lines require a supplied validated metric and evidence source.");
    }

    for (const [index, item] of subjectLines.entries()) {
      const text = typeof item?.text === "string" ? item.text.trim() : "";
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      if (!text) errors.push(`Subject line ${index + 1} is empty.`);
      if (wordCount >= 6) errors.push(`Subject line ${index + 1} must be under six words.`);
      for (const pattern of PROHIBITED_PATTERNS) {
        if (pattern.test(text)) {
          errors.push(`Subject line ${index + 1} contains prohibited language: '${text.match(pattern)[0]}'.`);
        }
      }
      const subjectMetric = text.match(/\$\s*\d[\d,.]*|\b\d+(?:\.\d+)?\s*%|\b\d+(?:\.\d+)?\s*(?:percent\b|hours?\b|days?\b|weeks?\b|months?\b|minutes?\b|incidents?\b|sites?\b)/i);
      if (subjectMetric && !metricEvidence.toLowerCase().includes(subjectMetric[0].replace(/\s+/g, "").toLowerCase())) {
        errors.push(`Subject line ${index + 1} contains an unverified metric: '${subjectMetric[0].trim()}'.`);
      }
    }

    if (!subjectLines.some((item) => item.text === content.subject)) {
      errors.push("Selected subject must exactly match one of the five subject line variations.");
    }
  }

  const body = typeof content.body === "string" ? content.body.trim() : "";
  const bodyWordCount = body.split(/\s+/).filter(Boolean).length;
  if (!body) {
    errors.push("Complete email body is missing.");
  } else if (bodyWordCount >= 125) {
    errors.push(`Email body must be under 125 words (received ${bodyWordCount}).`);
  }

  const requiredStrategyFields = [
    "marketSegment",
    "icp",
    "campaignObjective",
    "ctaObjective",
    "messageFraming",
    "impactKpi",
    "evidenceGaps"
  ];
  for (const field of requiredStrategyFields) {
    if (typeof content.strategy?.[field] !== "string" || !content.strategy[field].trim()) {
      errors.push(`Campaign strategy is missing '${field}'.`);
    }
  }

  const spicedFields = ["situation", "pain", "impact", "decision"];
  for (const field of spicedFields) {
    const sentence = content.spicedBreakdown?.[field];
    if (typeof sentence !== "string" || !sentence.trim()) {
      errors.push(`SPICED breakdown is missing '${field}'.`);
    } else if (body && !body.includes(sentence.trim())) {
      errors.push(`SPICED '${field}' must quote its exact sentence from the email body.`);
    }
  }

  const hasVerifiedCriticalEvent = [lead.criticalEvent, lead.whyNow]
    .some((event) => typeof event === "string" && event.trim());
  const criticalEvent = content.spicedBreakdown?.criticalEvent;
  if (hasVerifiedCriticalEvent) {
    if (typeof criticalEvent !== "string" || !criticalEvent.trim()) {
      errors.push("SPICED breakdown must include the supplied critical event.");
    } else if (body && !body.includes(criticalEvent.trim())) {
      errors.push("SPICED 'criticalEvent' must quote its exact sentence from the email body.");
    }
  } else if (typeof criticalEvent === "string" && criticalEvent.trim()) {
    errors.push("SPICED 'criticalEvent' must be omitted when no verified event was supplied.");
  }

  const impactSentence = content.spicedBreakdown?.impact || "";
  const quantifiedImpacts = impactSentence.match(/\$\s*\d[\d,.]*|\b\d+(?:\.\d+)?\s*%|\b\d+(?:\.\d+)?\s*(?:percent\b|hours?\b|days?\b|weeks?\b|months?\b|minutes?\b|incidents?\b|sites?\b)/gi) || [];
  for (const claim of quantifiedImpacts) {
    const normalizedClaim = claim.replace(/\s+/g, "").toLowerCase();
    const verifiedBrandFact = /^(?:30years|24\/7|24x7|9001:2015)$/i.test(normalizedClaim);
    if (!verifiedBrandFact && !metricEvidence.toLowerCase().includes(normalizedClaim)) {
      errors.push(`Impact sentence contains an unverified numerical claim: '${claim.trim()}'.`);
    }
  }

  // 2. Validate text components (hook, insight, ctaNote or body)
  const textFields = ["hook", "insight", "ctaNote", "body"];
  let hasTextField = false;

  for (const field of textFields) {
    if (content[field] && typeof content[field] === "string") {
      hasTextField = true;
      const val = content[field].trim();

      // Check for unresolved template tags
      if (UNRESOLVED_TAG_REGEX.test(val)) {
        errors.push(`Field '${field}' contains unresolved template tag: ${val.match(UNRESOLVED_TAG_REGEX)[0]}`);
      }

      // Check for markdown syntax leakage
      if (MARKDOWN_LEAK_REGEX.test(val)) {
        warnings.push(`Field '${field}' contains Markdown formatting which may render raw in plain-text slots.`);
      }

      // Check for unsafe HTML injections
      if (UNSAFE_HTML_REGEX.test(val)) {
        errors.push(`Field '${field}' contains potentially unsafe HTML tags.`);
      }

      // Check prohibited & unverified claims
      for (const pattern of PROHIBITED_PATTERNS) {
        if (pattern.test(val)) {
          errors.push(`Field '${field}' contains prohibited or unverified claim: '${val.match(pattern)[0]}'`);
        }
      }

      // Check for awkward personalization or invented facts
      if (lead.name && val.includes("[Name]") || val.includes("[Company]")) {
        errors.push(`Field '${field}' contains unpopulated bracket placeholder.`);
      }

      // Check length constraints
      const wordCount = val.split(/\s+/).filter(Boolean).length;
      if (field === "hook" && wordCount > 75) {
        warnings.push(`Opening hook is long (${wordCount} words). Recommended < 50 words.`);
      }
      if (field === "insight" && wordCount > 110) {
        warnings.push(`Industry insight is long (${wordCount} words). Recommended < 90 words.`);
      }
      if (field === "ctaNote" && wordCount > 60) {
        warnings.push(`CTA note is long (${wordCount} words). Recommended < 45 words.`);
      }
    }
  }

  if (!hasTextField) {
    errors.push("No body or slot text fields (hook, insight, ctaNote, body) were generated.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Sanitizes plain-text content:
 * - Strips accidental model commentary prefixes ("Here is the hook:", "Sure, here...")
 * - Strips markdown bolding or headers
 * - Trims whitespace
 */
function cleanGeneratedText(text) {
  if (!text || typeof text !== "string") return "";
  let cleaned = text.trim();

  // Strip leading model chat commentary
  cleaned = cleaned.replace(/^(?:here is (?:the|a|an|your)|subject:|email body:|note:).*?\n+/i, "");
  // Strip quotation wrappers if the entire string is enclosed in quotes
  cleaned = cleaned.replace(/^["'](.*)["']$/s, "$1").trim();
  // Strip markdown bold / italic markers for clean plain-text insertion
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, "$1");
  cleaned = cleaned.replace(/__([^_]+)__/g, "$1");
  cleaned = cleaned.replace(/^#+\s+/gm, "");
  // Normalize whitespace
  cleaned = cleaned.replace(/[ \t]+/g, " ");

  return cleaned.trim();
}

/**
 * Evaluates generated content against the official 7-criterion rubric:
 * 1. Personalization (25%)
 * 2. Relevance to campaign (20%)
 * 3. Professional tone (15%)
 * 4. Factual accuracy (15%)
 * 5. Clarity & readability (10%)
 * 6. CTA quality (10%)
 * 7. Brand consistency (5%)
 *
 * Total Score: 0 - 100
 */
function evaluateContentRubric(content, lead = {}, campaignType = "general") {
  const scores = {
    personalization: 0,   // max 25
    campaignRelevance: 0, // max 20
    professionalTone: 0,  // max 15
    factualAccuracy: 0,   // max 15
    clarityReadability: 0,// max 10
    ctaQuality: 0,        // max 10
    brandConsistency: 0,  // max 5
  };

  const fullText = [
    content.subject || "",
    content.hook || "",
    content.insight || "",
    content.ctaNote || "",
    content.body || ""
  ].join(" ");

  // 1. Personalization (max 25)
  let pScore = 15; // baseline
  if (lead.name && (fullText.includes(lead.name) || (content.hook && content.hook.length > 20))) pScore += 3;
  if (lead.industry && lead.industry.toLowerCase() !== "general") {
    const ind = lead.industry.toLowerCase();
    if (fullText.toLowerCase().includes(ind) || content.insight) pScore += 4;
  }
  if (lead.role) pScore += 3;
  scores.personalization = Math.min(25, pScore);

  // 2. Campaign Relevance (max 20)
  let cScore = 14;
  const lowerText = fullText.toLowerCase();
  if (campaignType === "retention" || lead.type === "existing") {
    if (lowerText.includes("partner") || lowerText.includes("continued") || lowerText.includes("trust") || lowerText.includes("ongoing")) {
      cScore += 6;
    }
  } else if (campaignType === "welcome" || campaignType === "promotional") {
    if (lowerText.includes("welcome") || lowerText.includes("audit") || lowerText.includes("consultation") || lowerText.includes("protect")) {
      cScore += 6;
    }
  } else if (campaignType === "reengagement") {
    if (lowerText.includes("reconnect") || lowerText.includes("review") || lowerText.includes("support")) {
      cScore += 6;
    }
  } else {
    cScore += 5;
  }
  scores.campaignRelevance = Math.min(20, cScore);

  // 3. Professional Tone (max 15)
  let tScore = 15;
  if (/!!!|\?\?|URGENT|ACT NOW|CHEAP/i.test(fullText)) tScore -= 6;
  if (/hey|whats up|buddy/i.test(fullText)) tScore -= 5;
  scores.professionalTone = Math.max(0, tScore);

  // 4. Factual Accuracy (max 15)
  let fScore = 15;
  for (const pattern of PROHIBITED_PATTERNS) {
    if (pattern.test(fullText)) fScore -= 5;
  }
  if (UNRESOLVED_TAG_REGEX.test(fullText)) fScore -= 5;
  scores.factualAccuracy = Math.max(0, fScore);

  // 5. Clarity & Readability (max 10)
  let rScore = 9;
  const words = fullText.split(/\s+/).filter(Boolean);
  if (words.length > 300) rScore -= 2;
  if (words.length < 30) rScore -= 3;
  scores.clarityReadability = Math.max(0, rScore);

  // 6. CTA Quality (max 10)
  let ctaScore = 7;
  const cta = (content.ctaNote || "").toLowerCase();
  if (cta.includes("consultation") || cta.includes("review") || cta.includes("discuss") || cta.includes("connect") || cta.includes("audit") || cta.includes("inquire")) {
    ctaScore += 3;
  }
  if (cta.includes("buy now") || cta.includes("purchase instantly")) ctaScore -= 3;
  scores.ctaQuality = Math.min(10, Math.max(0, ctaScore));

  // 7. Brand Consistency (max 5)
  let bScore = 4;
  if (lowerText.includes("isi security") || lowerText.includes("industrial security & intelligence") || lowerText.includes("iso 9001")) {
    bScore += 1;
  }
  scores.brandConsistency = Math.min(5, bScore);

  const total = Object.values(scores).reduce((a, b) => a + b, 0);

  return {
    scores,
    total,
    grade: total >= 90 ? "A" : total >= 80 ? "B" : total >= 70 ? "C" : "D"
  };
}

module.exports = {
  validateContent,
  cleanGeneratedText,
  evaluateContentRubric,
  PROHIBITED_PATTERNS
};
