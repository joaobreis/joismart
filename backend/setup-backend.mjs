import 'dotenv/config';
import {
  configureSdkMitra, runDdlMitra, runDmlMitra, runQueryMitra,
  createServerFunctionMitra, updateServerFunctionMitra, listServerFunctionsMitra,
  togglePublicExecutionMitra, listProfilesMitra, createProfileMitra,
  setProfileServerFunctionsMitra, setProfileUsersMitra, getProfileDetailsMitra,
  updateAdditionalBusinessInstructionsMitra, updateProjectSettingsMitra
} from 'mitra-sdk';
import { writeFileSync } from 'fs';

configureSdkMitra({ baseURL: process.env.MITRA_BASE_URL, token: process.env.MITRA_TOKEN, integrationURL: process.env.MITRA_BASE_URL_INTEGRATIONS });
const projectId = Number(process.env.MITRA_PROJECT_ID);
if (projectId !== 67220) throw new Error('projeto errado');

const ADMIN_EMAILS = ['pvd.breis@gmail.com', 'kleber3011@gmail.com'];
const AGORA = "DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 3 HOUR), '%Y-%m-%dT%H:%i:%s')";

async function ddl(sql) { await runDdlMitra({ projectId, sql }); }
async function q(sql) { const r = await runQueryMitra({ projectId, sql }); return (r.result ?? r).rows; }

async function tabelas() {
  await ddl(`CREATE TABLE IF NOT EXISTS CONFIG (
    CHAVE VARCHAR(40) PRIMARY KEY, VALOR VARCHAR(200) NOT NULL, DESCRICAO VARCHAR(200)
  ) COMMENT='Parametros da loja (precos, frete provisorio, juros, modo de pagamento). RETENCAO: tudo, configuracao'`);
  await ddl(`CREATE TABLE IF NOT EXISTS PLACAS (
    ID INT AUTO_INCREMENT PRIMARY KEY, CODIGO VARCHAR(30) NOT NULL UNIQUE, NOME VARCHAR(80) NOT NULL,
    TIPO_DESTINO VARCHAR(20) NOT NULL, FRASE VARCHAR(120), DESCRICAO VARCHAR(400), IMAGEM VARCHAR(120),
    COR VARCHAR(20), ORDEM INT DEFAULT 0, ATIVO BOOLEAN DEFAULT TRUE
  ) COMMENT='Modelos de plaquinha a venda. RETENCAO: tudo, catalogo'`);
  await ddl(`CREATE TABLE IF NOT EXISTS STATUS_PEDIDO (
    ID INT PRIMARY KEY, CODIGO VARCHAR(20) NOT NULL, NOME VARCHAR(40) NOT NULL, ORDEM INT
  ) COMMENT='Situacoes do pedido. RETENCAO: tudo, dominio'`);
  await ddl(`CREATE TABLE IF NOT EXISTS PEDIDOS (
    ID INT AUTO_INCREMENT PRIMARY KEY, TOKEN VARCHAR(40) NOT NULL UNIQUE, USUARIO_ID INT NOT NULL,
    STATUS_ID INT NOT NULL, PRECO_UNIT DECIMAL(10,2), PRECO_COMBO DECIMAL(10,2),
    SUBTOTAL DECIMAL(10,2), FRETE DECIMAL(10,2), JUROS DECIMAL(10,2) DEFAULT 0,
    FORMA_PAGAMENTO VARCHAR(10), PARCELAS INT, PAGAMENTO_MODO VARCHAR(10),
    ENTREGA_LOCAL BOOLEAN DEFAULT FALSE, NOME_RECEBEDOR VARCHAR(120), TELEFONE VARCHAR(20),
    CEP VARCHAR(9), LOGRADOURO VARCHAR(160), NUMERO VARCHAR(20), COMPLEMENTO VARCHAR(80),
    BAIRRO VARCHAR(80), CIDADE VARCHAR(80), UF VARCHAR(2),
    CRIADO_EM VARCHAR(19), PAGO_EM VARCHAR(19), ATUALIZADO_EM VARCHAR(19),
    INDEX IX_PED_USER (USUARIO_ID), INDEX IX_PED_STATUS (STATUS_ID, CRIADO_EM),
    FOREIGN KEY (STATUS_ID) REFERENCES STATUS_PEDIDO(ID)
  ) COMMENT='Pedidos da loja. RETENCAO: tudo, historico de vendas (rascunhos com mais de 1 dia sao apagados pela rotina)'`);
  await ddl(`CREATE TABLE IF NOT EXISTS PEDIDO_ITENS (
    ID INT AUTO_INCREMENT PRIMARY KEY, PEDIDO_ID INT NOT NULL, PLACA_ID INT NOT NULL,
    DESTINO_1 VARCHAR(300) NOT NULL, DESTINO_2 VARCHAR(120),
    FOREIGN KEY (PEDIDO_ID) REFERENCES PEDIDOS(ID) ON DELETE CASCADE,
    FOREIGN KEY (PLACA_ID) REFERENCES PLACAS(ID)
  ) COMMENT='Uma linha por plaquinha do pedido, com o destino gravado. RETENCAO: tudo, junto com o pedido'`);
  await ddl(`CREATE TABLE IF NOT EXISTS CLIENTES_MAPA (
    ID INT AUTO_INCREMENT PRIMARY KEY, NOME VARCHAR(120) NOT NULL, SEGMENTO VARCHAR(60),
    BAIRRO VARCHAR(80), LAT DECIMAL(10,6) NOT NULL, LNG DECIMAL(10,6) NOT NULL,
    TESTE BOOLEAN DEFAULT TRUE, ATIVO BOOLEAN DEFAULT TRUE
  ) COMMENT='Estabelecimentos no mapa de clientes. RETENCAO: tudo, cadastro'`);
}

async function seed() {
  const n = await q('SELECT COUNT(*) AS N FROM CONFIG');
  if (Number(n[0].N) > 0) { console.log('seed ja feito'); return; }
  await runDmlMitra({ projectId, sql: `INSERT INTO CONFIG (CHAVE, VALOR, DESCRICAO) VALUES
    ('PRECO_UNIT','49.90','Preco de cada plaquinha fora de um grupo de 3'),
    ('PRECO_COMBO3','120.00','Preco de cada grupo de 3 plaquinhas'),
    ('FRETE_BASE','22.00','Frete provisorio dos Correios para 1 plaquinha (fora de Joinville)'),
    ('FRETE_POR_PLACA','1.50','Frete provisorio por plaquinha adicional'),
    ('JUROS_4X','6.99','Juros provisorios em 4x (%) ate ligar o Mercado Pago'),
    ('JUROS_5X','8.49','Juros provisorios em 5x (%)'),
    ('JUROS_6X','9.99','Juros provisorios em 6x (%)'),
    ('PAGAMENTO_MODO','TESTE','TESTE ate a conta do Mercado Pago ser ligada')` });
  await runDmlMitra({ projectId, sql: `INSERT INTO STATUS_PEDIDO (ID, CODIGO, NOME, ORDEM) VALUES
    (0,'RASCUNHO','Rascunho',0),(1,'AGUARDANDO','Aguardando pagamento',1),(2,'PAGO','Pago',2),
    (3,'PRODUCAO','Em produção',3),(4,'ENVIADO','Enviado',4),(5,'SAIU_ENTREGA','Saiu para entrega',5),
    (6,'ENTREGUE','Entregue',6),(7,'CANCELADO','Cancelado',7)` });
  await runDmlMitra({ projectId, sql: `INSERT INTO PLACAS (CODIGO, NOME, TIPO_DESTINO, FRASE, DESCRICAO, IMAGEM, COR, ORDEM) VALUES
    ('google-azul','Avalie-nos no Google','GOOGLE','Nós adoraríamos a sua avaliação no Google','Mais avaliações 5 estrelas sem pedir duas vezes: o cliente aproxima o celular e já cai na tela de avaliar o seu negócio.','/placas/google-azul.webp','Azul',1),
    ('google-preta','Avalie-nos no Google','GOOGLE','Nós adoraríamos a sua avaliação no Google','A mesma plaquinha de avaliações, na versão preta, para balcões e ambientes mais sóbrios.','/placas/google-preta.webp','Preta',2),
    ('instagram','Instagram','INSTAGRAM','Siga a gente no Instagram','Transforma quem passa pelo balcão em seguidor: um toque e o perfil do seu negócio abre no app.','/placas/instagram.webp',NULL,3),
    ('cardapio','Cardápio','CARDAPIO','Confira nosso cardápio','O cardápio digital na mesa, sem papel e sempre atualizado. Ideal para bares, restaurantes e cafés.','/placas/cardapio.webp',NULL,4),
    ('pix','Pix','PIX','Faça o pagamento com Pix','O cliente aproxima e já recebe a sua chave Pix, sem digitar nada e sem erro de chave.','/placas/pix.webp',NULL,5),
    ('wifi','Wi-Fi','WIFI','Conecte-se ao nosso Wi-Fi','Chega de soletrar a senha: o cliente conecta na sua rede com um toque ou pelo QR code.','/placas/wifi.webp',NULL,6)` });
  await runDmlMitra({ projectId, sql: `INSERT INTO CLIENTES_MAPA (NOME, SEGMENTO, BAIRRO, LAT, LNG, TESTE) VALUES
    ('Café Dona Francisca (teste)','Cafeteria','Centro',-26.303900,-48.845800,TRUE),
    ('Studio Bella Pele (teste)','Estética','América',-26.290100,-48.852400,TRUE),
    ('Pizzaria Bom Retiro (teste)','Restaurante','Bom Retiro',-26.270800,-48.858200,TRUE),
    ('Barbearia do Porto (teste)','Barbearia','Atiradores',-26.309500,-48.858900,TRUE),
    ('Clínica Sorriso Norte (teste)','Clínica odontológica','Costa e Silva',-26.276300,-48.880100,TRUE),
    ('Empório Saguaçu (teste)','Mercearia','Saguaçu',-26.283900,-48.832500,TRUE),
    ('Academia Boa Vista Fit (teste)','Academia','Boa Vista',-26.296600,-48.822400,TRUE),
    ('Sushi Glória (teste)','Restaurante','Glória',-26.310700,-48.868500,TRUE),
    ('Pet Shop Iririú (teste)','Pet shop','Iririú',-26.276200,-48.814700,TRUE),
    ('Salão Anita Hair (teste)','Salão de beleza','Anita Garibaldi',-26.318800,-48.852200,TRUE),
    ('Hamburgueria Floresta (teste)','Lanchonete','Floresta',-26.333600,-48.856400,TRUE),
    ('Tattoo Bucarein (teste)','Estúdio de tatuagem','Bucarein',-26.316100,-48.838300,TRUE)` });
  console.log('seed ok');
}

async function adminProfile() {
  const lp = await listProfilesMitra({ projectId });
  const lista = lp.result ?? lp;
  let adm = lista.find(p => p.name === 'Administrador');
  if (!adm) { const r = await createProfileMitra({ projectId, name: 'Administrador' }); adm = { id: r.result.profileId }; }
  let cli = lista.find(p => p.name === 'Cliente');
  if (!cli) { const r = await createProfileMitra({ projectId, name: 'Cliente' }); cli = { id: r.result.profileId }; }
  return { admId: Number(adm.id), cliId: Number(cli.id) };
}

async function viewAdmins(admId) {
  const emails = ADMIN_EMAILS.map(e => `'${e}'`).join(',');
  await ddl(`CREATE OR REPLACE VIEW VW_ADMINS AS
    SELECT U.ID FROM INT_USER U WHERE LOWER(TRIM(U.DESCR)) IN (${emails})
    UNION SELECT PU.USERID FROM INT_PROFILEUSER PU WHERE PU.PROFILEID = ${admId}`);
}

const ADM = 'EXISTS (SELECT 1 FROM VW_ADMINS A WHERE A.ID = :VAR_USER)';
const VENDIDO = 'P.STATUS_ID IN (2,3,4,5,6)';

function sfsSql() {
  return [
    { name: 'pub_catalogo', pub: true, desc: 'Modelos de plaquinha ativos com os precos e juros atuais (publica, so leitura)', code:
      `SELECT P.ID, P.CODIGO, P.NOME, P.TIPO_DESTINO, P.FRASE, P.DESCRICAO, P.IMAGEM, P.COR, P.ORDEM,
        (SELECT VALOR FROM CONFIG WHERE CHAVE='PRECO_UNIT') AS PRECO_UNIT,
        (SELECT VALOR FROM CONFIG WHERE CHAVE='PRECO_COMBO3') AS PRECO_COMBO3,
        (SELECT VALOR FROM CONFIG WHERE CHAVE='JUROS_4X') AS JUROS_4X,
        (SELECT VALOR FROM CONFIG WHERE CHAVE='JUROS_5X') AS JUROS_5X,
        (SELECT VALOR FROM CONFIG WHERE CHAVE='JUROS_6X') AS JUROS_6X,
        (SELECT VALOR FROM CONFIG WHERE CHAVE='PAGAMENTO_MODO') AS PAGAMENTO_MODO
       FROM PLACAS P WHERE P.ATIVO = TRUE ORDER BY P.ORDEM` },
    { name: 'pub_mapa', pub: true, desc: 'Clientes ativos do mapa (publica, so leitura)', code:
      `SELECT ID, NOME, SEGMENTO, BAIRRO, LAT, LNG, TESTE FROM CLIENTES_MAPA WHERE ATIVO = TRUE ORDER BY NOME LIMIT 500` },

    { name: 'cli_souAdmin', perfil: 'cli', desc: 'Diz se quem chamou e administrador e o e-mail dele', code:
      `SELECT U.DESCR AS EMAIL, CASE WHEN ${ADM} THEN 1 ELSE 0 END AS ADMIN FROM INT_USER U WHERE U.ID = :VAR_USER` },
    { name: 'cli_cotarFrete', perfil: 'cli', desc: 'Frete pelo CEP e quantidade (gratis em Joinville; fora, valor provisorio)', code:
      `SELECT CASE WHEN CAST(REPLACE('{{cep}}','-','') AS UNSIGNED) BETWEEN 89200000 AND 89239999 THEN 1 ELSE 0 END AS LOCAL,
        CASE WHEN CAST(REPLACE('{{cep}}','-','') AS UNSIGNED) BETWEEN 89200000 AND 89239999 THEN 0
          ELSE ROUND((SELECT CAST(VALOR AS DECIMAL(10,2)) FROM CONFIG WHERE CHAVE='FRETE_BASE')
             + (SELECT CAST(VALOR AS DECIMAL(10,2)) FROM CONFIG WHERE CHAVE='FRETE_POR_PLACA') * GREATEST({{qtd}} - 1, 0), 2) END AS FRETE` },
    { name: 'int_pedidoCriar', perfil: 'cli', desc: 'Interna (chamada por cli_criarPedido): cria o rascunho do pedido do usuario', code:
      `INSERT INTO PEDIDOS (TOKEN, USUARIO_ID, STATUS_ID, NOME_RECEBEDOR, TELEFONE, CEP, LOGRADOURO, NUMERO, COMPLEMENTO, BAIRRO, CIDADE, UF, CRIADO_EM, ATUALIZADO_EM)
       VALUES ('{{token}}', :VAR_USER, 0, '{{nome}}', '{{telefone}}', '{{cep}}', '{{logradouro}}', '{{numero}}', '{{complemento}}', '{{bairro}}', '{{cidade}}', '{{uf}}', ${AGORA}, ${AGORA})` },
    { name: 'int_pedidoItem', perfil: 'cli', desc: 'Interna: inclui uma plaquinha no rascunho do proprio usuario', code:
      `INSERT INTO PEDIDO_ITENS (PEDIDO_ID, PLACA_ID, DESTINO_1, DESTINO_2)
       SELECT P.ID, PL.ID, '{{destino1}}', '{{destino2}}' FROM PEDIDOS P JOIN PLACAS PL ON PL.ID = {{placaId}} AND PL.ATIVO = TRUE
       WHERE P.TOKEN = '{{token}}' AND P.USUARIO_ID = :VAR_USER AND P.STATUS_ID = 0 AND '{{destino1}}' <> ''` },
    { name: 'int_pedidoFechar', perfil: 'cli', desc: 'Interna: calcula preco e frete no servidor e fecha o rascunho', code:
      `UPDATE PEDIDOS P
       JOIN (SELECT I.PEDIDO_ID, COUNT(*) AS QTD FROM PEDIDO_ITENS I JOIN PEDIDOS X ON X.ID = I.PEDIDO_ID
             WHERE X.TOKEN = '{{token}}' AND X.USUARIO_ID = :VAR_USER GROUP BY I.PEDIDO_ID) Q ON Q.PEDIDO_ID = P.ID
       JOIN (SELECT
          MAX(CASE WHEN CHAVE='PRECO_UNIT' THEN CAST(VALOR AS DECIMAL(10,2)) END) AS PU,
          MAX(CASE WHEN CHAVE='PRECO_COMBO3' THEN CAST(VALOR AS DECIMAL(10,2)) END) AS PC,
          MAX(CASE WHEN CHAVE='FRETE_BASE' THEN CAST(VALOR AS DECIMAL(10,2)) END) AS FB,
          MAX(CASE WHEN CHAVE='FRETE_POR_PLACA' THEN CAST(VALOR AS DECIMAL(10,2)) END) AS FP
          FROM CONFIG) C
       SET P.PRECO_UNIT = C.PU, P.PRECO_COMBO = C.PC,
           P.SUBTOTAL = FLOOR(Q.QTD / 3) * C.PC + MOD(Q.QTD, 3) * C.PU,
           P.ENTREGA_LOCAL = (CAST(REPLACE(P.CEP,'-','') AS UNSIGNED) BETWEEN 89200000 AND 89239999),
           P.FRETE = CASE WHEN CAST(REPLACE(P.CEP,'-','') AS UNSIGNED) BETWEEN 89200000 AND 89239999 THEN 0 ELSE ROUND(C.FB + C.FP * GREATEST(Q.QTD - 1, 0), 2) END,
           P.STATUS_ID = 1, P.ATUALIZADO_EM = ${AGORA}
       WHERE P.TOKEN = '{{token}}' AND P.USUARIO_ID = :VAR_USER AND P.STATUS_ID = 0` },
    { name: 'int_pedidoPorToken', perfil: 'cli', desc: 'Interna: id e total do pedido recem-criado do usuario', code:
      `SELECT ID, STATUS_ID, SUBTOTAL, FRETE FROM PEDIDOS WHERE TOKEN = '{{token}}' AND USUARIO_ID = :VAR_USER` },
    { name: 'cli_pagarTeste', perfil: 'cli', desc: 'MODO DE TESTE: simula pagamento aprovado do proprio pedido (recusa se o modo nao for TESTE)', code:
      `UPDATE PEDIDOS P
       SET P.FORMA_PAGAMENTO = '{{forma}}',
           P.PARCELAS = CASE WHEN '{{forma}}' = 'PIX' THEN 1 ELSE {{parcelas}} END,
           P.JUROS = CASE WHEN '{{forma}}' = 'CARTAO' AND {{parcelas}} >= 4 THEN ROUND((P.SUBTOTAL + P.FRETE) *
             (SELECT CAST(VALOR AS DECIMAL(6,2)) FROM CONFIG WHERE CHAVE = CASE {{parcelas}} WHEN 4 THEN 'JUROS_4X' WHEN 5 THEN 'JUROS_5X' ELSE 'JUROS_6X' END) / 100, 2) ELSE 0 END,
           P.PAGAMENTO_MODO = 'TESTE', P.STATUS_ID = 2, P.PAGO_EM = ${AGORA}, P.ATUALIZADO_EM = ${AGORA}
       WHERE P.ID = {{pedidoId}} AND P.USUARIO_ID = :VAR_USER AND P.STATUS_ID = 1
         AND '{{forma}}' IN ('PIX','CARTAO') AND {{parcelas}} BETWEEN 1 AND 6
         AND EXISTS (SELECT 1 FROM CONFIG WHERE CHAVE = 'PAGAMENTO_MODO' AND VALOR = 'TESTE')` },
    { name: 'cli_meusPedidos', perfil: 'cli', desc: 'Pedidos do usuario logado', code:
      `SELECT P.ID, P.CRIADO_EM, P.STATUS_ID, S.NOME AS STATUS, P.SUBTOTAL, P.FRETE, P.JUROS,
         (P.SUBTOTAL + P.FRETE + COALESCE(P.JUROS,0)) AS TOTAL, P.ENTREGA_LOCAL,
         (SELECT COUNT(*) FROM PEDIDO_ITENS I WHERE I.PEDIDO_ID = P.ID) AS QTD
       FROM PEDIDOS P JOIN STATUS_PEDIDO S ON S.ID = P.STATUS_ID
       WHERE P.USUARIO_ID = :VAR_USER AND P.STATUS_ID > 0 ORDER BY P.ID DESC LIMIT {{limit}} OFFSET {{offset}}` },
    { name: 'cli_pedidoDetalhe', perfil: 'cli', desc: 'Um pedido do usuario logado, uma linha por plaquinha', code:
      `SELECT P.ID, P.CRIADO_EM, P.PAGO_EM, P.STATUS_ID, S.NOME AS STATUS, P.SUBTOTAL, P.FRETE, P.JUROS, P.PRECO_UNIT, P.PRECO_COMBO,
         P.FORMA_PAGAMENTO, P.PARCELAS, P.ENTREGA_LOCAL, P.NOME_RECEBEDOR, P.TELEFONE, P.CEP, P.LOGRADOURO, P.NUMERO,
         P.COMPLEMENTO, P.BAIRRO, P.CIDADE, P.UF, I.ID AS ITEM_ID, PL.NOME AS PLACA, PL.COR, PL.IMAGEM, PL.TIPO_DESTINO,
         I.DESTINO_1, I.DESTINO_2
       FROM PEDIDOS P JOIN STATUS_PEDIDO S ON S.ID = P.STATUS_ID
       JOIN PEDIDO_ITENS I ON I.PEDIDO_ID = P.ID JOIN PLACAS PL ON PL.ID = I.PLACA_ID
       WHERE P.ID = {{pedidoId}} AND P.USUARIO_ID = :VAR_USER AND P.STATUS_ID > 0 ORDER BY I.ID` },

    { name: 'adm_vendasResumo', perfil: 'adm', desc: 'Admin: faturamento, pedidos, plaquinhas e ticket medio no periodo (pedidos pagos)', code:
      `SELECT COUNT(*) AS PEDIDOS, COALESCE(SUM(P.SUBTOTAL + P.FRETE + COALESCE(P.JUROS,0)),0) AS FATURAMENTO,
         COALESCE(SUM(P.SUBTOTAL),0) AS PRODUTOS, COALESCE(SUM(P.FRETE),0) AS FRETE,
         COALESCE(SUM((SELECT COUNT(*) FROM PEDIDO_ITENS I WHERE I.PEDIDO_ID = P.ID)),0) AS PLACAS,
         (SELECT COUNT(*) FROM PEDIDOS W WHERE W.STATUS_ID = 1) AS AGUARDANDO,
         (SELECT COUNT(*) FROM PEDIDOS W WHERE W.STATUS_ID IN (2,3)) AS A_PRODUZIR
       FROM PEDIDOS P
       WHERE ${VENDIDO} AND SUBSTRING(P.PAGO_EM,1,10) BETWEEN '{{inicio}}' AND '{{fim}}' AND ${ADM}` },
    { name: 'adm_vendasPorModelo', perfil: 'adm', desc: 'Admin: plaquinhas vendidas por modelo no periodo', code:
      `SELECT CONCAT(PL.NOME, CASE WHEN PL.COR IS NULL THEN '' ELSE CONCAT(' (', PL.COR, ')') END) AS name, COUNT(*) AS value
       FROM PEDIDOS P JOIN PEDIDO_ITENS I ON I.PEDIDO_ID = P.ID JOIN PLACAS PL ON PL.ID = I.PLACA_ID
       WHERE ${VENDIDO} AND SUBSTRING(P.PAGO_EM,1,10) BETWEEN '{{inicio}}' AND '{{fim}}' AND ${ADM}
       GROUP BY PL.ID, PL.NOME, PL.COR, PL.ORDEM ORDER BY value DESC` },
    { name: 'adm_vendasPorDia', perfil: 'adm', desc: 'Admin: faturamento por dia no periodo', code:
      `SELECT SUBSTRING(P.PAGO_EM,1,10) AS DIA, SUM(P.SUBTOTAL + P.FRETE + COALESCE(P.JUROS,0)) AS VALOR, COUNT(*) AS PEDIDOS
       FROM PEDIDOS P WHERE ${VENDIDO} AND SUBSTRING(P.PAGO_EM,1,10) BETWEEN '{{inicio}}' AND '{{fim}}' AND ${ADM}
       GROUP BY SUBSTRING(P.PAGO_EM,1,10) ORDER BY DIA` },
    { name: 'adm_pedidos', perfil: 'adm', desc: 'Admin: lista de pedidos com filtro de situacao (0 = todas) e busca por numero, nome ou e-mail', code:
      `SELECT P.ID, P.CRIADO_EM, P.PAGO_EM, P.STATUS_ID, S.NOME AS STATUS, U.DESCR AS EMAIL, P.NOME_RECEBEDOR, P.CIDADE, P.UF,
         P.ENTREGA_LOCAL, (P.SUBTOTAL + P.FRETE + COALESCE(P.JUROS,0)) AS TOTAL, P.FORMA_PAGAMENTO, P.PARCELAS,
         (SELECT COUNT(*) FROM PEDIDO_ITENS I WHERE I.PEDIDO_ID = P.ID) AS QTD, COUNT(*) OVER () AS TOTAL_LINHAS
       FROM PEDIDOS P JOIN STATUS_PEDIDO S ON S.ID = P.STATUS_ID LEFT JOIN INT_USER U ON U.ID = P.USUARIO_ID
       WHERE P.STATUS_ID > 0 AND ({{status}} = 0 OR P.STATUS_ID = {{status}})
         AND ('{{busca}}' = '' OR CAST(P.ID AS CHAR) = '{{busca}}' OR P.NOME_RECEBEDOR LIKE CONCAT('%', '{{busca}}', '%') OR U.DESCR LIKE CONCAT('%', '{{busca}}', '%'))
         AND ${ADM}
       ORDER BY P.ID DESC LIMIT {{limit}} OFFSET {{offset}}` },
    { name: 'adm_pedidoDetalhe', perfil: 'adm', desc: 'Admin: um pedido com itens, destinos e endereco', code:
      `SELECT P.ID, P.CRIADO_EM, P.PAGO_EM, P.STATUS_ID, S.NOME AS STATUS, U.DESCR AS EMAIL, P.SUBTOTAL, P.FRETE, P.JUROS,
         P.FORMA_PAGAMENTO, P.PARCELAS, P.PAGAMENTO_MODO, P.ENTREGA_LOCAL, P.NOME_RECEBEDOR, P.TELEFONE, P.CEP, P.LOGRADOURO,
         P.NUMERO, P.COMPLEMENTO, P.BAIRRO, P.CIDADE, P.UF, I.ID AS ITEM_ID, PL.NOME AS PLACA, PL.COR, PL.IMAGEM,
         PL.TIPO_DESTINO, I.DESTINO_1, I.DESTINO_2
       FROM PEDIDOS P JOIN STATUS_PEDIDO S ON S.ID = P.STATUS_ID LEFT JOIN INT_USER U ON U.ID = P.USUARIO_ID
       JOIN PEDIDO_ITENS I ON I.PEDIDO_ID = P.ID JOIN PLACAS PL ON PL.ID = I.PLACA_ID
       WHERE P.ID = {{pedidoId}} AND ${ADM} ORDER BY I.ID` },
    { name: 'adm_pedidoSituacao', perfil: 'adm', desc: 'Admin: muda a situacao de um pedido (1 a 7)', code:
      `UPDATE PEDIDOS SET STATUS_ID = {{statusId}}, ATUALIZADO_EM = ${AGORA},
         PAGO_EM = CASE WHEN {{statusId}} BETWEEN 2 AND 6 AND PAGO_EM IS NULL THEN ${AGORA} ELSE PAGO_EM END
       WHERE ID = {{pedidoId}} AND STATUS_ID > 0 AND {{statusId}} BETWEEN 1 AND 7 AND ${ADM}` },
    { name: 'adm_config', perfil: 'adm', desc: 'Admin: parametros da loja', code:
      `SELECT CHAVE, VALOR, DESCRICAO FROM CONFIG WHERE ${ADM} ORDER BY CHAVE` },
    { name: 'adm_configSalvar', perfil: 'adm', desc: 'Admin: salva precos, frete provisorio e juros de uma vez (vale para pedidos novos)', code:
      `UPDATE CONFIG SET VALOR = CASE CHAVE
          WHEN 'PRECO_UNIT' THEN CAST(ROUND({{precoUnit}},2) AS CHAR)
          WHEN 'PRECO_COMBO3' THEN CAST(ROUND({{precoCombo}},2) AS CHAR)
          WHEN 'FRETE_BASE' THEN CAST(ROUND({{freteBase}},2) AS CHAR)
          WHEN 'FRETE_POR_PLACA' THEN CAST(ROUND({{fretePorPlaca}},2) AS CHAR)
          WHEN 'JUROS_4X' THEN CAST(ROUND({{juros4}},2) AS CHAR)
          WHEN 'JUROS_5X' THEN CAST(ROUND({{juros5}},2) AS CHAR)
          WHEN 'JUROS_6X' THEN CAST(ROUND({{juros6}},2) AS CHAR)
          ELSE VALOR END
       WHERE CHAVE IN ('PRECO_UNIT','PRECO_COMBO3','FRETE_BASE','FRETE_POR_PLACA','JUROS_4X','JUROS_5X','JUROS_6X')
         AND {{precoUnit}} > 0 AND {{precoCombo}} > 0 AND {{freteBase}} >= 0 AND {{fretePorPlaca}} >= 0
         AND {{juros4}} >= 0 AND {{juros5}} >= 0 AND {{juros6}} >= 0 AND ${ADM}` },
    { name: 'adm_mapaListar', perfil: 'adm', desc: 'Admin: todos os clientes do mapa', code:
      `SELECT ID, NOME, SEGMENTO, BAIRRO, LAT, LNG, TESTE, ATIVO FROM CLIENTES_MAPA WHERE ${ADM} ORDER BY NOME LIMIT 500` },
    { name: 'adm_mapaCriar', perfil: 'adm', desc: 'Admin: inclui cliente no mapa', code:
      `INSERT INTO CLIENTES_MAPA (NOME, SEGMENTO, BAIRRO, LAT, LNG, TESTE, ATIVO)
       SELECT '{{nome}}', '{{segmento}}', '{{bairro}}', {{lat}}, {{lng}}, {{teste}} = 1, {{ativo}} = 1 FROM DUAL
       WHERE '{{nome}}' <> '' AND ${ADM}` },
    { name: 'adm_mapaAtualizar', perfil: 'adm', desc: 'Admin: altera cliente do mapa', code:
      `UPDATE CLIENTES_MAPA SET NOME = '{{nome}}', SEGMENTO = '{{segmento}}', BAIRRO = '{{bairro}}', LAT = {{lat}}, LNG = {{lng}},
         TESTE = ({{teste}} = 1), ATIVO = ({{ativo}} = 1)
       WHERE ID = {{id}} AND '{{nome}}' <> '' AND ${ADM}` },
    { name: 'adm_mapaRemover', perfil: 'adm', desc: 'Admin: remove cliente do mapa', code:
      `DELETE FROM CLIENTES_MAPA WHERE ID = {{id}} AND ${ADM}` },

    { name: 'cron_manutencaoPedidos', perfil: null, desc: 'Rotina (de hora em hora): cancela pedido sem pagamento ha 3 dias e apaga rascunho com mais de 1 dia', code:
      `UPDATE PEDIDOS SET STATUS_ID = 7, ATUALIZADO_EM = ${AGORA}
       WHERE STATUS_ID = 1 AND CRIADO_EM < DATE_FORMAT(DATE_SUB(DATE_SUB(NOW(), INTERVAL 3 HOUR), INTERVAL 3 DAY), '%Y-%m-%dT%H:%i:%s')` },
    { name: 'cron_limparRascunhos', perfil: null, desc: 'Rotina (diaria): apaga rascunhos de pedido com mais de 1 dia', code:
      `DELETE FROM PEDIDOS WHERE STATUS_ID = 0 AND CRIADO_EM < DATE_FORMAT(DATE_SUB(DATE_SUB(NOW(), INTERVAL 3 HOUR), INTERVAL 1 DAY), '%Y-%m-%dT%H:%i:%s')` },
  ];
}

function jsCriarPedido(ids) {
  return `
const sdk = require('mitra-sdk');
const projectId = Number(process.env.MITRA_PROJECT_ID);
const SF = ${JSON.stringify(ids)};
async function call(id, input) {
  const r = await sdk.executeServerFunctionMitra({ projectId, serverFunctionId: id, input });
  const res = r && r.result ? r.result : r;
  if (!res || res.executionStatus === 'FAILED') throw new Error('Falha interna ao gravar o pedido');
  let out = res.output; if (typeof out === 'string') { try { out = JSON.parse(out); } catch (e) {} }
  return out;
}
const s = (v, max) => String(v == null ? '' : v).trim().slice(0, max);
const URL_RE = /^https?:\\/\\/[^\\s]{3,}$/i;
const IG_RE = /^@?[A-Za-z0-9._]{1,30}$/;
const itens = Array.isArray(event.itens) ? event.itens : [];
const e = event.endereco || {};
if (itens.length < 1) return { error: 'O carrinho está vazio.' };
if (itens.length > 60) return { error: 'Para mais de 60 plaquinhas, fale com a gente no WhatsApp.' };
const end = { nome: s(e.nome,120), telefone: s(e.telefone,20).replace(/[^0-9]/g,''), cep: s(e.cep,9).replace(/[^0-9]/g,''),
  logradouro: s(e.logradouro,160), numero: s(e.numero,20), complemento: s(e.complemento,80), bairro: s(e.bairro,80), cidade: s(e.cidade,80), uf: s(e.uf,2).toUpperCase() };
if (!end.nome || !end.logradouro || !end.numero || !end.bairro || !end.cidade) return { error: 'Preencha o endereço completo.' };
if (end.cep.length !== 8) return { error: 'CEP inválido.' };
if (end.telefone.length < 10 || end.telefone.length > 11) return { error: 'Telefone com DDD inválido.' };
if (!/^[A-Z]{2}$/.test(end.uf)) return { error: 'UF inválida.' };
const cat = await call(SF.catalogo, {});
const placas = {}; (cat.rows || []).forEach(p => { placas[Number(p.ID)] = p; });
const limpos = [];
for (let i = 0; i < itens.length; i++) {
  const it = itens[i] || {}; const p = placas[Number(it.placaId)];
  if (!p) return { error: 'Modelo de plaquinha indisponível.', item: i };
  let d1 = s(it.destino1, 300), d2 = s(it.destino2, 120);
  switch (p.TIPO_DESTINO) {
    case 'GOOGLE': case 'CARDAPIO': if (!URL_RE.test(d1)) return { error: 'Link inválido na plaquinha ' + (i+1) + '.', item: i }; d2 = ''; break;
    case 'INSTAGRAM': if (!IG_RE.test(d1)) return { error: '@ do Instagram inválido na plaquinha ' + (i+1) + '.', item: i }; d1 = '@' + d1.replace(/^@/, ''); d2 = ''; break;
    case 'PIX': if (d1.length < 4 || d1.length > 77 || !d2) return { error: 'Informe a chave Pix e o nome do recebedor na plaquinha ' + (i+1) + '.', item: i }; break;
    case 'WIFI': if (!d1 || d1.length > 32 || d2.length < 8 || d2.length > 63) return { error: 'Informe a rede e a senha (8 a 63 caracteres) do Wi-Fi na plaquinha ' + (i+1) + '.', item: i }; break;
    default: return { error: 'Tipo desconhecido.' };
  }
  limpos.push({ placaId: Number(p.ID), destino1: d1, destino2: d2 });
}
const token = require('crypto').randomBytes(16).toString('hex');
const cepFmt = end.cep.slice(0,5) + '-' + end.cep.slice(5);
await call(SF.criar, { token, nome: end.nome, telefone: end.telefone, cep: cepFmt, logradouro: end.logradouro, numero: end.numero, complemento: end.complemento, bairro: end.bairro, cidade: end.cidade, uf: end.uf });
for (const it of limpos) { await call(SF.item, { token, placaId: it.placaId, destino1: it.destino1, destino2: it.destino2 }); }
await call(SF.fechar, { token });
const ped = await call(SF.porToken, { token });
const row = ped && ped.rows && ped.rows[0];
if (!row || Number(row.STATUS_ID) !== 1) return { error: 'Não foi possível fechar o pedido. Tente de novo.' };
return { pedidoId: Number(row.ID), subtotal: Number(row.SUBTOTAL), frete: Number(row.FRETE) };
`;
}

async function upsertSF(existentes, { name, type = 'SQL', code, desc }) {
  const ex = existentes.find(f => f.name === name);
  if (ex) { await updateServerFunctionMitra({ projectId, serverFunctionId: ex.id, code, description: desc }); return Number(ex.id); }
  const r = await createServerFunctionMitra({ projectId, name, type, code, description: desc });
  return Number(r.result.serverFunctionId);
}

async function main() {
  await tabelas();
  await seed();
  const { admId, cliId } = await adminProfile();
  await viewAdmins(admId);
  const lst = await listServerFunctionsMitra({ projectId });
  const existentes = lst.result ?? lst;
  const ids = {}; const perfis = { cli: [], adm: [] };
  for (const sf of sfsSql()) {
    ids[sf.name] = await upsertSF(existentes, sf);
    if (sf.pub) await togglePublicExecutionMitra({ projectId, serverFunctionId: ids[sf.name], publicExecution: true });
    if (sf.perfil) perfis[sf.perfil].push(ids[sf.name]);
  }
  ids.cli_criarPedido = await upsertSF(existentes, { name: 'cli_criarPedido', type: 'JAVASCRIPT', desc: 'Cria o pedido do usuario logado: valida destinos e endereco; preco e frete sao calculados no servidor',
    code: jsCriarPedido({ catalogo: ids.pub_catalogo, criar: ids.int_pedidoCriar, item: ids.int_pedidoItem, fechar: ids.int_pedidoFechar, porToken: ids.int_pedidoPorToken }) });
  perfis.cli.push(ids.cli_criarPedido);
  await updateServerFunctionMitra({ projectId, serverFunctionId: ids.cron_manutencaoPedidos, cronExpression: '0 7 * * * *' });
  await updateServerFunctionMitra({ projectId, serverFunctionId: ids.cron_limparRascunhos, cronExpression: '0 30 6 * * *' });

  await setProfileServerFunctionsMitra({ projectId, profileId: cliId, serverFunctionIds: perfis.cli });
  await setProfileServerFunctionsMitra({ projectId, profileId: admId, serverFunctionIds: [...perfis.cli, ...perfis.adm] });
  const devs = await q(`SELECT ID FROM INT_USER WHERE LOWER(DESCR) IN ('autopremiet1069p01@imersao.mitralab.io', ${ADMIN_EMAILS.map(e => `'${e}'`).join(',')})`);
  if (devs.length) await setProfileUsersMitra({ projectId, profileId: admId, userIds: devs.map(d => Number(d.ID)) });

  await updateAdditionalBusinessInstructionsMitra({ projectId, instructions: `JoiSmart: loja de plaquinhas NFC de Joinville.
- Receita (faturamento) = SUBTOTAL + FRETE + JUROS dos pedidos com STATUS_ID entre 2 e 6 (pagos em diante). STATUS_ID 0 e rascunho interno e 7 e cancelado: nunca contam.
- Preco: cada grupo de 3 plaquinhas custa CONFIG.PRECO_COMBO3; o que sobra custa CONFIG.PRECO_UNIT cada. O pedido guarda o preco do momento.
- Entrega gratis em Joinville (CEP 89200-000 a 89239-999); fora, frete provisorio de CONFIG.FRETE_BASE + FRETE_POR_PLACA por plaquinha adicional, ate os Correios serem ligados.
- Clientes do mapa com TESTE = 1 sao ficticios.
Sobre sua tecnologia: voce pode mencionar que usa o modelo Claude como IA e que roda em uma VM Linux. Quando perguntado sobre a engine agentica (como o loop funciona, como o contexto e gerenciado), responda que e uma tecnologia proprietaria do Mitra. NUNCA mencione Claude Code, OpenCode, Cursor, Copilot ou qualquer ferramenta de desenvolvimento assistido por IA. O sistema foi construido pela plataforma Mitra.` });
  await updateProjectSettingsMitra({ projectId, name: 'JoiSmart', color: '#21C25E' }).catch(() => {});

  writeFileSync(new URL('../frontend/src/lib/sf-ids.ts', import.meta.url), `// Gerado por backend/setup-backend.mjs\nexport const SF = ${JSON.stringify(ids, null, 2)} as const;\n`);
  console.log('SFs', ids, 'perfis', { admId, cliId }, 'admins dev', devs);
}
main().catch(e => { console.error('ERRO', e?.response?.data ?? e); process.exit(1); });
