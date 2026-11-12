import { executeServerFunctionMitra, executePublicServerFunctionMitra } from 'mitra-interactions-sdk';
import { getMitraErrorMessage } from './utils';

const PROJECT_ID = Number(import.meta.env.VITE_MITRA_PROJECT_ID);

function normalizar(output: unknown): any {
  let out: any = output;
  if (typeof out === 'string') {
    try { out = JSON.parse(out); } catch { /* texto */ }
  }
  return out;
}

export async function chamar(serverFunctionId: number, input: Record<string, unknown> = {}): Promise<any> {
  const res: any = await executeServerFunctionMitra({ projectId: PROJECT_ID, serverFunctionId, input });
  const r = res?.result ?? res;
  if (r?.executionStatus === 'FAILED') throw new Error(getMitraErrorMessage(r?.error) || 'Falha na operação');
  const out = normalizar(r?.output);
  if (out && typeof out === 'object' && !Array.isArray(out) && typeof out.error === 'string') throw new Error(out.error);
  return out;
}

export async function linhas(serverFunctionId: number, input: Record<string, unknown> = {}): Promise<any[]> {
  const out = await chamar(serverFunctionId, input);
  return Array.isArray(out?.rows) ? out.rows : [];
}

export async function linhasPublicas(serverFunctionId: number, input: Record<string, unknown> = {}): Promise<any[]> {
  const res: any = await executePublicServerFunctionMitra({ projectId: PROJECT_ID, serverFunctionId, input });
  if (res?.status === 'FAILED') throw new Error(getMitraErrorMessage(res?.error) || 'Falha ao carregar');
  const out = normalizar(res?.output);
  return Array.isArray(out?.rows) ? out.rows : [];
}
