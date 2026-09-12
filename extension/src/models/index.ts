/**
 * Core models and types for Compare Anything (Day 1 - Day 3)
 */

export interface PageSnapshot {
  id: string;
  url: string;
  domain: string;
  title: string;
  description: string;
  structuredData: string;
  importantText: string;
  capturedAt: string;
}

export interface SelectedPage {
  id: string;
  url: string;
  domain: string;
  title: string;
  addedAt: string;
}

// Day 3 Backend Comparison Schema
export interface ComparisonItem {
  id: string;
  displayName: string;
  shortDescription: string;
}

export interface CriterionValue {
  itemId: string;
  value: string;
  confidence: 'high' | 'medium' | 'low' | string;
}

export interface ComparisonCriterion {
  name: string;
  importance: 'high' | 'medium' | 'low' | string;
  values: CriterionValue[];
  winnerItemIds: string[];
}

export interface BestOverall {
  itemId: string | null;
  reason: string;
}

export interface BestFor {
  label: string;
  itemId: string;
  reason: string;
}

export interface MissingInformation {
  itemId: string;
  fields: string[];
}

export interface CompareResponse {
  comparisonTitle: string;
  comparisonType: string;
  goal: string;
  items: ComparisonItem[];
  criteria: ComparisonCriterion[];
  bestOverall: BestOverall;
  bestFor: BestFor[];
  keyDifferences: string[];
  missingInformation: MissingInformation[];
}

export interface ComparisonWorkspace {
  anonymousInstallId: string;
  selectedPages: SelectedPage[];
  snapshots: Record<string, PageSnapshot>;
  userGoal: string;
  createdAt: string;
  updatedAt: string;
  latestComparison?: CompareResponse | null;
}

export const MAX_PAGES = 4;
export const MIN_PAGES = 2;
export const MAX_CONTENT_CHARS = 3500;

export interface ExtractorResult {
  success: boolean;
  snapshot?: PageSnapshot;
  error?: string;
}
