import { runGpsValidatorTests } from './gpsValidator.test.js';
import { runAffineTransformTests } from './affineTransform.test.js';
import { runCalibrationSolverTests } from './calibrationSolver.test.js';
import { runInterpolatorTests } from './interpolator.test.js';
import { runSemanticLocationTests } from './semanticLocation.test.js';

console.log('\n======================================================');
console.log('  RUNNING CAMPUSLINK RED BULL TRACKING TEST SUITE');
console.log('======================================================\n');

try {
  runGpsValidatorTests();
  runAffineTransformTests();
  runCalibrationSolverTests();
  runInterpolatorTests();
  runSemanticLocationTests();

  console.log('\n======================================================');
  console.log('  ALL TEST SUITES PASSED SUCCESSFULLY (37 Assertions)');
  console.log('======================================================\n');
  process.exit(0);
} catch (error) {
  console.error('\nTEST SUITE FAILED:', error.message);
  console.error(error.stack);
  process.exit(1);
}
