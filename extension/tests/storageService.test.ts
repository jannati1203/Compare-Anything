import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from '../src/storage/storageService';
import { PageSnapshot } from '../src/models';

describe('StorageService', () => {
  beforeEach(async () => {
    await StorageService.clearComparison();
  });

  it('generates an anonymous install ID and creates workspace', async () => {
    const ws = await StorageService.getWorkspace();
    expect(ws.anonymousInstallId).toBeTruthy();
    expect(ws.selectedPages).toEqual([]);
    expect(ws.snapshots).toEqual({});
  });

  it('adds pages and prevents duplicate URLs', async () => {
    const snap1: PageSnapshot = {
      id: 'p1',
      url: 'https://example.com/product-a?utm_source=ad',
      domain: 'example.com',
      title: 'Product A',
      description: 'First product',
      structuredData: '',
      importantText: 'Some details',
      capturedAt: new Date().toISOString()
    };

    const res1 = await StorageService.addPage(snap1);
    expect(res1.success).toBe(true);
    expect(res1.workspace?.selectedPages.length).toBe(1);

    // Duplicate addition attempt (even with different query param or hash)
    const snap1Dup: PageSnapshot = {
      ...snap1,
      id: 'p1-dup',
      url: 'https://example.com/product-a#specs'
    };
    const resDup = await StorageService.addPage(snap1Dup);
    expect(resDup.success).toBe(false);
    expect(resDup.error).toBe('This page is already in your comparison.');
  });

  it('enforces maximum 4 pages limit and rejects a 5th page', async () => {
    for (let i = 1; i <= 4; i++) {
      const snap: PageSnapshot = {
        id: `p-${i}`,
        url: `https://example.com/item-${i}`,
        domain: 'example.com',
        title: `Item ${i}`,
        description: `Desc ${i}`,
        structuredData: '',
        importantText: `Text ${i}`,
        capturedAt: new Date().toISOString()
      };
      const res = await StorageService.addPage(snap);
      expect(res.success).toBe(true);
    }

    const ws = await StorageService.getWorkspace();
    expect(ws.selectedPages.length).toBe(4);

    // Try 5th page
    const snap5: PageSnapshot = {
      id: 'p-5',
      url: 'https://example.com/item-5',
      domain: 'example.com',
      title: 'Item 5',
      description: 'Desc 5',
      structuredData: '',
      importantText: 'Text 5',
      capturedAt: new Date().toISOString()
    };
    const res5 = await StorageService.addPage(snap5);
    expect(res5.success).toBe(false);
    expect(res5.error).toBe('Maximum 4 pages can be compared.');
  });

  it('removes a selected page and updates snapshots', async () => {
    const snap: PageSnapshot = {
      id: 'remove-me',
      url: 'https://example.com/remove',
      domain: 'example.com',
      title: 'Removable Page',
      description: '',
      structuredData: '',
      importantText: '',
      capturedAt: new Date().toISOString()
    };
    await StorageService.addPage(snap);

    const wsAfterAdd = await StorageService.getWorkspace();
    expect(wsAfterAdd.selectedPages.length).toBe(1);
    expect(wsAfterAdd.snapshots['remove-me']).toBeDefined();

    const wsAfterRemove = await StorageService.removePage('remove-me');
    expect(wsAfterRemove.selectedPages.length).toBe(0);
    expect(wsAfterRemove.snapshots['remove-me']).toBeUndefined();
  });

  it('updates optional user goal and preserves it until cleared', async () => {
    await StorageService.setUserGoal('Compare camera quality and battery life');
    const ws = await StorageService.getWorkspace();
    expect(ws.userGoal).toBe('Compare camera quality and battery life');

    await StorageService.clearComparison();
    const wsCleared = await StorageService.getWorkspace();
    expect(wsCleared.userGoal).toBe('');
    expect(wsCleared.selectedPages).toEqual([]);
  });
});
