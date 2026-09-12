/**
 * Export utilities for Copy Comparison and Download CSV
 */

import { CompareResponse, SelectedPage } from '../models';

/**
 * Escapes a cell value for standard CSV format (RFC 4180).
 */
function escapeCsvCell(val: string | null | undefined): string {
  if (val == null) return '""';
  const str = String(val).trim();
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Generates an RFC 4180 compliant CSV string from comparison data.
 */
export function generateComparisonCsv(
  comparison: CompareResponse,
  selectedPages: SelectedPage[]
): string {
  const itemMap = new Map<string, string>();
  // Use display names from comparison.items or fallback to selectedPages titles
  comparison.items.forEach((item) => {
    itemMap.set(item.id, item.displayName || item.id);
  });
  selectedPages.forEach((page) => {
    if (!itemMap.has(page.id)) {
      itemMap.set(page.id, page.title || page.domain);
    }
  });

  const pageIds = selectedPages.map((p) => p.id);
  const pageHeaders = pageIds.map((id) => escapeCsvCell(itemMap.get(id) || id));

  const rows: string[] = [];

  // Header row: Feature, Page 1, Page 2...
  rows.push([escapeCsvCell('Feature'), ...pageHeaders].join(','));

  // Criteria rows
  for (const criterion of comparison.criteria) {
    const valMap = new Map<string, string>();
    (criterion.values || []).forEach((v) => {
      valMap.set(v.itemId, v.value || 'Not stated');
    });

    const rowCells = [
      escapeCsvCell(criterion.name),
      ...pageIds.map((id) => escapeCsvCell(valMap.get(id) || 'Not stated'))
    ];
    rows.push(rowCells.join(','));
  }

  // Summary rows at the bottom
  rows.push('');
  rows.push(
    [
      escapeCsvCell('Best Overall'),
      escapeCsvCell(
        comparison.bestOverall.itemId
          ? `${itemMap.get(comparison.bestOverall.itemId) || comparison.bestOverall.itemId} - ${comparison.bestOverall.reason}`
          : `No clear winner - ${comparison.bestOverall.reason}`
      )
    ].join(',')
  );

  if (comparison.goal) {
    rows.push([escapeCsvCell('Goal / Priority'), escapeCsvCell(comparison.goal)].join(','));
  }

  return rows.join('\r\n');
}

/**
 * Generates a clean, human-readable text comparison for clipboard copying.
 */
export function generateComparisonPlainText(
  comparison: CompareResponse,
  selectedPages: SelectedPage[]
): string {
  const itemMap = new Map<string, string>();
  comparison.items.forEach((item) => {
    itemMap.set(item.id, item.displayName || item.id);
  });
  selectedPages.forEach((page) => {
    if (!itemMap.has(page.id)) {
      itemMap.set(page.id, page.title || page.domain);
    }
  });

  const lines: string[] = [];
  lines.push('COMPARE ANYTHING');
  lines.push(comparison.comparisonTitle || 'Comparison');
  lines.push('='.repeat(40));

  if (comparison.goal) {
    lines.push(`Goal:\n${comparison.goal}\n`);
  } else {
    lines.push('Goal:\nGeneral comparison\n');
  }

  // Best Overall
  lines.push('BEST OVERALL:');
  if (comparison.bestOverall.itemId) {
    const winnerName = itemMap.get(comparison.bestOverall.itemId) || comparison.bestOverall.itemId;
    lines.push(`${winnerName}`);
    if (comparison.bestOverall.reason) {
      lines.push(`Reason: ${comparison.bestOverall.reason}`);
    }
  } else {
    lines.push('No clear winner');
    if (comparison.bestOverall.reason) {
      lines.push(`Reason: ${comparison.bestOverall.reason}`);
    }
  }
  lines.push('');

  // Comparison Criteria
  lines.push('COMPARISON:');
  for (const criterion of comparison.criteria) {
    lines.push(`\n[${criterion.name}]`);
    const valMap = new Map<string, string>();
    (criterion.values || []).forEach((v) => valMap.set(v.itemId, v.value || 'Not stated'));

    for (const page of selectedPages) {
      const pageName = itemMap.get(page.id) || page.title || page.domain;
      const val = valMap.get(page.id) || 'Not stated';
      lines.push(`  • ${pageName}: ${val}`);
    }
  }

  // Best For
  if (comparison.bestFor && comparison.bestFor.length > 0) {
    lines.push('\nBEST FOR:');
    for (const bf of comparison.bestFor) {
      const itemName = itemMap.get(bf.itemId) || bf.itemId;
      lines.push(`  • ${bf.label}: ${itemName} (${bf.reason})`);
    }
  }

  // Key Differences
  if (comparison.keyDifferences && comparison.keyDifferences.length > 0) {
    lines.push('\nKEY DIFFERENCES:');
    for (const diff of comparison.keyDifferences) {
      lines.push(`  • ${diff}`);
    }
  }

  // Missing Information
  if (comparison.missingInformation && comparison.missingInformation.length > 0) {
    lines.push('\nMISSING INFORMATION:');
    for (const mi of comparison.missingInformation) {
      const pageName = itemMap.get(mi.itemId) || mi.itemId;
      if (mi.fields && mi.fields.length > 0) {
        lines.push(`  • ${pageName}: ${mi.fields.join(', ')}`);
      }
    }
  }

  // Sources
  lines.push('\nSOURCES:');
  for (const page of selectedPages) {
    lines.push(`  • ${page.title || page.domain}: ${page.url}`);
  }

  return lines.join('\n');
}

/**
 * Triggers a file download in the browser.
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
