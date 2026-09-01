import assert from 'assert';
import { createAffineTransformer } from '../lib/affineTransform.js';

export function runAffineTransformTests() {
  console.log('Testing Affine Transformer...');

  const coefficients = {
    a: 478863.683905,
    b: -19596.875341,
    c: -40689501.705,
    d: 3693.35968,
    e: -499077.146284,
    f: 9789781.4823,
  };

  const transformer = createAffineTransformer(coefficients);

  const res1 = transformer.toMapCoordinates(20.2485, 85.8010, 10);
  assert(typeof res1.x === 'number' && Number.isFinite(res1.x), 'Output X must be finite number');
  assert(typeof res1.y === 'number' && Number.isFinite(res1.y), 'Output Y must be finite number');
  assert(res1.x >= 0 && res1.x <= 1580, 'X must be clamped within SVG bounds');
  assert(res1.y >= 0 && res1.y <= 2891, 'Y must be clamped within SVG bounds');
  assert.strictEqual(res1.isInsideBounds, true, 'Campus coordinates should be inside bounds');
  assert(res1.accuracyRadiusPixels > 0, 'Accuracy radius must be positive');

  const invalidRes = transformer.toMapCoordinates(NaN, 85.8010);
  assert.strictEqual(invalidRes.x, null, 'Invalid latitude should produce null x');

  const inverse = transformer.toGpsCoordinates(res1.x, res1.y);
  assert(Math.abs(inverse.latitude - 20.2485) < 0.001, 'Inverse lat should closely match original lat');
  assert(Math.abs(inverse.longitude - 85.8010) < 0.001, 'Inverse lng should closely match original lng');

  console.log('  PASS: Affine Transformer (8 assertions)');
}
