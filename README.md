# 🐾 PetControl SaaS

[![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.io/)

**PetControl** é um sistema de gestão inteligente (SaaS) desenvolvido para pet shops e clínicas veterinárias. O objetivo é simplificar o dia a dia do negócio, focando na organização de vacinas, controle de estoque rigoroso e agendamentos eficientes.

## ✨ Funcionalidades Principais

- 📅 **Agenda Inteligente**: Gestão de banho, tosa e consultas com alertas.
- 💉 **Controle de Vacinação**: Histórico completo dos pets com lembretes automáticos de reforço.
- 📦 **Gestão de Estoque**: Monitoramento de validade de produtos e níveis baixos de estoque.
- 💰 **Financeiro Integrado**: Fluxo de pagamentos via **Pix (OpenPix)** e **Klivopay**.
- 📱 **PWA Ready**: Instale o sistema no celular como um aplicativo nativo.
- 🤖 **Dr. Pata**: Assistente virtual integrado para auxílio rápido.

## 🚀 Tecnologias Utilizadas

- **Frontend**: React 18, TypeScript, Vite.
- **UI/UX**: Tailwind CSS, Shadcn/UI, Lucide React (Icons), Recharts (Gráficos).
- **Backend / Database**: Supabase (Auth, DB, Storage, Edge Functions).
- **Pagamentos**: Integração com OpenPix e Klivopay.
- **Testes**: Vitest, React Testing Library.

## 🛠️ Como Iniciar

### Pré-requisitos

- Node.js (v18+) ou Bun
- Conta no Supabase

### Instalação

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/petcontrol-saas.git
    cd petcontrol-saas
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    # ou
    bun install
    ```

3.  **Configure as variáveis de ambiente:**
    Copie o arquivo `.env.example` para `.env` e preencha com suas chaves do Supabase e Gateways de pagamento.
    ```bash
    cp .env.example .env
    ```

4.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

## 📦 Scripts Disponíveis

- `npm run dev`: Inicia o servidor local.
- `npm run build`: Gera o build de produção na pasta `/dist`.
- `npm run lint`: Executa o linter para verificar a qualidade do código.
- `npm run test`: Executa os testes unitários.

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes (se disponível).

---

Desenvolvido com ❤️ por [Seu Nome/Vexoz]
