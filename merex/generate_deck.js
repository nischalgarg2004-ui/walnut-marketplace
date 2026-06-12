const pptxgen = require("pptxgenjs");

const pres = new pptxgen();

const COLORS = {
  bgDark: "0F0E0E",
  bgLight: "F5F5F5",
  textWhite: "FFFFFF",
  textDark: "0F0E0E",
  accentOrange: "F97316",
  accentAmber: "FBBF24",
  textGray: "A3A3A3",
  cardBgDark: "1F1F1F",
  cardBgLight: "EAEAEA"
};

// -------------------------------------------------------------
// SLIDE 1: Title Slide (Dark Theme)
// -------------------------------------------------------------
const slide1 = pres.addSlide();
slide1.background = { color: COLORS.bgDark };

slide1.addText("merex", {
  x: 1.0, y: 1.5, w: 3.0, h: 0.8,
  fontSize: 48, fontFace: "Arial", bold: true, color: COLORS.textWhite
});

slide1.addText("The Operating System for\nCreator-Brand Collaborations", {
  x: 1.0, y: 2.8, w: 11.3, h: 2.0,
  fontSize: 44, fontFace: "Arial", bold: true, color: COLORS.textWhite, lineSpacing: 50
});

slide1.addText("Programmable fame. Automate 1000s of micro-influencers and clippers without the micro-management.", {
  x: 1.0, y: 4.8, w: 10.0, h: 1.0,
  fontSize: 18, fontFace: "Courier New", color: COLORS.accentAmber
});

// -------------------------------------------------------------
// SLIDE 2: The Opportunity / Why Now (Dark Theme)
// -------------------------------------------------------------
const slide2 = pres.addSlide();
slide2.background = { color: COLORS.bgDark };

slide2.addText("01. THE OPPORTUNITY", {
  x: 0.8, y: 0.6, w: 4.0, h: 0.4,
  fontSize: 12, fontFace: "Courier New", bold: true, color: COLORS.accentOrange
});

slide2.addText("The Shift to Micro-Creators and Organic Clipping", {
  x: 0.8, y: 1.0, w: 11.0, h: 0.8,
  fontSize: 28, fontFace: "Arial", bold: true, color: COLORS.textWhite
});

slide2.addShape(pres.ShapeType.rect, {
  x: 0.8, y: 2.2, w: 5.6, h: 3.8, fill: { color: COLORS.cardBgDark }, line: { color: "333333", width: 1 }
});
slide2.addText("01 / THE DEATH OF TRADITIONAL INFLUENCER ADS", {
  x: 1.2, y: 2.5, w: 4.8, h: 0.4,
  fontSize: 12, fontFace: "Courier New", bold: true, color: COLORS.accentAmber
});
slide2.addText("Authenticity over Reach", {
  x: 1.2, y: 2.9, w: 4.8, h: 0.8,
  fontSize: 20, fontFace: "Arial", bold: true, color: COLORS.textWhite
});
slide2.addText("Brands are moving away from expensive, large-scale creators. The focus is shifting entirely to micro-creators and UGC clipping to drive genuine organic marketing that actually converts.", {
  x: 1.2, y: 3.7, w: 4.8, h: 1.8,
  fontSize: 14, fontFace: "Arial", color: COLORS.textGray, lineSpacing: 22
});

slide2.addShape(pres.ShapeType.rect, {
  x: 6.8, y: 2.2, w: 5.6, h: 3.8, fill: { color: COLORS.cardBgDark }, line: { color: "333333", width: 1 }
});
slide2.addText("02 / THE MARKET SIZE", {
  x: 7.2, y: 2.5, w: 4.8, h: 0.4,
  fontSize: 12, fontFace: "Courier New", bold: true, color: COLORS.accentAmber
});
slide2.addText("$1 Trillion by 2033", {
  x: 7.2, y: 2.9, w: 4.8, h: 0.8,
  fontSize: 20, fontFace: "Arial", bold: true, color: COLORS.textWhite
});
slide2.addText("The creator economy is projected to grow to over $1 trillion in the next decade. Micro-influencers offer 2-3x higher engagement rates, becoming the core engine of modern advertising spend.", {
  x: 7.2, y: 3.7, w: 4.8, h: 1.8,
  fontSize: 14, fontFace: "Arial", color: COLORS.textGray, lineSpacing: 22
});

// -------------------------------------------------------------
// SLIDE 3: The Problem (Dark Theme)
// -------------------------------------------------------------
const slide3 = pres.addSlide();
slide3.background = { color: COLORS.bgDark };

slide3.addText("02. THE PROBLEM", {
  x: 0.8, y: 0.6, w: 4.0, h: 0.4,
  fontSize: 12, fontFace: "Courier New", bold: true, color: COLORS.accentOrange
});

slide3.addText("An Unorganized, Opaque Market", {
  x: 0.8, y: 1.0, w: 11.0, h: 0.8,
  fontSize: 28, fontFace: "Arial", bold: true, color: COLORS.textWhite
});

slide3.addShape(pres.ShapeType.rect, {
  x: 0.8, y: 2.2, w: 11.6, h: 3.8, fill: { color: COLORS.cardBgDark }, line: { color: "333333", width: 1 }
});

slide3.addText("- NO OPEN MARKET: There is currently no open, centralized market for creators and brands to deal transparently.\n\n- THE MIDDLEMAN PROBLEM: The market is heavily unorganized and gated by legacy agencies and PR groups.\n\n- ZERO AUTHENTICITY CHECKS: Brands are blindly paying for campaigns without verification of genuine influence, leading to massive wasted ad spend and off-brief content.", {
  x: 1.2, y: 2.6, w: 10.8, h: 3.0,
  fontSize: 18, fontFace: "Arial", color: COLORS.textGray, lineSpacing: 34
});

// -------------------------------------------------------------
// SLIDE 4: The Solution & Moat (Dark Theme)
// -------------------------------------------------------------
const slide4 = pres.addSlide();
slide4.background = { color: COLORS.bgDark };

slide4.addText("03. THE SOLUTION & OUR MOat", {
  x: 0.8, y: 0.6, w: 4.0, h: 0.4,
  fontSize: 12, fontFace: "Courier New", bold: true, color: COLORS.accentOrange
});

slide4.addText("AI-Powered Programmable Fame", {
  x: 0.8, y: 1.0, w: 11.0, h: 0.8,
  fontSize: 28, fontFace: "Arial", bold: true, color: COLORS.textWhite
});

slide4.addText("Merex is NOT a freelancing website. You don't come here searching for a single influencer.", {
  x: 0.8, y: 2.0, w: 11.0, h: 0.6,
  fontSize: 20, fontFace: "Arial", color: COLORS.accentAmber, italic: true
});

slide4.addShape(pres.ShapeType.rect, {
  x: 0.8, y: 2.8, w: 5.6, h: 3.2, fill: { color: COLORS.cardBgDark }, line: { color: "333333", width: 1 }
});
slide4.addText("PROGRAM THE SYSTEM", {
  x: 1.2, y: 3.1, w: 4.8, h: 0.4,
  fontSize: 18, fontFace: "Arial", bold: true, color: COLORS.textWhite
});
slide4.addText("Program campaigns so 1000s of micro-influencers and clippers work for you simultaneously. Set the parameters, fund the escrow, and let the ecosystem execute.", {
  x: 1.2, y: 3.7, w: 4.8, h: 1.8,
  fontSize: 14, fontFace: "Arial", color: COLORS.textGray, lineSpacing: 22
});

slide4.addShape(pres.ShapeType.rect, {
  x: 6.8, y: 2.8, w: 5.6, h: 3.2, fill: { color: COLORS.cardBgDark }, line: { color: "333333", width: 1 }
});
slide4.addText("ELIMINATE MICRO-MANAGEMENT", {
  x: 7.2, y: 3.1, w: 4.8, h: 0.4,
  fontSize: 18, fontFace: "Arial", bold: true, color: COLORS.textWhite
});
slide4.addText("No DMs, no manual invoicing, no agency fees. Merex handles transparent matching, automated deliverable tracking, and milestone-based escrow payouts.", {
  x: 7.2, y: 3.7, w: 4.8, h: 1.8,
  fontSize: 14, fontFace: "Arial", color: COLORS.textGray, lineSpacing: 22
});


// -------------------------------------------------------------
// SLIDE 5: Business Model (Dark Theme)
// -------------------------------------------------------------
const slide5 = pres.addSlide();
slide5.background = { color: COLORS.bgDark };

slide5.addText("04. BUSINESS MODEL", {
  x: 0.8, y: 0.6, w: 4.0, h: 0.4,
  fontSize: 12, fontFace: "Courier New", bold: true, color: COLORS.accentOrange
});

slide5.addText("Scalable Monetization tied to Transaction Volume", {
  x: 0.8, y: 1.0, w: 11.0, h: 0.8,
  fontSize: 28, fontFace: "Arial", bold: true, color: COLORS.textWhite
});

// Model 1: Platform Fee
slide5.addShape(pres.ShapeType.rect, {
  x: 0.8, y: 2.2, w: 5.6, h: 3.8, fill: { color: COLORS.cardBgDark }, line: { color: "333333", width: 1 }
});
slide5.addText("CAMPAIGN TRANSACTION FEES", {
  x: 1.2, y: 2.5, w: 4.8, h: 0.4,
  fontSize: 14, fontFace: "Courier New", bold: true, color: COLORS.accentOrange
});
slide5.addText("Core Revenue", {
  x: 1.2, y: 2.9, w: 4.8, h: 0.8,
  fontSize: 24, fontFace: "Arial", bold: true, color: COLORS.textWhite
});
slide5.addText("We charge a transparent transaction fee on successful campaigns. By aligning our success with our users, we incentivize high-quality collaboration and rapid volume scaling.", {
  x: 1.2, y: 3.7, w: 4.8, h: 1.8,
  fontSize: 15, fontFace: "Arial", color: COLORS.textGray, lineSpacing: 24
});

// Model 2: Subscription
slide5.addShape(pres.ShapeType.rect, {
  x: 6.8, y: 2.2, w: 5.6, h: 3.8, fill: { color: COLORS.cardBgDark }, line: { color: "333333", width: 1 }
});
slide5.addText("SAAS SUBSCRIPTION", {
  x: 7.2, y: 2.5, w: 4.8, h: 0.4,
  fontSize: 14, fontFace: "Courier New", bold: true, color: COLORS.accentAmber
});
slide5.addText("Future Niche Features", {
  x: 7.2, y: 2.9, w: 4.8, h: 0.8,
  fontSize: 24, fontFace: "Arial", bold: true, color: COLORS.textWhite
});
slide5.addText("A recurring subscription model targeting power-users and high-volume enterprise brands, unlocking advanced analytics, custom CRM pipelines, and priority API access.", {
  x: 7.2, y: 3.7, w: 4.8, h: 1.8,
  fontSize: 15, fontFace: "Arial", color: COLORS.textGray, lineSpacing: 24
});

// -------------------------------------------------------------
// SLIDE 6: The Ask (Dark Theme)
// -------------------------------------------------------------
const slide6 = pres.addSlide();
slide6.background = { color: COLORS.bgDark };

slide6.addText("05. TRACTION & THE ASK", {
  x: 0.8, y: 0.6, w: 4.0, h: 0.4,
  fontSize: 12, fontFace: "Courier New", bold: true, color: COLORS.accentOrange
});

slide6.addText("We Are Expanding The Network", {
  x: 0.8, y: 1.0, w: 11.0, h: 0.8,
  fontSize: 28, fontFace: "Arial", bold: true, color: COLORS.textWhite
});

slide6.addShape(pres.ShapeType.rect, {
  x: 0.8, y: 2.2, w: 11.6, h: 3.8, fill: { color: COLORS.cardBgDark }, line: { color: COLORS.accentOrange, width: 1.5 }
});

slide6.addText("STRATEGIC PARTNERS & VCS", {
  x: 1.2, y: 2.6, w: 10.8, h: 0.4,
  fontSize: 14, fontFace: "Courier New", bold: true, color: COLORS.accentOrange
});

slide6.addText("Join us in building the infrastructure for programmable fame.", {
  x: 1.2, y: 3.2, w: 10.8, h: 0.8,
  fontSize: 24, fontFace: "Arial", bold: true, color: COLORS.textWhite
});

slide6.addText("We are currently raising capital and onboarding strategic partners who can accelerate brand adoption and scale our network of micro-creators and content clippers.", {
  x: 1.2, y: 4.2, w: 9.0, h: 1.4,
  fontSize: 16, fontFace: "Arial", color: COLORS.textGray, lineSpacing: 24
});

// -------------------------------------------------------------
// Write File
// -------------------------------------------------------------
const outputFileName = "merex_pitch_deck.pptx";
pres.writeFile({ fileName: outputFileName })
  .then((fileName) => {
    console.log(`Successfully generated PowerPoint: ${fileName}`);
  })
  .catch((err) => {
    console.error(`Error generating PowerPoint: ${err}`);
  });
