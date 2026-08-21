import { detectSchema } from './db/schemaHelper.js';
import 'dotenv/config';

detectSchema().then(res => {
  console.log(res);
  process.exit(0);
});
