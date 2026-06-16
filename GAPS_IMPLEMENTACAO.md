# Gaps de ImplementaÃ§Ã£o - CInplifica

Este documento consolida os gaps identificados a partir do roadmap de mÃ­dia, governanÃ§a e SSO, junto com a anÃ¡lise de funcionalidades faltantes do projeto CInplifica.

Use como checklist para verificar o que ainda falta implementar ou corrigir no repositÃ³rio.

---

## 1. Gaps CrÃ­ticos

### 1.1 Upload real de imagens

- [x] Verificar se o formulÃ¡rio de anÃºncio ainda depende de URL manual.
- [x] Verificar se existe backend para upload com Cloudinary, S3 ou outro object storage.
- [x] Verificar se o frontend possui input `file`.
- [x] Verificar se o frontend exibe preview da imagem antes de salvar.
- [x] Verificar se o upload retorna uma URL segura.
- [x] Verificar se o campo `imageUrl` Ã© salvo automaticamente apÃ³s o upload.
- [x] Verificar validaÃ§Ã£o de tipo de arquivo.
- [x] Verificar validaÃ§Ã£o de tamanho mÃ¡ximo de arquivo.

### 1.2 Contrato do chat entre API e frontend

- [x] Verificar se o backend retorna conversas com o campo `users`.
- [x] Verificar se o frontend espera o campo `participants`.
- [x] Padronizar o contrato entre backend e frontend.
- [x] Verificar se a lista de conversas renderiza nome e foto do outro usuÃ¡rio.
- [x] Verificar se nÃ£o hÃ¡ erro de runtime no console da pÃ¡gina de chat.

### 1.3 SSO real do CIn

- [x] Verificar se `/api/auth/mock-login` ainda Ã© o fluxo principal.
- [x] Verificar se o login mock fica restrito ao ambiente de desenvolvimento.
- [x] Verificar se as credenciais reais do CIn-SSO estÃ£o parametrizadas por `.env`.
- [x] Verificar callback e redirect do OpenID Connect.
- [x] Verificar criaÃ§Ã£o ou atualizaÃ§Ã£o de usuÃ¡rio apÃ³s login.
- [x] Verificar persistÃªncia de sessÃ£o/autenticaÃ§Ã£o apÃ³s callback.

### 1.4 Fluxo de negociaÃ§Ã£o incompleto

- [x] Verificar se existe botÃ£o "Iniciar negociaÃ§Ã£o" nos cards de anÃºncio.
- [x] Verificar se existe botÃ£o "Iniciar negociaÃ§Ã£o" na pÃ¡gina de detalhes.
- [x] Verificar se o botÃ£o chama `startConversation`.
- [x] Verificar se o usuÃ¡rio Ã© redirecionado corretamente para `/chat`.

---

## 2. Marketplace e AnÃºncios

### 2.1 PÃ¡gina de detalhes do anÃºncio

- [x] Verificar se existe rota `/listings/:id`.
- [x] Verificar se a pÃ¡gina mostra imagem em tamanho adequado.
- [x] Verificar se mostra descriÃ§Ã£o completa.
- [x] Verificar se mostra autor do anÃºncio.
- [x] Verificar se mostra categoria.
- [x] Verificar se mostra status.
- [x] Verificar se possui aÃ§Ã£o para contatar o vendedor ou responsÃ¡vel.

### 2.2 CRUD completo de anÃºncios

- [x] Verificar se existe endpoint `PATCH /listings/:id` ou `PUT /listings/:id`.
- [x] Verificar se existe endpoint para excluir anÃºncio.
- [x] Verificar se existe aÃ§Ã£o para encerrar/finalizar anÃºncio.
- [x] Verificar se o autor consegue editar tÃ­tulo.
- [x] Verificar se o autor consegue editar descriÃ§Ã£o.
- [x] Verificar se o autor consegue editar preÃ§o.
- [x] Verificar se o autor consegue editar imagem.
- [x] Verificar se o autor consegue editar categoria.
- [x] Verificar se o autor consegue marcar como "Vendido", "Finalizado", "Devolvido" ou equivalente.

### 2.3 Campos especÃ­ficos por categoria

#### Achados e Perdidos

- [x] Verificar se existe campo de local de perda/encontro.
- [x] Verificar se existe campo de data/hora aproximada.
- [x] Verificar se existe status especÃ­fico do item.
- [x] Verificar status como "Perdido", "Encontrado", "Em posse do achador" e "Devolvido".

#### AcadÃªmico

- [x] Verificar suporte a item gratuito/doaÃ§Ã£o.
- [x] Verificar se preÃ§o pode ser obrigatoriamente zero/grÃ¡tis nessa categoria.
- [x] Verificar se existe campo para link externo de material acadÃªmico.
- [x] Verificar se existem campos para disciplina, professor ou perÃ­odo, caso aplicÃ¡vel.

### 2.4 ValidaÃ§Ã£o real do MVP com imagens

- [x] Criar anÃºncio com imagem real.
- [x] Verificar se a imagem aparece no mural.
- [x] Abrir pÃ¡gina de detalhes do anÃºncio.
- [x] Verificar se a imagem aparece corretamente no detalhe.
- [x] Iniciar conversa a partir do anÃºncio.
- [x] Verificar se a conversa aparece no chat.

---

## 3. GovernanÃ§a, ModeraÃ§Ã£o e SeguranÃ§a

### 3.1 Sistema de denÃºncias

- [x] Verificar se existe model `Report` no Prisma.
- [x] Verificar se Ã© possÃ­vel denunciar anÃºncio.
- [x] Verificar se Ã© possÃ­vel denunciar mensagem.
- [x] Verificar se Ã© possÃ­vel denunciar conversa.
- [x] Verificar se o backend tem endpoint para criar denÃºncia.
- [x] Verificar se o backend tem endpoint para listar denÃºncias.
- [x] Verificar se o backend tem endpoint para atualizar status de denÃºncia.

### 3.2 AÃ§Ãµes de moderaÃ§Ã£o

- [x] Verificar se existe model `ModerationAction`.
- [x] Verificar se administrador/moderador pode aprovar denÃºncia.
- [x] Verificar se administrador/moderador pode rejeitar denÃºncia.
- [x] Verificar se administrador/moderador pode suspender usuÃ¡rio.
- [x] Verificar se administrador/moderador pode remover conteÃºdo.
- [x] Verificar se as aÃ§Ãµes de moderaÃ§Ã£o ficam registradas.

### 3.3 Audit log

- [x] Verificar se existe model `AuditLog`.
- [x] Verificar se login Ã© auditado.
- [x] Verificar se criaÃ§Ã£o, ediÃ§Ã£o e exclusÃ£o de anÃºncio sÃ£o auditadas.
- [x] Verificar se denÃºncias sÃ£o auditadas.
- [x] Verificar se aÃ§Ãµes de moderaÃ§Ã£o sÃ£o auditadas.
- [x] Verificar se suspensÃ£o de usuÃ¡rio Ã© auditada.

### 3.4 Dashboard de moderaÃ§Ã£o

- [x] Verificar se existe painel administrativo.
- [x] Verificar se o painel lista denÃºncias pendentes.
- [x] Verificar se o painel permite resolver denÃºncias.
- [x] Verificar se o painel permite visualizar histÃ³rico de moderaÃ§Ã£o.
- [x] Verificar controle de permissÃµes por papel de usuÃ¡rio.

---

## 4. ReputaÃ§Ã£o e Qualidade

### 4.1 AvaliaÃ§Ãµes de usuÃ¡rios

- [x] Verificar se existe entidade `Review`.
- [x] Verificar se existe rating associado ao `User`.
- [x] Verificar suporte a nota de 1 a 5 estrelas.
- [x] Verificar se avaliaÃ§Ãµes aparecem no perfil do usuÃ¡rio.
- [x] Verificar se avaliaÃ§Ãµes aparecem no contexto do anÃºncio ou negociaÃ§Ã£o.

### 4.2 TransaÃ§Ã£o concluÃ­da

- [x] Verificar se existe fluxo para marcar negociaÃ§Ã£o como concluÃ­da.
- [x] Verificar se apenas participantes da negociaÃ§Ã£o podem concluir.
- [x] Verificar se o anÃºncio muda de status apÃ³s conclusÃ£o.
- [x] Verificar se a avaliaÃ§Ã£o sÃ³ Ã© aberta apÃ³s conclusÃ£o.
- [x] Verificar se hÃ¡ prevenÃ§Ã£o contra avaliaÃ§Ãµes duplicadas.

---

## 5. NotificaÃ§Ãµes e Alertas

### 5.1 Mensagens nÃ£o lidas

- [x] Verificar se mensagens tÃªm estado de lida/nÃ£o lida.
- [x] Verificar se conversas possuem contador de mensagens nÃ£o lidas.
- [x] Verificar se o header mostra badge de mensagens nÃ£o lidas.
- [x] Verificar se o contador atualiza em tempo real via WebSocket.

### 5.2 Alertas de interesse

- [x] Verificar se usuÃ¡rio pode cadastrar palavras-chave de interesse.
- [x] Verificar se novos anÃºncios sÃ£o comparados com essas palavras-chave.
- [x] Verificar se o usuÃ¡rio recebe alerta quando hÃ¡ correspondÃªncia.
- [x] Verificar se o alerta aparece no app via badge, toast ou central de notificaÃ§Ãµes.

---

## 6. Infraestrutura e Qualidade TÃ©cnica

### 6.1 VariÃ¡veis de ambiente

- [ ] Verificar se URLs externas nÃ£o estÃ£o hardcoded.
- [ ] Verificar se `.env.example` estÃ¡ completo.
- [ ] Verificar variÃ¡veis para banco de dados.
- [ ] Verificar variÃ¡veis para JWT.
- [ ] Verificar variÃ¡veis para frontend URL.
- [ ] Verificar variÃ¡veis para SSO.
- [ ] Verificar variÃ¡veis para storage de imagens.

### 6.2 Uploads seguros

- [ ] Verificar validaÃ§Ã£o de MIME type.
- [ ] Verificar validaÃ§Ã£o de extensÃ£o.
- [ ] Verificar limite de tamanho.
- [ ] Verificar tratamento de erro no upload.
- [ ] Verificar se o anÃºncio nÃ£o Ã© criado com upload parcialmente falho.
- [ ] Verificar se hÃ¡ rollback ou compensaÃ§Ã£o quando necessÃ¡rio.

### 6.3 PaginaÃ§Ã£o e listagem

- [ ] Verificar se listagens usam paginaÃ§Ã£o server-side.
- [ ] Verificar se nÃ£o hÃ¡ `take: 9999`, `take: 10000` ou listagem ilimitada.
- [ ] Verificar se o retorno possui `total`.
- [ ] Verificar se o retorno possui `page`.
- [ ] Verificar se o retorno possui `limit`.
- [ ] Verificar se o retorno possui `totalPages`.

### 6.4 PermissÃµes

- [ ] Verificar se apenas o autor edita o prÃ³prio anÃºncio.
- [ ] Verificar se apenas o autor finaliza o prÃ³prio anÃºncio.
- [ ] Verificar se apenas usuÃ¡rio autenticado cria denÃºncia.
- [ ] Verificar se apenas usuÃ¡rio autenticado inicia conversa.
- [ ] Verificar se apenas administrador/moderador acessa moderaÃ§Ã£o.
