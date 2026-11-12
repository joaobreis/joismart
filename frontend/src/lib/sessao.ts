import { useEffect, useState, useSyncExternalStore } from 'react';
import { SF } from './sf-ids';
import { linhas } from './api';

let logado = false;
const ouvintes = new Set<() => void>();
export function definirLogado(v: boolean) { logado = v; perfil = null; ouvintes.forEach((f) => f()); }
export function useLogado() {
  return useSyncExternalStore((f) => { ouvintes.add(f); return () => ouvintes.delete(f); }, () => logado);
}

let perfil: Promise<{ email: string; admin: boolean }> | null = null;
export function carregarPerfil() {
  if (!perfil) {
    perfil = linhas(SF.cli_souAdmin).then((r) => ({ email: String(r[0]?.EMAIL ?? ''), admin: Number(r[0]?.ADMIN) === 1 }))
      .catch(() => { perfil = null; return { email: '', admin: false }; });
  }
  return perfil;
}
export function usePerfil() {
  const ok = useLogado();
  const [p, setP] = useState<{ email: string; admin: boolean } | null>(null);
  const [carregando, setCarregando] = useState(true);
  useEffect(() => {
    let vivo = true;
    if (!ok) { setP(null); setCarregando(false); return; }
    setCarregando(true);
    carregarPerfil().then((x) => { if (vivo) { setP(x); setCarregando(false); } });
    return () => { vivo = false; };
  }, [ok]);
  return { perfil: p, carregando };
}
