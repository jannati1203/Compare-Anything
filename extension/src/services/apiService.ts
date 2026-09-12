/**
 * API Service for communicating with ASP.NET Core 10 backend
 */

import { ComparisonWorkspace, CompareResponse } from '../models';
import { config } from '../config';

export class ApiService {
  /**
   * Sends structured page snapshots to the backend for AI comparison.
   * Only structured PageSnapshot data is sent, never raw HTML.
   */
  public static async comparePages(workspace: ComparisonWorkspace): Promise<CompareResponse> {
    if (!workspace.selectedPages || workspace.selectedPages.length < 2) {
      throw new Error('Add at least one more page to compare.');
    }

    if (workspace.selectedPages.length > 4) {
      throw new Error('Maximum 4 pages can be compared.');
    }

    // Build payload containing only structured data
    const pagesPayload = workspace.selectedPages.map((page) => {
      const snap = workspace.snapshots[page.id];
      // Combine structured metadata and important text
      const contentParts: string[] = [];
      if (snap?.structuredData) contentParts.push(snap.structuredData);
      if (snap?.importantText) contentParts.push(snap.importantText);
      const combinedText = contentParts.join('\n\n') || page.title;

      return {
        id: page.id,
        url: page.url,
        domain: page.domain,
        title: page.title || page.domain,
        importantText: combinedText
      };
    });

    const payload = {
      installId: workspace.anonymousInstallId,
      goal: workspace.userGoal || '',
      pages: pagesPayload
    };

    const endpoint = `${config.apiBaseUrl.replace(/\/+$/, '')}/api/v1/compare`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.requestTimeoutMs);

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error("Comparison couldn't be generated. Please try again.");
      }
      // Network failure or backend offline
      throw new Error('Unable to connect to Compare Anything. Please try again.');
    } finally {
      clearTimeout(timeoutId);
    }

    // Handle HTTP error statuses
    if (!response.ok) {
      let errorMessage = "Comparison couldn't be generated. Please try again.";
      try {
        const errorJson = await response.json();
        if (errorJson && typeof errorJson.error === 'string' && errorJson.error.trim()) {
          errorMessage = errorJson.error.trim();
        }
      } catch {
        // Use status code fallbacks if body is not JSON
        if (response.status === 429) {
          errorMessage = "Today's free comparison limit has been reached. Please try again later.";
        } else if (response.status >= 500) {
          errorMessage = 'Compare Anything is temporarily unavailable.';
        }
      }

      throw new Error(errorMessage);
    }

    try {
      const data = (await response.json()) as CompareResponse;
      if (!data || !Array.isArray(data.criteria)) {
        throw new Error("Comparison couldn't be generated. Please try again.");
      }
      return data;
    } catch (err: any) {
      if (err instanceof Error && err.message) {
        throw err;
      }
      throw new Error("Comparison couldn't be generated. Please try again.");
    }
  }
}
