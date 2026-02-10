import PDFDocument from 'pdfkit';

const COLORS = {
  primary: '#007BFF',
  secondary: '#0B1D3A',
  text: '#333333',
  lightGray: '#666666',
  border: '#dddddd',
  background: '#f8f9fa',
  white: '#ffffff',
};

function streamToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

function escapeText(text: string | null | undefined): string {
  if (!text) return '';
  return String(text);
}

function addFlowingText(doc: PDFKit.PDFDocument, text: string, x: number, startY: number, options: { width: number; fontSize?: number; color?: string; lineGap?: number }): number {
  const contentWidth = options.width;
  const fontSize = options.fontSize || 10;
  const color = options.color || COLORS.text;
  const lineGap = options.lineGap || 4;
  const pageBottom = doc.page.height - 80;

  doc.fontSize(fontSize).fillColor(color);

  const paragraphs = text.split('\n');
  let currentY = startY;

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (trimmed === '') {
      currentY += fontSize + lineGap;
      if (currentY > pageBottom) {
        doc.addPage();
        currentY = 50;
      }
      continue;
    }

    const textHeight = doc.heightOfString(trimmed, { width: contentWidth, lineGap });
    if (currentY + textHeight > pageBottom) {
      doc.addPage();
      currentY = 50;
    }

    doc.fontSize(fontSize).fillColor(color);
    doc.text(trimmed, x, currentY, { width: contentWidth, lineGap });
    currentY += textHeight + lineGap;
  }

  return currentY;
}

function addFootersToAllPages(doc: PDFKit.PDFDocument, footerLines: string[]): void {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const pageHeight = doc.page.height;
    doc.strokeColor(COLORS.border).lineWidth(1).moveTo(50, pageHeight - 60).lineTo(doc.page.width - 50, pageHeight - 60).stroke();
    doc.fontSize(9).fillColor(COLORS.lightGray);
    let footerY = pageHeight - 50;
    for (const line of footerLines) {
      doc.text(line, 50, footerY, { align: 'center', width: doc.page.width - 100 });
      footerY += 12;
    }
  }
}

function formatCurrency(amount: number | string | null | undefined): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
  return `$${num.toFixed(2)}`;
}

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export async function generateInvoicePDF(invoice: any): Promise<Buffer> {
  const doc = new PDFDocument({ 
    size: 'A4', 
    margin: 50,
    bufferPages: true
  });

  const lineItems = Array.isArray(invoice.lineItems) ? invoice.lineItems : [];
  
  doc.fontSize(28).fillColor(COLORS.primary).text('Gigster Garage', 50, 50);
  doc.fontSize(10).fillColor(COLORS.lightGray).text('Simplified Workflow Hub', 50, 80);
  
  doc.fontSize(24).fillColor(COLORS.primary).text('INVOICE', 400, 50, { align: 'right' });
  doc.fontSize(10).fillColor(COLORS.text);
  doc.text(`Invoice #: ${escapeText(invoice.invoiceNumber || invoice.id)}`, 400, 80, { align: 'right' });
  doc.text(`Date: ${formatDate(invoice.createdAt)}`, 400, 95, { align: 'right' });
  if (invoice.dueDate) {
    doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, 400, 110, { align: 'right' });
  }

  doc.strokeColor(COLORS.primary).lineWidth(2).moveTo(50, 130).lineTo(545, 130).stroke();

  doc.fontSize(12).fillColor(COLORS.primary).text('Bill To:', 50, 150);
  doc.fontSize(11).fillColor(COLORS.text);
  doc.text(escapeText(invoice.clientName), 50, 168);
  if (invoice.clientEmail) {
    doc.text(escapeText(invoice.clientEmail), 50, 183);
  }
  if (invoice.clientAddress) {
    doc.text(escapeText(invoice.clientAddress), 50, 198);
  }

  const tableTop = 250;
  const colWidths = { desc: 250, qty: 60, rate: 80, amount: 80 };
  const colX = { desc: 50, qty: 300, rate: 370, amount: 460 };

  doc.rect(50, tableTop, 495, 25).fill(COLORS.primary);
  doc.fontSize(10).fillColor(COLORS.white);
  doc.text('Description', colX.desc + 5, tableTop + 7);
  doc.text('Qty', colX.qty + 5, tableTop + 7);
  doc.text('Rate', colX.rate + 5, tableTop + 7);
  doc.text('Amount', colX.amount + 5, tableTop + 7);

  let currentY = tableTop + 30;
  doc.fillColor(COLORS.text);
  
  lineItems.forEach((item: any, index: number) => {
    const bgColor = index % 2 === 0 ? COLORS.white : COLORS.background;
    doc.rect(50, currentY - 5, 495, 25).fill(bgColor);
    
    doc.fillColor(COLORS.text).fontSize(10);
    doc.text(escapeText(item.description), colX.desc + 5, currentY);
    doc.text(String(item.quantity || 1), colX.qty + 5, currentY);
    doc.text(formatCurrency(item.rate || item.unitPrice), colX.rate + 5, currentY);
    doc.text(formatCurrency(item.amount || (item.quantity || 1) * (item.rate || item.unitPrice || 0)), colX.amount + 5, currentY);
    
    currentY += 25;
  });

  currentY += 20;
  
  const totalsX = 370;
  const totalsValueX = 460;
  
  doc.fontSize(10).fillColor(COLORS.text);
  doc.text('Subtotal:', totalsX, currentY);
  doc.text(formatCurrency(invoice.subtotal || invoice.totalAmount), totalsValueX, currentY);
  currentY += 18;
  
  if (invoice.taxAmount && parseFloat(invoice.taxAmount) > 0) {
    doc.text('Tax:', totalsX, currentY);
    doc.text(formatCurrency(invoice.taxAmount), totalsValueX, currentY);
    currentY += 18;
  }
  
  if (invoice.discount && parseFloat(invoice.discount) > 0) {
    doc.text('Discount:', totalsX, currentY);
    doc.text(`-${formatCurrency(invoice.discount)}`, totalsValueX, currentY);
    currentY += 18;
  }

  currentY += 5;
  doc.rect(totalsX - 10, currentY - 5, 195, 30).fill(COLORS.primary);
  doc.fontSize(12).fillColor(COLORS.white);
  doc.text('Total Due:', totalsX, currentY + 3);
  doc.text(formatCurrency(invoice.totalAmount), totalsValueX, currentY + 3);

  currentY += 50;
  if (invoice.paymentTerms || invoice.notes) {
    doc.rect(50, currentY, 495, 60).fill(COLORS.background);
    doc.strokeColor(COLORS.primary).lineWidth(3).moveTo(50, currentY).lineTo(50, currentY + 60).stroke();
    
    doc.fontSize(10).fillColor(COLORS.primary).text('Payment Terms:', 60, currentY + 10);
    doc.fontSize(9).fillColor(COLORS.text);
    doc.text(escapeText(invoice.paymentTerms || invoice.notes || 'Payment due upon receipt'), 60, currentY + 25, {
      width: 475
    });
  }

  if (invoice.paymentUrl) {
    currentY += 80;
    doc.rect(50, currentY, 495, 80).fill(COLORS.primary);
    doc.fontSize(14).fillColor(COLORS.white).text('Pay Online', 50, currentY + 15, { align: 'center', width: 495 });
    doc.fontSize(10).text('Click the link below to pay securely online:', 50, currentY + 35, { align: 'center', width: 495 });
    doc.fontSize(9).fillColor('#ffff00').text(invoice.paymentUrl, 50, currentY + 55, { align: 'center', width: 495, link: invoice.paymentUrl });
  }

  const pageHeight = doc.page.height;
  doc.fontSize(9).fillColor(COLORS.lightGray);
  doc.text('Gigster Garage - Simplified Workflow Hub', 50, pageHeight - 50, { align: 'center', width: 495 });
  doc.text(`Generated on ${formatDate(new Date())}`, 50, pageHeight - 38, { align: 'center', width: 495 });

  doc.end();
  return streamToBuffer(doc);
}

export async function generateProposalPDF(proposal: any): Promise<Buffer> {
  const doc = new PDFDocument({ 
    size: 'A4', 
    margin: 50,
    bufferPages: true
  });

  doc.rect(0, 0, doc.page.width, 100).fill(COLORS.primary);
  doc.fontSize(28).fillColor(COLORS.white).text('Gigster Garage', 50, 30, { align: 'center', width: doc.page.width - 100 });
  doc.fontSize(12).text('Simplified Workflow Hub', 50, 60, { align: 'center', width: doc.page.width - 100 });

  doc.fontSize(22).fillColor(COLORS.primary).text(escapeText(proposal.title), 50, 130, { align: 'center', width: doc.page.width - 100 });

  const infoY = 180;
  doc.rect(50, infoY, doc.page.width - 100, 80).fill(COLORS.background);
  doc.strokeColor(COLORS.primary).lineWidth(3).moveTo(50, infoY).lineTo(50, infoY + 80).stroke();
  
  doc.fontSize(12).fillColor(COLORS.primary).text('Prepared For:', 60, infoY + 10);
  doc.fontSize(11).fillColor(COLORS.text);
  doc.text(`Client: ${escapeText(proposal.clientName)}`, 60, infoY + 28);
  if (proposal.clientEmail) {
    doc.text(`Email: ${escapeText(proposal.clientEmail)}`, 60, infoY + 43);
  }
  doc.text(`Date: ${formatDate(proposal.createdAt)}`, 60, infoY + 58);

  let currentY = infoY + 100;

  if (proposal.content) {
    doc.fontSize(14).fillColor(COLORS.primary).text('Proposal Details', 50, currentY);
    doc.strokeColor(COLORS.primary).lineWidth(1).moveTo(50, currentY + 18).lineTo(200, currentY + 18).stroke();
    currentY += 30;
    
    currentY = addFlowingText(doc, escapeText(proposal.content), 50, currentY, {
      width: doc.page.width - 100,
      fontSize: 10,
      color: COLORS.text
    });
  }

  addFootersToAllPages(doc, [
    'Gigster Garage - Professional Project Management & Client Collaboration Platform',
    `Generated on ${formatDate(new Date())}`
  ]);

  doc.end();
  return streamToBuffer(doc);
}

export async function generateContractPDF(contract: any): Promise<Buffer> {
  const doc = new PDFDocument({ 
    size: 'A4', 
    margin: 50,
    bufferPages: true
  });

  doc.rect(0, 0, doc.page.width, 100).fill(COLORS.secondary);
  doc.fontSize(28).fillColor(COLORS.white).text('Gigster Garage', 50, 30, { align: 'center', width: doc.page.width - 100 });
  doc.fontSize(12).text('Service Contract', 50, 60, { align: 'center', width: doc.page.width - 100 });

  doc.fontSize(20).fillColor(COLORS.secondary).text(escapeText(contract.title || contract.contractTitle || 'Service Contract'), 50, 120, { align: 'center', width: doc.page.width - 100 });

  let currentY = 160;

  doc.rect(50, currentY, doc.page.width - 100, 70).fill(COLORS.background);
  doc.fontSize(12).fillColor(COLORS.secondary).text('Contract Parties', 60, currentY + 10);
  doc.fontSize(10).fillColor(COLORS.text);
  doc.text(`Service Provider: Gigster Garage`, 60, currentY + 28);
  doc.text(`Client: ${escapeText(contract.clientName)}`, 60, currentY + 43);
  doc.text(`Contract Value: ${formatCurrency(contract.contractValue)}`, 300, currentY + 28);
  doc.text(`Date: ${formatDate(contract.contractDate || contract.createdAt)}`, 300, currentY + 43);

  currentY += 90;

  const sections = [
    { title: 'Scope of Work', content: contract.scope },
    { title: 'Deliverables', content: contract.deliverables },
    { title: 'Payment Terms', content: contract.paymentTerms },
    { title: 'Responsibilities', content: contract.responsibilities },
    { title: 'Legal Terms', content: contract.legalTerms },
    { title: 'Confidentiality', content: contract.confidentiality },
  ];

  sections.forEach(section => {
    if (section.content) {
      if (currentY > doc.page.height - 150) {
        doc.addPage();
        currentY = 50;
      }
      
      doc.fontSize(12).fillColor(COLORS.secondary).text(section.title, 50, currentY);
      doc.strokeColor(COLORS.secondary).lineWidth(1).moveTo(50, currentY + 15).lineTo(180, currentY + 15).stroke();
      currentY += 25;
      
      currentY = addFlowingText(doc, escapeText(section.content), 50, currentY, {
        width: doc.page.width - 100,
        fontSize: 10,
        color: COLORS.text
      });
      currentY += 10;
    }
  });

  if (currentY > doc.page.height - 200) {
    doc.addPage();
    currentY = 50;
  }

  currentY += 30;
  doc.fontSize(12).fillColor(COLORS.secondary).text('Signatures', 50, currentY);
  currentY += 30;

  doc.strokeColor(COLORS.border).lineWidth(1);
  doc.moveTo(50, currentY + 30).lineTo(230, currentY + 30).stroke();
  doc.moveTo(300, currentY + 30).lineTo(480, currentY + 30).stroke();
  
  doc.fontSize(10).fillColor(COLORS.text);
  doc.text('Client Signature', 50, currentY + 35);
  doc.text(escapeText(contract.clientName), 50, currentY + 50);
  doc.text('Date: _______________', 50, currentY + 65);
  
  doc.text('Service Provider', 300, currentY + 35);
  doc.text('Gigster Garage', 300, currentY + 50);
  doc.text('Date: _______________', 300, currentY + 65);

  addFootersToAllPages(doc, [
    'This contract is governed by applicable laws and regulations.',
    'Generated by Gigster Garage - Simplified Workflow Hub'
  ]);

  doc.end();
  return streamToBuffer(doc);
}

export async function generatePresentationPDF(presentation: any): Promise<Buffer> {
  const slides = Array.isArray(presentation.slides) ? presentation.slides.sort((a: any, b: any) => a.order - b.order) : [];
  
  const doc = new PDFDocument({ 
    size: 'A4', 
    margin: 50,
    bufferPages: true
  });

  if (slides.length === 0) {
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.secondary);
    doc.fontSize(36).fillColor(COLORS.white).text(escapeText(presentation.title || 'Presentation'), 50, doc.page.height / 2 - 50, { align: 'center', width: doc.page.width - 100 });
    if (presentation.subtitle) {
      doc.fontSize(18).text(escapeText(presentation.subtitle), 50, doc.page.height / 2 + 10, { align: 'center', width: doc.page.width - 100 });
    }
  } else {
    slides.forEach((slide: any, index: number) => {
      if (index > 0) {
        doc.addPage();
      }

      if (slide.slideType === 'title' && index === 0) {
        doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.secondary);
        doc.fontSize(36).fillColor(COLORS.white).text(escapeText(presentation.title || slide.title), 50, doc.page.height / 3, { align: 'center', width: doc.page.width - 100 });
        
        if (presentation.subtitle) {
          doc.fontSize(18).text(escapeText(presentation.subtitle), 50, doc.page.height / 3 + 60, { align: 'center', width: doc.page.width - 100 });
        }
        
        let authorY = doc.page.height / 2 + 50;
        if (presentation.author) {
          doc.fontSize(14).text(escapeText(presentation.author), 50, authorY, { align: 'center', width: doc.page.width - 100 });
          authorY += 25;
        }
        if (presentation.company) {
          doc.fontSize(12).fillColor('#cccccc').text(escapeText(presentation.company), 50, authorY, { align: 'center', width: doc.page.width - 100 });
          authorY += 25;
        }
        if (presentation.date) {
          doc.fontSize(11).text(escapeText(presentation.date), 50, authorY, { align: 'center', width: doc.page.width - 100 });
        }
      } else {
        doc.fontSize(28).fillColor(COLORS.secondary).text(escapeText(slide.title || 'Slide'), 50, 50);
        
        doc.strokeColor(COLORS.primary).lineWidth(2).moveTo(50, 85).lineTo(200, 85).stroke();
        
        if (slide.content) {
          addFlowingText(doc, escapeText(slide.content), 50, 110, {
            width: doc.page.width - 100,
            fontSize: 12,
            color: COLORS.text,
            lineGap: 5
          });
        }
      }

      doc.fontSize(10).fillColor(COLORS.lightGray).text(`${index + 1} / ${slides.length}`, doc.page.width - 80, doc.page.height - 40);
    });
  }

  doc.end();
  return streamToBuffer(doc);
}
