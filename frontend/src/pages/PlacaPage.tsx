import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Minus, Plus, ShoppingBag, Wifi } from 'lucide-react';
import Layout from '../components/site/Layout';
import { useCatalogo, carrinhoAcoes, brl, nomePlaca, AVISO_WIFI_IPHONE, calcularPreco } from '../lib/loja';
import { imgPlaca } from '../lib/placas-img';

const DESTINO_TXT: Record<string, string> = {
  GOOGLE: 'Você informa o link de avaliação do seu negócio no Google.',
  INSTAGRAM: 'Você informa o @ do perfil do Instagram.',
  CARDAPIO: 'Você informa o link do seu cardápio digital.',
  PIX: 'Você informa a chave Pix e o nome do recebedor.',
  WIFI: 'Você informa o nome da rede e a senha do Wi-Fi.',
};

export default function PlacaPage() {
  const { codigo } = useParams();
  const cat = useCatalogo();
  const [qtd, setQtd] = useState(1);
  const [ok, setOk] = useState(false);
  const p = cat?.placas.find((x) => x.CODIGO === codigo);

  if (cat && !p) {
    return <Layout><div className="mx-auto max-w-xl px-4 py-24 text-center"><h1 className="text-[20px] font-semibold">Plaquinha não encontrada</h1><Link to="/#modelos" className="botao-vitrine mt-6">Ver plaquinhas</Link></div></Layout>;
  }
  const outras = cat?.placas.filter((x) => x.CODIGO !== codigo && x.TIPO_DESTINO === p?.TIPO_DESTINO) ?? [];

  return (
    <Layout>
      <section className="hero-fundo">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-8 md:py-14">
          <Link to="/#modelos" className="nav-item -ml-3"><ArrowLeft size={16} /> Todas as plaquinhas</Link>
          {!p ? <div className="skeleton h-[480px] rounded-2xl mt-6" /> : (
            <div className="grid gap-10 md:grid-cols-2 items-center mt-4">
              <img src={imgPlaca(p.CODIGO)} alt={nomePlaca(p)} className="placa-img placa-flutua w-[86%] max-w-[480px] mx-auto animate-scaleIn" style={{ ['--giro' as string]: '-5deg' }} />
              <div className="flex flex-col gap-5 animate-slideUp">
                <div>
                  <span className="rotulo-secao">Plaquinha NFC + QR code</span>
                  <h1 className="vitrine-sub mt-2">{p.NOME}</h1>
                  {p.COR && <p className="mt-1 text-[15px]" style={{ color: 'var(--fg-muted)' }}>Cor {p.COR.toLowerCase()}</p>}
                </div>
                <p className="text-[16px]" style={{ color: 'var(--fg-muted)' }}>{p.DESCRICAO}</p>
                <ul className="flex flex-col gap-2 text-[14px]" style={{ color: 'var(--fg)' }}>
                  <li className="flex gap-2"><Check size={17} className="texto-marca shrink-0" /> Frase impressa: “{p.FRASE}”</li>
                  <li className="flex gap-2"><Check size={17} className="texto-marca shrink-0" /> Aproximação NFC e QR code na mesma plaquinha</li>
                  <li className="flex gap-2"><Check size={17} className="texto-marca shrink-0" /> {DESTINO_TXT[p.TIPO_DESTINO]}</li>
                </ul>
                {outras.length > 0 && (
                  <div className="flex gap-2 items-center text-[13px]" style={{ color: 'var(--fg-muted)' }}>
                    Também em: {outras.map((o) => <Link key={o.ID} to={`/plaquinha/${o.CODIGO}`} className="pilula">{o.COR}</Link>)}
                  </div>
                )}
                {p.TIPO_DESTINO === 'WIFI' && (
                  <p className="text-[13.5px] flex gap-2 rounded-xl p-3.5" style={{ background: 'var(--info-soft)', color: 'var(--info-text)' }}>
                    <Wifi size={16} className="shrink-0 mt-0.5" /> {AVISO_WIFI_IPHONE}
                  </p>
                )}
                <div className="flex items-end gap-3">
                  <span className="text-[30px] font-extrabold tabular-nums texto-marca">{brl(cat!.precos.unit)}</span>
                  <span className="text-[14px] pb-1.5" style={{ color: 'var(--fg-subtle)' }}>ou 3 por {brl(cat!.precos.combo)} misturando modelos</span>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="inline-flex items-center rounded-[14px] border h-[52px]" style={{ borderColor: 'var(--border-strong)' }}>
                    <button className="h-full px-4" onClick={() => setQtd(Math.max(1, qtd - 1))} aria-label="Menos"><Minus size={16} /></button>
                    <span className="w-8 text-center font-bold tabular-nums">{qtd}</span>
                    <button className="h-full px-4" onClick={() => setQtd(Math.min(60, qtd + 1))} aria-label="Mais"><Plus size={16} /></button>
                  </div>
                  <button className="botao-vitrine" onClick={() => { carrinhoAcoes.adicionar(p.ID, qtd); setOk(true); }}>
                    {ok ? <><Check size={18} /> No carrinho</> : <><ShoppingBag size={18} /> Adicionar · {brl(calcularPreco(qtd, cat!.precos.unit, cat!.precos.combo).total)}</>}
                  </button>
                  {ok && <Link to="/carrinho" className="botao-vitrine-sec">Ver carrinho</Link>}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
