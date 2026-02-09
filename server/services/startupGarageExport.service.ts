import PDFDocument from "pdfkit";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  TableRow,
  TableCell,
  Table,
  WidthType,
} from "docx";

const MODULE_LABELS: Record<string, string> = {
  TEAM: "Customize Team",
  WEBSITE_AUDIT: "Website Review & Audit",
  GTM: "Go-To-Market Plan",
  SOCIAL_PR: "Social + PR Plan",
  POSTS_20: "20 Posts + Prompts",
  CANVA_TEMPLATE: "Instagram Template Spec",
  ACTION_30_60_90: "30/60/90 Action Plan",
};

function streamToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

function safe(v: any): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

function flattenContent(moduleKey: string, content: any): string[] {
  const lines: string[] = [];
  if (!content) return lines;

  switch (moduleKey) {
    case "TEAM": {
      if (content.teamName) lines.push(`Team: ${content.teamName}`);
      for (const m of content.members || []) {
        lines.push("");
        lines.push(`${m.role}${m.name ? ` — ${m.name}` : ""}`);
        if (m.bio) lines.push(`  ${m.bio}`);
        if (m.skills?.length) lines.push(`  Skills: ${m.skills.join(", ")}`);
        if (m.responsibilities?.length) {
          lines.push("  Responsibilities:");
          m.responsibilities.forEach((r: string) => lines.push(`    • ${r}`));
        }
        if (m.deliverables?.length) {
          lines.push("  Deliverables:");
          m.deliverables.forEach((d: string) => lines.push(`    • ${d}`));
        }
      }
      break;
    }
    case "WEBSITE_AUDIT": {
      if (content.summary) {
        lines.push(content.summary.overall || "");
        if (content.summary.top3Wins?.length) {
          lines.push("", "Top Wins:");
          content.summary.top3Wins.forEach((w: string) => lines.push(`  ✓ ${w}`));
        }
        if (content.summary.top3Fixes?.length) {
          lines.push("", "Top Fixes Needed:");
          content.summary.top3Fixes.forEach((f: string) => lines.push(`  ✗ ${f}`));
        }
      }
      if (content.scorecards?.length) {
        lines.push("", "Scorecards:");
        content.scorecards.forEach((sc: any) => {
          lines.push(`  ${sc.category}: ${sc.score}/${sc.maxScore} — ${sc.details}`);
        });
      }
      if (content.priorityBacklog?.length) {
        lines.push("", "Priority Backlog:");
        content.priorityBacklog.forEach((item: any) => {
          lines.push(`  [${item.priority}] ${item.issue} (${item.effort})`);
          lines.push(`    → ${item.recommendation}`);
        });
      }
      break;
    }
    case "GTM": {
      if (content.companyOverview) lines.push(content.companyOverview);
      if (content.positioning) {
        lines.push("", "Positioning:");
        lines.push(`  Statement: ${safe(content.positioning.statement)}`);
        lines.push(`  Value Prop: ${safe(content.positioning.uniqueValueProp)}`);
        if (content.positioning.keyDifferentiators?.length) {
          content.positioning.keyDifferentiators.forEach((d: string) => lines.push(`  • ${d}`));
        }
      }
      if (content.targetPersonas?.length) {
        lines.push("", "Target Personas:");
        content.targetPersonas.forEach((p: any) => {
          lines.push(`  ${p.name} — ${safe(p.demographics)}`);
          p.painPoints?.forEach((pp: string) => lines.push(`    Pain: ${pp}`));
          p.buyingMotivations?.forEach((m: string) => lines.push(`    Motivation: ${m}`));
        });
      }
      if (content.pricingRecommendations) {
        lines.push("", "Pricing:");
        lines.push(`  Strategy: ${safe(content.pricingRecommendations.strategy)}`);
        content.pricingRecommendations.tiers?.forEach((t: any) => {
          lines.push(`  ${t.name} (${t.price}) — ${safe(t.target)}`);
          t.features?.forEach((f: string) => lines.push(`    • ${f}`));
        });
      }
      if (content.channelPlan?.primaryChannels?.length) {
        lines.push("", "Channels:");
        content.channelPlan.primaryChannels.forEach((ch: any) => {
          lines.push(`  ${ch.channel}: ${safe(ch.strategy)}`);
          lines.push(`    Budget: ${safe(ch.budget)} | ROI: ${safe(ch.expectedROI)}`);
        });
      }
      break;
    }
    case "SOCIAL_PR": {
      if (content.mode) lines.push(`Mode: ${content.mode}`);
      if (content.platformRecommendations?.length) {
        lines.push("", "Platforms:");
        content.platformRecommendations.forEach((p: any) => {
          lines.push(`  ${p.platform} (${p.priority}): ${safe(p.strategy)}`);
          lines.push(`    Frequency: ${safe(p.postingFrequency)}`);
        });
      }
      if (content.paidAdsAdvice) {
        lines.push("", "Paid Ads:");
        lines.push(`  Budget: ${safe(content.paidAdsAdvice.budget)}`);
        lines.push(`  Targeting: ${safe(content.paidAdsAdvice.targeting)}`);
      }
      if (content.brandingToolkit) {
        lines.push("", "Branding Toolkit:");
        lines.push(`  Voice: ${safe(content.brandingToolkit.voiceTone)}`);
        content.brandingToolkit.keyMessages?.forEach((m: string) => lines.push(`  • ${m}`));
      }
      break;
    }
    case "POSTS_20": {
      for (const post of content.posts || []) {
        lines.push("");
        lines.push(`Post #${post.id || "?"} — ${safe(post.platform)} (${safe(post.type)})`);
        lines.push(`Goal: ${safe(post.goal)}`);
        lines.push(`Caption: ${safe(post.caption)}`);
        if (post.imagery) lines.push(`Imagery: ${post.imagery}`);
        if (post.cta) lines.push(`CTA: ${post.cta}`);
        if (post.hashtags?.length) lines.push(`Hashtags: ${post.hashtags.join(" ")}`);
        if (post.imagePrompts?.length) {
          lines.push("Image Prompts:");
          post.imagePrompts.forEach((p: string) => lines.push(`  • ${p}`));
        }
      }
      break;
    }
    case "CANVA_TEMPLATE": {
      for (const t of content.templates || []) {
        lines.push("");
        lines.push(`${t.name} (${safe(t.size)})`);
        if (t.typeSystem) {
          lines.push(`  Fonts: ${safe(t.typeSystem.headingFont)} / ${safe(t.typeSystem.bodyFont)}`);
        }
        t.components?.forEach((c: any) => {
          lines.push(`  Component: ${c.type} — ${safe(c.position)}`);
        });
        if (t.imagePromptPattern) lines.push(`  Prompt: ${t.imagePromptPattern}`);
        if (t.exportNotes) lines.push(`  Export: ${t.exportNotes}`);
      }
      break;
    }
    case "ACTION_30_60_90": {
      const phases = [
        { key: "days30", label: "Days 1–30" },
        { key: "days60", label: "Days 31–60" },
        { key: "days90", label: "Days 61–90" },
      ];
      for (const phase of phases) {
        const items = content[phase.key] || [];
        if (items.length === 0) continue;
        lines.push("", `${phase.label}:`);
        items.forEach((item: any) => {
          lines.push(`  ${item.title} [${safe(item.owner)}]`);
          lines.push(`    ${safe(item.details)}`);
          lines.push(`    ✓ Done when: ${safe(item.definitionOfDone)}`);
        });
      }
      break;
    }
    default:
      lines.push(JSON.stringify(content, null, 2));
  }

  return lines;
}

export async function generateStartupGaragePDF(
  planTitle: string,
  companyName: string,
  outputs: Array<{ moduleKey: string; content: any; status: string }>
): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });

  doc.fontSize(24).fillColor("#007BFF").text("Gigster Garage", 50, 50);
  doc.fontSize(10).fillColor("#666666").text("Start-up Garage Business Plan", 50, 78);
  doc.moveDown(0.5);
  doc.fontSize(18).fillColor("#0B1D3A").text(planTitle || companyName, 50, 100);
  doc.moveTo(50, 125).lineTo(545, 125).strokeColor("#dddddd").stroke();
  doc.moveDown(2);

  let y = 140;
  const pageHeight = 780;

  for (const output of outputs) {
    if (output.status !== "READY" || !output.content) continue;

    const label = MODULE_LABELS[output.moduleKey] || output.moduleKey;
    const lines = flattenContent(output.moduleKey, output.content);

    if (y > pageHeight - 60) {
      doc.addPage();
      y = 50;
    }

    doc.fontSize(16).fillColor("#007BFF").text(label, 50, y);
    y += 24;
    doc.moveTo(50, y).lineTo(545, y).strokeColor("#dddddd").stroke();
    y += 8;

    for (const line of lines) {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 50;
      }
      const indent = line.startsWith("    ") ? 30 : line.startsWith("  ") ? 15 : 0;
      const text = line.trimStart();
      if (!text) {
        y += 6;
        continue;
      }

      const isBold = !line.startsWith(" ") && line.length < 80 && !line.includes(":");
      doc.fontSize(9).fillColor(isBold ? "#0B1D3A" : "#333333");
      if (isBold) doc.font("Helvetica-Bold"); else doc.font("Helvetica");
      const textHeight = doc.heightOfString(text, { width: 495 - indent });
      doc.text(text, 50 + indent, y, { width: 495 - indent });
      y += textHeight + 3;
    }

    y += 16;
  }

  doc.end();
  return streamToBuffer(doc);
}

export async function generateStartupGarageDocx(
  planTitle: string,
  companyName: string,
  outputs: Array<{ moduleKey: string; content: any; status: string }>
): Promise<Buffer> {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      children: [new TextRun({ text: "Gigster Garage", bold: true, size: 48, color: "007BFF" })],
      alignment: AlignmentType.LEFT,
    }),
    new Paragraph({
      children: [new TextRun({ text: "Start-up Garage Business Plan", size: 20, color: "666666", italics: true })],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: planTitle || companyName, bold: true, size: 36, color: "0B1D3A" })],
      spacing: { after: 400 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" } },
    })
  );

  for (const output of outputs) {
    if (output.status !== "READY" || !output.content) continue;

    const label = MODULE_LABELS[output.moduleKey] || output.moduleKey;
    const lines = flattenContent(output.moduleKey, output.content);

    children.push(
      new Paragraph({
        children: [new TextRun({ text: label, bold: true, size: 28, color: "007BFF" })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" } },
      })
    );

    for (const line of lines) {
      const text = line.trimStart();
      if (!text) {
        children.push(new Paragraph({ spacing: { after: 80 } }));
        continue;
      }

      const indent = line.startsWith("    ") ? 600 : line.startsWith("  ") ? 300 : 0;
      const isBullet = text.startsWith("•") || text.startsWith("✓") || text.startsWith("✗") || text.startsWith("→");
      const isBold = !line.startsWith(" ") && text.length < 80 && !text.includes(":");

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: text,
              bold: isBold,
              size: 18,
              color: isBold ? "0B1D3A" : "333333",
            }),
          ],
          indent: { left: indent },
          bullet: isBullet ? { level: indent > 300 ? 1 : 0 } : undefined,
          spacing: { after: 60 },
        })
      );
    }
  }

  const doc = new Document({
    sections: [{ children }],
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 20 },
        },
      },
    },
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
