import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Router } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = Router();


// Done: Define route to serve index.html
router.get('/', (_, res) => {
  const indexPath = path.join(__dirname, '../../public/index.html');


  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Internal Server Error');  
    }
  });
});


export default router;


//const indexPath = path.join(__dirname, '../client/public', 'index.html'