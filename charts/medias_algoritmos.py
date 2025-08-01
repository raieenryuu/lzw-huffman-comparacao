import pandas as pd
import matplotlib.pyplot as plt
import os

# Carregar os dados do CSV
csv_path = f"{os.path.dirname(__file__)}/../resultados_medias_compressao.csv"
data = pd.read_csv(csv_path)

# Extrair os dados
algoritmos = data["Algoritmo"]
taxa_compressao = data["Taxa de Compressão Média (%)"]
tempo_compressao = data["Tempo Médio Compressão (ms)"]
tempo_descompressao = data["Tempo Médio Descompressão (ms)"]

# Taxa de Compressão Média
plt.figure(figsize=(8, 6))
plt.bar(algoritmos, taxa_compressao, color=['orange', 'purple'])
plt.title("Taxa de Compressão Média (%)")
plt.xlabel("Algoritmo (Maior é melhor)")
plt.ylabel("Taxa de Compressão Média (%)")
plt.grid(axis='y', linestyle='--', alpha=0.7)
plt.savefig(f"{os.path.dirname(__file__)}/taxa_compressao_media.png")
plt.show()

# Tempo Médio de Compressão
plt.figure(figsize=(8, 6))
plt.bar(algoritmos, tempo_compressao, color=['orange', 'purple'])
plt.title("Tempo Médio de Compressão (ms)")
plt.xlabel("Algoritmo (Menor é melhor)")
plt.ylabel("Tempo Médio de Compressão (ms)")
plt.grid(axis='y', linestyle='--', alpha=0.7)
plt.savefig(f"{os.path.dirname(__file__)}/tempo_medio_compressao.png")
plt.show()

# Tempo Médio de Descompressão
plt.figure(figsize=(8, 6))
plt.bar(algoritmos, tempo_descompressao, color=['orange', 'purple'])
plt.title("Tempo Médio de Descompressão (ms)")
plt.xlabel("Algoritmo (Menor é melhor)")
plt.ylabel("Tempo Médio de Descompressão (ms)")
plt.grid(axis='y', linestyle='--', alpha=0.7)
plt.savefig(f"{os.path.dirname(__file__)}/tempo_medio_descompressao.png")
plt.show()