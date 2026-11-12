import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, Tag, Wifi, ArrowRight } from 'lucide-react';
import Layout from '../components/site/Layout';
import { useCatalogo, useCarrinho, carrinhoAcoes, brl, calcularPreco, nomePlaca, AVISO_WIFI_IPHONE } from '../lib/loja';
import { imgPlaca } from '../lib/placas-img';
import { useLogado } from '../lib/sessao';

export default function CarrinhoPage() {
  const cat = useCatalogo();
  const { itens, qtd } = useCarrinho();
  const logado = useLogado();
  const navigate = useNavigate();
  const linhas = (cat?.placas ?? []).filter((p) => itens[p.ID] > 0).map((p) => ({ p, q: itens[p.ID] }));
  const qtdValida = linhas.reduce((a, l) => a + l.q, 0);
  const preco = cat ? calcularPreco(qtdValida, cat.precos.unit, cat.precos.combo) : null;
  const faltam = qtdValida % 3 === 0 ? 0 : 3 - (qtdValida % 3);
  const temWifi = linhas.some((l) => l.p.TIPO_DESTINO === 'WIFI');

  function fechar() {
    navigate(logado ? '/checkout' : '/login?volta=%2Fcheckout');
  }

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 md:px-6 py-8 md:py-12">
        <h1 className="vitrine-sub">Seu carrinho</h1>
        {!cat ? <div className="skeleton h-64 rounded-2xl mt-6" /> : qtd === 0 || linhas.length === 0 ? (
          <div className="cartao p-10 mt-6 flex flex-col items-center text-center gap-4">
            <span className="passo-num"><ShoppingBag size={20} /></span>
            <p className="text-[15px]" style={{ color: 'var(--fg-muted)' }}>O carrinho está vazio. Escolha as suas plaquinhas.</p>
            <Link to="/#modelos" className="botao-vitrine">Ver plaquinhas</Link>
            <button className="botao-vitrine-sec !h-11" disabled>Fechar pedido</button>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_340px] mt-6 items-start">
            <div className="flex flex-col gap-3">
              {linhas.map(({ p, q }) => (
                <div key={p.ID} className="cartao p-4 flex items-center gap-4">
                  <img src={imgPlaca(p.CODIGO)} alt="" className="w-20 h-20 object-contain placa-img" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[15px]" style={{ color: 'var(--fg)' }}>{nomePlaca(p)}</p>
                    <p className="text-[13px]" style={{ color: 'var(--fg-subtle)' }}>{brl(cat.precos.unit)} a unidade</p>
                    <div className="mt-2 inline-flex items-center rounded-lg border h-9" style={{ borderColor: 'var(--border)' }}>
                      <button className="h-full px-3" onClick={() => carrinhoAcoes.definir(p.ID, q - 1)} aria-label="Menos"><Minus size={14} /></button>
                      <span className="w-7 text-center font-semibold tabular-nums">{q}</span>
                      <button className="h-full px-3" onClick={() => carrinhoAcoes.definir(p.ID, q + 1)} aria-label="Mais"><Plus size={14} /></button>
                    </div>
                  </div>
                  <button className="nav-item nav-icone" onClick={() => carrinhoAcoes.definir(p.ID, 0)} aria-label="Remover"><Trash2 size={16} /></button>
                </div>
              ))}
              {temWifi && (
                <p className="text-[13.5px] flex gap-2 rounded-xl p-3.5" style={{ background: 'var(--info-soft)', color: 'var(--info-text)' }}>
                  <Wifi size={16} className="shrink-0 mt-0.5" /> {AVISO_WIFI_IPHONE}
                </p>
              )}
            </div>
            <div className="cartao p-5 flex flex-col gap-3 lg:sticky lg:top-20">
              <h2 className="text-[15px] font-semibold">Resumo</h2>
              <div className="flex justify-between text-[14px]"><span style={{ color: 'var(--fg-muted)' }}>{qtdValida} plaquinhas sem combo</span><span className="tabular-nums" style={{ color: 'var(--fg-subtle)' }}>{brl(preco!.semCombo)}</span></div>
              {preco!.grupos > 0 && <div className="flex justify-between text-[14px]"><span style={{ color: 'var(--fg-muted)' }}>{preco!.grupos} combo{preco!.grupos > 1 ? 's' : ''} de 3 × {brl(cat.precos.combo)}</span><span className="tabular-nums">{brl(preco!.grupos * cat.precos.combo)}</span></div>}
              {preco!.resto > 0 && <div className="flex justify-between text-[14px]"><span style={{ color: 'var(--fg-muted)' }}>{preco!.resto} avulsa{preco!.resto > 1 ? 's' : ''} × {brl(cat.precos.unit)}</span><span className="tabular-nums">{brl(preco!.resto * cat.precos.unit)}</span></div>}
              {preco!.economia > 0 && (
                <div className="flex justify-between text-[14px] font-semibold texto-marca"><span className="inline-flex items-center gap-1.5"><Tag size={14} /> Você economiza</span><span className="tabular-nums">{brl(preco!.economia)}</span></div>
              )}
              <div className="flex justify-between pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <span className="font-semibold">Total das plaquinhas</span><span className="text-[20px] font-extrabold tabular-nums">{brl(preco!.total)}</span>
              </div>
              <p className="text-[12.5px]" style={{ color: 'var(--fg-subtle)' }}>Frete calculado no próximo passo. Grátis em Joinville.</p>
              {faltam > 0 && qtdValida > 0 && (
                <p className="text-[13px] rounded-xl p-3" style={{ background: 'var(--accent-soft)', color: 'var(--accent-text)' }}>
                  Adicione mais {faltam} e feche um combo de 3 por {brl(cat.precos.combo)}.
                </p>
              )}
              <button className="botao-vitrine w-full mt-1" onClick={fechar}>Fechar pedido <ArrowRight size={18} /></button>
              <Link to="/#modelos" className="text-center text-[13px]" style={{ color: 'var(--fg-muted)' }}>Continuar comprando</Link>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
