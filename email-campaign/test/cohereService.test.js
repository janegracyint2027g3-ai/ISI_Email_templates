const assert = require("node:assert/strict");
const { before, test } = require("node:test");

process.env.EMAIL ||= "test@example.com";
process.env.APP_PASSWORD ||= "test-password";
process.env.COHERE_API_KEY ||= "test-api-key";

let cohereService;
let validatorService;
let templateService;
let industryContext;

before(() => {
  cohereService = require("../services/cohereService");
  validatorService = require("../services/validatorService");
  templateService = require("../services/templateService");
  industryContext = require("../services/industryContext");
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

test("verified fallback omits an unavailable critical event and validates", () => {
  const content = cohereService.getFallbackContent(
    { industry: "Healthcare", type: "new" },
    "leadgen"
  );
  const validation = validatorService.validateContent(content, { industry: "Healthcare" }, "leadgen");

  assert.equal(content.subjectLines.length, 5);
  assert.ok(content.spicedBreakdown.situation.length > 0);
  assert.ok(content.spicedBreakdown.pain.length > 0);
  assert.ok(content.spicedBreakdown.impact.length > 0);
  assert.equal(content.spicedBreakdown.criticalEvent, "");
  assert.ok(content.spicedBreakdown.decision.length > 0);
  assert.doesNotMatch(content.body, /renewal|approaching|timely/i);
  assert.ok(content.body.trim().split(/\s+/).length < 125);
  assert.equal(validation.isValid, true, validation.errors.join("; "));
});

test("fallback and prompt use relevant context for every existing vertical", () => {
  for (const industry of [
    "aerospace",
    "bfsi",
    "construction",
    "education",
    "healthcare",
    "hospitality",
    "it_ites",
    "logistics",
    "manufacturing",
    "retail",
    "smart_cities"
  ]) {
    const context = industryContext.resolveIndustryContext(industry);
    const lead = { industry };
    const fallback = cohereService.getFallbackContent(lead, "leadgen");
    const prompt = cohereService.buildStructuredPrompt(lead, "leadgen");

    assert.ok(fallback.body.includes(context.situation), `${industry} fallback is not industry-specific`);
    assert.ok(fallback.strategy.impactKpi.includes(context.impactKpi));
    assert.equal(fallback.subjectLines.length, 5);
    assert.ok(fallback.subjectLines.every((item) => item.text.split(/\s+/).length <= 5));
    assert.ok(prompt.includes(context.operatingContext), `${industry} prompt is missing operating context`);
    assert.ok(prompt.includes(context.roles), `${industry} prompt is missing role guidance`);
  }

  const aerospaceContext = industryContext.resolveIndustryContext("aerospace");
  assert.doesNotMatch(aerospaceContext.services, /aerospace certification|aerospace security system/i);
  assert.doesNotMatch(
    cohereService.buildStructuredPrompt({ industry: "it_ites" }, "leadgen"),
    /cybersecurity|threat detection|fraud detection/i
  );
});

test("custom and missing industries use cautious generic site-security context", () => {
  const custom = industryContext.resolveIndustryContext("Renewable Energy");
  const missing = industryContext.resolveIndustryContext("");

  assert.equal(custom.label, "Renewable Energy operations");
  assert.match(custom.situation, /may coordinate staff, visitors, contractors/i);
  assert.equal(missing.label, "Business operations");

  const fallback = cohereService.getFallbackContent({}, "leadgen");
  const validation = validatorService.validateContent(fallback, {}, "leadgen");
  assert.match(fallback.body, /relevant sites/i);
  assert.equal(validation.isValid, true, validation.errors.join("; "));
});

test("verified critical events are included, while supplied event wording is preserved", () => {
  const lead = { industry: "Healthcare", criticalEvent: "a new hospital wing opening in Q3" };
  const content = cohereService.getFallbackContent(lead, "leadgen");
  const validation = validatorService.validateContent(content, lead, "leadgen");

  assert.match(content.spicedBreakdown.criticalEvent, /new hospital wing opening in Q3/);
  assert.equal(content.subjectLines[4].category, "trigger");
  assert.match(content.subjectLines[4].text, /hospital wing opening/i);
  assert.ok(content.body.includes(content.spicedBreakdown.criticalEvent));
  assert.equal(validation.isValid, true, validation.errors.join("; "));
});

test("fallback remains valid across existing campaign purposes", () => {
  const expectedCtas = {
    welcome: /brief introduction/i,
    leadgen: /short follow-up/i,
    promotional: /review of the site-security arrangements/i,
    business_value: /compare your site routines/i,
    industry_specific: /site-security requirements/i,
    reengagement: /still under review/i,
    consultation: /access control/i,
    retention: /current coverage/i
  };

  for (const campaignType of [
    "welcome",
    "leadgen",
    "promotional",
    "business_value",
    "industry_specific",
    "reengagement",
    "retention",
    "consultation"
  ]) {
    const lead = {
      industry: "logistics",
      type: campaignType === "retention" ? "existing" : "new",
      specificService: "access control"
    };
    const content = cohereService.getFallbackContent(lead, campaignType);
    const validation = validatorService.validateContent(content, lead, campaignType);

    assert.equal(validation.isValid, true, `${campaignType}: ${validation.errors.join("; ")}`);
    assert.match(content.spicedBreakdown.decision, expectedCtas[campaignType]);
  }
});

test("malformed or unavailable Cohere responses fall back to validated content", async () => {
  for (const chat of [
    async () => ({ text: "not valid JSON" }),
    async () => { throw new Error("API unavailable"); }
  ]) {
    const result = await cohereService.generateEmailContent(
      { industry: "manufacturing" },
      { campaignType: "leadgen", client: { chat } }
    );

    assert.equal(result.source, "fallback");
    assert.equal(result.validation.isValid, true, result.validation.errors.join("; "));
    assert.equal(result.content.spicedBreakdown.criticalEvent, "");
  }
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
