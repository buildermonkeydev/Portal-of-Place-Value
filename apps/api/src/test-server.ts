import express from 'express';
const app = express();
app.get('/', (_, res) => res.send('Hello World!'));
app.listen(3000, () => console.log('Test server running on http://localhost:3000'));