const fs = require("fs");
const path = require("path");
const config = require("../config/email");

function escapeHtml(s) {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getTemplateForLead(lead) {
  if (lead.templateFile) {
    const customPath = path.join(__dirname, "..", "templates", lead.templateFile);
    if (fs.existsSync(customPath)) {
      return lead.templateFile;
    }
  }

  return "customercentric.html";
}

function renderTemplateForLead(lead, agentContent = {}) {
  const fileName = getTemplateForLead(lead);
  const tplPath = path.join(__dirname, "..", "templates", fileName);
  
  if (!fs.existsSync(tplPath)) {
    throw new Error(`Template file not found at ${tplPath}`);
  }

  let html = fs.readFileSync(tplPath, "utf8");

  // Determine subject line: priority to generated agentContent.subject, fallback to template comment or default
  let subject = agentContent.subject;
  if (!subject) {
    const subjectMatch = html.match(/<!--\s*SUBJECT:\s*(.*?)\s*-->/);
    subject = subjectMatch ? subjectMatch[1].trim() : "ISI Security & Intelligence Update";
  }

  // Build attachments list for CID inline image rendering
  const attachments = [];

  // Check logo
  let logoFileName = "logo.png";
  let logoPath = path.join(__dirname, "..", "assets", logoFileName);
  if (!fs.existsSync(logoPath)) {
    logoFileName = "isi-logo.png";
    logoPath = path.join(__dirname, "..", "assets", logoFileName);
  }

  let logoUrl = `${config.company.website}/assets/logo.png`;
  if (fs.existsSync(logoPath)) {
    logoUrl = "cid:logo";
    attachments.push({
      filename: logoFileName,
      path: logoPath,
      cid: "logo"
    });
  }

  // Resolve header banner (H1 to H6)
  const randomHeaderNum = Math.floor(Math.random() * 6) + 1;
  let headerBannerFile = `H${randomHeaderNum} (1).png`;
  if (!fs.existsSync(path.join(__dirname, "..", "assets", headerBannerFile))) {
    // Check without (1)
    if (fs.existsSync(path.join(__dirname, "..", "assets", `H${randomHeaderNum}.png`))) {
      headerBannerFile = `H${randomHeaderNum}.png`;
    } else {
      headerBannerFile = "";
    }
  }

  let headerBannerHtml = "";
  if (headerBannerFile) {
    const bannerPath = path.join(__dirname, "..", "assets", headerBannerFile);
    headerBannerHtml = `<img src="cid:header_banner" alt="Header Banner" width="600" style="display:block;width:100%;max-width:600px;border:0;" />`;
    attachments.push({
      filename: headerBannerFile,
      path: bannerPath,
      cid: "header_banner"
    });
  } else if (config.headerBannerUrl) {
    headerBannerHtml = `<img src="${config.headerBannerUrl}" alt="Header Banner" width="600" style="display:block;width:100%;max-width:600px;border:0;" />`;
  }

  // Resolve footer banner (F1 to F4)
  const randomFooterNum = Math.floor(Math.random() * 4) + 1;
  let footerBannerFile = `F${randomFooterNum}.png`;
  if (!fs.existsSync(path.join(__dirname, "..", "assets", footerBannerFile))) {
    footerBannerFile = "";
  }

  let footerBannerHtml = "";
  if (footerBannerFile) {
    const footerBannerPath = path.join(__dirname, "..", "assets", footerBannerFile);
    footerBannerHtml = `<img src="cid:footer_banner" alt="ISI Security Head Office &amp; Contact Details" width="600" style="display:block;width:100%;max-width:600px;border:0;" />`;
    attachments.push({
      filename: footerBannerFile,
      path: footerBannerPath,
      cid: "footer_banner"
    });
  } else {
    const fallbackFooterPath = path.join(__dirname, "..", "assets", "footer_banner.png");
    if (fs.existsSync(fallbackFooterPath)) {
      footerBannerHtml = `<img src="cid:footer_banner" alt="ISI Security Head Office &amp; Contact Details" width="600" style="display:block;width:100%;max-width:600px;border:0;" />`;
      attachments.push({
        filename: "footer_banner.png",
        path: fallbackFooterPath,
        cid: "footer_banner"
      });
    } else if (config.footerBannerUrl) {
      footerBannerHtml = `<img src="${config.footerBannerUrl}" alt="Footer Banner" width="600" style="display:block;width:100%;max-width:600px;border:0;" />`;
    }
  }

  // Clean and prepare slot content
  const hookText = agentContent.hook ? escapeHtml(agentContent.hook) : "";
  const insightText = agentContent.insight ? escapeHtml(agentContent.insight) : "";
  const ctaNoteText = agentContent.ctaNote ? escapeHtml(agentContent.ctaNote) : "";
  const bodyText = agentContent.body || [agentContent.hook, agentContent.insight, agentContent.ctaNote].filter(Boolean).join("\n\n");
  const emailBodyHtml = bodyText
    .split(/\n\s*\n/)
    .map((paragraph) => `<p>${escapeHtml(paragraph.trim())}</p>`)
    .filter((paragraph) => paragraph !== "<p></p>")
    .join("\n");
  const replySubject = encodeURIComponent(subject);

  // Standard replacements dictionary
  const replacements = {
    "{{NAME}}": escapeHtml(lead.name || "Valued Partner"),
    "{{COMPANY_NAME}}": config.company.name,
    "{{TAGLINE}}": config.company.tagline,
    "{{CERTIFICATION}}": config.company.certification,
    "{{WEBSITE}}": config.company.website,
    "{{HEADER_BANNER}}": headerBannerHtml,
    "{{FOOTER_BANNER}}": footerBannerHtml,
    "{{LOGO_URL}}": logoUrl,
    "{{YEAR}}": String(new Date().getFullYear()),
    "{{AI_PERSONALIZED_HOOK}}": hookText,
    "{{AI_INDUSTRY_INSIGHT}}": insightText,
    "{{AI_CTA_PERSONALIZATION}}": ctaNoteText,
    "{{AI_EMAIL_BODY}}": emailBodyHtml,
    "{{AI_MARKET_SEGMENT}}": escapeHtml(lead.marketSegment || lead.customerSegment || lead.industry || "Enterprise operations"),
    "{{AI_SUBJECT}}": escapeHtml(subject),
    "{{SUBJECT}}": escapeHtml(subject),
    "{{CONTACT_EMAIL}}": encodeURIComponent(config.company.email),
    "{{AI_REPLY_SUBJECT}}": replySubject,
    "{{ADDRESS}}": escapeHtml(config.company.address),
    "{{CONTACT_PHONE}}": escapeHtml(config.company.phone)
  };

  // Perform standard replacements
  for (const [k, v] of Object.entries(replacements)) {
    html = html.split(k).join(v);
  }

  // Harmonize templates lacking placeholder tags (e.g. industry sub-templates)
  if (!html.includes(hookText) && hookText) {
    // If the template has a generic Dear <Role>, replace it with personalized greeting and hook
    html = html.replace(
      /<p[^>]*>Dear\s+[^<]+,<\/p>/i,
      `<p style="font-size: 16px; line-height: 26px; color: #333333; margin: 0 0 16px 0; text-align: justify;">Dear ${escapeHtml(lead.name || "Valued Partner")},</p>\n<p style="font-size: 16px; line-height: 26px; color: #555555; margin: 0 0 20px 0; text-align: justify;">${hookText}</p>`
    );

    // If insight exists and wasn't inserted, inject before service cards or CTA
    if (insightText && !html.includes(insightText)) {
      html = html.replace(
        /(<table[^>]*class="card"|<table[^>]*width="100%"[^>]*>[\s\S]*?<table[^>]*class="card")/i,
        `<p style="font-size: 16px; line-height: 26px; color: #555555; margin: 0 0 25px 0; text-align: justify;">${insightText}</p>\n$1`
      );
    }
  }

  return {
    subject,
    html,
    templateUsed: fileName,
    attachments
  };
}

module.exports = {
  renderTemplateForLead,
  getTemplateForLead,
  escapeHtml
};
