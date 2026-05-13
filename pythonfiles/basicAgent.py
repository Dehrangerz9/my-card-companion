#bibliotecas
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
import pandas as pd
import json
#CountVectorizer é uma classe da biblioteca sklearn que transforma textos do vocabulário em vetores numéricos.
#MultinomialNBclassifica os textos em vetores com base na frequência das palavras. Aprende com a contagem das palavras vetorizadas e probabilidades aprendidas.

#DADOS DE TREINAMENTO
perguntas = pd.read_csv('/content/perguntas.csv')

frases = perguntas["frase"].astype(str).tolist()
categorias = perguntas["categoria"].astype(str).tolist()

#VETORIZAÇÃO E TREINAMENTO
vetorizador = CountVectorizer()
X = vetorizador.fit_transform(frases)

#vetorizador vai guardar um objeto que será usado para transformar texto em números.
#X guarda o resultado da transformação das frases em vetore numéricos.
#fit_transform é um método da classe CountVectorizer que aprende o vocabuláro das frases e transforma em vetor.

modelo = MultinomialNB()
modelo.fit(X, categorias)

#modelo vai guardar o modelo criado
#modelo.fit é um algoritmo que treina os exemplos das frases que passamos para ele.

#RESPOSTAS
with open("/content/respostas.json", "r", encoding="utf-8") as arquivo:
    respostas = json.load(arquivo)

#COMEÇO DO CHATBOT
print("="*40)
print("CHATBOT - OPERADORA DE CARTÃO")
print("Digite sua pergunta ou 'sair' para encerrar")
print("="*40)

while True:
  pergunta = input("\nVocê: ").lower()

  if pergunta == "sair":
    print("Chatbot: Atendimento encerrado.")
    break

    #Vetorização da pergunta
  pergunta_vetorizada = vetorizador.transform([pergunta])

    #pergunta_vetorizada - transforma a pergunta digitada em uma forma numérica que o modelo consiga entender.
    #vetorizador é o objeto COuntVectorizer(), que foi treinado antes com essas frases do dataset.

    #Previsão
  categoria_prevista = modelo.predict(pergunta_vetorizada)[0]
    #modelo.predict(): analisa o vetor da pergunta e decide qual a categoria ela pertence (começa desde o início)

    #Probabilidades
  probabilidades = modelo.predict_proba(pergunta_vetorizada)[0]
    #retorna a probabilidade de cada categoria -> [8.18, 8.75, 8.15] em porcentagem

  maior_probabilidade = max(probabilidades)
    #guarda a maior probabilidade de resposta escolhida pelo modelo

  if maior_probabilidade < 0.40: #menor que 40%
        print("Chatbot: Desculpe, não entendi sua solicitação. Pode reformular a pergunta?")
  else:
        print("Categoria identificada:", categoria_prevista)
        print("Probabilidade:", round(maior_probabilidade * 100, 2), "%")
        print("Chatbot:", respostas[categoria_prevista])