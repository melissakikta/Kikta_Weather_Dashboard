import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Router } from 'express';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = Router();


// Done: Define route to serve index.html
router.get('/', (req, res) => {
  const filePath = path.join(__dirname, '../client/public', 'index.html');
  res.sendFile(filePath);
});


export default router;
