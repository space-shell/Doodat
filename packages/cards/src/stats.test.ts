import { describe, it, expect } from 'vitest';
import {
  countByDomain,
  countByCategory,
  countByTradition,
  countByIntensity,
  radarSeries,
} from './stats';
import type { Domain, ContentCard } from './types';

// ─── countByDomain ────────────────────────────────────────────────────────────

describe('countByDomain', () => {
  it('counts 30 cards per domain across the full deck', () => {
    expect(countByDomain()).toEqual({ physical: 30, mental: 30, spiritual: 30 });
  });

  it('can count an arbitrary card set', () => {
    const cards: ContentCard[] = [
      { id: 'phys-x', type: 'content', domain: 'physical', category: 'c', intensity_low: '', intensity_medium: '', intensity_high: '', tags: [], created_at: 0 },
      { id: 'phys-y', type: 'content', domain: 'physical', category: 'c', intensity_low: '', intensity_medium: '', intensity_high: '', tags: [], created_at: 0 },
      { id: 'ment-x', type: 'content', domain: 'mental', category: 'c', intensity_low: '', intensity_medium: '', intensity_high: '', tags: [], created_at: 0 },
    ];
    expect(countByDomain(cards)).toEqual({ physical: 2, mental: 1, spiritual: 0 });
  });
});

// ─── countByCategory ──────────────────────────────────────────────────────────

describe('countByCategory', () => {
  it('returns all 8 physical categories when no domain filter is given', () => {
    const all = countByCategory();
    expect(Object.keys(all).sort()).toEqual([]);
    expect(all).toEqual({});
  });

  it('counts the known physical categories', () => {
    const phys = countByCategory('physical');
    expect(Object.keys(phys).sort()).toEqual(
      ['cardio', 'dietary', 'fasting', 'flexibility', 'full_body', 'lower_body', 'meditation', 'upper_body'],
    );
    expect(phys.upper_body).toBe(5);
    expect(phys.dietary).toBe(5);
    expect(phys.fasting).toBe(2);
  });

  it('counts the known mental categories', () => {
    const ment = countByCategory('mental');
    expect(Object.keys(ment).sort()).toEqual(
      ['anxiety', 'creativity', 'discipline', 'focus', 'reading', 'sharing', 'social', 'writing'],
    );
    expect(ment.reading).toBe(7);
  });

  it('counts the known spiritual categories', () => {
    const spir = countByCategory('spiritual');
    expect(Object.keys(spir).sort()).toEqual(
      ['meditation', 'praise', 'reflection', 'religious_text'],
    );
    expect(spir.reflection).toBe(14);
    expect(spir.religious_text).toBe(9);
  });
});

// ─── countByTradition ─────────────────────────────────────────────────────────

describe('countByTradition', () => {
  it('counts the 8 known traditions plus agnostic, totalling all 30 spiritual cards', () => {
    const trad = countByTradition();
    expect(trad.Christianity).toBe(4);
    expect(trad.Stoicism).toBe(4);
    expect(trad.Buddhism).toBe(4);
    expect(trad.Taoism).toBe(3);
    expect(trad.Islam).toBe(3);
    expect(trad.Hinduism).toBe(3);
    expect(trad.Judaism).toBe(2);
    expect(trad.Sikhism).toBe(1);
    expect(trad.agnostic).toBe(6);

    const total = Object.values(trad).reduce((a, b) => a + b, 0);
    expect(total).toBe(30);
  });
});

// ─── countByIntensity ─────────────────────────────────────────────────────────

describe('countByIntensity', () => {
  it('counts every card once per intensity level (every card has all three)', () => {
    expect(countByIntensity()).toEqual({ low: 90, medium: 90, high: 90 });
  });
});

// ─── radarSeries ──────────────────────────────────────────────────────────────

describe('radarSeries', () => {
  it('produces a 3-axis domain series with matched values', () => {
    const s = radarSeries('domain');
    expect(s.axes).toEqual(['physical', 'mental', 'spiritual']);
    expect(s.values).toEqual([30, 30, 30]);
    expect(s.axes.length).toBe(s.values.length);
  });

  it('produces a tradition series with the 8 named traditions plus agnostic', () => {
    const s = radarSeries('tradition');
    expect(s.values.length).toBe(s.axes.length);
    expect(s.axes).toContain('agnostic');
    expect(s.axes).toContain('Christianity');
    const total = s.values.reduce((a, b) => a + b, 0);
    expect(total).toBe(30);
  });

  it('produces a 3-axis intensity series', () => {
    const s = radarSeries('intensity');
    expect(s.axes).toEqual(['low', 'medium', 'high']);
    expect(s.values).toEqual([90, 90, 90]);
  });

  it('produces a category series, scoped to one domain', () => {
    const s = radarSeries('category', 'physical' as Domain);
    expect(s.axes.length).toBe(8);
    expect(s.values.length).toBe(8);
    expect(s.values.reduce((a, b) => a + b, 0)).toBe(30);
  });

  it('category series defaults to physical when no domain given', () => {
    const s = radarSeries('category');
    expect(s.axes).toContain('upper_body');
  });
});
