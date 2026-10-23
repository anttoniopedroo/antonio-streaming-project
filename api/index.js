// Função da Vercel: todas as rotas /api/* caem aqui (ver "rewrites" no vercel.json).
// É o mesmo back-end do ambiente local (server/app.js). As chaves vêm das
// Environment Variables do painel da Vercel, não de server/chave_api.env.
import { app } from '../server/app.js';

export default app;
