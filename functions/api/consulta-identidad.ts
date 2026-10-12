// Cloudflare Pages Function: /api/consulta-identidad
// Redirecciona / procesa de forma transparente la consulta hacia el servicio DNP Ventanilla Social
export { onRequestPost, onRequestOptions } from './dnp-lookup';
