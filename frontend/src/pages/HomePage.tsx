import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Smartphone, QrCode, Star, Plus, Check, Truck, CreditCard, Sparkles, MapPin, ArrowRight, Wifi } from 'lucide-react';
import Layout from '../components/site/Layout';
import Logo from '../components/site/Logo';
import Revelar from '../components/site/Revelar';
import MapaClientes from '../components/site/MapaClientes';
import type { PontoMapa } from '../components/site/MapaClientes';
import { useCatalogo, carrinhoAcoes, brl, calcularPreco, nomePlaca, AVISO_WIFI_IPHONE } from '../lib/loja';
import { imgPlaca } from '../lib/placas-img';
import { linhasPublicas } from '../lib/api';
import { SF } from '../lib/sf-ids';

interface Placa { ID: number; CODIGO: string; NOME: string; TIPO_DESTINO: string; FRASE: string; DESCRICAO: string; COR: string | null; }

const HERO = [
  { c: 'instagram', giro: -14, cls: 'left-[2%] top-[18%] w-[34%] z-10', d: '0s' },
  { c: 'google-azul', giro: -4, cls: 'left-[24%] top-[4%] w-[42%] z-30', d: '.8s' },
  { c: 'cardapio', giro: 9, cls: 'left-[56%] top-[14%] w-[36%] z-20', d: '1.6s' },
  { c: 'pix', giro: 15, cls: 'left-[62%] top-[50%] w-[32%] z-10', d: '2.4s' },
  { c: 'wifi', giro: -10, cls: 'left-[8%] top-[54%] w-[30%] z-20', d: '3.2s' },
];

function BotaoAdicionar({ placa }: { placa: Placa }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      className="botao-vitrine !h-11 !px-4 !text-[13px] w-full"
      onClick={() => { carrinhoAcoes.adicionar(placa.ID); setOk(true); setTimeout(() => setOk(false), 1400); }}
    >
      {ok ? <><Check size={16} /> Adicionada</> : <><Plus size={16} /> Adicionar</>}
    </button>
  );
}

export default function HomePage() {
  const cat = useCatalogo();
  const navigate = useNavigate();
  const [pontos, setPontos] = useState<PontoMapa[]>([]);
  useEffect(() => { linhasPublicas(SF.pub_mapa).then(setPontos).catch(() => setPontos([])); }, []);

  const unit = cat?.precos.unit ?? 49.9;
  const combo = cat?.precos.combo ?? 120;
  const economia3 = calcularPreco(3, unit, combo).economia;
  const pct = Math.round((economia3 / (unit * 3)) * 100);
  const faixa = [`3 plaquinhas por ${brl(combo)}`, 'Entrega grátis em Joinville', 'Pix ou 3x sem juros', 'Misture os modelos no combo', `Economize ${brl(economia3)}`];

  return (
    <Layout>
      <section className="hero-fundo overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 md:px-6 pt-10 pb-14 md:pt-16 md:pb-20 grid gap-10 md:grid-cols-2 items-center">
          <div className="flex flex-col gap-6 animate-slideUp">
            <Logo tamanho={44} />
            <h1 className="vitrine-titulo">
              Aproximou,<br /><span className="texto-marca">conectou.</span>
            </h1>
            <p className="text-[16px] md:text-[17px] max-w-md" style={{ color: 'var(--fg-muted)' }}>
              Plaquinhas NFC com QR code que levam o seu cliente direto para a avaliação no Google, o seu Instagram, o cardápio, o Pix ou o Wi-Fi. Um toque e pronto.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#modelos" className="botao-vitrine">Quero as minhas <ArrowRight size={18} /></a>
              <a href="#como-funciona" className="botao-vitrine-sec">Como funciona</a>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px]" style={{ color: 'var(--fg-subtle)' }}>
              <span className="inline-flex items-center gap-1.5"><Truck size={15} /> Grátis em Joinville</span>
              <span className="inline-flex items-center gap-1.5"><CreditCard size={15} /> Pix ou 3x sem juros</span>
              <span className="inline-flex items-center gap-1.5"><Star size={15} /> {brl(unit)} a unidade</span>
            </div>
          </div>
          <div className="relative aspect-square w-full max-w-[560px] mx-auto">
            {HERO.map((h) => (
              <img key={h.c} src={imgPlaca(h.c)} alt="" draggable={false}
                className={`placa-img placa-flutua absolute ${h.cls}`}
                style={{ ['--giro' as string]: `${h.giro}deg`, animationDelay: h.d }} />
            ))}
            <div className="absolute right-[4%] top-[2%] z-40 rotate-6 rounded-xl px-3 py-2 font-extrabold text-[13px] uppercase tracking-wide"
              style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}>
              3 por {brl(combo)}
            </div>
          </div>
        </div>
      </section>

      <div className="faixa-promo" aria-hidden="true">
        <div className="faixa-promo-trilho">
          {[...faixa, ...faixa, ...faixa, ...faixa].map((t, i) => <span key={i}>★ {t}</span>)}
        </div>
      </div>

      <section id="como-funciona" className="mx-auto max-w-6xl px-4 md:px-6 py-16 md:py-24 scroll-mt-20">
        <Revelar>
          <span className="rotulo-secao">Como funciona</span>
          <h2 className="vitrine-sub mt-2">Sem app, sem cadastro.<br /><span className="texto-marca">É só aproximar.</span></h2>
        </Revelar>
        <div className="grid gap-5 md:grid-cols-3 mt-10">
          {[
            { i: <Smartphone size={20} />, t: 'Aproxime o celular', d: 'O NFC da plaquinha abre o destino na hora: a avaliação, o perfil, o cardápio, o Pix ou o Wi-Fi.' },
            { i: <QrCode size={20} />, t: 'Ou leia o QR code', d: 'Celular sem NFC? Cada plaquinha também tem um QR code. Ninguém fica de fora.' },
            { i: <Sparkles size={20} />, t: 'Seu negócio cresce', d: 'Mais avaliações 5 estrelas, mais seguidores e menos tempo explicando senha ou chave Pix.' },
          ].map((p, k) => (
            <Revelar key={p.t} atraso={k * 120}>
              <div className="cartao p-6 h-full flex flex-col gap-3">
                <span className="passo-num">{p.i}</span>
                <h3 className="text-[17px] font-bold" style={{ color: 'var(--fg)' }}>{k + 1}. {p.t}</h3>
                <p className="text-[14px]" style={{ color: 'var(--fg-muted)' }}>{p.d}</p>
              </div>
            </Revelar>
          ))}
        </div>
      </section>

      <section id="modelos" className="secao-verde py-16 md:py-24 scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <Revelar>
            <span className="rotulo-secao">Plaquinhas</span>
            <h2 className="vitrine-sub mt-2">Escolha a sua.<br /><span className="texto-marca">Ou misture todas.</span></h2>
            <p className="mt-3 text-[15px] max-w-xl" style={{ color: 'var(--fg-muted)' }}>
              Todas no mesmo preço. No combo de 3 você pode misturar modelos e cores.
            </p>
          </Revelar>
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-10">
            {!cat && Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-[460px] rounded-2xl" />)}
            {cat?.placas.map((p, k) => (
              <Revelar key={p.ID} atraso={(k % 3) * 100}>
                <div className="cartao cartao-vivo p-5 h-full flex flex-col gap-4">
                  <button onClick={() => navigate(`/plaquinha/${p.CODIGO}`)} className="block" aria-label={`Ver ${nomePlaca(p)}`}>
                    <img src={imgPlaca(p.CODIGO)} alt={nomePlaca(p)} loading="lazy" className="placa-img placa-hover w-[78%] mx-auto" />
                  </button>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-[17px] font-bold" style={{ color: 'var(--fg)' }}>{p.NOME}</h3>
                      <p className="text-[13px]" style={{ color: 'var(--fg-subtle)' }}>{p.COR ? `Cor ${p.COR.toLowerCase()}` : p.FRASE}</p>
                    </div>
                    <span className="text-[17px] font-extrabold tabular-nums whitespace-nowrap texto-marca">{brl(unit)}</span>
                  </div>
                  <p className="text-[14px] flex-1" style={{ color: 'var(--fg-muted)' }}>{p.DESCRICAO}</p>
                  {p.TIPO_DESTINO === 'WIFI' && (
                    <p className="text-[12.5px] flex gap-2 rounded-xl p-3" style={{ background: 'var(--info-soft)', color: 'var(--info-text)' }}>
                      <Wifi size={15} className="shrink-0 mt-0.5" /> {AVISO_WIFI_IPHONE}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Link to={`/plaquinha/${p.CODIGO}`} className="botao-vitrine-sec !h-11 !px-4 !text-[13px]">Detalhes</Link>
                    <BotaoAdicionar placa={p} />
                  </div>
                </div>
              </Revelar>
            ))}
            {cat && (
              <Revelar>
                <div className="cartao p-6 h-full min-h-[260px] flex flex-col items-center justify-center text-center gap-3 border-dashed">
                  <span className="passo-num"><Sparkles size={20} /></span>
                  <h3 className="text-[20px] font-extrabold uppercase" style={{ color: 'var(--fg)' }}>Novidades em breve</h3>
                  <p className="text-[14px] max-w-[260px]" style={{ color: 'var(--fg-muted)' }}>Novos modelos estão a caminho. Quer um destino diferente? Fale com a gente no WhatsApp.</p>
                </div>
              </Revelar>
            )}
          </div>
        </div>
      </section>

      <section id="precos" className="mx-auto max-w-6xl px-4 md:px-6 py-16 md:py-24 scroll-mt-20">
        <div className="grid gap-10 md:grid-cols-2 items-center">
          <Revelar>
            <span className="rotulo-secao">Preços</span>
            <h2 className="vitrine-sub mt-2">Leve 3 por <span className="texto-marca">{brl(combo)}</span></h2>
            <p className="mt-4 text-[15px]" style={{ color: 'var(--fg-muted)' }}>
              A unidade sai por {brl(unit)}. A cada 3 plaquinhas, de qualquer modelo, você paga {brl(combo)} e economiza {brl(economia3)} (cerca de {pct}%). O que passar do combo volta a {brl(unit)} cada.
            </p>
            <ul className="mt-6 flex flex-col gap-3 text-[15px]" style={{ color: 'var(--fg)' }}>
              <li className="flex gap-3 items-center"><Check size={18} className="texto-marca" /> Misture Google, Instagram, Cardápio, Pix e Wi-Fi</li>
              <li className="flex gap-3 items-center"><Check size={18} className="texto-marca" /> Pix ou cartão em até 3x sem juros</li>
              <li className="flex gap-3 items-center"><Check size={18} className="texto-marca" /> Entrega grátis em Joinville; Correios para o resto do Brasil</li>
            </ul>
          </Revelar>
          <Revelar atraso={120}>
            <div className="cartao overflow-hidden">
              <div className="overflow-x-auto">
                <table className="tabela">
                  <thead><tr><th>Quantidade</th><th className="text-right">Sem combo</th><th className="text-right">Você paga</th><th className="text-right">Economia</th></tr></thead>
                  <tbody>
                    {[1, 3, 4, 6, 9].map((q) => {
                      const c = calcularPreco(q, unit, combo);
                      return (
                        <tr key={q}>
                          <td className="font-semibold">{q} {q === 1 ? 'plaquinha' : 'plaquinhas'}</td>
                          <td className="text-right tabular-nums" style={{ color: 'var(--fg-subtle)' }}>{c.economia > 0 ? <s>{brl(c.semCombo)}</s> : '—'}</td>
                          <td className="text-right tabular-nums font-bold">{brl(c.total)}</td>
                          <td className="text-right tabular-nums texto-marca font-semibold">{c.economia > 0 ? brl(c.economia) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </Revelar>
        </div>
      </section>

      <section id="mapa" className="secao-verde py-16 md:py-24 scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <Revelar>
            <span className="rotulo-secao">Clientes</span>
            <h2 className="vitrine-sub mt-2">Joinville já está <span className="texto-marca">aproximando.</span></h2>
            <p className="mt-3 text-[15px] flex items-center gap-2" style={{ color: 'var(--fg-muted)' }}>
              <MapPin size={16} /> {pontos.length} estabelecimentos usando as plaquinhas JoiSmart.
            </p>
          </Revelar>
          <Revelar atraso={100} className="mt-8"><MapaClientes pontos={pontos} /></Revelar>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 md:px-6 py-16 md:py-24">
        <Revelar>
          <div className="rounded-[28px] p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 justify-between" style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}>
            <div>
              <h2 className="font-extrabold uppercase leading-[1] tracking-tight" style={{ fontSize: 'clamp(28px, 5vw, 46px)' }}>Monte o seu combo<br />em 1 minuto.</h2>
              <p className="mt-3 text-[15px] font-medium opacity-80">3 plaquinhas por {brl(combo)}. Pague com Pix ou cartão.</p>
            </div>
            <a href="#modelos" className="inline-flex items-center gap-2 h-14 px-8 rounded-2xl font-extrabold uppercase tracking-wide text-[15px]" style={{ background: 'var(--accent-fg)', color: 'var(--accent)' }}>
              Escolher plaquinhas <ArrowRight size={18} />
            </a>
          </div>
        </Revelar>
      </section>
    </Layout>
  );
}
