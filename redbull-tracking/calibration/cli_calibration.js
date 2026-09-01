import { solveAffineCalibration } from './calibrationSolver.js';
import fs from 'fs';

const SAMPLE_REFERENCE_ANCHORS = [
  { name: 'LH-5 North Gate', lat: 20.250620, lng: 85.801050, x: 676, y: 48 },
  { name: 'BH-7 North-West', lat: 20.250403, lng: 85.800364, x: 389, y: 138 },
  { name: 'BH-2 North', lat: 20.250319, lng: 85.800819, x: 590, y: 180 },
  { name: 'BH-1 North', lat: 20.249985, lng: 85.800832, x: 572, y: 366 },
  { name: 'Admin / Academic Block', lat: 20.249472, lng: 85.800603, x: 437, y: 650 },
  { name: 'Centre for Data Science', lat: 20.249447, lng: 85.801393, x: 869, y: 614 },
  { name: 'Football Court 1', lat: 20.249177, lng: 85.801115, x: 709, y: 766 },
  { name: 'Auditorium', lat: 20.249192, lng: 85.801627, x: 941, y: 794 },
  { name: 'C-Block', lat: 20.248795, lng: 85.801163, x: 716, y: 961 },
  { name: 'SC-Block Complex', lat: 20.248375, lng: 85.801274, x: 764, y: 1177 },
  { name: 'F-Block', lat: 20.248446, lng: 85.801871, x: 1053, y: 1213 },
  { name: 'Food Court Plaza', lat: 20.248166, lng: 85.802406, x: 1337, y: 1308 },
  { name: 'E-Block', lat: 20.247555, lng: 85.801300, x: 871, y: 1485 },
  { name: 'Cricket Ground', lat: 20.247594, lng: 85.800515, x: 394, y: 1614 },
  { name: 'LH-4 South-West', lat: 20.247100, lng: 85.800700, x: 583, y: 1836 },
  { name: 'LH-3 South', lat: 20.246450, lng: 85.801350, x: 847, y: 2143 },
  { name: 'BH-5 / BH-8 Hostels', lat: 20.245800, lng: 85.802300, x: 1302, y: 2436 },
  { name: 'BH-9 South Gate', lat: 20.245450, lng: 85.802400, x: 1451, y: 2637 },
  { name: 'Football Court 2 South', lat: 20.245050, lng: 85.802100, x: 1344, y: 2830 },
];

function runCliCalibration() {
  const args = process.argv.slice(2);
  let points = SAMPLE_REFERENCE_ANCHORS;

  if (args.length > 0) {
    const filePath = args[0];
    if (fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        points = JSON.parse(fileContent);
      } catch (err) {
        console.error('Failed to read points from file:', err.message);
        process.exit(1);
      }
    }
  }

  console.log(`\n======================================================`);
  console.log(`  CAMPUSLINK RED BULL TRACKING: AFFINE CALIBRATION`);
  console.log(`======================================================\n`);
  console.log(`Solving Least-Squares Affine Matrix for ${points.length} ground control points...\n`);

  const result = solveAffineCalibration(points);

  if (!result.success) {
    console.error(`Calibration Error:`, result.error);
    process.exit(1);
  }

  console.log(`CALIBRATION RESULTS:`);
  console.log(`- Quality Rating:    ${result.metrics.quality}`);
  console.log(`- Root Mean Sq Err:  ${result.metrics.rmse} px`);
  console.log(`- Average Error:     ${result.metrics.averageErrorPx} px`);
  console.log(`- Maximum Error:     ${result.metrics.maxErrorPx} px`);
  console.log(`- Event Ready:       ${result.metrics.isAcceptableForEvent ? 'YES' : 'NO'}\n`);

  console.log(`CALIBRATED COEFFICIENTS:`);
  console.log(`  x = ${result.coefficients.a} * lng + ${result.coefficients.b} * lat + (${result.coefficients.c})`);
  console.log(`  y = ${result.coefficients.d} * lng + ${result.coefficients.e} * lat + (${result.coefficients.f})\n`);

  console.log(`COPY-PASTE CONFIGURATION SNIPPET:`);
  console.log(result.exportSnippet);

  console.log(`\nRESIDUAL BREAKDOWN PER POINT:`);
  console.table(result.residuals.map(r => ({
    Point: r.name,
    'Actual (X, Y)': `(${r.actualX}, ${r.actualY})`,
    'Predicted (X, Y)': `(${r.predictedX}, ${r.predictedY})`,
    'Error (px)': r.totalErrorPx,
  })));
}

runCliCalibration();
