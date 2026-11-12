import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, Wifi, Lock } from 'lucide-react';
import Layout from '../components/site/Layout';
import Input from '../components/ui/Input';
import { useCatalogo, useCarrinho, carrinhoAcoes, brl, calcularPreco, nomePlaca, AVISO_WIFI_IPHONE, ehJoinville } from '../lib/loja';
import type { Placa } from '../lib/loja';
import { imgPlaca } from '../lib/placas-img';
import { useLogado } from '../lib/sessao';
import { chamar, linhas } from '../lib/api';
import { SF } from '../lib/sf-ids';
import { getMitraErrorMessage } from '../lib/utils';

interface Item { chave: string; placa: Placa; d1: string; d2: string; }
interface Endereco { nome: string; telefone: string; cep: string; logradouro: string; numero: string; complemento: string; bairro: string; cidade: string; uf: string; }

const CAMPOS: Record<string, { r1: string; p1: string; r2?: string; p2?: string }> = {
  GOOGLE: { r1: 'Link de avaliação no Google', p1: 'https://g.page/r/.../review' },
  INSTAGRAM: { r1: '@ do Instagram', p1: '@seunegocio' },
  CARDAPIO: { r1: 'Link do cardápio', p1: 'https://seucardapio.com.br' },
  PIX: { r1: 'Chave Pix', p1: 'CNPJ, e-mail, celular ou chave aleatória', r2: 'Nome do recebedor', p2: 'Como aparece no banco' },
  WIFI: { r1: 'Nome da rede (SSID)', p1: 'MinhaLoja_WiFi', r2: 'Senha do Wi-Fi', p2: 'Mínimo de 8 caracteres' },
};
const URL_RE = /^https?:\/\/\S{3,}$/i;
const IG_RE = /^@?[A-Za-z0-9._]{1,30}$/;

function validar(it: Item): string {
  const a = it.d1.trim(), b = it.d2.trim();
  switch (it.placa.TIPO_DESTINO) {
    case 'GOOGLE': case 'CARDAPIO': return URL_RE.test(a) ? '' : 'Informe um link começando com https://';
    case 'INSTAGRAM': return IG_RE.test(a) ? '' : 'Informe o @ do perfil (letras, números, ponto ou _)';
    case 'PIX': return a.length >= 4 && a.length <= 77 && b ? '' : 'Informe a chave Pix e o nome do recebedor';
    case 'WIFI': return a && a.length <= 32 && b.length >= 8 && b.length <= 63 ? '' : 'Informe a rede e uma senha de 8 a 63 caracteres';
  }
  return '';
}
const soNum = (s: string) => s.replace(/\D/g, '');
const fmtCep = (s: string) => { const n = soNum(s).slice(0, 8); return n.length > 5 ? `${n.slice(0, 5)}-${n.slice(5)}` : n; };
const fmtTel = (s: string) => {
  const n = soNum(s).slice(0, 11);
  if (n.length <= 2) return n;
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
};

export default function CheckoutPage() {
  const logado = useLogado();
  const cat = useCatalogo();
  const { itens: carrinho } = useCarrinho();
  const navigate = useNavigate();
  const [itens, setItens] = useState<Item[]>([]);
  const [end, setEnd] = useState<Endereco>({ nome: '', telefone: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '' });
  const [frete, setFrete] = useState<{ valor: number; local: boolean } | null>(null);
  const [freteErro, setFreteErro] = useState('');
  const [tentou, setTentou] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const montado = useRef(false);

  useEffect(() => {
    if (!cat || montado.current) return;
    montado.current = true;
    const lista: Item[] = [];
    cat.placas.forEach((p) => { for (let i = 0; i < (carrinho[p.ID] ?? 0); i++) lista.push({ chave: `${p.ID}-${i}`, placa: p, d1: '', d2: '' }); });
    setItens(lista);
  }, [cat, carrinho]);

  const cep = soNum(end.cep);
  useEffect(() => {
    setFrete(null); setFreteErro('');
    if (cep.length !== 8 || itens.length === 0) return;
    let vivo = true;
    const t = setTimeout(async () => {
      try {
        const [r] = await linhas(SF.cli_cotarFrete, { cep, qtd: itens.length });
        if (vivo) setFrete({ valor: Number(r?.FRETE ?? 0), local: Number(r?.LOCAL) === 1 });
      } catch {
        if (vivo) setFreteErro('Não foi possível calcular o frete agora. Tente de novo ou chame a gente no WhatsApp.');
      }
      try {
        const via = await fetch(`https://viacep.com.br/ws/${cep}/json/`).then((x) => x.json());
        if (vivo && via && !via.erro) {
          setEnd((e) => ({ ...e, logradouro: e.logradouro || via.logradouro || '', bairro: e.bairro || via.bairro || '', cidade: via.localidade || e.cidade, uf: via.uf || e.uf }));
        }
      } catch { /* preenchimento manual */ }
    }, 400);
    return () => { vivo = false; clearTimeout(t); };
  }, [cep, itens.length]);

  const erros = useMemo(() => itens.map(validar), [itens]);
  const preco = cat ? calcularPreco(itens.length, cat.precos.unit, cat.precos.combo) : null;
  const endErro = !end.nome.trim() || soNum(end.telefone).length < 10 || cep.length !== 8 || !end.logradouro.trim() || !end.numero.trim() || !end.bairro.trim() || !end.cidade.trim() || !/^[A-Za-z]{2}$/.test(end.uf);

  if (!logado) return <Navigate to="/login?volta=%2Fcheckout" replace />;
  if (cat && montado.current && itens.length === 0) return <Navigate to="/carrinho" replace />;

  const upd = (k: string, campo: 'd1' | 'd2', v: string) => setItens((l) => l.map((i) => (i.chave === k ? { ...i, [campo]: v } : i)));
  const setE = (k: keyof Endereco, v: string) => setEnd((e) => ({ ...e, [k]: v }));

  async function confirmar() {
    setTentou(true); setErro('');
    const primeiro = erros.findIndex(Boolean);
    if (primeiro >= 0) { document.getElementById(`item-${primeiro}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    if (endErro) { document.getElementById('endereco')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    if (!frete) { setErro(freteErro || 'Aguarde o cálculo do frete.'); return; }
    setEnviando(true);
    try {
      const r = await chamar(SF.cli_criarPedido, {
        itens: itens.map((i) => ({ placaId: i.placa.ID, destino1: i.d1.trim(), destino2: i.d2.trim() })),
        endereco: { ...end, cep, telefone: soNum(end.telefone) },
      });
      carrinhoAcoes.limpar();
      navigate(`/pedido/${r.pedidoId}`, { replace: true });
    } catch (e) {
      setErro(getMitraErrorMessage(e));
    } finally {
      setEnviando(false);
    }
  }

  const local = frete?.local ?? (cep.length === 8 && ehJoinville(cep));

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 md:px-6 py-8 md:py-12">
        <Link to="/carrinho" className="nav-item -ml-3"><ArrowLeft size={16} /> Voltar ao carrinho</Link>
        <h1 className="vitrine-sub mt-2">Fechar pedido</h1>
        {!cat ? <div className="skeleton h-64 rounded-2xl mt-6" /> : (
          <div className="grid gap-5 lg:grid-cols-[1fr_340px] mt-6 items-start">
            <div className="flex flex-col gap-5">
              <div className="cartao">
                <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <h2 className="text-[15px] font-semibold">1. O que cada plaquinha vai abrir</h2>
                  <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--fg-subtle)' }}>Gravamos esse destino no NFC e no QR code.</p>
                </div>
                <div className="flex flex-col">
                  {itens.map((it, k) => {
                    const c = CAMPOS[it.placa.TIPO_DESTINO];
                    const e = tentou ? erros[k] : '';
                    return (
                      <div key={it.chave} id={`item-${k}`} className="px-5 py-4 flex gap-4 border-t first:border-t-0" style={{ borderColor: 'var(--border-subtle)' }}>
                        <img src={imgPlaca(it.placa.CODIGO)} alt="" className="w-14 h-14 object-contain shrink-0" />
                        <div className="flex-1 flex flex-col gap-3 min-w-0">
                          <p className="text-[14px] font-semibold">Plaquinha {k + 1} · {nomePlaca(it.placa)}</p>
                          <div className={`grid gap-3 ${c.r2 ? 'sm:grid-cols-2' : ''}`}>
                            <Input label={c.r1} placeholder={c.p1} value={it.d1} onChange={(ev) => upd(it.chave, 'd1', ev.target.value)} maxLength={300} error={e && !c.r2 ? e : undefined} />
                            {c.r2 && <Input label={c.r2} placeholder={c.p2} value={it.d2} onChange={(ev) => upd(it.chave, 'd2', ev.target.value)} maxLength={it.placa.TIPO_DESTINO === 'WIFI' ? 63 : 120} />}
                          </div>
                          {e && c.r2 && <p className="text-[12px]" style={{ color: 'var(--danger-text)' }}>{e}</p>}
                          {it.placa.TIPO_DESTINO === 'WIFI' && (
                            <p className="text-[12.5px] flex gap-2" style={{ color: 'var(--info-text)' }}><Wifi size={14} className="shrink-0 mt-0.5" /> {AVISO_WIFI_IPHONE}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="cartao" id="endereco">
                <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <h2 className="text-[15px] font-semibold">2. Entrega</h2>
                  <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--fg-subtle)' }}>Grátis em Joinville. Fora de Joinville, pelos Correios.</p>
                </div>
                <div className="p-5 grid gap-4 sm:grid-cols-6">
                  <div className="sm:col-span-3"><Input label="Quem recebe" value={end.nome} onChange={(e) => setE('nome', e.target.value)} maxLength={120} error={tentou && !end.nome.trim() ? 'Obrigatório' : undefined} /></div>
                  <div className="sm:col-span-3"><Input label="Telefone com DDD" inputMode="tel" placeholder="(47) 99999-9999" value={end.telefone} onChange={(e) => setE('telefone', fmtTel(e.target.value))} error={tentou && soNum(end.telefone).length < 10 ? 'Telefone com DDD' : undefined} /></div>
                  <div className="sm:col-span-2"><Input label="CEP" inputMode="numeric" placeholder="89200-000" value={end.cep} onChange={(e) => setE('cep', fmtCep(e.target.value))} error={tentou && cep.length !== 8 ? 'CEP inválido' : undefined} /></div>
                  <div className="sm:col-span-4"><Input label="Rua" value={end.logradouro} onChange={(e) => setE('logradouro', e.target.value)} maxLength={160} error={tentou && !end.logradouro.trim() ? 'Obrigatório' : undefined} /></div>
                  <div className="sm:col-span-2"><Input label="Número" value={end.numero} onChange={(e) => setE('numero', e.target.value)} maxLength={20} error={tentou && !end.numero.trim() ? 'Obrigatório' : undefined} /></div>
                  <div className="sm:col-span-4"><Input label="Complemento" placeholder="Opcional" value={end.complemento} onChange={(e) => setE('complemento', e.target.value)} maxLength={80} /></div>
                  <div className="sm:col-span-3"><Input label="Bairro" value={end.bairro} onChange={(e) => setE('bairro', e.target.value)} maxLength={80} error={tentou && !end.bairro.trim() ? 'Obrigatório' : undefined} /></div>
                  <div className="sm:col-span-2"><Input label="Cidade" value={end.cidade} onChange={(e) => setE('cidade', e.target.value)} maxLength={80} error={tentou && !end.cidade.trim() ? 'Obrigatório' : undefined} /></div>
                  <div className="sm:col-span-1"><Input label="UF" value={end.uf} onChange={(e) => setE('uf', e.target.value.toUpperCase().slice(0, 2))} error={tentou && !/^[A-Za-z]{2}$/.test(end.uf) ? 'UF' : undefined} /></div>
                </div>
              </div>
            </div>

            <div className="cartao p-5 flex flex-col gap-3 lg:sticky lg:top-20">
              <h2 className="text-[15px] font-semibold">Resumo</h2>
              <div className="flex justify-between text-[14px]"><span style={{ color: 'var(--fg-muted)' }}>{itens.length} plaquinhas</span><span className="tabular-nums">{brl(preco!.total)}</span></div>
              {preco!.economia > 0 && <div className="flex justify-between text-[13px] texto-marca"><span>Economia do combo</span><span className="tabular-nums">−{brl(preco!.economia)}</span></div>}
              <div className="flex justify-between text-[14px]">
                <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--fg-muted)' }}><Truck size={14} /> Frete</span>
                <span className="tabular-nums">{cep.length !== 8 ? 'Informe o CEP' : frete ? (frete.valor === 0 ? 'Grátis' : brl(frete.valor)) : freteErro ? '—' : 'Calculando...'}</span>
              </div>
              {local && <p className="text-[12.5px] font-semibold texto-marca">Entrega grátis em Joinville</p>}
              {!local && frete && <p className="text-[12px]" style={{ color: 'var(--fg-subtle)' }}>Frete provisório dos Correios. O valor final da embalagem ainda está sendo definido pela loja.</p>}
              {freteErro && <p className="text-[12.5px]" style={{ color: 'var(--danger-text)' }}>{freteErro}</p>}
              <div className="flex justify-between pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <span className="font-semibold">Total</span>
                <span className="text-[20px] font-extrabold tabular-nums">{brl(preco!.total + (frete?.valor ?? 0))}</span>
              </div>
              {tentou && (erros.some(Boolean) || endErro) && <p className="text-[12.5px]" style={{ color: 'var(--danger-text)' }}>Confira os campos destacados.</p>}
              {erro && <p className="text-[12.5px]" style={{ color: 'var(--danger-text)' }}>{erro}</p>}
              <button className="botao-vitrine w-full mt-1 disabled:opacity-60" onClick={confirmar} disabled={enviando || !frete}>
                <Lock size={16} /> {enviando ? 'Gravando pedido...' : 'Ir para o pagamento'}
              </button>
              <p className="text-[12px] text-center" style={{ color: 'var(--fg-subtle)' }}>Pix ou cartão em até 3x sem juros pelo Mercado Pago.</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
