import React, { useEffect, useState } from 'react';
import './Results.css';
import { StorageService } from '../storage/storageService';
import { ComparisonWorkspace, CompareResponse, SelectedPage } from '../models';
import { generateComparisonCsv, generateComparisonPlainText, downloadFile } from '../utils/exportUtils';

export const Results: React.FC = () => {
  const [workspace, setWorkspace] = useState<ComparisonWorkspace | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const ws = await StorageService.getWorkspace();
        setWorkspace(ws);
      } catch (err) {
        console.error('Failed to load workspace in results:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const comparison: CompareResponse | null = workspace?.latestComparison || null;
  const selectedPages: SelectedPage[] = workspace?.selectedPages || [];

  // Helper map for display names
  const itemMap = new Map<string, string>();
  if (comparison?.items) {
    comparison.items.forEach((item) => itemMap.set(item.id, item.displayName || item.id));
  }
  selectedPages.forEach((page) => {
    if (!itemMap.has(page.id)) {
      itemMap.set(page.id, page.title || page.domain);
    }
  });

  // Action: Copy Comparison
  const handleCopyComparison = async () => {
    if (!comparison) return;
    try {
      const plainText = generateComparisonPlainText(comparison, selectedPages);
      await navigator.clipboard.writeText(plainText);
      showToast('✓ Comparison copied to clipboard!');
    } catch {
      showToast('Unable to copy to clipboard. Please copy manually.');
    }
  };

  // Action: Download CSV
  const handleDownloadCsv = () => {
    if (!comparison) return;
    try {
      const csv = generateComparisonCsv(comparison, selectedPages);
      const cleanTitle = (comparison.comparisonTitle || 'comparison')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      downloadFile(csv, `${cleanTitle}.csv`, 'text/csv');
      showToast('✓ Downloaded CSV successfully!');
    } catch (err) {
      console.error('Failed to generate CSV:', err);
      showToast('Failed to download CSV.');
    }
  };

  // Action: Share Comparison (Generates clean local PNG summary)
  const handleShareComparison = () => {
    if (!comparison) return;
    try {
      const canvas = document.createElement('canvas');
      const width = 800;
      const height = 650;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Card border
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, width - 40, height - 40);

      // Header Tagline
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('COMPARE ANYTHING', 45, 60);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px sans-serif';
      ctx.fillText('Stop switching between tabs. Compare them.', 45, 80);

      // Title
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 22px sans-serif';
      const title = comparison.comparisonTitle || 'Webpage Comparison';
      ctx.fillText(title.length > 50 ? title.substring(0, 47) + '...' : title, 45, 120);

      // Goal / Priority if available
      if (comparison.goal && comparison.goal.trim()) {
        ctx.fillStyle = '#64748b';
        ctx.font = 'italic 13px sans-serif';
        ctx.fillText(`Priority: ${comparison.goal}`, 45, 145);
      }

      // Best Overall Card
      ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
      ctx.strokeStyle = winnerDisplayName ? '#10b981' : '#475569';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(45, 165, 710, 115, 8);
      } else {
        ctx.rect(45, 165, 710, 115);
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('BEST OVERALL', 65, 195);

      ctx.fillStyle = winnerDisplayName ? '#34d399' : '#e2e8f0';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(winnerDisplayName || 'No clear winner (Inconclusive Evidence)', 65, 225);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '13px sans-serif';
      const reason = comparison.bestOverall?.reason || 'Based strictly on verified evidence from original pages.';
      ctx.fillText(reason.length > 88 ? reason.substring(0, 85) + '...' : reason, 65, 255);

      // Key Recommendations (Best For)
      let startY = 315;
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('KEY ATTRIBUTES & RECOMMENDATIONS', 45, startY);
      startY += 20;

      const bestForList = comparison.bestFor || [];
      const displayBestFor = bestForList.slice(0, 4);

      if (displayBestFor.length > 0) {
        displayBestFor.forEach((bf, i) => {
          const colX = 45 + (i % 2) * 365;
          const rowY = startY + Math.floor(i / 2) * 95;

          ctx.fillStyle = 'rgba(30, 41, 59, 0.6)';
          ctx.strokeStyle = '#334155';
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(colX, rowY, 345, 85, 6);
          } else {
            ctx.rect(colX, rowY, 345, 85);
          }
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText(bf.label, colX + 15, rowY + 25);

          ctx.fillStyle = '#f8fafc';
          ctx.font = '600 14px sans-serif';
          const winnerName = itemMap.get(bf.itemId) || bf.itemId;
          ctx.fillText(winnerName, colX + 15, rowY + 48);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '11px sans-serif';
          const r = bf.reason || '';
          ctx.fillText(r.length > 48 ? r.substring(0, 45) + '...' : r, colX + 15, rowY + 70);
        });
      }

      // Footer
      ctx.fillStyle = '#475569';
      ctx.font = '12px sans-serif';
      ctx.fillText('Generated locally with Compare Anything • Evidence-based decision engine', 45, 605);

      // Download as PNG
      const cleanTitle = (comparison.comparisonTitle || 'comparison')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const link = document.createElement('a');
      link.download = `${cleanTitle}-summary.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('✓ Shareable comparison summary PNG downloaded!');
    } catch (err) {
      console.error('Failed to generate share image:', err);
      showToast('Failed to generate share image.');
    }
  };

  // Action: Start New Comparison
  const handleStartNewComparison = async () => {
    try {
      const cleared = await StorageService.startNewComparison();
      setWorkspace(cleared);
      showToast('Workspace cleared. You can now add new pages from the extension popup.');
    } catch (err) {
      console.error('Failed to clear workspace:', err);
    }
  };

  // Safe external link opener
  const handleOpenSource = (url: string) => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (isLoading) {
    return (
      <div className="results-layout" style={{ textAlign: 'center', paddingTop: '80px' }}>
        <h2>Loading comparison...</h2>
      </div>
    );
  }

  if (!comparison) {
    return (
      <div className="results-layout">
        <header className="results-topbar">
          <div className="brand-section">
            <h1>COMPARE ANYTHING</h1>
            <p>Stop switching between tabs. Compare them.</p>
          </div>
        </header>

        <div className="empty-state">
          <h2>No comparison generated yet</h2>
          <p>Open 2 to 4 webpages and click Compare in the extension popup to generate your comparison.</p>
        </div>
      </div>
    );
  }

  const winnerItemId = comparison.bestOverall?.itemId;
  const winnerDisplayName = winnerItemId ? itemMap.get(winnerItemId) || winnerItemId : null;

  return (
    <div className="results-layout">
      {/* Toast notice */}
      {toastMessage && <div className="toast-notice">{toastMessage}</div>}

      {/* Top Header & Toolbar */}
      <header className="results-topbar">
        <div className="brand-section">
          <h1>COMPARE ANYTHING</h1>
          <p>Stop switching between tabs. Compare them.</p>
        </div>

        <div className="toolbar-actions">
          <button className="btn-tool" onClick={handleCopyComparison} title="Copy plain text comparison">
            📋 Copy Comparison
          </button>
          <button className="btn-tool" onClick={handleDownloadCsv} title="Export as CSV spreadsheet">
            📥 Download CSV
          </button>
          <button className="btn-tool" onClick={handleShareComparison} title="Export shareable summary PNG card">
            🖼️ Share Image
          </button>
          <button className="btn-tool btn-danger-outline" onClick={handleStartNewComparison} title="Clear comparison and start over">
            🔄 Start New Comparison
          </button>
        </div>
      </header>

      {/* Overview & Goal Banner */}
      <section className="overview-card">
        <h2 className="comparison-heading">{comparison.comparisonTitle || 'Webpage Comparison'}</h2>
        <div className="goal-badge">
          <span className="goal-label">Your priority:</span>
          <span>{comparison.goal && comparison.goal.trim() ? comparison.goal : 'General comparison'}</span>
        </div>
      </section>

      {/* BEST OVERALL SECTION */}
      <section
        className={`best-overall-card ${winnerItemId ? 'is-winner' : ''}`}
        aria-label="Best Overall Recommendation"
      >
        <div className="section-label">Best Overall</div>
        <div className="winner-title">
          {winnerDisplayName ? (
            <>
              <span>{winnerDisplayName}</span>
              <span className="winner-badge">Top Recommendation</span>
            </>
          ) : (
            <>
              <span>No clear winner</span>
              <span className="no-winner-badge">Inconclusive Evidence</span>
            </>
          )}
        </div>
        <p className="winner-reason">
          {comparison.bestOverall?.reason ||
            'The provided pages do not contain enough comparable evidence to reliably select an overall winner.'}
        </p>
      </section>

      {/* DYNAMIC COMPARISON TABLE */}
      <section className="comparison-section">
        <div className="section-label">Feature & Specification Matrix</div>
        <div className="table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th className="col-feature">Feature / Criterion</th>
                {selectedPages.map((page) => (
                  <th key={page.id} className="col-item-header">
                    <div>{itemMap.get(page.id) || page.title || page.domain}</div>
                    <div className="col-item-domain">{page.domain}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison.criteria.map((criterion, idx) => {
                const valMap = new Map<string, string>();
                (criterion.values || []).forEach((v) => {
                  valMap.set(v.itemId, v.value || 'Not stated');
                });

                const winners = criterion.winnerItemIds || [];

                return (
                  <tr key={idx}>
                    <td className="col-feature">
                      <strong>{criterion.name}</strong>
                      {criterion.importance && criterion.importance !== 'medium' && (
                        <span className="importance-indicator">{criterion.importance}</span>
                      )}
                    </td>
                    {selectedPages.map((page) => {
                      const val = valMap.get(page.id) || 'Not stated';
                      const isWinning = winners.includes(page.id);
                      const isNotStated = val === 'Not stated';

                      return (
                        <td key={page.id}>
                          <span
                            className={`cell-value ${isWinning ? 'is-winner' : ''} ${
                              isNotStated ? 'not-stated' : ''
                            }`}
                          >
                            {isWinning && '★ '}
                            {val}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* BEST FOR CARDS (Hidden if empty) */}
      {comparison.bestFor && comparison.bestFor.length > 0 && (
        <section className="comparison-section">
          <div className="section-label">Best For Specific Use Cases</div>
          <div className="best-for-grid">
            {comparison.bestFor.map((bf, idx) => (
              <div key={idx} className="best-for-card">
                <div className="best-for-label">{bf.label}</div>
                <div className="best-for-winner">{itemMap.get(bf.itemId) || bf.itemId}</div>
                <div className="best-for-reason">{bf.reason}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* KEY DIFFERENCES & MISSING INFORMATION */}
      <section className="info-columns">
        {/* Key Differences */}
        {comparison.keyDifferences && comparison.keyDifferences.length > 0 && (
          <div className="info-card">
            <div className="section-label">Key Differences</div>
            <ul className="bullet-list">
              {comparison.keyDifferences.map((diff, idx) => (
                <li key={idx} className="bullet-item">
                  <span className="bullet-dot">•</span>
                  <span>{diff}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing Information */}
        {comparison.missingInformation && comparison.missingInformation.length > 0 && (
          <div className="info-card">
            <div className="section-label">Missing Information in Sources</div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              These specifications were not stated on the original pages:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {comparison.missingInformation.map((mi, idx) => {
                if (!mi.fields || mi.fields.length === 0) return null;
                const pageName = itemMap.get(mi.itemId) || mi.itemId;
                return (
                  <div key={idx}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {pageName}:
                    </div>
                    <div style={{ marginTop: '4px' }}>
                      {mi.fields.map((f, fIdx) => (
                        <span key={fIdx} className="missing-tag">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* SOURCES SECTION */}
      <section className="comparison-section">
        <div className="section-label">Source Pages Evaluated</div>
        <div className="sources-grid">
          {selectedPages.map((page) => (
            <div key={page.id} className="source-card">
              <div>
                <div className="source-title" title={page.title}>
                  {itemMap.get(page.id) || page.title || page.domain}
                </div>
                <div className="source-domain">{page.domain}</div>
              </div>
              <button
                className="btn-source"
                onClick={() => handleOpenSource(page.url)}
                aria-label={`Open original page for ${page.title}`}
              >
                Open Source Page ↗
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Trust & Privacy Notice */}
      <footer
        style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '16px',
          marginTop: '12px',
          color: 'var(--text-muted)',
          fontSize: '11px',
          textAlign: 'center'
        }}
      >
        Compare Anything evaluates only the content extracted from the webpages you explicitly selected.
        No external assumptions or general knowledge were used to fill missing facts.
      </footer>
    </div>
  );
};
