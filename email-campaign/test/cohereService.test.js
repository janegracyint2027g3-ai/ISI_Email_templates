const assert = require("node:assert/strict");
const { before, test } = require("node:test");

process.env.EMAIL ||= "test@example.com";
process.env.APP_PASSWORD ||= "test-password";
process.env.COHERE_API_KEY ||= "test-api-key";

let cohereService;
let validatorService;
let templateService;

before(() => {
  cohereService = require("../services/cohereService");
  validatorService = require("../services/validatorService");
  templateService = require("../services/templateService");
});

test("campaign prompt includes ICP, segment, CTA objective, and evidence-backed KPI inputs", () => {
  const prompt = cohereService.buildStructuredPrompt(
    {
      industry: "Healthcare",
      marketSegment: "Multi-site regional hospitals",
      icp: "COO responsible for hospital operations",
      role: "Chief Operating Officer",
      ctaObjective: "Get a reply to discuss access control",
      impactKpi: "Visitor access exceptions",
      validatedImpactMetrics: "No baseline; hospital operations audit required",
      criticalEvent: "New hospital wing opening in Q3"
    },
    "leadgen"
  );

  assert.match(prompt, /Multi-site regional hospitals/);
  assert.match(prompt, /COO responsible for hospital operations/);
  assert.match(prompt, /Get a reply to discuss access control/);
  assert.match(prompt, /Visitor access exceptions/);
  assert.match(prompt, /New hospital wing opening in Q3/);
  assert.match(prompt, /do not invent a baseline, target, savings, percentage, or customer outcome/i);
  assert.match(prompt, /under 125 words/i);
  assert.match(prompt, /enterprise risk mitigation, brand reputation/i);
});

test("verified fallback follows the five-sentence SPICED schema and validates", () => {
  const content = cohereService.getFallbackContent(
    { industry: "Healthcare", type: "new" },
    "leadgen"
  );
  const validation = validatorService.validateContent(content, { industry: "Healthcare" }, "leadgen");

  assert.equal(content.subjectLines.length, 5);
  assert.equal(content.spicedBreakdown.situation.length > 0, true);
  assert.equal(content.spicedBreakdown.pain.length > 0, true);
  assert.equal(content.spicedBreakdown.impact.length > 0, true);
  assert.equal(content.spicedBreakdown.criticalEvent.length > 0, true);
  assert.equal(content.spicedBreakdown.decision.length > 0, true);
  assert.ok(content.body.trim().split(/\s+/).length < 125);
  assert.equal(validation.isValid, true, validation.errors.join("; "));
});

test("content validation rejects overlong bodies and banned language", () => {
  const content = cohereService.getFallbackContent({ industry: "Healthcare" }, "leadgen");
  content.body = `${content.body} ${"extra ".repeat(125)}`;

  const validation = validatorService.validateContent(content, { industry: "Healthcare" }, "leadgen");
  assert.ok(validation.errors.some((error) => error.includes("under 125 words")));

  content.body = content.body.replace("extra", "Transform");
  const bannedValidation = validatorService.validateContent(content, { industry: "Healthcare" }, "leadgen");
  assert.ok(bannedValidation.errors.some((error) => error.includes("Transform")));
});

test("content validation requires evidence for numerical impact claims", () => {
  const lead = { industry: "Healthcare" };
  const content = cohereService.getFallbackContent(lead, "leadgen");
  content.spicedBreakdown.impact = "This can reduce incident frequency by 18%.";
  content.body = `${content.spicedBreakdown.situation}\n${content.spicedBreakdown.pain}\n${content.spicedBreakdown.impact}\n${content.spicedBreakdown.criticalEvent}\n${content.spicedBreakdown.decision}`;
  content.insight = `${content.spicedBreakdown.impact} ${content.spicedBreakdown.criticalEvent}`;

  const unverified = validatorService.validateContent(content, lead, "leadgen");
  assert.ok(unverified.errors.some((error) => error.includes("unverified numerical claim")));

  const verified = validatorService.validateContent(
    content,
    { ...lead, validatedImpactMetrics: "18% reduction in incident frequency, verified in site audit." },
    "leadgen"
  );
  assert.equal(verified.errors.some((error) => error.includes("unverified numerical claim")), false);
});

test("all default campaign types use the concise customer-centric email layout", () => {
  for (const lead of [
    { type: "new", industry: "Healthcare" },
    { type: "existing", industry: "Hospitality" },
    { type: "lapsed", industry: "Manufacturing" }
  ]) {
    assert.equal(templateService.getTemplateForLead(lead), "customercentric.html");
  }

  const subject = "Reviewing site priorities";
  const body = "Hospitals coordinate patient, staff, and visitor access.\n\nWould a brief review be useful?";
  const { html, templateUsed } = templateService.renderTemplateForLead(
    { type: "new", industry: "Healthcare" },
    { subject, hook: "Hospitals coordinate patient, staff, and visitor access.", body }
  );

  assert.equal(templateUsed, "customercentric.html");
  assert.match(html, /Hospitals coordinate patient, staff, and visitor access\./);
  assert.match(html, /Would a brief review be useful\?/);
  assert.match(html, /mailto:info%40isisecurity\.in\?subject=Reviewing%20site%20priorities/);
  assert.doesNotMatch(html, /\{\{[A-Z_]+\}\}/);
});
