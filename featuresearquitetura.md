# Features e arquitetura — JoiSmart

## Features para quem usa
- **Visitante (sem login):** página inicial com logo, plaquinhas animadas, como funciona, os 6 modelos (Google azul/preta, Instagram, Cardápio, Pix, Wi-Fi), "Novidades em breve", preços (R$ 49,90 / 3 por R$ 120), mapa de clientes de Joinville, página de cada plaquinha, carrinho (guardado no navegador) e WhatsApp flutuante em todas as páginas.
- **Cliente (logado):** login Google, e-mail e senha (Facebook e Apple em modo de teste); destino de cada plaquinha; endereço com frete (grátis em Joinville, Correios provisório fora); pagamento Mercado Pago em modo de teste (Pix ou cartão 1x–6x, 4x–6x com juros); Meus pedidos com situação.
- **Administrador (pvd.breis@gmail.com, kleber3011@gmail.com, ou perfil "Administrador"):** relatório de vendas por período; pedidos com itens/destinos/endereço e troca de situação; preços, frete provisório e juros; clientes do mapa (incluir, alterar, remover).
- Cancelamento automático de pedido não pago em 3 dias (rotina de hora em hora).

## Dados (3NF)
CONFIG (chave/valor) · PLACAS (modelos) · STATUS_PEDIDO (lookup) · PEDIDOS (cliente = :VAR_USER, preço do momento, frete, juros, endereço) · PEDIDO_ITENS (uma linha por plaquinha, com destino) · CLIENTES_MAPA.

## Backend
- SF públicas (só leitura): catálogo+preços, mapa.
- SF do cliente: cotarFrete, criarPedido (JS, valida e calcula tudo no servidor), pagarPedidoTeste (SQL, juros calculados no servidor), meusPedidos, meuPedido, meuPedidoItens, souAdmin.
- SF do admin: todas conferem o administrador no SQL.
- Total = subtotal + frete + juros, sempre recalculado no servidor.

## Riscos
- Mercado Pago real, login Facebook/Apple e frete real dos Correios dependem das contas da loja (PA-01, PA-03).
- Cadastro livre de clientes depende da privacidade do app na publicação.
