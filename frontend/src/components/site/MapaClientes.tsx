import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface PontoMapa { ID: number; NOME: string; SEGMENTO: string; BAIRRO: string; LAT: number; LNG: number; TESTE: boolean | number; }

const esc = (s: string) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export default function MapaClientes({ pontos, altura = 420, aoClicarMapa }: { pontos: PontoMapa[]; altura?: number; aoClicarMapa?: (lat: number, lng: number) => void }) {
  const caixa = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const camada = useRef<L.LayerGroup | null>(null);
  const clique = useRef(aoClicarMapa);
  clique.current = aoClicarMapa;

  useEffect(() => {
    if (!caixa.current || mapa.current) return;
    const m = L.map(caixa.current, { scrollWheelZoom: false, zoomControl: true }).setView([-26.3045, -48.8487], 12);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO', subdomains: 'abcd', maxZoom: 19,
    }).addTo(m);
    m.on('click', (e: L.LeafletMouseEvent) => clique.current?.(e.latlng.lat, e.latlng.lng));
    camada.current = L.layerGroup().addTo(m);
    mapa.current = m;
    return () => { m.remove(); mapa.current = null; };
  }, []);

  useEffect(() => {
    const g = camada.current;
    if (!g) return;
    g.clearLayers();
    pontos.forEach((p) => {
      const teste = p.TESTE === true || Number(p.TESTE) === 1;
      const icone = L.divIcon({ className: '', html: `<div class="mapa-ponto ${teste ? 'mapa-ponto-teste' : ''}"></div>`, iconSize: [18, 18], iconAnchor: [9, 9] });
      L.marker([Number(p.LAT), Number(p.LNG)], { icon: icone })
        .bindPopup(`<strong>${esc(p.NOME)}</strong><br/><span style="color:var(--fg-muted)">${esc(p.SEGMENTO)}${p.BAIRRO ? ' · ' + esc(p.BAIRRO) : ''}</span>${teste ? '<br/><em style="color:var(--warning-text)">cliente de teste</em>' : ''}`)
        .addTo(g);
    });
  }, [pontos]);

  return <div ref={caixa} className="mapa-caixa" style={{ height: altura }} />;
}
