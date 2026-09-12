/**
 * Tab Service for querying active tab information
 */

import { getDomain, isUnsupportedUrl } from '../utils/urlUtils';

export interface ActiveTabInfo {
  id?: number;
  url: string;
  domain: string;
  title: string;
  isUnsupported: boolean;
}

export class TabService {
  /**
   * Retrieves info on the currently active tab.
   */
  public static async getActiveTab(): Promise<ActiveTabInfo> {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url) {
          const isUnsupported = isUnsupportedUrl(tab.url);
          return {
            id: tab.id,
            url: tab.url,
            domain: getDomain(tab.url),
            title: tab.title || getDomain(tab.url),
            isUnsupported
          };
        }
      } catch (err) {
        console.warn('Failed to query active tab:', err);
      }
    }

    // Default/fallback for testing outside extension context
    return {
      url: 'https://example.com/demo-item',
      domain: 'example.com',
      title: 'Demo Comparison Item',
      isUnsupported: false
    };
  }
}
