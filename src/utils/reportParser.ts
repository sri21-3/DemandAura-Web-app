import { MarkdownReportResponse, SegmentationRecord } from '../types/models';

export interface ParsedSummaryRow {
  clusterLabel: number;
  marketCount: number;
  clusterName: string;
  keyInsightsSummary: string;
}

export interface ParsedClusterBreakdown {
  clusterLabel: number;
  clusterName: string;
  recordCountText: string;
  marketCount: number;
  keyInsightsSummary: string;
  metricTrends: string;
  businessInterpretation: string;
  businessUseCase: string;
  coreBusinessQuestion: string;
  additionalBullets: { label: string; value: string }[];
  markets: SegmentationRecord[];
}

export interface ParsedSegmentationReport {
  reportTitle: string;
  markdownHeader: string;
  summaryRows: ParsedSummaryRow[];
  clusters: ParsedClusterBreakdown[];
  clusterMap: Record<number, ParsedClusterBreakdown>;
  rawContent: string;
}

function cleanMarkdownInline(text: string): string {
  return text
    .replace(/^\*\*|\*\*$/g, '')
    .replace(/^\*|\*$/g, '')
    .replace(/^"|"$/g, '')
    .replace(/^“|”$/g, '')
    .trim();
}

function stripBoldAndQuotes(text: string): string {
  let cleaned = text.trim();
  // Remove wrapping asterisks for italics/bold
  cleaned = cleaned.replace(/^\*+|\*+$/g, '').trim();
  // Remove wrapping quotes
  cleaned = cleaned.replace(/^["“]|["”]$/g, '').trim();
  // Remove remaining inline bold markers if any
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1');
  return cleaned.trim();
}

/**
 * Dynamically parses the live Markdown reports returned by:
 * - GET /reports/market-segmentation
 * - GET /reports/4-weeks-segmentation
 *
 * Designed to adapt automatically every week as cluster counts, names,
 * metrics, and business interpretations update in the backend pipeline.
 */
export function parseSegmentationReport(
  report: MarkdownReportResponse | null | undefined,
  datasetRows: SegmentationRecord[] = []
): ParsedSegmentationReport | null {
  if (!report || !report.content || !report.content.trim()) {
    return null;
  }

  const rawContent = report.content;
  const lines = rawContent.split(/\r?\n/);

  let markdownHeader = report.report_title || 'Market Segmentation Report';
  for (const line of lines) {
    const h1Match = line.match(/^#\s+(.+)$/);
    if (h1Match) {
      markdownHeader = h1Match[1].trim();
      break;
    }
  }

  // 1. Parse SECTION 1: SUMMARY TABLE
  const summaryRows: ParsedSummaryRow[] = [];
  const summaryMap = new Map<number, ParsedSummaryRow>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) continue;

    const cells = trimmed
      .slice(1, -1)
      .split('|')
      .map((c) => c.trim());

    if (cells.length < 4) continue;

    // Skip header or alignment separator rows
    const firstCellClean = cleanMarkdownInline(cells[0]);
    if (
      firstCellClean.toLowerCase().includes('cluster_label') ||
      firstCellClean.includes('---') ||
      firstCellClean.includes(':---')
    ) {
      continue;
    }

    const labelNum = Number.parseInt(
      firstCellClean.replace(/[^0-9-]/g, ''),
      10
    );
    if (Number.isNaN(labelNum)) continue;

    const countNum =
      Number.parseInt(
        cleanMarkdownInline(cells[1]).replace(/[^0-9]/g, ''),
        10
      ) || 0;
    const clusterName = cleanMarkdownInline(cells[2]);
    const keyInsightsSummary = stripBoldAndQuotes(cells[3]);

    const rowObj: ParsedSummaryRow = {
      clusterLabel: labelNum,
      marketCount: countNum,
      clusterName,
      keyInsightsSummary,
    };
    summaryRows.push(rowObj);
    summaryMap.set(labelNum, rowObj);
  }

  // 2. Parse SECTION 2: DETAILED CLUSTER BREAKDOWN
  const breakdownMap = new Map<
    number,
    {
      clusterLabel: number;
      clusterName: string;
      recordCountText: string;
      metricTrends: string;
      businessInterpretation: string;
      businessUseCase: string;
      coreBusinessQuestion: string;
      additionalBullets: { label: string; value: string }[];
    }
  >();

  let currentClusterId: number | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Match e.g. "### Cluster 0: High-Income Latent Demand"
    const clusterHeadingMatch = trimmed.match(
      /^###\s+Cluster\s+(-?\d+)\s*:\s*(.+)$/i
    );
    if (clusterHeadingMatch) {
      const labelNum = Number.parseInt(clusterHeadingMatch[1], 10);
      const name = cleanMarkdownInline(clusterHeadingMatch[2]);
      currentClusterId = labelNum;
      breakdownMap.set(labelNum, {
        clusterLabel: labelNum,
        clusterName: name,
        recordCountText: '',
        metricTrends: '',
        businessInterpretation: '',
        businessUseCase: '',
        coreBusinessQuestion: '',
        additionalBullets: [],
      });
      continue;
    }

    // Stop if another H2 section starts after Section 2
    if (
      currentClusterId !== null &&
      trimmed.startsWith('## ') &&
      !trimmed.toUpperCase().includes('DETAILED CLUSTER')
    ) {
      currentClusterId = null;
      continue;
    }

    if (currentClusterId !== null) {
      const currentEntry = breakdownMap.get(currentClusterId);
      if (!currentEntry) continue;

      // Match bullet lines like "- **Metric Trends**: ..."
      const bulletMatch = trimmed.match(/^-\s+\*\*(.+?)\*\*\s*:\s*(.+)$/);
      if (bulletMatch) {
        const rawKey = bulletMatch[1].trim().toLowerCase();
        const rawVal = stripBoldAndQuotes(bulletMatch[2]);

        if (rawKey.includes('record count') || rawKey.includes('market count')) {
          currentEntry.recordCountText = rawVal;
        } else if (rawKey.includes('metric trend')) {
          currentEntry.metricTrends = rawVal;
        } else if (rawKey.includes('business interpretation')) {
          currentEntry.businessInterpretation = rawVal;
        } else if (rawKey.includes('business use case')) {
          currentEntry.businessUseCase = rawVal;
        } else if (rawKey.includes('core business question')) {
          currentEntry.coreBusinessQuestion = rawVal;
        } else {
          currentEntry.additionalBullets.push({
            label: bulletMatch[1].trim(),
            value: rawVal,
          });
        }
      }
    }
  }

  // Group datasetRows by Cluster_Label
  const marketsByCluster = new Map<number, SegmentationRecord[]>();
  for (const row of datasetRows) {
    const label = row.Cluster_Label ?? -1;
    const list = marketsByCluster.get(label) || [];
    list.push(row);
    marketsByCluster.set(label, list);
  }

  // Collect all unique cluster labels discovered across summary table, breakdown sections, and dataset
  const allLabels = new Set<number>([
    ...summaryMap.keys(),
    ...breakdownMap.keys(),
  ]);
  for (const label of marketsByCluster.keys()) {
    if (label >= 0) allLabels.add(label);
  }

  const sortedLabels = Array.from(allLabels).sort((a, b) => a - b);

  const clusters: ParsedClusterBreakdown[] = [];
  const clusterMap: Record<number, ParsedClusterBreakdown> = {};

  for (const label of sortedLabels) {
    const summary = summaryMap.get(label);
    const breakdown = breakdownMap.get(label);
    const assignedMarkets = marketsByCluster.get(label) || [];

    const parsedCountFromRecordText = breakdown?.recordCountText
      ? Number.parseInt(breakdown.recordCountText.replace(/[^0-9]/g, ''), 10)
      : NaN;

    const marketCount =
      summary?.marketCount ||
      (!Number.isNaN(parsedCountFromRecordText)
        ? parsedCountFromRecordText
        : assignedMarkets.length);

    const clusterName =
      breakdown?.clusterName ||
      summary?.clusterName ||
      assignedMarkets[0]?.Cluster_Name ||
      `Market Group ${label}`;

    const merged: ParsedClusterBreakdown = {
      clusterLabel: label,
      clusterName,
      recordCountText:
        breakdown?.recordCountText ||
        `${marketCount} ${marketCount === 1 ? 'market' : 'markets'}`,
      marketCount,
      keyInsightsSummary:
        summary?.keyInsightsSummary ||
        breakdown?.businessInterpretation ||
        '',
      metricTrends: breakdown?.metricTrends || '',
      businessInterpretation: breakdown?.businessInterpretation || '',
      businessUseCase: breakdown?.businessUseCase || '',
      coreBusinessQuestion: breakdown?.coreBusinessQuestion || '',
      additionalBullets: breakdown?.additionalBullets || [],
      markets: assignedMarkets,
    };

    clusters.push(merged);
    clusterMap[label] = merged;
  }

  return {
    reportTitle: report.report_title || markdownHeader,
    markdownHeader,
    summaryRows,
    clusters,
    clusterMap,
    rawContent,
  };
}
