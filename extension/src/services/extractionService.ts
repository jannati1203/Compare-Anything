/**
 * Extraction Service
 * Executes PageExtractor on the active tab via chrome.scripting.executeScript
 */

import { PageSnapshot } from '../models';
import { PageExtractor } from '../extractors/pageExtractor';
import { TabService } from './tabService';

export interface ExtractionResult {
  success: boolean;
  snapshot?: PageSnapshot;
  error?: string;
}

export class ExtractionService {
  /**
   * Extracts snapshot from the currently active tab.
   */
  public static async extractCurrentPage(): Promise<ExtractionResult> {
    const tabInfo = await TabService.getActiveTab();

    if (tabInfo.isUnsupported) {
      return {
        success: false,
        error: "We couldn't extract enough information from this page."
      };
    }

    if (typeof chrome !== 'undefined' && chrome.scripting && chrome.scripting.executeScript && tabInfo.id) {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tabInfo.id },
          func: PageExtractor.getInjectedExtractionFunction()
        });

        if (results && results[0] && results[0].result) {
          const snapshot = results[0].result as PageSnapshot;
          return {
            success: true,
            snapshot
          };
        } else {
          return {
            success: false,
            error: "We couldn't extract enough information from this page."
          };
        }
      } catch (err) {
        console.warn('Script execution failed:', err);
        return {
          success: false,
          error: "We couldn't extract enough information from this page."
        };
      }
    }

    // Fallback for development/testing environment
    return {
      success: true,
      snapshot: {
        id: `page-${Date.now()}`,
        url: tabInfo.url,
        domain: tabInfo.domain,
        title: tabInfo.title,
        description: 'Simulated page description for development.',
        structuredData: '--- Metadata ---\nog:site_name: Example Store',
        importantText: '--- Specifications ---\nBattery: 5000mAh\nDisplay: 6.7 inch OLED',
        capturedAt: new Date().toISOString()
      }
    };
  }
}
