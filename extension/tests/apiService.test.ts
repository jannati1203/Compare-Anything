import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiService } from '../src/services/apiService';
import { ComparisonWorkspace } from '../src/models';

describe('ApiService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects if fewer than 2 pages are selected', async () => {
    const ws: ComparisonWorkspace = {
      anonymousInstallId: 'uuid',
      selectedPages: [
        { id: '1', url: 'https://a.com', domain: 'a.com', title: 'A', addedAt: '' }
      ],
      snapshots: {},
      userGoal: '',
      createdAt: '',
      updatedAt: ''
    };

    await expect(ApiService.comparePages(ws)).rejects.toThrow('Add at least one more page to compare.');
  });

  it('rejects if more than 4 pages are selected', async () => {
    const pages = [1, 2, 3, 4, 5].map((n) => ({
      id: `${n}`,
      url: `https://example.com/${n}`,
      domain: 'example.com',
      title: `Item ${n}`,
      addedAt: ''
    }));

    const ws: ComparisonWorkspace = {
      anonymousInstallId: 'uuid',
      selectedPages: pages,
      snapshots: {},
      userGoal: '',
      createdAt: '',
      updatedAt: ''
    };

    await expect(ApiService.comparePages(ws)).rejects.toThrow('Maximum 4 pages can be compared.');
  });

  it('handles backend 429 rate limit error gracefully', async () => {
    const ws: ComparisonWorkspace = {
      anonymousInstallId: 'uuid',
      selectedPages: [
        { id: '1', url: 'https://a.com', domain: 'a.com', title: 'A', addedAt: '' },
        { id: '2', url: 'https://b.com', domain: 'b.com', title: 'B', addedAt: '' }
      ],
      snapshots: {},
      userGoal: '',
      createdAt: '',
      updatedAt: ''
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: "Today's free comparison limit has been reached. Please try again later." })
    });

    await expect(ApiService.comparePages(ws)).rejects.toThrow(
      "Today's free comparison limit has been reached. Please try again later."
    );
  });

  it('handles network failure gracefully', async () => {
    const ws: ComparisonWorkspace = {
      anonymousInstallId: 'uuid',
      selectedPages: [
        { id: '1', url: 'https://a.com', domain: 'a.com', title: 'A', addedAt: '' },
        { id: '2', url: 'https://b.com', domain: 'b.com', title: 'B', addedAt: '' }
      ],
      snapshots: {},
      userGoal: '',
      createdAt: '',
      updatedAt: ''
    };

    global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

    await expect(ApiService.comparePages(ws)).rejects.toThrow(
      'Unable to connect to Compare Anything. Please try again.'
    );
  });
});
