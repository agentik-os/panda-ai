/**
 * PDF Export Utilities
 *
 * Professional PDF export for cost analytics using jsPDF
 */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Extend jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

/**
 * Format date for display
 */
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format currency
 */
function formatCurrency(amount: number): string {
  return `$${amount.toFixed(4)}`;
}

/**
 * Add Agentik OS branding header to PDF
 */
function addHeader(doc: jsPDF, title: string, dateRange: string) {
  // Agentik OS branding colors (purple accent)
  const accentColor = [108, 99, 255] as const; // Purple

  // Header background
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(0, 0, doc.internal.pageSize.width, 40, "F");

  // Logo text (since we don't have an actual logo file)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Agentik OS", 20, 20);

  // Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "normal");
  doc.text(title, 20, 32);

  // Date range
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  doc.text(dateRange, doc.internal.pageSize.width - 20, 20, { align: "right" });

  // Reset text color
  doc.setTextColor(0, 0, 0);
}

/**
 * Add footer to PDF
 */
function addFooter(doc: jsPDF) {
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;

  // Footer line
  doc.setDrawColor(200, 200, 200);
  doc.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);

  // Footer text
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Generated on ${formatDate(Date.now())} | Agentik OS Cost Analytics`,
    pageWidth / 2,
    pageHeight - 12,
    { align: "center" }
  );

  // Page number
  doc.text(
    `Page ${doc.getCurrentPageInfo().pageNumber}`,
    pageWidth - 20,
    pageHeight - 12,
    { align: "right" }
  );
}

/**
 * Export cost report to PDF
 */
export function exportCostPDF(
  data: {
    summary: {
      totalCost: number;
      totalAgents: number;
      totalModels: number;
      totalTokens: number;
      dateRange: string;
    };
    costsByAgent?: Array<{
      agentId: string;
      agentName: string;
      totalCost: number;
      totalTokens: number;
      requestCount: number;
    }>;
    costsByModel?: Array<{
      model: string;
      provider: string;
      totalCost: number;
      totalTokens: number;
      requestCount: number;
    }>;
    costHistory?: Array<{
      timestamp: number;
      totalCost: number;
      totalTokens: number;
      requestCount: number;
    }>;
  },
  filename?: string
) {
  const doc = new jsPDF();
  let yPos = 50;

  // Header
  addHeader(doc, "Cost Analytics Report", data.summary.dateRange);

  // Summary Section
  yPos += 10;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Executive Summary", 20, yPos);

  yPos += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const summaryData = [
    ["Total Cost", formatCurrency(data.summary.totalCost)],
    ["Active Agents", data.summary.totalAgents.toString()],
    ["Models Used", data.summary.totalModels.toString()],
    ["Total Tokens", (data.summary.totalTokens / 1000000).toFixed(2) + "M"],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [["Metric", "Value"]],
    body: summaryData,
    theme: "grid",
    headStyles: { fillColor: [108, 99, 255], textColor: 255 },
    margin: { left: 20, right: 20 },
    tableWidth: "wrap",
    columnStyles: {
      0: { cellWidth: 60, fontStyle: "bold" },
      1: { cellWidth: 60, halign: "right" },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 20;

  // Agent Cost Breakdown
  if (data.costsByAgent && data.costsByAgent.length > 0) {
    if (yPos > 200) {
      doc.addPage();
      addHeader(doc, "Cost Analytics Report", data.summary.dateRange);
      yPos = 50;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Cost by Agent", 20, yPos);

    yPos += 10;

    const agentTableData = data.costsByAgent.slice(0, 15).map((item) => [
      item.agentName,
      formatCurrency(item.totalCost),
      item.requestCount.toString(),
      (item.totalTokens / 1000).toFixed(1) + "K",
      formatCurrency(item.totalCost / item.requestCount),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Agent", "Total Cost", "Requests", "Tokens", "Avg/Request"]],
      body: agentTableData,
      theme: "striped",
      headStyles: { fillColor: [108, 99, 255], textColor: 255 },
      margin: { left: 20, right: 20 },
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 20;
  }

  // Model Cost Breakdown
  if (data.costsByModel && data.costsByModel.length > 0) {
    if (yPos > 200) {
      doc.addPage();
      addHeader(doc, "Cost Analytics Report", data.summary.dateRange);
      yPos = 50;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Cost by Model", 20, yPos);

    yPos += 10;

    const modelTableData = data.costsByModel.map((item) => [
      item.model,
      item.provider,
      formatCurrency(item.totalCost),
      item.requestCount.toString(),
      formatCurrency(item.totalCost / item.requestCount),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Model", "Provider", "Total Cost", "Requests", "Avg/Request"]],
      body: modelTableData,
      theme: "striped",
      headStyles: { fillColor: [108, 99, 255], textColor: 255 },
      margin: { left: 20, right: 20 },
      columnStyles: {
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 20;
  }

  // Cost History
  if (data.costHistory && data.costHistory.length > 0) {
    if (yPos > 200) {
      doc.addPage();
      addHeader(doc, "Cost Analytics Report", data.summary.dateRange);
      yPos = 50;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Cost Trend (Last 7 Days)", 20, yPos);

    yPos += 10;

    const historyTableData = data.costHistory.slice(-7).map((item) => [
      formatDate(item.timestamp),
      formatCurrency(item.totalCost),
      item.requestCount.toString(),
      (item.totalTokens / 1000).toFixed(1) + "K",
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Date", "Total Cost", "Requests", "Tokens"]],
      body: historyTableData,
      theme: "striped",
      headStyles: { fillColor: [108, 99, 255], textColor: 255 },
      margin: { left: 20, right: 20 },
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right" },
      },
    });
  }

  // Footer
  addFooter(doc);

  // Save PDF
  const defaultFilename = `agentik-cost-report-${new Date().toISOString().split("T")[0]!}.pdf`;
  doc.save(filename || defaultFilename);
}

/**
 * Export agent-specific cost report to PDF
 */
export function exportAgentCostPDF(
  agentName: string,
  data: {
    totalCost: number;
    totalTokens: number;
    requestCount: number;
    model: string;
    costHistory: Array<{
      timestamp: number;
      totalCost: number;
      totalTokens: number;
      requestCount: number;
    }>;
  },
  filename?: string
) {
  const doc = new jsPDF();
  let yPos = 50;

  addHeader(doc, `Agent Report: ${agentName}`, `Generated ${formatDate(Date.now())}`);

  // Agent Summary
  yPos += 10;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Agent Summary", 20, yPos);

  yPos += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const summaryData = [
    ["Agent Name", agentName],
    ["Model", data.model],
    ["Total Cost", formatCurrency(data.totalCost)],
    ["Total Requests", data.requestCount.toString()],
    ["Total Tokens", (data.totalTokens / 1000000).toFixed(2) + "M"],
    ["Avg Cost/Request", formatCurrency(data.totalCost / data.requestCount)],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [["Metric", "Value"]],
    body: summaryData,
    theme: "grid",
    headStyles: { fillColor: [108, 99, 255], textColor: 255 },
    margin: { left: 20, right: 20 },
    tableWidth: "wrap",
    columnStyles: {
      0: { cellWidth: 70, fontStyle: "bold" },
      1: { cellWidth: 70 },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 20;

  // Cost History
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Cost History", 20, yPos);

  yPos += 10;

  const historyData = data.costHistory.map((item) => [
    formatDate(item.timestamp),
    formatCurrency(item.totalCost),
    item.requestCount.toString(),
    (item.totalTokens / 1000).toFixed(1) + "K",
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Date", "Cost", "Requests", "Tokens"]],
    body: historyData,
    theme: "striped",
    headStyles: { fillColor: [108, 99, 255], textColor: 255 },
    margin: { left: 20, right: 20 },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
    },
  });

  addFooter(doc);

  const defaultFilename = `agentik-agent-${agentName.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]!}.pdf`;
  doc.save(filename || defaultFilename);
}
