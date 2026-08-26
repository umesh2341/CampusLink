import assert from 'assert';
import { createSemanticLocationResolver } from '../lib/semanticLocation.js';

export function runSemanticLocationTests() {
  console.log('Testing Campus Semantic Location Resolver...');

  const resolver = createSemanticLocationResolver();

  const atAuditorium = resolver.resolveLocation(941, 794);
  assert.strictEqual(atAuditorium.isInsideZone, true);
  assert(atAuditorium.description.includes('University Auditorium'), 'Should resolve Auditorium');

  const nearDataScience = resolver.resolveLocation(869, 700);
  assert(atAuditorium.distanceMeters >= 0, 'Distance must be positive');
  assert(nearDataScience.description.length > 0, 'Description must not be empty');

  const unknown = resolver.resolveLocation(NaN, 100);
  assert.strictEqual(unknown.description, 'Location unknown');

  console.log('  PASS: Semantic Location Resolver (5 assertions)');
}
