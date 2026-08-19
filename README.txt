MÃO NA BRASA — PROJETO CORRIGIDO

Esta versão foi corrigida a partir do ZIP enviado.

CORREÇÕES:
- CSS completo do site restaurado/organizado.
- Carrinho lateral agora começa fechado e só abre pelo botão.
- Carrinho tem rolagem própria e não trava o conteúdo da página.
- Total e botão de envio ficam no fluxo correto do painel.
- Visualização ampliada do produto usa overlay próprio, sem <dialog>.
- Clique no card abre o produto ampliado.
- Botão Adicionar do card não abre o preview por engano.
- ESC fecha o preview/carrinho.
- Abrir o carrinho fecha o preview.
- Layout responsivo para desktop, tablet e celular.
- Service Worker atualizado para v18 para evitar cache da versão quebrada.
- SQL incluído para Supabase, sem apagar tabelas existentes.

ARQUIVOS PRINCIPAIS:
index.html
styles.css
script.js
admin.html
supabase.sql
sw.js
manifest.json

SUPABASE:
URL: https://wahqqziycgeqdnjwekze.supabase.co
A aplicação usa a chave publishable fornecida no projeto.
Nunca coloque uma service_role key no frontend.
