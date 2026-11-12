import { useEffect, useSyncExternalStore } from 'react';
import { SF } from './sf-ids';
import { linhasPublicas } from './api';

export interface Placa {
  ID: number; CODIGO: string; NOME: string; TIPO_DESTINO: 'GOOGLE' | 'INSTAGRAM' | 'CARDAPIO' | 'PIX' | 'WIFI';
  FRASE: string; DESCRICAO: string; IMAGEM: string; COR: string | null;
}
export interface Precos { unit: number; combo: number; juros: Record<number, number>; modo: string; }

export const WHATSAPP_NUMERO = '5547991161541';
export const WHATSAPP_TEXTO = 'Olá! Vim pelo site da JoiSmart e quero saber mais sobre as plaquinhas.';
export const whatsLink = (texto = WHATSAPP_TEXTO) => `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(texto)}`;
export const AVISO_WIFI_IPHONE = 'No Android, é só aproximar o celular. No iPhone, a conexão é feita pelo QR code da plaquinha.';

export const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const imagem = (caminho: string) => `.${caminho}`;
export const nomePlaca = (p: { NOME: string; COR?: string | null }) => (p.COR ? `${p.NOME} (${p.COR.toLowerCase()})` : p.NOME);

export function calcularPreco(qtd: number, unit: number, combo: number) {
  const grupos = Math.floor(qtd / 3);
  const resto = qtd % 3;
  const total = Math.round((grupos * combo + resto * unit) * 100) / 100;
  const semCombo = Math.round(qtd * unit * 100) / 100;
  return { grupos, resto, total, semCombo, economia: Math.round((semCombo - total) * 100) / 100 };
}

export function parcelas(total: number, n: number, juros: Record<number, number>) {
  const taxa = n >= 4 ? (juros[n] ?? 0) : 0;
  const final = Math.round(total * (1 + taxa / 100) * 100) / 100;
  return { n, taxa, final, valor: Math.round((final / n) * 100) / 100, semJuros: taxa === 0 };
}

export const ehJoinville = (cep: string) => {
  const n = Number(cep.replace(/\D/g, ''));
  return n >= 89200000 && n <= 89239999;
};

// ── Catálogo (cache em memória) ──
let catalogo: { placas: Placa[]; precos: Precos } | null = null;
let promessa: Promise<void> | null = null;
const ouvintesCat = new Set<() => void>();

export function carregarCatalogo(forcar = false): Promise<void> {
  if (promessa && !forcar) return promessa;
  promessa = linhasPublicas(SF.pub_catalogo).then((rows) => {
    const r0 = rows[0] ?? {};
    catalogo = {
      placas: rows.map((r) => ({ ...r, ID: Number(r.ID) })),
      precos: {
        unit: Number(r0.PRECO_UNIT ?? 49.9), combo: Number(r0.PRECO_COMBO3 ?? 120),
        juros: { 4: Number(r0.JUROS_4X ?? 0), 5: Number(r0.JUROS_5X ?? 0), 6: Number(r0.JUROS_6X ?? 0) },
        modo: String(r0.PAGAMENTO_MODO ?? 'TESTE'),
      },
    };
    ouvintesCat.forEach((f) => f());
  }).catch((e) => { promessa = null; throw e; });
  return promessa;
}

export function useCatalogo() {
  const dados = useSyncExternalStore((f) => { ouvintesCat.add(f); return () => ouvintesCat.delete(f); }, () => catalogo);
  useEffect(() => { carregarCatalogo().catch(() => {}); }, []);
  return dados;
}

// ── Carrinho (localStorage) ──
const CHAVE = 'joismart-carrinho';
type Carrinho = Record<string, number>;
let carrinho: Carrinho = (() => { try { return JSON.parse(localStorage.getItem(CHAVE) || '{}') || {}; } catch { return {}; } })();
const ouvintes = new Set<() => void>();
function gravar(novo: Carrinho) {
  carrinho = novo;
  localStorage.setItem(CHAVE, JSON.stringify(novo));
  ouvintes.forEach((f) => f());
}
export const carrinhoAcoes = {
  adicionar(id: number, qtd = 1) { gravar({ ...carrinho, [id]: Math.min(60, (carrinho[id] ?? 0) + qtd) }); },
  definir(id: number, qtd: number) {
    const novo = { ...carrinho };
    if (qtd <= 0) delete novo[id]; else novo[id] = Math.min(60, qtd);
    gravar(novo);
  },
  limpar() { gravar({}); },
};
export function useCarrinho() {
  const c = useSyncExternalStore((f) => { ouvintes.add(f); return () => ouvintes.delete(f); }, () => carrinho);
  const qtd = Object.values(c).reduce((a, b) => a + b, 0);
  return { itens: c, qtd };
}
