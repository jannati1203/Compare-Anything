import React, { useEffect, useState } from 'react';
import './Popup.css';
import { TabService, ActiveTabInfo } from '../services/tabService';
import { ExtractionService } from '../services/extractionService';
import { StorageService } from '../storage/storageService';
import { ApiService } from '../services/apiService';
import { ComparisonWorkspace, MAX_PAGES, MIN_PAGES } from '../models';
import { normalizeUrl } from '../utils/urlUtils';

export const Popup: React.FC = () => {
  const [workspace, setWorkspace] = useState<ComparisonWorkspace | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTabInfo | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    type: 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);
  const [goalText, setGoalText] = useState<string>('');

  // Load initial workspace and active tab info
  useEffect(() => {
    async function init() {
      try {
        const ws = await StorageService.getWorkspace();
        setWorkspace(ws);
        setGoalText(ws.userGoal || '');

        const tab = await TabService.getActiveTab();
        setActiveTab(tab);
      } catch (err) {
        console.error('Error initializing popup:', err);
      }
    }
    init();
  }, []);

  const selectedCount = workspace?.selectedPages?.length || 0;

  // Check if current active tab is already in selected pages
  const isCurrentPageAdded = Boolean(
    activeTab?.url &&
      workspace?.selectedPages?.some(
        (page) => normalizeUrl(page.url) === normalizeUrl(activeTab.url)
      )
  );

  // Handle adding current active page
  const handleAddPage = async () => {
    setNotification(null);

    if (!activeTab) {
      setNotification({
        type: 'error',
        message: "We couldn't extract enough information from this page."
      });
      return;
    }

    if (activeTab.isUnsupported) {
      setNotification({
        type: 'error',
        message: "We couldn't extract enough information from this page."
      });
      return;
    }

    if (selectedCount >= MAX_PAGES) {
      setNotification({
        type: 'error',
        message: 'Maximum 4 pages can be compared.'
      });
      return;
    }

    if (isCurrentPageAdded) {
      setNotification({
        type: 'error',
        message: 'This page is already in your comparison.'
      });
      return;
    }

    setIsExtracting(true);
    try {
      const extraction = await ExtractionService.extractCurrentPage();

      if (!extraction.success || !extraction.snapshot) {
        setNotification({
          type: 'error',
          message: extraction.error || "We couldn't extract enough information from this page."
        });
        setIsExtracting(false);
        return;
      }

      const addResult = await StorageService.addPage(extraction.snapshot);

      if (!addResult.success) {
        setNotification({
          type: 'error',
          message: addResult.error || "We couldn't extract enough information from this page."
        });
      } else if (addResult.workspace) {
        setWorkspace(addResult.workspace);
        // If now exactly 1 page is added, show helpful prompt
        if (addResult.workspace.selectedPages.length === 1) {
          setNotification({
            type: 'info',
            message: 'Add at least one more page to compare.'
          });
        }
      }
    } catch (err) {
      console.error('Extraction error:', err);
      setNotification({
        type: 'error',
        message: "We couldn't extract enough information from this page."
      });
    } finally {
      setIsExtracting(false);
    }
  };

  // Handle removing a selected page
  const handleRemovePage = async (pageId: string) => {
    setNotification(null);
    try {
      const updated = await StorageService.removePage(pageId);
      setWorkspace(updated);
      if (updated.selectedPages.length === 1) {
        setNotification({
          type: 'info',
          message: 'Add at least one more page to compare.'
        });
      }
    } catch (err) {
      console.error('Failed to remove page:', err);
    }
  };

  // Handle updating optional user goal
  const handleGoalChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setGoalText(text);
    try {
      await StorageService.setUserGoal(text);
    } catch (err) {
      console.error('Failed to save goal:', err);
    }
  };

  // Handle clear comparison
  const handleClearComparison = async () => {
    try {
      const cleared = await StorageService.clearComparison();
      setWorkspace(cleared);
      setGoalText('');
      setNotification(null);
    } catch (err) {
      console.error('Failed to clear comparison:', err);
    }
  };

  // Compare button text calculation
  const getCompareButtonLabel = () => {
    if (selectedCount >= MIN_PAGES) {
      return `COMPARE ${selectedCount} PAGES`;
    }
    return 'COMPARE PAGES';
  };

  // Comparison execution (Day 3: Connect to backend)
  const handleCompareClick = async () => {
    setNotification(null);

    if (selectedCount < MIN_PAGES) {
      setNotification({
        type: 'warning',
        message: 'Add at least one more page to compare.'
      });
      return;
    }

    if (selectedCount > MAX_PAGES) {
      setNotification({
        type: 'error',
        message: 'Maximum 4 pages can be compared.'
      });
      return;
    }

    if (!workspace) return;

    setIsComparing(true);
    try {
      // Send structured page snapshots to backend
      const result = await ApiService.comparePages(workspace);

      // Save latest comparison result into storage
      await StorageService.saveLatestComparison(result);

      // Open dedicated full results page
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create({ url: chrome.runtime.getURL('results.html') });
      } else {
        window.open('results.html', '_blank');
      }
    } catch (err: any) {
      console.error('Comparison request failed:', err);
      const message = err?.message || 'Compare Anything is temporarily unavailable.';
      setNotification({
        type: 'error',
        message
      });
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="popup-container">
      {/* Header */}
      <header className="popup-header">
        <div className="header-top">
          <h1 className="brand-title">COMPARE ANYTHING</h1>
          <span className="badge-counter">{selectedCount} / 4 pages added</span>
        </div>
        <p className="brand-tagline">Stop switching between tabs. Compare them.</p>
      </header>

      {/* Notifications / Alerts */}
      {notification && (
        <div className={`alert-banner alert-${notification.type}`} role="alert">
          <span>{notification.message}</span>
          <button
            className="alert-close"
            onClick={() => setNotification(null)}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}

      {/* Professional Loading State Screen */}
      {isComparing ? (
        <section className="loading-card" aria-live="polite">
          <div className="spinner" />
          <div className="loading-title">Comparing your selected pages...</div>
          <p className="loading-subtitle">
            Analyzing evidence and structuring key differences across your {selectedCount} pages.
          </p>
          <div className="progress-bar-container">
            <div className="progress-bar-indeterminate" />
          </div>
        </section>
      ) : (
        <>
          {/* Current Page Section */}
          <section className="card current-page-card">
            <div className="card-label">Current Page</div>
            <div className="current-page-title" title={activeTab?.title || ''}>
              {activeTab?.title || 'Loading tab...'}
            </div>
            <div className="current-page-domain">
              {activeTab?.domain || 'unknown-domain'}
            </div>

            {isCurrentPageAdded ? (
              <button className="btn-add btn-added" disabled>
                ✓ Added
              </button>
            ) : (
              <button
                className="btn-add"
                onClick={handleAddPage}
                disabled={isExtracting || activeTab?.isUnsupported}
              >
                {isExtracting ? 'EXTRACTING...' : 'ADD TO COMPARISON'}
              </button>
            )}
          </section>

          {/* Selected Pages List */}
          {selectedCount > 0 && (
            <section className="selected-pages-section">
              <div className="section-heading">
                <span>Selected Pages</span>
                <span>{selectedCount} / 4</span>
              </div>
              <div className="selected-pages-list">
                {workspace?.selectedPages?.map((page) => (
                  <div key={page.id} className="page-item-card">
                    <div className="page-item-info">
                      <div className="page-item-title" title={page.title}>
                        {page.title || page.domain}
                      </div>
                      <div className="page-item-domain">{page.domain}</div>
                    </div>
                    <button
                      className="btn-remove"
                      onClick={() => handleRemovePage(page.id)}
                      aria-label={`Remove ${page.title}`}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Optional User Goal */}
          <section className="goal-section">
            <label htmlFor="user-goal" className="goal-label">
              What matters to you? — Optional
            </label>
            <textarea
              id="user-goal"
              className="goal-textarea"
              value={goalText}
              onChange={handleGoalChange}
              placeholder="Which job is better for a fresh graduate?"
            />
          </section>

          {/* Comparison Actions */}
          <section className="actions-section">
            <button
              className="btn-compare"
              disabled={selectedCount < MIN_PAGES || isComparing}
              onClick={handleCompareClick}
            >
              {getCompareButtonLabel()}
            </button>

            {selectedCount > 0 && (
              <button className="btn-clear" onClick={handleClearComparison}>
                Clear Comparison
              </button>
            )}
          </section>
        </>
      )}

      {/* Privacy Notice */}
      <footer className="privacy-notice">
        Compare Anything extracts relevant information from webpages you explicitly add. When you
        click Compare, that extracted information may be securely sent to our server and AI provider
        to generate your comparison.
      </footer>
    </div>
  );
};
