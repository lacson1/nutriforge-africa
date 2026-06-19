import { describe, it, expect } from 'vitest';
import {
  normalizePatientState,
  encodePatientState,
} from '../js/patient-state-core.mjs';

describe('patient-state-core', () => {
  it('normalizes short aliases', () => {
    expect(normalizePatientState('prev')).toBe('prevention');
    expect(normalizePatientState('mgmt')).toBe('management');
    expect(normalizePatientState('rem')).toBe('remission');
    expect(normalizePatientState('ins')).toBe('insulin');
    expect(normalizePatientState('su')).toBe('insulin');
  });

  it('normalizes long forms', () => {
    expect(normalizePatientState('prevention')).toBe('prevention');
    expect(normalizePatientState('ALL')).toBe('all');
  });

  it('falls back to all for unknown values', () => {
    expect(normalizePatientState('bogus')).toBe('all');
    expect(normalizePatientState('')).toBe('all');
  });

  it('encodes compact hash params', () => {
    expect(encodePatientState('management')).toBe('mgmt');
    expect(encodePatientState('prev')).toBe('prev');
    expect(encodePatientState('all')).toBe('all');
  });
});
