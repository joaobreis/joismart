# UX — JoiSmart
Site de vendas público, uma página principal longa + páginas de compra. Topo fixo com links (Plaquinhas, Preços, Mapa), Meus pedidos/Entrar, Administração (só admin) e carrinho com contador. WhatsApp flutuante no canto inferior direito.

- `/` Início: hero com logo e plaquinhas inclinadas → faixa promocional rolando → Como funciona (3 passos) → Modelos (cards com adicionar) → Preços (tabela de combos e economia) → Mapa → chamada final.
- `/plaquinha/:id` página do modelo (aviso do Wi-Fi no iPhone).
- `/carrinho` itens por modelo com +/−, total com combos e economia.
- `/checkout` (login) destinos de cada plaquinha → endereço e frete → resumo.
- `/pedido/:id` pagamento (Pix ou cartão, parcelas) em modo de teste e confirmação.
- `/meus-pedidos` lista com situação.
- `/admin` com abas: Vendas, Pedidos, Preços e frete, Mapa.
- `/login` com volta ao lugar de onde veio.
