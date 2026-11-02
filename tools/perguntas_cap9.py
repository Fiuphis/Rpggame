# Banco de perguntas do Capítulo 9 (Integridade). Gera data/perguntas.json.
# Cada item: (rank, seção, enunciado, [resposta certa, errada, errada, errada]).
# Rank: 1=C, 2=B, 3=A, 4=S, 5=SS. A posição da resposta certa é distribuída por igual entre a, b, c e d em cada rank.
# Uso: python3 tools/perguntas_cap9.py
import json, random, os, sys

S = {
    1: '9.1 Introdução', 2: '9.2 Olhando mais de perto', 3: '9.3 Predicados e proposições',
    4: '9.4 Predicados de RelVar e de BD', 5: '9.5 Verificando as restrições', 6: '9.6 Predicados internos e externos',
    7: '9.7 Correção e consistência', 8: '9.8 Integridade e visões', 9: '9.9 Classificação das restrições',
    10: '9.10 Chaves', 11: '9.11 Triggers', 12: '9.12 Recursos de SQL', 13: '9.13 Resumo',
}

Q = [
# ---------------- RANK C (1) ----------------
(1, 1, 'Formalmente, uma restrição de integridade é uma expressão de que tipo?', ['Booleana (TRUE ou FALSE)', 'Aritmética (um número)', 'De texto (uma frase)', 'De data (um instante)']),
(1, 1, 'Durante quanto tempo uma restrição de integridade precisa ser avaliada como TRUE?', ['O tempo todo', 'Só no fim do dia', 'Só no primeiro acesso', 'Só quando o usuário pedir']),
(1, 1, 'Quem é responsável por impor e monitorar as restrições de integridade?', ['O SGBD', 'O usuário final', 'O sistema operacional', 'O navegador']),
(1, 1, 'O que o SGBD faz com uma atualização que viola uma restrição de integridade?', ['Rejeita a atualização', 'Aceita e avisa depois', 'Apaga a tabela inteira', 'Ignora a restrição']),
(1, 1, 'Uma restrição de integridade também pode ser chamada de quê?', ['Regra de negócio', 'Índice de busca', 'Consulta salva', 'Cópia de segurança']),
(1, 1, 'No início, a integridade no modelo relacional focava principalmente em quê?', ['Chaves primárias e estrangeiras', 'Triggers e procedimentos armazenados', 'Visões e consultas complexas', 'Índices e ordenação de linhas']),
(1, 2, 'As restrições de integridade ditam o quê para uma variável?', ['Os valores permitidos', 'O nome da variável', 'A cor da tabela', 'O dono do banco']),
(1, 2, 'Qual linguagem formal o capítulo usa para expressar as restrições?', ['Tutorial D', 'HTML', 'Python', 'COBOL']),
(1, 2, 'Quais quantificadores são usados para escrever restrições na lógica?', ['FORALL e EXISTS', 'SELECT e FROM', 'BEGIN e END', 'OPEN e CLOSE']),
(1, 3, 'Como se chama uma expressão booleana que contém variáveis?', ['Predicado', 'Proposição', 'Tupla', 'Domínio']),
(1, 3, 'Quando as variáveis de um predicado recebem valores reais, ele vira o quê?', ['Proposição', 'Relação', 'Chave', 'Visão']),
(1, 3, 'Como uma proposição pode ser avaliada?', ['Como verdadeira ou falsa', 'Só como verdadeira', 'Nunca pode ser avaliada', 'Só como desconhecida']),
(1, 4, 'Qual o nome da regra que proíbe deixar o predicado de banco de dados FALSE?', ['Regra Áurea', 'Regra de Codd', 'Regra do Menor Custo', 'Regra de Atomicidade']),
(1, 4, 'O predicado de RelVar junta as restrições usando qual operador lógico?', ['AND (E lógico)', 'OR (OU lógico)', 'NOT (negação)', 'XOR (OU exclusivo)']),
(1, 4, 'Pela Regra Áurea, uma atualização nunca pode deixar o predicado do banco como:', ['FALSE', 'TRUE', 'Com mais tuplas', 'Com menos tuplas']),
(1, 5, 'Segundo a Regra Áurea, quando as restrições devem ser verificadas?', ['Logo após cada atualização', 'Uma vez por semana', 'Só no backup', 'Só quando o banco reinicia']),
(1, 6, 'Quem entende e impõe os predicados internos?', ['O SGBD', 'Só o usuário', 'O hardware', 'Ninguém']),
(1, 6, 'O predicado externo representa o quê?', ['O significado real dos dados', 'O código-fonte interno do SGBD', 'O espaço ocupado no disco', 'As senhas de acesso ao banco']),
(1, 6, 'O SGBD consegue entender o predicado externo?', ['Não, só o interno', 'Sim, sempre', 'Sim, se houver índice', 'Só em visões']),
(1, 7, 'O que o SGBD consegue garantir sobre os dados?', ['Consistência', 'Verdade no mundo real', 'Correção absoluta', 'Que não há erros de digitação']),
(1, 7, 'No capítulo, consistência significa:', ['Nenhuma regra declarada é violada', 'Os dados são verdade no mundo real', 'O banco está sempre vazio', 'Todas as tabelas têm o mesmo tamanho']),
(1, 8, 'A integridade se aplica também às visões?', ['Sim, também às visões', 'Não, só a tabelas', 'Só a índices', 'Só a backups']),
(1, 8, 'Uma visão também é chamada de:', ['RelVar virtual', 'RelVar básica', 'Chave estrangeira', 'Trigger']),
(1, 8, 'As tabelas reais do banco são chamadas de:', ['RelVars básicas', 'RelVars virtuais', 'Proposições', 'Gatilhos']),
(1, 9, 'Em quantas categorias principais o capítulo divide as restrições?', ['Quatro', 'Duas', 'Três', 'Sete']),
(1, 9, 'Qual categoria de restrição envolve duas ou mais RelVars ao mesmo tempo?', ['Restrição de banco de dados', 'Restrição de tipo', 'Restrição de atributo', 'Restrição de RelVar']),
(1, 9, 'As restrições de tipo especificam o quê?', ['Os valores válidos de um tipo', 'Os usuários que usam o banco', 'A ordem das linhas na tabela', 'O nome de cada tabela']),
(1, 9, 'Qual categoria declara que um atributo deve ser de um tipo específico?', ['Restrição de atributo', 'Restrição de banco de dados', 'Trigger', 'Assertiva']),
(1, 10, 'Quais duas propriedades uma chave candidata deve ter?', ['Unicidade e irredutibilidade', 'Atomicidade e durabilidade', 'Integridade e normalização', 'Ordenação e compactação']),
(1, 10, 'A integridade referencial proíbe o quê?', ['Chave estrangeira sem correspondente', 'Tabelas com milhares de linhas', 'Consultas que usam a cláusula WHERE', 'Colunas com nomes muito compridos']),
(1, 10, 'Qual ação referencial propaga a mudança do pai para os filhos?', ['CASCADE', 'RESTRICT', 'NO ACTION', 'COMMIT']),
(1, 10, 'Qual ação referencial impede mudar o pai se houver filhos?', ['RESTRICT', 'CASCADE', 'GRANT', 'DROP']),
(1, 10, 'No modelo relacional, as chaves são o mecanismo básico de quê?', ['Endereçamento', 'Criptografia', 'Impressão', 'Compressão']),
(1, 11, 'Qual é o nome de trigger em português?', ['Gatilho', 'Visão', 'Índice', 'Cursor']),
(1, 11, 'Os triggers seguem regras do tipo:', ['ECA (Evento-Condição-Ação)', 'CRUD (Criar-Ler-Alterar-Apagar)', 'DDL (Definição de Dados)', 'DML (Manipulação de Dados)']),
(1, 11, 'Como o capítulo classifica os triggers?', ['Como um desvio problemático', 'Como a melhor forma de integridade', 'Como obrigatórios em toda tabela', 'Como um tipo de chave']),
(1, 11, 'Qual abordagem o capítulo recomenda no lugar dos triggers?', ['Declarativa', 'Procedimental', 'Manual', 'Aleatória']),
(1, 12, 'Qual comando SQL define a chave primária de uma tabela?', ['PRIMARY KEY', 'MAIN KEY', 'FIRST KEY', 'TOP KEY']),
(1, 12, 'Qual restrição SQL faz uma verificação local de condição numa tabela?', ['CHECK', 'SELECT', 'GROUP BY', 'ORDER BY']),
(1, 12, 'Qual comando SQL cria regras que envolvem várias tabelas?', ['CREATE ASSERTION', 'CREATE INDEX', 'CREATE USER', 'CREATE DATABASE']),
(1, 12, 'Qual palavra-chave do SQL permite adiar a verificação de uma restrição?', ['DEFERRABLE', 'DISTINCT', 'DEFAULT', 'DESC']),
(1, 12, 'Com a verificação postergada do SQL, a regra é avaliada em que momento?', ['No COMMIT da transação', 'No SELECT', 'Na criação da tabela', 'No login']),
(1, 12, 'Qual restrição SQL impede repetir valores numa coluna que não é a chave primária?', ['UNIQUE', 'DEFAULT', 'ORDER BY', 'GROUP BY']),
(1, 12, 'Qual cláusula SQL declara uma chave estrangeira?', ['FOREIGN KEY', 'OUTER KEY', 'OTHER KEY', 'LINK KEY']),
(1, 13, 'Qual é o problema central tratado no capítulo de integridade?', ['Garantir que os dados sejam corretos', 'Deixar as consultas mais rápidas', 'Reduzir o espaço ocupado no disco', 'Criar telas e interfaces gráficas']),

# ---------------- RANK B (2) ----------------
(2, 2, 'Por que usar lógica formal, como a Tutorial D, para escrever restrições?', ['Para expressá-las sem ambiguidade', 'Para deixar o banco mais rápido', 'Para esconder as regras do usuário', 'Para dispensar o SGBD']),
(2, 2, 'Na escrita de restrições, a construção IF ... THEN representa:', ['Uma implicação lógica', 'Um laço de repetição', 'Uma junção de tabelas', 'Uma ordenação']),
(2, 2, 'O quantificador FORALL expressa a ideia de:', ['Para todo elemento', 'Existe ao menos um', 'Nenhum elemento', 'Apenas o primeiro']),
(2, 2, 'O quantificador EXISTS expressa a ideia de:', ['Existe pelo menos um', 'Para todo elemento', 'Nenhum elemento existe', 'Exatamente dois']),
(2, 1, 'Na visão atual do capítulo, as restrições de integridade em geral são:', ['De importância crucial', 'Opcionais e raras', 'Apenas sobre chaves', 'Assunto do sistema operacional']),
(2, 2, 'Uma restrição de integridade pode tratar de:', ['Uma variável ou uma combinação delas', 'Uma só coluna, nunca mais que isso', 'Apenas o nome dado à tabela', 'Apenas o usuário que está logado']),
(2, 3, 'Por que não dá para avaliar um predicado imediatamente?', ['Porque ele contém variáveis', 'Porque ele é sempre falso', 'Porque ele não tem operadores', 'Porque só existe em visões']),
(2, 3, 'Trocar as variáveis de um predicado por valores reais se chama:', ['Instanciação', 'Normalização', 'Indexação', 'Compilação']),
(2, 3, '"O fornecedor S1 fica em Londres" é um exemplo de:', ['Proposição', 'Predicado', 'Trigger', 'Assertiva']),
(2, 3, '"O fornecedor x fica na cidade y" é um exemplo de:', ['Predicado', 'Proposição', 'Chave primária', 'Visão']),
(2, 4, 'O predicado de banco de dados é formado por:', ['AND de todos os predicados de RelVar', 'OR de todos os predicados de RelVar', 'Apenas a chave primária', 'Apenas os triggers']),
(2, 4, 'O predicado de uma RelVar reúne:', ['Todas as restrições daquela RelVar', 'Todas as linhas daquela RelVar', 'Os nomes das colunas', 'Os usuários com acesso']),
(2, 4, 'Se uma única restrição de uma RelVar for FALSE, o predicado dessa RelVar será:', ['FALSE', 'TRUE', 'Metade verdadeiro', 'Indefinido para sempre']),
(2, 5, 'Pela Regra Áurea, o erro de uma atualização inválida deve ser pego quando?', ['Antes de a alteração ser efetivada', 'Depois que a alteração já foi gravada', 'No próximo backup do banco', 'Só quando um usuário reclamar']),
(2, 5, 'Qual a diferença entre a Regra Áurea e a verificação postergada do SQL?', ['Áurea verifica na hora; SQL pode adiar', 'Áurea adia; SQL verifica sempre na hora', 'As duas verificam só no fim do dia', 'Nenhuma das duas verifica as regras']),
(2, 6, 'Qual a diferença entre predicado interno e externo?', ['Interno é formal; externo é informal', 'Interno é informal; externo é formal', 'Os dois são a mesma coisa', 'O externo é o código do SGBD']),
(2, 6, 'O predicado interno de uma RelVar corresponde a quê?', ['Às regras formais que o SGBD impõe', 'À intenção do usuário ao gravar', 'Ao nome dado ao banco de dados', 'Ao layout da tela do sistema']),
(2, 7, 'Por que o SGBD não garante que o banco esteja "correto"?', ['Não sabe o que é verdade no mundo', 'Não tem memória para guardar tudo', 'Correção só vale para as visões', 'Ele não aceita chaves primárias']),
(2, 7, 'Um dado falso no mundo real, mas que respeita todas as regras, será:', ['Aceito pelo sistema', 'Rejeitado pelo sistema', 'Corrigido automaticamente', 'Transformado em NULL']),
(2, 8, 'De onde vêm os predicados de uma visão?', ['Das RelVars básicas que a compõem', 'Do usuário que criou a visão', 'De um arquivo externo ao banco', 'De nenhuma: visão não tem predicado']),
(2, 8, 'Atualizações feitas por meio de uma visão devem respeitar:', ['As restrições das RelVars básicas', 'Nenhuma restrição, visão é livre', 'Apenas o formato dos campos de data', 'Só as permissões de quem a criou']),
(2, 9, 'Quando uma restrição de tipo é verificada?', ['Na invocação do seletor', 'No COMMIT da transação', 'Só no backup noturno', 'Ao apagar a tabela']),
(2, 9, 'Quando uma restrição de RelVar é verificada?', ['Quando a RelVar é atualizada', 'Só quando o banco é criado', 'Só quando alguém lê os dados', 'Só uma vez por dia, em lote']),
(2, 9, '"O status de um fornecedor não pode diminuir" é uma restrição de:', ['Transição', 'Tipo', 'Atributo', 'Chave candidata']),
(2, 9, 'Para checar uma restrição de transição, o sistema compara:', ['O valor antigo com o valor novo', 'Duas tabelas de bancos diferentes', 'Dois usuários conectados', 'O índice com a chave']),
(2, 9, '"Um peso deve ser decimal e positivo" é exemplo de restrição de:', ['Tipo', 'Banco de dados', 'Transição', 'Referencial']),
(2, 9, 'Qual o papel de uma restrição de atributo, como "CIDADE é do tipo CHAR"?', ['Ligar o atributo a um tipo', 'Ligar duas tabelas do banco', 'Criar um índice na coluna', 'Disparar um trigger na carga']),
(2, 10, 'O que significa a unicidade de uma chave candidata?', ['Duas tuplas nunca repetem o valor dela', 'A chave tem um só atributo, sempre', 'O valor da chave nunca pode mudar', 'Só existe uma tabela com essa chave']),
(2, 10, 'O que significa a irredutibilidade de uma chave candidata?', ['Nenhum subconjunto dela já é único', 'Ela não pode ser apagada nunca', 'Ela tem sempre um único atributo', 'Ela não aceita valores numéricos']),
(2, 10, 'O valor de uma chave estrangeira deve corresponder a um valor de:', ['Uma chave candidata existente', 'Qualquer coluna do tipo texto', 'Um índice qualquer da tabela', 'Uma visão vazia do banco']),
(2, 10, 'Qual ação referencial rejeita a mudança depois, com efeito prático igual ao RESTRICT?', ['NO ACTION', 'CASCADE', 'SET NULL', 'COMMIT']),
(2, 10, 'Ao apagar um fornecedor que tem fornecimentos, com RESTRICT:', ['A exclusão é recusada', 'Os fornecimentos são apagados', 'Os fornecimentos viram NULL', 'O fornecedor é duplicado']),
(2, 10, 'A chave primária é escolhida entre:', ['As chaves candidatas', 'As chaves estrangeiras', 'Os índices', 'As visões']),
(2, 10, 'Em qual RelVar fica a chave estrangeira?', ['Na RelVar que referencia (filha)', 'Só na RelVar referenciada (pai)', 'Em nenhuma RelVar', 'Só nas visões']),
(2, 11, 'O que significam as letras da regra ECA de um trigger?', ['Evento, Condição e Ação', 'Erro, Chave e Atributo', 'Entrada, Cálculo e Arquivo', 'Exclusão, Commit e Assertiva']),
(2, 11, 'Por serem procedimentais, os triggers são, segundo o capítulo:', ['Mais difíceis de entender e otimizar', 'Mais fáceis de entender e otimizar', 'Imunes a erros de lógica', 'Obrigatórios em toda tabela SQL']),
(2, 11, 'Por que a abordagem declarativa é considerada mais segura que os triggers?', ['Diz o que vale, sem passo a passo', 'Roda mais devagar que um trigger', 'Exige escrever mais código', 'Só funciona dentro de visões']),
(2, 11, 'Quando um trigger é disparado?', ['Sozinho, quando há uma atualização', 'Só quando o usuário manda executar', 'Uma vez por mês, em lote', 'Só na criação do banco de dados']),
(2, 12, 'Para que serve o CREATE ASSERTION?', ['Regras complexas com várias tabelas', 'Criar uma nova tabela no banco', 'Apagar dados antigos de uma vez', 'Dar permissões a novos usuários']),
(2, 12, 'Qual a diferença entre o CHECK de tabela e o CREATE ASSERTION?', ['CHECK é local; ASSERTION abrange o banco', 'CHECK abrange o banco; ASSERTION é local', 'São idênticos', 'ASSERTION só serve para chaves']),
(2, 12, 'A verificação postergada (DEFERRABLE) existe:', ['No SQL, mas não na Regra Áurea', 'Na Regra Áurea, mas não no SQL', 'Nos dois, do mesmo jeito', 'Em nenhum dos dois']),
(2, 12, 'PRIMARY KEY, UNIQUE, FOREIGN KEY e CHECK são restrições de:', ['Tabelas básicas', 'Visões apenas', 'Usuários', 'Backups']),
(2, 12, 'Qual destes NÃO é uma restrição declarativa do SQL?', ['Trigger', 'PRIMARY KEY', 'CHECK', 'UNIQUE']),
(2, 12, 'Complete o SQL: FOREIGN KEY (S#) ____ S (S#)', ['REFERENCES', 'POINTS TO', 'LINKED TO', 'DEPENDS ON']),
(2, 12, 'No SQL, quantas PRIMARY KEY uma tabela pode declarar?', ['No máximo uma', 'Quantas quiser', 'Exatamente duas', 'Uma por coluna']),

# ---------------- RANK A (3) ----------------
(3, 2, 'Leia: FORALL SX (SX.STATUS > 0). O que a restrição exige?', ['Todo fornecedor tem status positivo', 'Algum fornecedor tem status positivo', 'Nenhum fornecedor tem status', 'Só o primeiro tem status positivo']),
(3, 2, "Leia: EXISTS PX (PX.COR = 'Vermelho'). Ela é verdadeira quando:", ['Há ao menos uma peça vermelha', 'Todas as peças são vermelhas', 'Nenhuma peça é vermelha', 'Há exatamente uma cor']),
(3, 2, "Leia: FORALL SX (IF SX.CIDADE = 'Paris' THEN SX.STATUS = 30). Ela exige:", ['Todo fornecedor de Paris tem status 30', 'Todos os fornecedores ficam em Paris', 'Status 30 só para quem é de fora', 'Algum fornecedor fica em Paris']),
(3, 2, 'Escrever "o salário deve ser alto" como restrição é um problema porque:', ['É vago: "alto" não tem valor definido', 'Salário não tem um tipo de dado', 'Restrições não podem usar números', 'O SGBD não aceita regras em texto']),
(3, 3, 'No predicado "x leciona a disciplina y", trocar x por Ana e y por BD gera:', ['Uma proposição avaliável', 'Um novo predicado com variáveis', 'Uma chave estrangeira', 'Um trigger']),
(3, 3, 'Qual destas frases é uma proposição?', ['"Ana mora em Jataí"', '"x mora em y"', '"x mora em Jataí"', '"x tem idade z"']),
(3, 3, 'Por que dizemos que uma restrição de integridade é um predicado?', ['Porque seu valor depende dos dados', 'Porque seu valor nunca muda', 'Porque é escrita como um trigger', 'Porque não usa lógica formal']),
(3, 4, 'Uma RelVar tem as restrições R1, R2 e R3. Seu predicado de RelVar é:', ['R1 AND R2 AND R3', 'R1 OR R2 OR R3', 'Apenas R1', 'NOT R1']),
(3, 4, 'S tem predicado TRUE e SP tem predicado FALSE. O predicado do banco é:', ['FALSE', 'TRUE', 'Metade TRUE', 'Depende do usuário']),
(3, 4, 'Acrescentar uma nova restrição a uma RelVar muda o quê?', ['O predicado da RelVar e o do banco', 'Só os dados que já estão guardados', 'Nada, o predicado é fixo', 'Só a chave primária da RelVar']),
(3, 4, 'Um predicado de banco de dados FALSE significa que:', ['Alguma restrição está violada', 'O banco está vazio', 'Todas as restrições estão violadas', 'O banco está correto']),
(3, 4, 'A Regra Áurea vale para:', ['Toda operação de atualização', 'Só para consultas SELECT', 'Só para criar tabelas', 'Só para visões']),
(3, 5, 'Por que a Regra Áurea exige verificação imediata?', ['Para o banco nunca guardar estado inválido', 'Para economizar espaço em disco', 'Para acelerar as consultas', 'Para aceitar dados inválidos por um tempo']),
(3, 6, 'Na RelVar S, a frase "o fornecedor S# se chama SNOME e fica em CIDADE" é o predicado:', ['Externo', 'Interno', 'De tipo', 'De transição']),
(3, 6, 'A regra formal STATUS >= 1 AND STATUS <= 100, imposta pelo SGBD, faz parte do predicado:', ['Interno', 'Externo', 'De visão apenas', 'De trigger']),
(3, 6, 'O SGBD aceita um aluno com nome "XYZ123" se ele respeitar as regras. Por quê?', ['Só entende o predicado interno', 'Ele confere se o nome existe', 'Nomes não têm tipo definido', 'As visões ignoram os nomes']),
(3, 7, 'A idade deve estar entre 0 e 120. Alguém digita 30 para quem tem 25. O banco fica:', ['Consistente, mas incorreto', 'Correto, mas inconsistente', 'Inconsistente e incorreto', 'Correto e consistente']),
(3, 7, 'Um caixa digita R$ 100 em vez de R$ 10, valor dentro das regras. Quem detecta o erro?', ['Quem conhece o valor real', 'O SGBD, pela Regra Áurea', 'Um CHECK de valor máximo', 'A chave primária da tabela']),
(3, 8, "Visão LONDRES: fornecedores com CIDADE = 'Londres'. Seu predicado inclui:", ["O predicado de S AND CIDADE = 'Londres'", "Só CIDADE = 'Londres'", "O predicado de S OR CIDADE = 'Londres'", 'Nenhuma restrição']),
(3, 8, 'Inserir, pela visão LONDRES, um fornecedor de Paris deveria ser:', ['Rejeitado: fere o predicado de V', 'Aceito, pois S aceita Paris', 'Aceito e movido para Londres', 'Aceito, com a cidade em NULL']),
(3, 8, 'Uma visão que faz a junção de S e SP herda as restrições:', ['De S e de SP', 'Só de S', 'Só de SP', 'De nenhuma das duas']),
(3, 9, 'Uma restrição de tipo é verificada na invocação do seletor. Isso quer dizer que:', ['Valores inválidos nem chegam a existir', 'O valor inválido é aceito até o COMMIT', 'A checagem só ocorre dentro de visões', 'O seletor funciona como um trigger']),
(3, 9, 'O tipo PESO só aceita decimais positivos. Ao tentar criar PESO(-5):', ['O seletor rejeita o valor', 'O valor é aceito e corrigido', 'Vira uma restrição de RelVar', 'Dispara um CASCADE']),
(3, 9, '"O status de todo fornecedor fica entre 1 e 100", só na RelVar S. Categoria:', ['Restrição de RelVar', 'Restrição de banco de dados', 'Restrição de atributo', 'Restrição de tipo']),
(3, 9, 'Qual exemplo é uma restrição de atributo?', ['O atributo PESO é do tipo PESO', 'Todo peso deve ser positivo', 'O status nunca pode diminuir', 'Todo SP tem um S existente']),
(3, 9, 'Qual exemplo é uma restrição de banco de dados?', ['Fornecedor de status < 20 não fornece P6', 'Todo peso de peça deve ser positivo', 'O atributo CIDADE é do tipo CHAR', 'O status de todo fornecedor fica entre 1 e 100']),
(3, 9, 'Qual exemplo é uma restrição de tipo?', ['Uma quantidade deve ser inteira e >= 0', 'Todo SP referencia um S existente', 'O status de um fornecedor nunca diminui', 'S# é chave candidata da RelVar S']),
(3, 9, "A restrição \"fornecedor de Londres tem status 20\" é violada quando:", ['Um fornecedor de Londres tem status 10', 'Um fornecedor de Paris tem status 10', 'Não há fornecedor em Londres', 'Um de Londres tem status 20']),
(3, 9, 'Qual item NÃO é uma das quatro categorias de restrição do capítulo?', ['Restrição de trigger', 'Restrição de tipo', 'Restrição de atributo', 'Restrição de banco de dados']),
(3, 10, 'Em ALUNO(MATRICULA, CPF, NOME), MATRICULA e CPF são únicos. Quantas chaves candidatas?', ['Duas', 'Uma', 'Três', 'Nenhuma']),
(3, 10, 'Em ALUNO, MATRICULA já é única. O conjunto {MATRICULA, NOME} é:', ['Único, mas não é chave candidata', 'Chave candidata, pois é único', 'Chave estrangeira para ALUNO', 'Não é único, por causa do NOME']),
(3, 10, 'Em ALUNO, escolhemos MATRICULA como chave primária. O CPF passa a ser:', ['Chave alternativa (candidata)', 'Chave estrangeira de ALUNO', 'Atributo comum, sem unicidade', 'Uma segunda chave primária']),
(3, 10, 'NOTA tem MATRICULA como FK para ALUNO. Inserir nota com matrícula inexistente:', ['É rejeitado: o aluno não existe', 'O aluno é criado automaticamente', 'É aceito por causa do CASCADE', 'É aceito e a nota fica sem aluno']),
(3, 10, 'Mudar a matrícula de um aluno que tem notas, com ON UPDATE CASCADE:', ['As notas recebem a nova matrícula', 'A mudança é recusada pelo SGBD', 'As notas do aluno são apagadas', 'As notas ficam com a antiga']),
(3, 10, 'Qual a diferença prática entre RESTRICT e NO ACTION?', ['Quase nenhuma: as duas rejeitam', 'NO ACTION propaga aos filhos', 'RESTRICT apaga os filhos', 'NO ACTION aceita órfãos']),
(3, 10, 'A RelVar SP(S#, P#, QTD) tem chave {S#, P#}. Isso significa que:', ['Cada par S#, P# aparece uma vez', 'Cada S# aparece uma só vez', 'Cada P# aparece uma só vez', 'Cada QTD aparece uma só vez']),
(3, 10, 'Em CIDADE(NOME, UF), só NOME+UF juntos são únicos. A chave candidata é:', ['{NOME, UF}', '{NOME}', '{UF}', 'Não há chave candidata']),
(3, 10, 'Com CASCADE na exclusão, apagar 1 pai que tem 3 filhos remove quantas tuplas?', ['4', '1', '3', '0']),
(3, 10, 'Com RESTRICT na exclusão, apagar 1 pai que tem 3 filhos remove quantas tuplas?', ['0: a exclusão é recusada', '1: só o pai é apagado', '3: só os filhos somem', '4: pai e filhos somem']),
(3, 10, 'S tem os fornecedores S1, S2 e S3. Qual valor de S# pode entrar em SP?', ['S2', 'S4', 'S9', 'S0']),
(3, 10, 'Antes de apagar um pai, o que a ação RESTRICT verifica?', ['Se há filhos que o referenciam', 'Se o pai tem algum índice criado', 'Se a tabela do pai está vazia', 'Se o usuário é o dono do pai']),
(3, 10, 'ALUNO tem COD_CURSO apontando para CURSO(COD). Em ALUNO, COD_CURSO é:', ['Chave estrangeira', 'Chave primária de ALUNO', 'Chave candidata de CURSO', 'Um trigger']),
(3, 11, 'Trigger: "após INSERT em VENDA, se valor > 1000, avisar o gerente". Qual é a condição?', ['valor > 1000', 'INSERT em VENDA', 'Avisar o gerente', 'Após a operação']),
(3, 11, 'Garantir "todo SP tem um S" com trigger, em vez de FOREIGN KEY, segundo o capítulo, é:', ['Pior: procedimental, difícil de otimizar', 'Melhor: o trigger é mais seguro e rápido', 'Igual: os dois são declarativos', 'Impossível: SQL não tem triggers']),
(3, 11, 'Qual exemplo descreve um trigger?', ['Ao inserir venda, baixar o estoque', 'Declarar PRIMARY KEY (ID) na tabela', 'Declarar CHECK (QTD > 0) na tabela', 'Declarar UNIQUE (EMAIL) na tabela']),
(3, 12, 'O que faz CHECK (QTD > 0) numa tabela SP?', ['Rejeita linhas com QTD <= 0', 'Apaga as linhas com QTD 0', 'Ordena por QTD', 'Cria um índice em QTD']),
(3, 12, 'Regra entre CLIENTE e CONTA: "dívida não passa do limite". Recurso SQL ideal:', ['CREATE ASSERTION', 'UNIQUE', 'PRIMARY KEY', 'ORDER BY']),
(3, 12, 'FOREIGN KEY (S#) REFERENCES S (S#) ON DELETE CASCADE. Apagar S1 faz o quê?', ['Apaga também os SP de S1', 'Recusa a exclusão', 'Deixa os SP de S1 órfãos', 'Apaga a tabela SP inteira']),
(3, 12, 'Uma tabela tem PRIMARY KEY (ID) e UNIQUE (EMAIL). Isso indica:', ['Duas chaves candidatas: ID e EMAIL', 'Duas chaves primárias na tabela', 'Que EMAIL é chave estrangeira', 'Que só ID é chave da tabela']),
(3, 12, 'Com uma restrição DEFERRABLE adiada, um INSERT que viola a regra:', ['Pode passar até o COMMIT', 'É rejeitado na mesma hora', 'Nunca chega a ser checado', 'Apaga a regra do banco']),
(3, 12, 'Qual restrição SQL substitui melhor um trigger que impede preço negativo?', ['CHECK (PRECO >= 0)', 'UNIQUE (PRECO)', 'FOREIGN KEY (PRECO)', 'ORDER BY PRECO']),
(3, 12, 'CHECK (FIM >= INICIO) compara duas colunas da mesma linha. Isso é permitido?', ['Sim: é uma verificação local', 'Não: CHECK só compara com constantes', 'Só se for feito por um trigger', 'Só dentro de um CREATE ASSERTION']),
(3, 12, 'UNIQUE (A, B) numa tabela significa que:', ['O par A+B não se repete', 'A nunca se repete', 'B nunca se repete', 'A e B são sempre iguais']),
(3, 1, 'Se o SGBD não impusesse as restrições, quem teria de garantir as regras?', ['Cada programa que usa o banco', 'Ninguém, seria automático', 'O sistema operacional', 'Os índices']),
(3, 13, 'Qual par junta corretamente conceito e definição?', ['Proposição: predicado com valores', 'Predicado: sempre verdadeiro', 'Trigger: restrição declarativa', 'Visão: RelVar básica']),

# ---------------- RANK S (4) ----------------
(4, 3, 'Cada tupla presente numa RelVar representa:', ['Uma proposição tida como verdadeira', 'Uma proposição tida como falsa', 'Um predicado ainda sem valores', 'Uma restrição que já foi violada']),
(4, 3, 'P(x) = "x tem status maior que 10". Se S1 tem status 20, P(S1) é:', ['Uma proposição verdadeira', 'Uma proposição falsa', 'Ainda um predicado aberto', 'Um trigger de verificação']),
(4, 10, 'Sem tuplas duplicadas, por que toda RelVar tem ao menos uma chave candidata?', ['Todos os atributos juntos já são únicos', 'O SQL cria uma chave automaticamente', 'Cada atributo sozinho é sempre único', 'Um trigger impede tuplas repetidas']),
(4, 10, 'R(A, B, C): {A} é único, {B, C} é único e {A, B} é único. Quais são as chaves candidatas?', ['{A} e {B, C}', '{A}, {B, C} e {A, B}', 'Só {A, B}', 'Só {A}']),
(4, 10, 'Uma chave estrangeira pode referenciar a própria RelVar, como em FUNC(ID, ID_CHEFE)?', ['Sim: o chefe também é funcionário', 'Não: FK só aponta para outra RelVar', 'Só se ID_CHEFE for chave primária', 'Só por meio de um trigger']),
(4, 10, 'Em SP, S# é FK para S. Qual estado viola a integridade referencial?', ['SP tem S9, mas S não tem S9', 'S tem S9, mas SP não tem S9', 'S e SP têm S1', 'SP está vazia']),
(4, 10, 'AULA: chaves {PROF,HORA} e {SALA,HORA}. Há (Bia,10h,S2). Inserir (Ana,10h,S2):', ['Viola a chave {SALA, HORA}', 'É aceito', 'Viola a chave {PROF, HORA}', 'Viola as duas chaves']),
(4, 10, 'Uma chave estrangeira precisa ser chave candidata da RelVar onde ela está?', ['Não: só precisa casar com uma chave', 'Sim: toda FK é chave da sua RelVar', 'Sim, e tem de ser a primária', 'Só quando a FK é composta']),
(4, 10, 'OUTRA tem a FK (S#, P#) para a chave {S#, P#} de SP. O valor (S1, P9) é válido se:', ['Existir o par (S1, P9) em SP', 'Existir S1 em S, não importa P9', 'Existir P9 em P, não importa S1', 'Existirem S1 em S e P9 em P']),
(4, 10, 'A mesma chave estrangeira pode ter valor repetido na tabela filha?', ['Sim: vários filhos têm o mesmo pai', 'Não: toda FK também é sempre única', 'Só se a ação for CASCADE', 'Só se o pai tiver índice']),
(4, 10, 'Em SP, a FK S# usa RESTRICT. Qual operação em SP nunca é bloqueada por ela?', ['Apagar um fornecimento', 'Inserir SP com S# inexistente', 'Mudar S# para um inexistente', 'Nenhuma operação']),
(4, 10, 'Por que a irredutibilidade importa numa chave candidata?', ['Evita atributos sobrando na chave', 'Deixa a chave com mais atributos', 'Permite tuplas duplicadas na RelVar', 'Liga a chave a outra tabela']),
(4, 12, 'O que significa INITIALLY DEFERRED numa restrição DEFERRABLE?', ['Começa adiada e é checada no COMMIT', 'Começa checada na hora, sem adiar', 'Nunca é checada pelo SGBD', 'Vira um trigger de verificação']),
(4, 12, 'O que significa DEFERRABLE INITIALLY IMMEDIATE?', ['Checada na hora, mas pode ser adiada', 'Adiada, mas pode ser checada antes', 'Nunca é checada pelo SGBD', 'Checada só no próximo backup']),
(4, 5, 'Por que a verificação postergada do SQL contraria a Regra Áurea?', ['Deixa o banco inválido até o COMMIT', 'Verifica cedo demais, antes do INSERT', 'Impede que qualquer COMMIT aconteça', 'Não usa predicados para verificar']),
(4, 11, 'Qual vantagem a restrição declarativa tem sobre o trigger, para o SGBD?', ['O SGBD entende a regra e pode otimizar', 'Roda passo a passo, como um programa', 'Dispensa qualquer verificação do SGBD', 'Aceita dados inválidos por um tempo']),
(4, 9, 'Qual par está certo sobre quando cada restrição é checada?', ['Tipo: no seletor; RelVar: na atualização', 'Tipo: no COMMIT; RelVar: no seletor', 'Ambas só no backup', 'Tipo: na atualização; RelVar: no seletor']),
(4, 9, '"Todo funcionário ganha menos que o seu chefe", tudo na RelVar FUNC. Categoria:', ['RelVar, pois só envolve FUNC', 'Tipo, pois limita o salário', 'Atributo, pois cita o salário', 'Banco de dados, pois cita o chefe']),
(4, 2, 'Leia: FORALL PX (EXISTS SPX (SPX.P# = PX.P#)). Ela exige que:', ['Toda peça apareça em algum fornecimento', 'Algum fornecimento não tenha peça', 'Toda peça seja fornecida por todos', 'Exista ao menos uma peça fornecida']),
(4, 4, 'O banco tem 5 RelVars: 4 com predicado TRUE e 1 com FALSE. Pela Regra Áurea:', ['Esse estado nunca deveria existir', 'É aceito, pois a maioria é TRUE', 'É aceito até o COMMIT', 'Só a RelVar FALSE é apagada']),
(4, 6, 'Qual relação entre predicado interno e externo é a desejada?', ['O interno reflete o externo ao máximo', 'O externo é imposto pelo próprio SGBD', 'O interno pode ignorar o externo', 'Os dois devem se contradizer']),
(4, 8, 'Uma visão V projeta S sem o atributo STATUS. A regra "status entre 1 e 100":', ['Continua valendo na RelVar S', 'Deixa de existir no banco todo', 'Passa a valer apenas na visão V', 'Vira uma restrição de tipo']),
(4, 11, 'Numa regra ECA, qual parte pode impedir que a ação seja executada?', ['A condição', 'O evento', 'A ação', 'O COMMIT']),
(4, 12, 'Uma CREATE ASSERTION se encaixa em qual categoria do capítulo?', ['Restrição de banco de dados', 'Restrição de tipo', 'Restrição de atributo', 'Restrição de transição']),
(4, 12, 'Um CHECK local consegue garantir "todo SP tem um S"?', ['Não: envolve outra tabela; use FK', 'Sim: CHECK vale para todo o banco', 'Só se for junto com UNIQUE', 'Só se a tabela S for uma visão']),
(4, 4, 'Uma nova restrição é criada, mas os dados atuais a violam. O que isso indica?', ['Fica FALSE: a regra não pode ser aceita', 'Os dados errados são apagados sozinhos', 'Os dados atuais não importam para a regra', 'Os dados que violam viram NULL']),
(4, 9, 'Qual exemplo é uma restrição de transição?', ['Estado civil não volta de casado a solteiro', 'Idade deve ser sempre maior ou igual a 0', 'Todo fornecimento tem fornecedor existente', 'O atributo CPF tem o tipo de dado CPF']),
(4, 1, 'Por que a integridade deixou de tratar só de chaves?', ['Toda regra de negócio é uma restrição', 'As chaves foram abolidas', 'Os triggers substituíram as chaves', 'Visões não têm chaves']),
(4, 11, 'Por que o capítulo chama os triggers de "desvio"?', ['Fogem da abordagem declarativa', 'Estão sempre errados por natureza', 'Não existem em nenhum SQL', 'Só servem para atualizar visões']),
(4, 7, 'Quanto mais regras reais forem declaradas no banco:', ['Mais perto do correto ele fica', 'O banco fica menos consistente', 'O banco fica mais incorreto', 'Nada muda: o SGBD ignora regras']),
(4, 9, 'Restrições de tipo e de atributo, juntas, garantem que:', ['Todo valor de atributo é válido no tipo', 'Todas as tabelas estão ligadas por FK', 'Nunca há tuplas duplicadas no banco', 'Os triggers disparam na hora certa']),
(4, 9, 'Uma restrição de banco de dados pode ser violada atualizando só uma das RelVars?', ['Sim: por isso é checada em cada uma', 'Não: só atualizando todas de uma vez', 'Não: esse tipo nunca é violado', 'Só no COMMIT da transação']),
(4, 9, 'PESO é do tipo PESO, que só aceita valores > 0. Quantas restrições e de que tipo?', ['Duas: uma de atributo e uma de tipo', 'Duas: uma de tipo e uma de transição', 'Uma só, de banco de dados', 'Duas, ambas de RelVar']),
(4, 11, 'Um trigger e uma FK fazem a mesma regra. Se o trigger tiver um erro de código:', ['A regra pode falhar sem o SGBD ver', 'O SGBD corrige o trigger sozinho', 'A FK deixa de existir no banco', 'Nada muda, o trigger é declarativo']),
(4, 5, 'Que garantia a Regra Áurea dá aos programas que usam o banco?', ['Nunca leem dados que violem as regras', 'Precisam checar tudo por conta própria', 'Não podem atualizar nenhum dado', 'Só podem ler dados por visões']),

# ---------------- RANK SS (5) ----------------
(5, 2, "Regra: IF CIDADE = 'Londres' THEN STATUS = 20. Um fornecedor de Paris com status 5:", ['Satisfaz a regra (o IF é falso)', 'Viola a regra', 'Deixa a regra indefinida', 'Só satisfaz se mudar para Londres']),
(5, 2, 'NOT EXISTS SX (SX.STATUS < 0) é equivalente a:', ['FORALL SX (SX.STATUS >= 0)', 'EXISTS SX (SX.STATUS >= 0)', 'FORALL SX (SX.STATUS < 0)', 'NOT FORALL SX (SX.STATUS < 0)']),
(5, 2, 'A restrição FORALL PX (PX.PESO > 0), numa RelVar P sem nenhuma tupla, é:', ['TRUE: não há contraexemplo', 'FALSE: não há peças com peso', 'Indefinida: falta uma tupla', 'Erro: FORALL exige tuplas']),
(5, 4, 'Uma RelVar sem nenhuma restrição declarada tem predicado de RelVar igual a:', ['TRUE (AND vazio é verdadeiro)', 'FALSE (não há nada a valer)', 'NULL (valor desconhecido)', 'Indefinido até a 1ª regra']),
(5, 10, 'A->B: CASCADE; B->C: RESTRICT. Apagar pai de A cujos filhos em B têm filhos em C:', ['A exclusão inteira é recusada', 'Apaga A e B; C fica órfão', 'Apaga A, B e C', 'Apaga só a tupla de A']),
(5, 7, 'Seja C = "banco correto" e K = "banco consistente". Qual implicação vale?', ['C implica K, mas K não implica C', 'K implica C, mas C não implica K', 'C e K são equivalentes', 'Não há relação entre C e K']),
(5, 10, 'R(A, B, C): {A, B} e {B, C} são únicos; nenhum atributo sozinho é único. Chaves candidatas:', ['{A, B} e {B, C}', 'Só {A, B, C}', '{A, B}, {B, C} e {A, B, C}', 'Nenhuma']),
(5, 12, 'FK DEFERRABLE INITIALLY DEFERRED. Transação: INSERT filho, INSERT pai, COMMIT:', ['Dá certo: a FK é checada no COMMIT', 'Falha já no INSERT do filho', 'Falha no COMMIT: o pai veio depois', 'O filho é apagado no COMMIT']),
(5, 5, 'Com checagem imediata (Regra Áurea), inserir o filho antes do pai na mesma transação:', ['Falha já no INSERT do filho', 'Dá certo, checando no COMMIT', 'O SGBD cria o pai sozinho', 'A FK é ignorada até o fim']),
(5, 11, 'T1: após UPDATE em A, altera B. T2: após UPDATE em B, altera A. UPDATE em A causa:', ['Disparos em cadeia: T1, T2, T1...', 'Só T1 roda, e T2 é ignorado', 'Nenhum disparo, pois são iguais', 'Um erro de chave estrangeira']),
(5, 9, '"Ganha menos que o chefe" e "o salário não pode cair", ambas em FUNC. Categorias:', ['RelVar (estado) e RelVar (transição)', 'Banco de dados (estado) e tipo', 'Atributo (estado) e tipo (transição)', 'Tipo (estado) e banco de dados']),
(5, 10, 'SP: ON DELETE CASCADE, ON UPDATE RESTRICT. S1 tem SP. Trocar S1 por S9 em S:', ['É recusado: há fornecimentos', 'Os SP passam para S9', 'Os SP de S1 são apagados', 'Os SP ficam órfãos']),
(5, 3, '"Existe x tal que x fica em Londres", com x ligado por EXISTS, é:', ['Uma proposição: x está quantificado', 'Um predicado, pois x continua livre', 'Uma tupla da RelVar de fornecedores', 'Uma chave candidata de S']),
(5, 5, 'Uma operação insere 2 tuplas: a 1ª fere a regra e a 2ª conserta. Checando ao fim:', ['É aceita: o estado final é válido', 'É recusada logo na 1ª tupla', 'Só a 2ª tupla acaba inserida', 'A checagem fica para o COMMIT']),
(5, 12, 'ASSERTION: "fornecedor de status < 20 não fornece P6". Checar ao atualizar:', ['S ou SP', 'Só S', 'Só SP', 'Só P']),
(5, 2, 'FORALL SX FORALL SY (IF SX.S# = SY.S# THEN SX.NOME = SY.NOME) garante que:', ['Mesmo S# implica mesmo nome', 'Mesmo nome implica mesmo S#', 'Todos têm o mesmo nome', 'Todos os S# são diferentes']),
(5, 10, 'Um atributo pode fazer parte de uma chave candidata e ser também chave estrangeira?', ['Sim, como S# em SP', 'Não, nunca', 'Só se for a chave inteira', 'Só em visões']),
(5, 3, 'No predicado "x fornece a peça y", instanciar só x = S1 resulta em:', ['Um predicado, ainda com y livre', 'Uma proposição, pois x tem valor', 'Uma tupla da RelVar SP', 'Uma chave candidata {x, y}']),
(5, 10, 'A->B->C em CASCADE. O pai tem 2 filhos em B, e cada um 3 em C. Apagar o pai remove:', ['9 tuplas', '3 tuplas', '7 tuplas', '1 tupla']),
(5, 8, "V1 = S WHERE STATUS > 10 e V2 = V1 WHERE CIDADE = 'Paris'. O predicado de V2 inclui:", ["pred(S) AND STATUS > 10 AND CIDADE = 'Paris'", "pred(S) OR STATUS > 10 OR CIDADE = 'Paris'", "pred(S) AND CIDADE = 'Paris', sem o STATUS", "Só CIDADE = 'Paris', pois V2 é nova"]),
]

LETRA = 'CBASS'


def build():
    random.seed(9)
    out, seen = [], set()
    for rank in range(1, 6):
        items = [q for q in Q if q[0] == rank]
        pos = [i % 4 for i in range(len(items))]
        random.shuffle(pos)
        for (rk, sec, text, opts), p in zip(items, pos):
            assert len(opts) == 4 and len(set(opts)) == 4, text
            key = text.strip().lower()
            assert key not in seen, 'repetida: ' + text
            seen.add(key)
            wrong = opts[1:]
            random.shuffle(wrong)
            ans = wrong[:p] + [opts[0]] + wrong[p:]
            out.append({'difficulty': rk, 'tema': 'Integridade - ' + S[sec], 'text': text, 'answers': ans, 'correct': p})
    return out


if __name__ == '__main__':
    qs = build()
    cnt = {r: sum(1 for q in qs if q['difficulty'] == r) for r in range(1, 6)}
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
    if '--check' not in sys.argv:
        with open(os.path.join(root, 'data', 'perguntas.json'), 'w', encoding='utf-8') as f:
            json.dump(qs, f, ensure_ascii=False, indent=1)
    print('total', len(qs), ' '.join(f'{LETRA[r - 1] if r < 4 else ("S" if r == 4 else "SS")}={cnt[r]}' for r in cnt))
    for r in range(1, 6):
        ps = [q['correct'] for q in qs if q['difficulty'] == r]
        print(' rank', r, 'posicoes certas a/b/c/d =', [ps.count(i) for i in range(4)])
    longest = sum(1 for q in qs if len(q['answers'][q['correct']]) == max(len(a) for a in q['answers']))
    print(' resposta certa e a mais longa em', longest, 'de', len(qs))
    print(' maior enunciado', max(len(q['text']) for q in qs), '| maior resposta', max(len(a) for q in qs for a in q['answers']))
