require("dotenv").config();

const required = ["EMAIL", "APP_PASSWORD", "COHERE_API_KEY"];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  headerBannerUrl: "",
  footerBannerUrl: "",
  smtp: {
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.APP_PASSWORD,
    },
  },
  from: `"ISI Security & Intelligence" <${process.env.EMAIL}>`,
  cohereApiKey: process.env.COHERE_API_KEY,
  cohereModel: process.env.COHERE_MODEL || "command-r-plus-08-2024",
  dryRun: process.env.DRY_RUN === "true" || process.argv.includes("--dry-run") || process.argv.includes("--preview"),
  company: {
    name: "Industrial Security & Intelligence (I) Pvt. Ltd.",
    shortName: "ISI Security",
    tagline: "Your Safety. Our Priority.",
    certification: "AN ISO 9001 : 2015 COMPANY | Over 30 Years of Excellence",
    website: "https://www.isisecurity.in",
    address: "No. 9, First Floor, Kamarajar Salai, Ashok Nagar, Chennai – 600083, Tamil Nadu, India.",
    phone: "+91 77088 87878",
    email: "info@isisecurity.in",
    services: [
      "Corporate Security",
      "Industrial Security",
      "Investigation Services",
      "Manpower Solutions",
      "Security Consulting",
      "Risk Assessment",
      "Facility Protection",
      "24x7 Security Support",
    ],
    // Verified brand boundaries for content generation
    verifiedFacts: {
      establishedYears: "Over 30 Years",
      certification: "ISO 9001:2015 Certified",
      operationalCoverage: "Pan-India operations with trained personnel and 24x7 operational coordination",
      coreStrengths: [
        "Vetted, professionally trained manned guarding personnel",
        "Tailored industrial & corporate facility protection protocols",
        "Discreet corporate investigation & background verification services",
        "Systematic risk assessment and security consultation walkthroughs",
        "Reliable operational coordination and emergency response support"
      ]
    },
    // Strictly prohibited claims that must never be generated
    prohibitedClaims: [
      "2-hour callback guarantee (or any time-bound response guarantee)",
      "Unsupported numerical cost reductions or savings percentages (e.g. 'cut costs by 40%')",
      "Unverified awards, unverified certifications beyond ISO 9001:2015",
      "Fictional client names, unverified case study metrics, or non-existent partner programs",
      "Claims of proprietary hardware or software patents not explicitly verified"
    ]
  },
};

