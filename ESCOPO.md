# Site de venda de plaquinhas NFC — Escopo Técnico Funcional

| Campo | Valor |
|---|---|
| Projeto | Site de venda de plaquinhas NFC |
| Versão | 2.0 |
| Data | 12/11/2026 |
| Elaborado por | Agent (Governador), em entrevista com autopremiet1069p01@imersao.mitralab.io |
| Status | Em elaboração |

## 2. Objetivo

A **JoiSmart**, empresa de João e Kleber em Joinville, vende **plaquinhas NFC** para estabelecimentos. Ao aproximar o celular (ou ler o QR code), a plaquinha abre um destino: o **Instagram** do negócio, uma conversa no **WhatsApp** ou a página **Avalie-nos no Google**.

O objetivo é ter um **site de vendas** que apresente as plaquinhas, deixe o cliente montar o pedido com os tipos e quantidades que quiser, **pagar no próprio site** e receber em casa (Correios) ou de graça em Joinville. O site deve ser moderno, chamativo e minimalista, com transições e imagens PNG das plaquinhas em destaque, seguindo a referência visual enviada pela loja.

O site tem **login de clientes** (Google, Facebook, Apple ou e-mail e senha) e um **login de administrador** com um menu para ver relatórios de vendas, alterar preços e manter o **mapa de clientes** da região de Joinville. Nesta primeira versão os clientes do mapa são fictícios, só para teste.

## 3. Atores e personas

| Persona | Responsabilidade | Interação com o sistema |
|---|---|---|
| Dono ou gerente de estabelecimento (cliente) | Quer mais seguidores, contatos e avaliações para o seu negócio (estúdios, restaurantes, clínicas, salões, lojas e qualquer outro estabelecimento) | Cria conta ou entra com Google, Facebook, Apple ou e-mail e senha; monta o pedido, informa o destino de cada plaquinha, paga no site e acompanha os seus pedidos |
| Visitante | Ainda não conhece a plaquinha NFC | Navega sem login, entende como funciona, vê preços e o mapa de clientes; chama no WhatsApp pelo botão flutuante |
| Administrador (João e Kleber) | Vendem, produzem e enviam os pedidos e cuidam da marca | Entram com login de administrador e usam o menu de administração: relatórios de vendas, pedidos, preços e clientes do mapa |

## 4. Pré-condições

| ID | Descrição | Tipo |
|---|---|---|
| PC-01 | Conta no Mercado Pago ou no Asaas (abertura gratuita, sem mensalidade), com as credenciais de integração para o site cobrar e saber quando o pagamento foi aprovado | Obrigatória |
| PC-02 | Acesso ao cálculo de frete dos Correios e CEP de origem do envio em Joinville | Obrigatória |
| PC-03 | Peso e medidas da plaquinha embalada (1, 3 e 6 unidades), para o cálculo do frete | Obrigatória |
| PC-04 | Contas de desenvolvedor no Google, Facebook (Meta) e Apple para o login social | Obrigatória |
| PC-05 | Domínio do site (ex.: joismart.com.br) | Obrigatória |
| PC-06 | WhatsApp da empresa para o botão flutuante: (47) 99116-1541 | Obrigatória |
| PC-07 | Imagens PNG das plaquinhas: Google azul, Google preta, Instagram, Cardápio, Pix e Wi-Fi (já enviadas pela loja em 12/11) | Obrigatória |
| PC-08 | E-mails dos administradores: pvd.breis@gmail.com e kleber3011@gmail.com | Obrigatória |
| PC-09 | Logo da JoiSmart: será criado no projeto no estilo PicPay e aprovado pela loja | Desejável |

## 5. Glossário

| Termo | Definição |
|---|---|
| JoiSmart | Nome da marca e do site |
| Plaquinha NFC | Placa padrão que, ao aproximar o celular, abre um destino; também tem QR code |
| NFC | Tecnologia de aproximação que lê a plaquinha encostando o celular |
| QR code | Código impresso na plaquinha para quem não usa NFC |
| Tipo de plaquinha | Google (azul ou preta), Instagram, Cardápio, Pix ou Wi-Fi |
| Destino | O que a plaquinha abre: link de avaliação do Google, @ do Instagram, link do cardápio, chave Pix ou rede e senha do Wi-Fi |
| Combo de 3 | Cada grupo de 3 plaquinhas, de qualquer tipo, por R$ 120,00 |
| Carrinho | Lista das plaquinhas escolhidas antes de pagar |
| Pedido | Compra fechada, com itens, destinos, entrega e situação do pagamento |
| Mapa de clientes | Mapa da região de Joinville com os estabelecimentos que usam as plaquinhas |
| Cliente de teste | Estabelecimento fictício do mapa, usado só até entrarem os reais |
| Administrador | Usuário com acesso ao menu de administração (pvd.breis@gmail.com e kleber3011@gmail.com) |
| Login social | Entrar com a conta do Google, Facebook ou Apple |
| WhatsApp flutuante | Botão fixo no canto da tela que abre conversa com a JoiSmart (não é um tipo de plaquinha) |
| Serviço de pagamento | Mercado Pago ou Asaas, que recebe Pix e cartão e avisa o site quando o pagamento é aprovado |

## 6. Regras de negócio

**RN-01 — Tipos de plaquinha.** Por enquanto o site vende cinco tipos, com as imagens PNG enviadas pela loja: **Avalie-nos no Google** ("Nós adoraríamos a sua avaliação no Google", em duas cores: **azul** ou **preta**), **Instagram** ("Siga a gente no Instagram"), **Cardápio** ("Confira nosso cardápio"), **Pix** ("Faça o pagamento com Pix") e **Wi-Fi** ("Conecte-se ao nosso Wi-Fi"). Não há plaquinha de WhatsApp. Cada plaquinha tem a área "Aproxime seu celular" (NFC) e um QR code. O site mostra a chamada "Novidades em breve" para os próximos tipos.

**RN-02 — Plaquinha padrão.** A plaquinha não leva o logo do cliente: o visual é o da imagem do tipo escolhido. Muda só o destino gravado, que o cliente informa no pedido para cada plaquinha: Google = link de avaliação do negócio; Instagram = @ do perfil; Cardápio = link do cardápio; Pix = chave Pix e nome do recebedor; Wi-Fi = nome da rede e senha.

**RN-03 — Preço.** Cada grupo de 3 plaquinhas, de qualquer tipo e cor misturados, sai por **R$ 120,00**. As que sobram fora de um grupo de 3 custam **R$ 49,90** cada. Fórmula: total = (quantidade ÷ 3, sem resto) × R$ 120,00 + (resto) × R$ 49,90. Exemplos: 1 = R$ 49,90; 2 = R$ 99,80; 3 = R$ 120,00; 4 = R$ 169,90; 5 = R$ 219,80; 6 = R$ 240,00; 7 = R$ 289,90. O carrinho mostra a economia (3 unidades economizam R$ 29,70; 6 economizam R$ 59,40). Os dois valores são alterados pelo administrador e valem para os pedidos novos.

**RN-04 — Login.** Para comprar, o cliente precisa de conta: entra com **Google, Facebook, Apple** ou cria conta com **e-mail e senha**. Navegar, ver preços e o mapa não exige login. O cliente logado vê os seus pedidos e a situação de cada um.

**RN-05 — Entrega.** Endereço em **Joinville**: entrega **grátis**. Fora de Joinville: **frete calculado pelos Correios** a partir do CEP, mostrado antes de pagar e somado ao total. Ex.: 4 plaquinhas (R$ 169,90) + frete de R$ 22,00 = R$ 191,90. Peso e medidas da embalagem ainda não definidos (PA-01): até lá o cálculo usa valores provisórios configuráveis pelo administrador.

**RN-06 — Pagamento.** O cliente paga no próprio site pelo **Mercado Pago**, com **Pix** ou **cartão de crédito**. Cartão: **até 3 vezes sem juros**; **4, 5 ou 6 vezes com juros** pagos pelo cliente (taxa do Mercado Pago). Ex.: R$ 120,00 em 3× = 3 de R$ 40,00 sem juros; em 6× o valor das parcelas inclui os juros e o site mostra o total final antes de confirmar. O pedido só vai para produção depois do pagamento aprovado. Enquanto a conta do Mercado Pago não estiver ligada, o site funciona em modo de teste.

**RN-07 — Situação do pedido.** Aguardando pagamento → Pago → Em produção → Enviado (ou Saiu para entrega, em Joinville) → Entregue; ou Cancelado. O administrador muda a situação; Pago é marcado sozinho quando o pagamento é aprovado. Pedido sem pagamento em 3 dias é cancelado sozinho.

**RN-08 — Administrador.** São administradores **pvd.breis@gmail.com** e **kleber3011@gmail.com**. O login de administrador abre o menu de administração: relatório de vendas (faturamento, quantidade de pedidos e de plaquinhas por tipo, por período), lista de pedidos com os destinos de cada plaquinha, alteração de preços e cadastro dos clientes do mapa. Cliente comum não vê nada disso.

**RN-09 — WhatsApp flutuante.** Em todas as páginas, um botão fixo no canto da tela abre conversa com o WhatsApp da JoiSmart, **(47) 99116-1541**, com uma mensagem pronta (ex.: "Olá! Vim pelo site da JoiSmart e quero saber mais sobre as plaquinhas").

**RN-10 — Mapa de clientes.** Um mapa da região de Joinville mostra um ponto por estabelecimento que usa as plaquinhas, com nome e tipo de negócio. O administrador inclui, altera e remove pontos. Nesta versão o mapa vem com clientes fictícios marcados como teste, para trocar pelos reais antes de divulgar.

**RN-11 — Identidade visual e logo.** A JoiSmart ainda não tem logo: o site cria um logo no estilo do **PicPay** — nome "joismart" em letras minúsculas, arredondadas e grossas, **verde vivo** sobre fundo escuro (e a versão branca sobre verde), com um símbolo simples de ondas de aproximação (NFC). O logo é mostrado à loja para aprovação antes de publicar. O site segue essa identidade e a referência enviada: fundo escuro (preto ou verde bem escuro), verde vivo de destaque, títulos grandes em letra grossa, faixas de chamada promocional e os PNGs das plaquinhas inclinados e sobrepostos, com transições e animações ao rolar. Moderno, chamativo e minimalista, e bom no celular.

**RN-12 — Aviso do Wi-Fi no iPhone.** A página e o carrinho da plaquinha de Wi-Fi avisam: "No Android, é só aproximar o celular. No iPhone, a conexão é feita pelo QR code da plaquinha."

## 7. Fluxo principal (caminho feliz)

| Passo | Descrição |
|---|---|
| 1 | O visitante abre o site da JoiSmart e vê a chamada principal com o logo e as plaquinhas animadas |
| 2 | Rola a página e vê como funciona (aproximar o celular ou ler o QR code) e os cinco tipos: Google, Instagram, Cardápio, Pix e Wi-Fi |
| 3 | Vê os preços: R$ 49,90 a unidade e 3 por R$ 120,00 |
| 4 | Vê o mapa com os clientes da região de Joinville |
| 5 | Escolhe os tipos (e a cor, no Google) e as quantidades e coloca no carrinho; o total já aplica os combos de 3 |
| 6 | Para fechar, entra com Google, Facebook, Apple ou e-mail e senha |
| 7 | Informa o destino de cada plaquinha (link do Google, @ do Instagram, link do cardápio, chave Pix ou rede e senha do Wi-Fi) |
| 8 | Informa o endereço; o site mostra entrega grátis (Joinville) ou o frete dos Correios |
| 9 | Paga no site e vê a confirmação do pedido |
| 10 | O administrador vê o pedido pago no menu de administração, com os destinos de cada plaquinha |
| 11 | O administrador muda a situação para Em produção e depois Enviado ou Saiu para entrega |
| 12 | O cliente acompanha a situação em Meus pedidos |
| 13 | O administrador consulta o relatório de vendas do período, ajusta preços ou inclui o novo cliente no mapa |

## 8. Fluxos alternativos e exceções

| ID | Cenário | Comportamento esperado |
|---|---|---|
| FA-01 | Pagamento recusado | O pedido fica Aguardando pagamento e o cliente pode tentar de novo ou trocar a forma |
| FA-02 | Pagamento não feito em até 3 dias (prazo em aberto: PA-04) | O pedido é cancelado sozinho |
| FA-03 | CEP inválido ou cálculo dos Correios fora do ar | O site avisa e não deixa pagar sem frete; sugere tentar de novo ou chamar no WhatsApp |
| FA-04 | Destino de uma plaquinha em branco ou com formato errado (ex.: WhatsApp sem DDD) | O site não deixa avançar e mostra o campo a corrigir |
| FA-05 | Cliente tenta comprar sem login | O site pede para entrar ou criar conta e volta ao carrinho, sem perder os itens |
| FA-06 | Já existe conta com o mesmo e-mail | O site oferece entrar com a conta existente ou recuperar a senha |
| FA-07 | Esqueceu a senha | Recebe por e-mail um link para criar uma nova |
| FA-08 | Cliente comum tenta abrir o menu de administração pelo endereço | O acesso é bloqueado |
| FA-09 | Administrador muda o preço | Vale só para pedidos novos; pedidos já feitos mantêm o valor pago |
| FA-10 | Carrinho vazio | O botão de fechar pedido fica desativado |
| FA-11 | Cliente com endereço em Joinville | O frete é zero e aparece "Entrega grátis em Joinville" |

## 9. Critérios de aceite

| ID | Critério |
|---|---|
| CA-01 | O site mostra os cinco tipos (Google azul e preta, Instagram, Cardápio, Pix e Wi-Fi) com os PNGs da loja, sem plaquinha de WhatsApp, e a chamada "Novidades em breve" |
| CA-02 | O carrinho calcula: 1 = R$ 49,90; 3 = R$ 120,00; 4 = R$ 169,90; 6 = R$ 240,00; 7 = R$ 289,90, com tipos misturados |
| CA-03 | O carrinho mostra a economia do combo (ex.: R$ 29,70 em 3 unidades) |
| CA-04 | Navegar, ver preços e o mapa funciona sem login; fechar o pedido exige login |
| CA-05 | É possível entrar com Google, Facebook, Apple e com e-mail e senha |
| CA-06 | O pedido pede o destino certo de cada tipo (link do Google, @ do Instagram, link do cardápio, chave Pix, rede e senha do Wi-Fi) e não fecha com campo vazio ou inválido |
| CA-07 | Endereço em Joinville tem frete zero; outro CEP mostra o frete dos Correios antes do pagamento |
| CA-08 | O pagamento é feito no site pelo Mercado Pago, com Pix ou cartão, e o pedido vira Pago sozinho quando aprovado |
| CA-09 | No cartão, 1× a 3× aparecem sem juros (R$ 120,00 = 3× de R$ 40,00) e 4× a 6× aparecem com juros e o total final antes de confirmar |
| CA-10 | O cliente vê os seus pedidos e a situação de cada um |
| CA-11 | O administrador vê cada pedido com itens, destinos, endereço e valor, e muda a situação |
| CA-12 | O relatório de vendas mostra faturamento, pedidos e plaquinhas por tipo no período escolhido |
| CA-13 | O administrador altera o preço unitário e o do combo, e o novo valor aparece no site para pedidos novos |
| CA-14 | O administrador inclui, altera e remove clientes do mapa, e o mapa se atualiza |
| CA-15 | O mapa abre com pelo menos 10 clientes fictícios na região de Joinville, marcados como teste |
| CA-16 | O botão flutuante aparece em todas as páginas e abre o WhatsApp (47) 99116-1541 com a mensagem pronta |
| CA-17 | Só pvd.breis@gmail.com e kleber3011@gmail.com acessam o menu de administração; um cliente comum não acessa nem pelo endereço direto |
| CA-18 | A plaquinha de Wi-Fi mostra o aviso de que no iPhone a conexão é pelo QR code |
| CA-19 | O site tem o logo JoiSmart no estilo PicPay, transições ao rolar, segue a referência (fundo escuro, verde vivo) e funciona bem no celular |

## 10. Pontos em aberto

| ID | Ponto | Questão |
|---|---|---|
| PA-01 | Peso e medidas | Peso e medidas da embalagem para o frete dos Correios (1, 3 e 6 unidades) ainda não definidos pela loja; até lá o frete usa valores provisórios configuráveis |
| PA-02 | Aprovação do logo | O logo criado no estilo PicPay precisa ser aprovado pela loja antes de publicar o site |
| PA-03 | Credenciais e contas | Conta do Mercado Pago e contas de login social (Google, Facebook, Apple) e domínio ainda precisam ser criadas ou ligadas pela loja; até lá pagamento e login social ficam em modo de teste |

Decisões fechadas em 12/11: Mercado Pago com Pix e cartão (até 3× sem juros, 4× a 6× com juros); aviso do Wi-Fi no iPhone; cancelamento automático em 3 dias sem pagamento (padrão adotado).

