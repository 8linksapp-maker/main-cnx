# Main Astro - JAMstack SaaS Dashboard

Bem-vindo ao **Main Astro**, a plataforma definitiva para gestão, automação e deploy de sites JAMstack de alta performance.

## 🚀 O que é o Main Astro?
O Main Astro é um Painel de Controle (SaaS) projetado para empreendedores e desenvolvedores que buscam velocidade máxima, segurança absoluta e SEO imbatível para seus projetos web. 

Com integração nativa à **Vercel** e **Supabase**, o Main Astro permite que você gerencie toda a sua infraestrutura de sites a partir de uma interface única e moderna.

## ✨ Principais Funcionalidades
- **Gestão de Projetos**: Controle total sobre seus sites hospedados na Vercel.
- **Deploys Automáticos**: Ciclos de build e deploy ultra-rápidos direto do painel.
- **Domínios e SSL**: Configuração e gestão de domínios customizados com SSL automático.
- **Infraestrutura Global**: Sites distribuídos via Global CDN (Edge Computing) para carregamento instantâneo.
- **Autenticação Segura**: Gerenciamento de usuários e sessões via Supabase Auth.
- **Wow Performance**: Arquitetura estática que garante Score 100 no Google PageSpeed Insights.

## 🛠 Stack Tecnológica
- **Framework**: Astro 
- **Componentes**: React + Tailwind CSS
- **Banco de Dados & Auth**: Supabase
- **Infraestrutura & API**: Vercel

## 📁 Estrutura do Projeto
- `src/pages/index.astro`: Landing Page / Portal de Vendas.
- `src/pages/dashboard/`: Painel administrativo protegido.
- `src/pages/login.astro`: Portal de acesso seguro.
- `src/lib/`: Configurações de serviços e clientes API.
- `src/themes/`: Sistema de temas e layouts do portal.

## ⚙️ Começando
### Pré-requisitos
- Bun ou Node.js instalado.
- Conta no Supabase e na Vercel.

### Instalação
1. Clone o repositório.
2. Configure o arquivo `.env`:
   ```env
   PUBLIC_SUPABASE_URL=seu_url
   PUBLIC_SUPABASE_ANON_KEY=seu_anon_key
   ```
3. Instale as dependências:
   ```bash
   bun install
   ```
4. Inicie o servidor de desenvolvimento:
   ```bash
   bun dev
   ```

---
*Main Astro — A Nova Era do Desenvolvimento Web.*
