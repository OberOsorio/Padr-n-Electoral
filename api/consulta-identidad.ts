import type { VercelRequest, VercelResponse } from '@vercel/node';
import dnpLookupHandler from './dnp-lookup.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return dnpLookupHandler(req, res);
}
