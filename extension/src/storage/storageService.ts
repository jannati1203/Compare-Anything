/**
 * Storage Service for Compare Anything
 * Manages local workspace, selected pages, snapshots, user goal, anonymous install ID, and comparison results.
 */

import { ComparisonWorkspace, PageSnapshot, SelectedPage, CompareResponse, MAX_PAGES } from '../models';
import { normalizeUrl } from '../utils/urlUtils';

const STORAGE_KEY = 'compare_anything_workspace';

// In-memory fallback for testing or non-extension browser environments
let inMemoryWorkspace: ComparisonWorkspace | null = null;

export class StorageService {
  /**
   * Generates or retrieves the unique anonymous install ID.
   */
  private static getOrGenerateAnonymousId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `anon-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Creates an empty workspace.
   */
  public static createEmptyWorkspace(installId?: string): ComparisonWorkspace {
    return {
      anonymousInstallId: installId || this.getOrGenerateAnonymousId(),
      selectedPages: [],
      snapshots: {},
      userGoal: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      latestComparison: null
    };
  }

  /**
   * Retrieves the current workspace from chrome.storage.local or fallback.
   */
  public static async getWorkspace(): Promise<ComparisonWorkspace> {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      try {
        const result = await chrome.storage.local.get([STORAGE_KEY]);
        const data = result[STORAGE_KEY] as ComparisonWorkspace | undefined;
        if (data && data.anonymousInstallId) {
          return {
            ...data,
            selectedPages: data.selectedPages || [],
            snapshots: data.snapshots || {},
            userGoal: data.userGoal || '',
            latestComparison: data.latestComparison || null
          };
        }
        // Initialize if not present
        const newWorkspace = this.createEmptyWorkspace();
        await chrome.storage.local.set({ [STORAGE_KEY]: newWorkspace });
        return newWorkspace;
      } catch (err) {
        console.warn('Failed to load from chrome.storage.local, using fallback:', err);
      }
    }

    // In-memory fallback
    if (!inMemoryWorkspace) {
      inMemoryWorkspace = this.createEmptyWorkspace();
    }
    return inMemoryWorkspace;
  }

  /**
   * Saves the workspace to chrome.storage.local or fallback.
   */
  public static async saveWorkspace(workspace: ComparisonWorkspace): Promise<void> {
    workspace.updatedAt = new Date().toISOString();
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      try {
        await chrome.storage.local.set({ [STORAGE_KEY]: workspace });
        return;
      } catch (err) {
        console.warn('Failed to save to chrome.storage.local, saving to memory fallback:', err);
      }
    }
    inMemoryWorkspace = workspace;
  }

  /**
   * Adds a page snapshot to the workspace.
   * Validates duplicate URLs and maximum 4 pages limit.
   */
  public static async addPage(snapshot: PageSnapshot): Promise<{
    success: boolean;
    workspace?: ComparisonWorkspace;
    error?: string;
  }> {
    const workspace = await this.getWorkspace();

    // 1. Max 4 pages check
    if (workspace.selectedPages.length >= MAX_PAGES) {
      return {
        success: false,
        error: 'Maximum 4 pages can be compared.'
      };
    }

    // 2. Duplicate URL check (normalized)
    const incomingNormalized = normalizeUrl(snapshot.url);
    const isDuplicate = workspace.selectedPages.some(
      (page) => normalizeUrl(page.url) === incomingNormalized
    );

    if (isDuplicate) {
      return {
        success: false,
        error: 'This page is already in your comparison.'
      };
    }

    // 3. Add to workspace
    const selectedPage: SelectedPage = {
      id: snapshot.id,
      url: snapshot.url,
      domain: snapshot.domain,
      title: snapshot.title || snapshot.domain,
      addedAt: new Date().toISOString()
    };

    workspace.selectedPages.push(selectedPage);
    workspace.snapshots[snapshot.id] = snapshot;

    await this.saveWorkspace(workspace);
    return { success: true, workspace };
  }

  /**
   * Removes a selected page and its snapshot by ID.
   */
  public static async removePage(pageId: string): Promise<ComparisonWorkspace> {
    const workspace = await this.getWorkspace();
    workspace.selectedPages = workspace.selectedPages.filter((p) => p.id !== pageId);
    if (workspace.snapshots[pageId]) {
      delete workspace.snapshots[pageId];
    }
    await this.saveWorkspace(workspace);
    return workspace;
  }

  /**
   * Updates the optional user goal text.
   */
  public static async setUserGoal(goal: string): Promise<ComparisonWorkspace> {
    const workspace = await this.getWorkspace();
    workspace.userGoal = goal;
    await this.saveWorkspace(workspace);
    return workspace;
  }

  /**
   * Stores the latest comparison response from the backend.
   */
  public static async saveLatestComparison(comparison: CompareResponse): Promise<ComparisonWorkspace> {
    const workspace = await this.getWorkspace();
    workspace.latestComparison = comparison;
    await this.saveWorkspace(workspace);
    return workspace;
  }

  /**
   * Clears all selected pages and snapshots while retaining the anonymous install ID.
   */
  public static async clearComparison(): Promise<ComparisonWorkspace> {
    const workspace = await this.getWorkspace();
    workspace.selectedPages = [];
    workspace.snapshots = {};
    workspace.userGoal = '';
    workspace.latestComparison = null;
    await this.saveWorkspace(workspace);
    return workspace;
  }

  /**
   * Alias for starting a brand new comparison.
   */
  public static async startNewComparison(): Promise<ComparisonWorkspace> {
    return this.clearComparison();
  }
}
