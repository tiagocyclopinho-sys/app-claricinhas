# Sistema Claricinhas - Controle Interno

Este é o sistema interno da Claricinhas, desenvolvido para controle de despesas, produção e vendas.

## 🚀 Como Rodar Localmente

1. Certifique-se de ter o [Node.js](https://nodejs.org/) instalado.
2. Abra o terminal na pasta `sistema`.
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Inicie o sistema:
   ```bash
   npm run dev
   ```
5. Acesse o endereço que aparecerá no terminal (geralmente `http://localhost:5173`).

## 📁 Estrutura do Projeto

- `src/pages`: Contém as telas do sistema (Dashboard, Despesas, Produção, Vendas).
- `src/components`: Componentes reutilizáveis como a Sidebar.
- `public`: Imagens e logotipos utilizados.

## ⚠️ Observações Importantes (Para o Usuário Leigo)

- **Dados Locais**: O sistema salva as informações direto no seu navegador (LocalStorage). Isso significa que os dados ficam salvos apenas no computador/celular onde você os inseriu. Se limpar o histórico do navegador, os dados serão perdidos.
- **Responsividade**: O sistema foi desenhado para funcionar bem no celular. Para isso, usamos um menu lateral que se esconde em telas menores.
- **Imagens de Produção**: Ao adicionar uma foto na produção, ela é convertida para texto (Base64) e salva localmente. Fotos muito grandes podem deixar o navegador lento.

## 🌐 Como fazer o Deploy (Colocar na Internet)

Para que outras pessoas acessem o sistema pelo link:

1. **GitHub**: Crie uma conta no [GitHub](https://github.com/) e envie a pasta `sistema` para um novo repositório.
2. **Vercel**: Crie uma conta na [Vercel](https://vercel.com/), conecte seu GitHub e selecione o repositório do projeto.
3. O deploy será automático e você receberá um link (ex: `claricinhas.vercel.app`).

---
Desenvolvido com ❤️ para Claricinhas.
