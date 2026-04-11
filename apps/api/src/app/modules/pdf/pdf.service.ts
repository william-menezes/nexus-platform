import { Injectable } from '@nestjs/common';
import { join } from 'path';
import PdfPrinter from 'pdfmake';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TDocumentDefinitions = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Content = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TableCell = any;
import {
  QuotePdfData,
  OsPdfData,
  ReceiptPdfData,
  PdfLineItem,
  TenantBranding,
} from './pdf.interfaces';

const PRIMARY = '#FF7B42';
const DARK    = '#1a1a2e';
const GRAY    = '#6B7280';
const LIGHT   = '#F9FAFB';

const FONTS_PATH = join(process.cwd(), 'node_modules/pdfmake/fonts/Roboto');

const printer = new PdfPrinter({
  Roboto: {
    normal:      join(FONTS_PATH, 'Roboto-Regular.ttf'),
    bold:        join(FONTS_PATH, 'Roboto-Medium.ttf'),
    italics:     join(FONTS_PATH, 'Roboto-Italic.ttf'),
    bolditalics: join(FONTS_PATH, 'Roboto-MediumItalic.ttf'),
  },
});

function brl(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function fmtDate(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
}

function header(tenant: TenantBranding, docTitle: string, docCode: string): Content {
  return {
    table: {
      widths: ['*', 'auto'],
      body: [[
        {
          stack: [
            { text: tenant.companyName, style: 'companyName' },
            tenant.phone ? { text: `Tel: ${tenant.phone}`, style: 'companyInfo' } : '',
            tenant.cnpj  ? { text: `CNPJ: ${tenant.cnpj}`,  style: 'companyInfo' } : '',
          ],
          border: [false, false, false, false],
        },
        {
          stack: [
            { text: docTitle, style: 'docTitle' },
            { text: docCode,  style: 'docCode'  },
          ],
          alignment: 'right',
          border: [false, false, false, false],
        },
      ]],
    },
    margin: [0, 0, 0, 16],
  };
}

function divider(): Content {
  return { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: PRIMARY }], margin: [0, 0, 0, 12] };
}

function infoRow(label: string, value: string): Content {
  return {
    columns: [
      { text: label, style: 'infoLabel', width: 120 },
      { text: value, style: 'infoValue' },
    ],
    margin: [0, 2, 0, 2],
  };
}

function itemsTable(items: PdfLineItem[]): Content {
  const rows: TableCell[][] = [
    [
      { text: 'Descrição',  style: 'tableHeader', fillColor: PRIMARY, color: '#fff' },
      { text: 'Qtd',       style: 'tableHeader', fillColor: PRIMARY, color: '#fff', alignment: 'center' },
      { text: 'Preço Unit.', style: 'tableHeader', fillColor: PRIMARY, color: '#fff', alignment: 'right' },
      { text: 'Desconto',  style: 'tableHeader', fillColor: PRIMARY, color: '#fff', alignment: 'right' },
      { text: 'Total',     style: 'tableHeader', fillColor: PRIMARY, color: '#fff', alignment: 'right' },
    ],
    ...items.map((item, i): TableCell[] => [
      { text: item.description,           style: 'tableCell', fillColor: i % 2 === 0 ? LIGHT : '#fff' },
      { text: String(item.quantity),      style: 'tableCell', fillColor: i % 2 === 0 ? LIGHT : '#fff', alignment: 'center' },
      { text: brl(item.unitPrice),        style: 'tableCell', fillColor: i % 2 === 0 ? LIGHT : '#fff', alignment: 'right' },
      { text: item.discount ? brl(item.discount) : '—', style: 'tableCell', fillColor: i % 2 === 0 ? LIGHT : '#fff', alignment: 'right' },
      { text: brl(item.totalPrice),       style: 'tableCell', fillColor: i % 2 === 0 ? LIGHT : '#fff', alignment: 'right' },
    ]),
  ];

  return {
    table: { headerRows: 1, widths: ['*', 48, 80, 70, 80], body: rows },
    layout: { hLineColor: () => '#E5E7EB', vLineColor: () => '#E5E7EB' },
    margin: [0, 12, 0, 0],
  };
}

function totalsBlock(subtotal: number, discountAmount: number, total: number): Content {
  return {
    table: {
      widths: ['*', 120],
      body: [
        [{ text: 'Subtotal', alignment: 'right', style: 'totalLabel', border: [false,false,false,false] },
         { text: brl(subtotal), alignment: 'right', style: 'totalValue', border: [false,false,false,false] }],
        ...(discountAmount > 0 ? [[
          { text: 'Desconto', alignment: 'right', style: 'totalLabel', border: [false,false,false,false] },
          { text: `- ${brl(discountAmount)}`, alignment: 'right', style: 'totalLabel', color: '#EF4444', border: [false,false,false,false] },
        ]] : []),
        [{ text: 'TOTAL', alignment: 'right', style: 'grandTotalLabel', border: [false, true, false, false], borderColor: ['','#E5E7EB','',''] },
         { text: brl(total), alignment: 'right', style: 'grandTotalValue', border: [false, true, false, false], borderColor: ['','#E5E7EB','',''] }],
      ],
    },
    margin: [0, 8, 0, 0],
  };
}

function styles() {
  return {
    companyName:    { fontSize: 16, bold: true, color: DARK },
    companyInfo:    { fontSize: 9,  color: GRAY },
    docTitle:       { fontSize: 14, bold: true, color: PRIMARY },
    docCode:        { fontSize: 11, color: GRAY },
    infoLabel:      { fontSize: 9,  bold: true, color: GRAY },
    infoValue:      { fontSize: 9,  color: DARK },
    sectionHeader:  { fontSize: 10, bold: true, color: PRIMARY, margin: [0, 12, 0, 4] },
    tableHeader:    { fontSize: 9,  bold: true },
    tableCell:      { fontSize: 9 },
    totalLabel:     { fontSize: 10, color: GRAY },
    totalValue:     { fontSize: 10, color: DARK },
    grandTotalLabel:{ fontSize: 12, bold: true, color: DARK },
    grandTotalValue:{ fontSize: 12, bold: true, color: PRIMARY },
    noteText:       { fontSize: 9,  color: GRAY, italics: true },
    signatureLine:  { fontSize: 9,  color: GRAY },
  };
}

function buildPdf(docDef: TDocumentDefinitions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = printer.createPdfKitDocument(docDef);
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

@Injectable()
export class PdfService {
  async generateQuotePdf(data: QuotePdfData): Promise<Buffer> {
    const docDef: TDocumentDefinitions = {
      defaultStyle: { font: 'Roboto', fontSize: 10 },
      pageMargins: [40, 40, 40, 60],
      styles: styles(),
      footer: (currentPage, pageCount) => ({
        text: `Página ${currentPage} de ${pageCount} — gerado em ${fmtDate(new Date())}`,
        alignment: 'center', fontSize: 8, color: GRAY, margin: [0, 10, 0, 0],
      }),
      content: [
        header(data.tenant, 'ORÇAMENTO', data.code),
        divider(),
        { text: 'DADOS DO ORÇAMENTO', style: 'sectionHeader' },
        infoRow('Data:', fmtDate(data.createdAt)),
        data.validUntil ? infoRow('Válido até:', fmtDate(data.validUntil)) : '',
        infoRow('Cliente:', data.clientName),
        data.clientPhone ? infoRow('Telefone:', data.clientPhone) : '',
        data.clientEmail ? infoRow('E-mail:', data.clientEmail) : '',
        data.employeeName ? infoRow('Responsável:', data.employeeName) : '',
        data.description ? [
          { text: 'DESCRIÇÃO DO SERVIÇO', style: 'sectionHeader' },
          { text: data.description, style: 'noteText' },
        ] : '',
        { text: 'ITENS', style: 'sectionHeader' },
        itemsTable(data.items),
        totalsBlock(data.subtotal, data.discountAmount, data.total),
        data.notes ? [
          { text: 'OBSERVAÇÕES', style: 'sectionHeader' },
          { text: data.notes, style: 'noteText' },
        ] : '',
        { text: '\n\n\n' },
        {
          columns: [
            { stack: [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1, lineColor: GRAY }] },
              { text: 'Assinatura do Cliente', style: 'signatureLine', alignment: 'center', margin: [0, 4, 0, 0] },
            ]},
            { text: '' },
            { stack: [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1, lineColor: GRAY }] },
              { text: 'Assinatura da Empresa', style: 'signatureLine', alignment: 'center', margin: [0, 4, 0, 0] },
            ]},
          ],
          margin: [0, 16, 0, 0],
        },
      ].flat().filter(Boolean),
    };
    return buildPdf(docDef);
  }

  async generateServiceOrderPdf(data: OsPdfData): Promise<Buffer> {
    const docDef: TDocumentDefinitions = {
      defaultStyle: { font: 'Roboto', fontSize: 10 },
      pageMargins: [40, 40, 40, 60],
      styles: styles(),
      footer: (currentPage, pageCount) => ({
        text: `Página ${currentPage} de ${pageCount} — gerado em ${fmtDate(new Date())}`,
        alignment: 'center', fontSize: 8, color: GRAY, margin: [0, 10, 0, 0],
      }),
      content: [
        header(data.tenant, 'ORDEM DE SERVIÇO', data.code),
        divider(),
        { text: 'DADOS DA OS', style: 'sectionHeader' },
        infoRow('Data:', fmtDate(data.createdAt)),
        infoRow('Cliente:', data.clientName),
        data.clientPhone ? infoRow('Telefone:', data.clientPhone) : '',
        data.employeeName ? infoRow('Técnico:', data.employeeName) : '',
        data.equipmentInfo ? infoRow('Equipamento:', data.equipmentInfo) : '',
        data.warrantyUntil ? infoRow('Garantia até:', fmtDate(data.warrantyUntil)) : '',
        data.description ? [
          { text: 'DESCRIÇÃO DO PROBLEMA', style: 'sectionHeader' },
          { text: data.description, style: 'noteText' },
        ] : '',
        data.items.length > 0 ? [
          { text: 'SERVIÇOS E PEÇAS', style: 'sectionHeader' },
          itemsTable(data.items),
          totalsBlock(data.subtotal, data.discountAmount, data.total),
        ] : '',
        data.notes ? [
          { text: 'OBSERVAÇÕES', style: 'sectionHeader' },
          { text: data.notes, style: 'noteText' },
        ] : '',
        { text: '\n\n\n' },
        {
          columns: [
            { stack: [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1, lineColor: GRAY }] },
              { text: 'Assinatura do Cliente', style: 'signatureLine', alignment: 'center', margin: [0, 4, 0, 0] },
            ]},
            { text: '' },
            { stack: [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1, lineColor: GRAY }] },
              { text: 'Assinatura da Empresa', style: 'signatureLine', alignment: 'center', margin: [0, 4, 0, 0] },
            ]},
          ],
          margin: [0, 16, 0, 0],
        },
      ].flat().filter(Boolean),
    };
    return buildPdf(docDef);
  }

  async generateReceiptPdf(data: ReceiptPdfData): Promise<Buffer> {
    const paymentMethodMap: Record<string, string> = {
      cash: 'Dinheiro', credit: 'Cartão de Crédito', debit: 'Cartão de Débito',
      pix: 'PIX', boleto: 'Boleto', transfer: 'Transferência',
    };

    const docDef: TDocumentDefinitions = {
      defaultStyle: { font: 'Roboto', fontSize: 10 },
      pageMargins: [40, 40, 40, 60],
      styles: styles(),
      footer: (currentPage, pageCount) => ({
        text: `Página ${currentPage} de ${pageCount} — gerado em ${fmtDate(new Date())}`,
        alignment: 'center', fontSize: 8, color: GRAY, margin: [0, 10, 0, 0],
      }),
      content: [
        header(data.tenant, 'RECIBO DE VENDA', data.code),
        divider(),
        { text: 'DADOS DA VENDA', style: 'sectionHeader' },
        infoRow('Data:', fmtDate(data.createdAt)),
        data.clientName ? infoRow('Cliente:', data.clientName) : '',
        { text: 'ITENS', style: 'sectionHeader' },
        itemsTable(data.items),
        totalsBlock(data.subtotal, data.discountAmount, data.total),
        { text: 'PAGAMENTOS', style: 'sectionHeader' },
        {
          table: {
            widths: ['*', 100],
            body: data.payments.map(p => [
              { text: paymentMethodMap[p.method] ?? p.method, style: 'tableCell', border: [false,false,false,true], borderColor: ['','','','#E5E7EB'] },
              { text: brl(p.amount), style: 'tableCell', alignment: 'right', border: [false,false,false,true], borderColor: ['','','','#E5E7EB'] },
            ]),
          },
          margin: [0, 4, 0, 0],
        },
      ].flat().filter(Boolean),
    };
    return buildPdf(docDef);
  }
}
