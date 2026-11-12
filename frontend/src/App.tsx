import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { initMitra, configurePublic } from './lib/mitra-auth'
import { definirLogado } from './lib/sessao'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import PlacaPage from './pages/PlacaPage'
import CarrinhoPage from './pages/CarrinhoPage'
import CheckoutPage from './pages/CheckoutPage'
import PedidoPage from './pages/PedidoPage'
import MeusPedidosPage from './pages/MeusPedidosPage'
import AdminPage from './pages/admin/AdminPage'

function iniciar() {
  const ok = initMitra()
  if (!ok) configurePublic()
  definirLogado(ok)
  return ok
}

function App() {
  const [logado, setLogado] = useState(iniciar)
  const exigeLogin = (el: React.ReactElement, rota: string) =>
    logado ? el : <Navigate to={`/login?volta=${encodeURIComponent(rota)}`} replace />

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/plaquinha/:codigo" element={<PlacaPage />} />
      <Route path="/carrinho" element={<CarrinhoPage />} />
      <Route path="/checkout" element={exigeLogin(<CheckoutPage />, '/checkout')} />
      <Route path="/pedido/:id" element={exigeLogin(<PedidoPage />, '/meus-pedidos')} />
      <Route path="/meus-pedidos" element={exigeLogin(<MeusPedidosPage />, '/meus-pedidos')} />
      <Route path="/admin" element={exigeLogin(<AdminPage />, '/admin')} />
      <Route path="/login" element={<LoginPage onLogin={() => setLogado(true)} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
