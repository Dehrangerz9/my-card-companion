# APS - 7º Semestre: CardVault IA

**Integrantes:**
* **Yume Fernandes Lima** - RA: 2646927
* **Lucas Perrone Borlin Alvez** - RA: 2548107

Este projeto consiste em uma aplicação completa (Full Stack) que integra um chatbot de inteligência artificial voltado para o sistema CardVault. A solução utiliza Processamento de Linguagem Natural (PLN) para classificar intenções de usuários e fornecer respostas automáticas.

---

##  Estrutura do Projeto

O projeto está dividido em duas partes principais:

```text
fmu-ia/
├── frontend/   # Interface do Usuário (React + Vite + TailwindCSS)
└── backend/    # Servidor de IA (Python FastAPI + scikit-learn)

```

1. **Frontend**: Uma interface moderna e responsiva construída com React, utilizando TailwindCSS para estilização.
2. **Backend**: Uma API robusta em Python que carrega o modelo de aprendizado de máquina e processa as mensagens em tempo real.

---

## Requisitos de Instalação

Antes de começar, certifique-se de ter instalado em sua máquina:

* **Python 3.10** ou superior.
* **Node.js v18** ou superior.
* **Gerenciador de pacotes npm** (instalado junto com o Node).

---

## Como Executar Localmente

Siga os passos abaixo para rodar o projeto em seu ambiente de desenvolvimento.

### 1. Configurando o Backend (IA)

O backend é responsável pelo processamento lógico do chatbot.

1. Abra o terminal na pasta raiz do projeto e entre no diretório do backend:
```bash
cd backend

```


2. Crie um ambiente virtual (venv) para isolar as bibliotecas:
```bash
python -m venv venv

```


3. Ative o ambiente virtual:
* **Windows:** `venv\Scripts\activate`
* **Linux/macOS:** `source venv/bin/activate`


4. Instale as dependências necessárias:
```bash
pip install -r requirements.txt

```


5. Inicie o servidor:
```bash
uvicorn main:app --reload

```


* A API estará disponível em: `http://localhost:8000`
* Documentação interativa (Swagger): `http://localhost:8000/docs`



### 2. Configurando o Frontend (UI)

Com o backend rodando, abra um **novo terminal** para o frontend.

1. Navegue até a pasta do frontend:
```bash
cd frontend

```


2. Instale as dependências do React:
```bash
npm install

```


3. Inicie a aplicação:
```bash
npm run dev

```


* O site estará disponível em: `http://localhost:5173`



---

##  Detalhes Técnicos da Inteligência Artificial

O chatbot foi implementado utilizando a biblioteca **scikit-learn** e baseia-se em um modelo de classificação estatística.

### Funcionamento Interno:

* **Algoritmo**: Utilizamos o **Multinomial Naive Bayes**. É um classificador probabilístico ideal para processamento de texto e categorização de intenções.
* **Vetorização**: O sistema utiliza o **CountVectorizer** com configurações de *unigrams* e *bigrams*. Isso significa que a IA analisa tanto palavras isoladas quanto pares de palavras para entender melhor o contexto.
* **Base de Conhecimento**: Todos os padrões de fala e respostas estão armazenados no arquivo `intents.json`.

### Arquivos Chave:

* `intents.json`: Contém os dados de treinamento (intenções, frases de exemplo e respostas).
* `chatbot.py`: Contém a classe `CardVaultChatbot`. Ela realiza o treinamento do modelo toda vez que o servidor inicia e expõe a função `respond()`.
* `main.py`: Define as rotas da API usando FastAPI, permitindo que o frontend envie mensagens via protocolo HTTP (POST /chat).

**Dica**: Para adicionar novos conhecimentos ao chatbot, basta editar o arquivo `intents.json`, adicionar novas perguntas/respostas e reiniciar o servidor backend.
