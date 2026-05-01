import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const searchPath = join(__dirname, '../js/search-core.js');

function loadSearchSandbox() {
  const code = readFileSync(searchPath, 'utf8');
  const ctx = { console };
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  return ctx;
}

describe('search-core.js', () => {
  it('loads and matches multi-token AND', () => {
    const s = loadSearchSandbox();
    const f = {
      name: 'Lentils',
      aka: 'Lens culinaris',
      benefits: 'budget legume',
      bio: '',
      use: '',
      catLabel: 'Legume',
      micro: '',
      limits: '',
    };
    expect(s.foodMatchesSearch(f, '')).toBe(true);
    expect(s.foodMatchesSearch(f, 'lentil legume')).toBe(true);
    expect(s.foodMatchesSearch(f, 'lentil xyz')).toBe(false);
  });

  it('maps affordable synonym to benefits text', () => {
    const s = loadSearchSandbox();
    const f = {
      name: 'Rice',
      aka: '',
      benefits: 'low-cost staple',
      bio: '',
      use: '',
      catLabel: 'Grain',
      micro: '',
      limits: '',
    };
    expect(s.foodMatchesSearch(f, 'cheap')).toBe(true);
  });

  it('scores name prefix higher than substring', () => {
    const s = loadSearchSandbox();
    const a = { name: 'Oats', aka: '', benefits: '', bio: '', use: '', catLabel: '', micro: '', limits: '' };
    const b = { name: 'Goats cheese', aka: '', benefits: '', bio: '', use: '', catLabel: '', micro: '', limits: '' };
    expect(s.foodSearchRelevance(a, 'oat')).toBeGreaterThan(s.foodSearchRelevance(b, 'oat'));
  });
});
