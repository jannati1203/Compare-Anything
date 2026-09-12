import { describe, it, expect } from 'vitest';
import { generateComparisonCsv, generateComparisonPlainText } from '../src/utils/exportUtils';
import { CompareResponse, SelectedPage } from '../src/models';

describe('exportUtils', () => {
  const sampleComparison: CompareResponse = {
    comparisonTitle: 'Product A vs Product B',
    comparisonType: 'Product',
    goal: 'Best battery life',
    items: [
      { id: 'p1', displayName: 'Product A', shortDescription: 'First option' },
      { id: 'p2', displayName: 'Product B', shortDescription: 'Second option' }
    ],
    criteria: [
      {
        name: 'Battery Life',
        importance: 'high',
        values: [
          { itemId: 'p1', value: '18 hours', confidence: 'high' },
          { itemId: 'p2', value: '12 hours', confidence: 'high' }
        ],
        winnerItemIds: ['p1']
      },
      {
        name: 'Price, USD',
        importance: 'medium',
        values: [
          { itemId: 'p1', value: '$999', confidence: 'high' },
          { itemId: 'p2', value: 'Not stated', confidence: 'low' }
        ],
        winnerItemIds: []
      }
    ],
    bestOverall: {
      itemId: 'p1',
      reason: 'Longer battery life by 6 hours.'
    },
    bestFor: [
      { label: 'Long Trips', itemId: 'p1', reason: '18 hours battery' }
    ],
    keyDifferences: [
      'Product A lasts 6 hours longer.'
    ],
    missingInformation: [
      { itemId: 'p2', fields: ['Price'] }
    ]
  };

  const samplePages: SelectedPage[] = [
    { id: 'p1', title: 'Product A', domain: 'a.com', url: 'https://a.com/item', addedAt: '' },
    { id: 'p2', title: 'Product B', domain: 'b.com', url: 'https://b.com/item', addedAt: '' }
  ];

  it('generates properly formatted RFC 4180 CSV with escaped commas and quotes', () => {
    const csv = generateComparisonCsv(sampleComparison, samplePages);

    expect(csv).toContain('"Feature","Product A","Product B"');
    expect(csv).toContain('"Battery Life","18 hours","12 hours"');
    expect(csv).toContain('"Price, USD","$999","Not stated"');
    expect(csv).toContain('"Best Overall"');
    expect(csv).toContain('"Goal / Priority","Best battery life"');
  });

  it('generates clean, human-readable plain text comparison', () => {
    const text = generateComparisonPlainText(sampleComparison, samplePages);

    expect(text).toContain('COMPARE ANYTHING');
    expect(text).toContain('Product A vs Product B');
    expect(text).toContain('Goal:\nBest battery life');
    expect(text).toContain('BEST OVERALL:\nProduct A');
    expect(text).toContain('Reason: Longer battery life by 6 hours.');
    expect(text).toContain('[Battery Life]');
    expect(text).toContain('• Product A: 18 hours');
    expect(text).toContain('• Product B: 12 hours');
    expect(text).toContain('BEST FOR:\n  • Long Trips: Product A');
    expect(text).toContain('KEY DIFFERENCES:\n  • Product A lasts 6 hours longer.');
    expect(text).toContain('MISSING INFORMATION:\n  • Product B: Price');
    expect(text).toContain('SOURCES:');
    expect(text).toContain('https://a.com/item');
  });
});
