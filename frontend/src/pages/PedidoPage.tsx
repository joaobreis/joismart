import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, CreditCard, FlaskConical, QrCode, Truck, Wifi } from 'lucide-react';
import Layout from '../components/site/Layout';
import Badge from '../components/ui/Badge';
import { useCatalogo, brl, parcelas, AVISO_WIFI_IPHONE, carrinhoAcoes } from '../lib/loja';
import { imgPlaca } from '../lib/placas-img';
import { chamar, linhas } from '../lib/api';
import { SF } from '../lib/sf-ids';
import { getMitraErrorMessage } from '../lib/utils';

interface Linha {
  ID: number; CRIADO_EM: string; STATUS_ID: number; STATUS: string; SUBTOTAL: number; FRETE: number; JUROS: number;
  FORMA_PAGAMENTO: string | null; PARCELAS: number | null; ENTREGA_LOCAL: number | boolean; NOME_RECEBEDOR: string;
  CEP: string; LOGRADOURO: string; NUMERO: string; COMPLEMENTO: string; BAIRRO: string; CIDADE: string; UF: string;
  ITEM_ID: number; PLACA: string; COR: string | null; IMAGEM: string; TIPO_DESTINO: string; DESTINO_1: string; DESTINO_2: string | null;
}

export const variantePorSituacao = (id: number): 'success' | 'danger' | 'info' | 'warning' | 'neutral' | 'accent' =>
  id === 1 ? 'warning' : id === 7 ? 'danger' : id === 6 ? 'success' : id === 2 ? 'accent' : 'info';

const codigoDaImagem = (img: string) => (img.split('/').pop() ?? '').replace(/\.[a-z]+$/, '');

export default function PedidoPage() {
  const { id } = useParams();
  const cat = useCatalogo();
  const [itens, setItens] = useState<Linha[] | null>(null);
  const [erro, setErro] = useState('');
  const [forma, setForma] = useState<'PIX' | 'CARTAO'>('PIX');
  const [nParc, setNParc] = useState(1);
  const [pagando, setPagando] = useState(false);

  async function carregar() {
    try {
      const r = await linhas(SF.cli_pedidoDetalhe, { pedidoId: Number(id) || 0 });
      setItens(r.map((x) => ({ ...x, STATUS_ID: Number(x.STATUS_ID), SUBTOTAL: Number(x.SUBTOTAL), FRETE: Number(x.FRETE), JUROS: Number(x.JUROS ?? 0) })));
    } catch (e) { setErro(getMitraErrorMessage(e)); }
  }
  useEffect(() => { carregar(); carrinhoAcoes.limpar(); }, [id]);

  async function pagar() {
    setPagando(true); setErro('');
    try {
      await chamar(SF.cli_pagarTeste, { pedidoId: Number(id), forma, parcelas: forma === 'PIX' ? 1 : nParc });
      await carregar();
    } catch (e) { setErro(getMitraErrorMessage(e)); }
    finally { setPagando(false); }
  }

  const p = itens?.[0];
  const total = p ? p.SUBTOTAL + p.FRETE : 0;
  const juros = cat?.precos.juros ?? {};
  const opcoes = [1, 2, 3, 4, 5, 6].map((n) => parcelas(total, n, juros));
  const escolhida = opcoes[nParc - 1];

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 md:px-6 py-8 md:py-12">
        <Link to="/meus-pedidos" className="inline-flex items-center gap-1.5 text-[13px]" style={{ color: 'var(--fg-muted)' }}><ArrowLeft size={14} /> Meus pedidos</Link>
        {!itens ? (erro ? <p className="mt-6" style={{ color: 'var(--danger)' }}>{erro}</p> : <div className="skeleton h-64 rounded-2xl mt-6" />) : !p ? (
          <div className="cartao p-8 mt-6 text-center"><p style={{ color: 'var(--fg-muted)' }}>Pedido não encontrado.</p></div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <h1 className="vitrine-sub">Pedido #{p.ID}</h1>
              <Badge variant={variantePorSituacao(p.STATUS_ID)} dot>{p.STATUS}</Badge>
            </div>
            <div className="grid gap-5 lg:grid-cols-[1fr_360px] mt-6 items-start">
              <div className="flex flex-col gap-3">
                {itens.map((i) => (
                  <div key={i.ITEM_ID} className="cartao p-4 flex items-center gap-4">
                    <img src={imgPlaca(codigoDaImagem(i.IMAGEM))} alt="" className="w-16 h-16 object-contain placa-img" />
                    <div className="min-w-0">
                      <p className="font-semibold text-[14.5px]">{i.COR ? `${i.PLACA} (${i.COR.toLowerCase()})` : i.PLACA}</p>
                      <p className="text-[13px] break-all" style={{ color: 'var(--fg-muted)' }}>{i.DESTINO_1}{i.TIPO_DESTINO === 'WIFI' && i.DESTINO_2 ? ' · senha cadastrada' : i.DESTINO_2 ? ` · ${i.DESTINO_2}` : ''}</p>
                    </div>
                  </div>
                ))}
                {itens.some((i) => i.TIPO_DESTINO === 'WIFI') && (
                  <p className="text-[13.5px] flex gap-2 rounded-xl p-3.5" style={{ background: 'var(--info-soft)', color: 'var(--info-text)' }}><Wifi size={16} className="shrink-0 mt-0.5" /> {AVISO_WIFI_IPHONE}</p>
                )}
                <div className="cartao p-4 flex gap-3 text-[13.5px]">
                  <Truck size={18} className="shrink-0 texto-marca" />
                  <div>
                    <p className="font-semibold">{Number(p.ENTREGA_LOCAL) ? 'Entrega grátis em Joinville' : 'Envio pelos Correios'}</p>
                    <p style={{ color: 'var(--fg-muted)' }}>{p.NOME_RECEBEDOR} · {p.LOGRADOURO}, {p.NUMERO}{p.COMPLEMENTO ? ` – ${p.COMPLEMENTO}` : ''} · {p.BAIRRO} · {p.CIDADE}/{p.UF} · CEP {p.CEP}</p>
                  </div>
                </div>
              </div>

              <div className="cartao p-5 flex flex-col gap-3 lg:sticky lg:top-20">
                <div className="flex justify-between text-[14px]"><span style={{ color: 'var(--fg-muted)' }}>Plaquinhas</span><span className="tabular-nums">{brl(p.SUBTOTAL)}</span></div>
                <div className="flex justify-between text-[14px]"><span style={{ color: 'var(--fg-muted)' }}>Frete</span><span className="tabular-nums">{p.FRETE > 0 ? brl(p.FRETE) : 'Grátis'}</span></div>
                {p.JUROS > 0 && <div className="flex justify-between text-[14px]"><span style={{ color: 'var(--fg-muted)' }}>Juros do parcelamento</span><span className="tabular-nums">{brl(p.JUROS)}</span></div>}
                <div className="flex justify-between pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span className="font-semibold">Total</span><span className="text-[20px] font-extrabold tabular-nums">{brl(p.STATUS_ID === 1 && forma === 'CARTAO' ? escolhida.final : total + p.JUROS)}</span>
                </div>

                {p.STATUS_ID === 1 ? (
                  <>
                    <p className="text-[12.5px] flex gap-2 rounded-xl p-3" style={{ background: 'var(--warning-soft)', color: 'var(--warning-text)' }}>
                      <FlaskConical size={15} className="shrink-0 mt-0.5" /> Pagamento em modo de teste: nenhuma cobrança é feita até a conta do Mercado Pago ser ligada.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {(['PIX', 'CARTAO'] as const).map((f) => (
                        <button key={f} className={f === forma ? 'botao-vitrine !h-11 !px-3 !text-[14px]' : 'botao-vitrine-sec !h-11 !px-3 !text-[14px]'} onClick={() => setForma(f)}>
                          {f === 'PIX' ? <><QrCode size={16} /> Pix</> : <><CreditCard size={16} /> Cartão</>}
                        </button>
                      ))}
                    </div>
                    {forma === 'PIX' ? (
                      <div className="flex flex-col items-center gap-2 py-2">
                        <div className="qr-teste" aria-label="QR code de exemplo" />
                        <p className="text-[12.5px] text-center" style={{ color: 'var(--fg-subtle)' }}>QR code de exemplo. Com o Mercado Pago ligado, aqui aparece o Pix de verdade.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {opcoes.map((o) => (
                          <button key={o.n} onClick={() => setNParc(o.n)} className="flex justify-between items-center rounded-xl border px-3 h-11 text-[13.5px]"
                            style={{ borderColor: o.n === nParc ? 'var(--accent)' : 'var(--border)', background: o.n === nParc ? 'var(--accent-soft)' : 'transparent' }}>
                            <span>{o.n}x de <b className="tabular-nums">{brl(o.valor)}</b></span>
                            <span className="text-[12px]" style={{ color: o.semJuros ? 'var(--accent-text)' : 'var(--fg-subtle)' }}>{o.semJuros ? 'sem juros' : `total ${brl(o.final)}`}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {erro && <p className="text-[13px]" style={{ color: 'var(--danger)' }}>{erro}</p>}
                    <button className="botao-vitrine w-full disabled:opacity-60" onClick={pagar} disabled={pagando}>
                      {pagando ? 'Aprovando…' : 'Simular pagamento aprovado'}
                    </button>
                  </>
                ) : p.STATUS_ID === 7 ? (
                  <p className="text-[13.5px]" style={{ color: 'var(--fg-muted)' }}>Este pedido foi cancelado.</p>
                ) : (
                  <div className="flex flex-col items-center text-center gap-2 py-2">
                    <CheckCircle2 size={36} className="texto-marca" />
                    <p className="font-semibold">Pagamento aprovado</p>
                    <p className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>
                      {p.FORMA_PAGAMENTO === 'CARTAO' ? `Cartão em ${p.PARCELAS}x` : 'Pix'}. Agora a gente produz as suas plaquinhas e avisa a cada etapa.
                    </p>
                    <Link to="/meus-pedidos" className="botao-vitrine-sec !h-11 w-full mt-1">Ver meus pedidos</Link>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
