import * as fs from 'fs';
import * as path from 'path';
import bpm = require('bmp-js');
import Huffman from './huffman';
import LZW from './lzw';
import { performance } from 'perf_hooks';
import { Parser } from 'json2csv';

// ### ESTRUTURAS DE DADOS ###

interface ResultadoTeste {
    'Nome da Imagem': string;
    'Tipo da Imagem': string;
    'Tamanho Original (Bytes)': number;
    'Algoritmo': 'Huffman' | 'LZW';
    'Tamanho Comprimido (Bytes)': number;
    'Taxa de Compressão (%)': string;
    'Tempo de Compressão (ms)': string;
    'Tempo de Descompressão (ms)': string;
}

interface CasoDeTeste {
    nome: string;
    caminho: string;
    tipo: string;
}

// ### FUNÇÕES AUXILIARES ###

/**
 * Converte uma string de bits (ex: "01101001") em um Buffer de bytes.
 */
function empacotarBitsParaBuffer(bitString: string): Buffer {
    const bytes = [];
    for (let i = 0; i < bitString.length; i += 8) {
        const byteString = bitString.substring(i, i + 8).padEnd(8, '0');
        bytes.push(parseInt(byteString, 2));
    }
    return Buffer.from(bytes);
}

/**
 * Procura por arquivos .bmp no diretório 'imagens' e em seus subdiretórios.
 * @returns Um array de casos de teste para serem executados.
 */
function carregarCasosDeTeste(): CasoDeTeste[] {
    const casosDeTeste: CasoDeTeste[] = [];
    const diretorioRaizImagens = path.join(__dirname, '..', 'imagens');

    try {
        const entradasRaiz = fs.readdirSync(diretorioRaizImagens);
        for (const entrada of entradasRaiz) {
            const caminhoEntrada = path.join(diretorioRaizImagens, entrada);
            const stat = fs.statSync(caminhoEntrada);

            if (stat.isDirectory()) {
                // Lógica para subdiretórios (ex: /imagens/simples)
                const tipoPasta = entrada;
                fs.readdirSync(caminhoEntrada)
                    .filter(arquivo => arquivo.toLowerCase().endsWith('.bmp'))
                    .forEach(arquivoImagem => {
                        casosDeTeste.push({
                            nome: arquivoImagem,
                            caminho: path.join(caminhoEntrada, arquivoImagem),
                            tipo: tipoPasta
                        });
                    });
            } else if (entrada.toLowerCase().endsWith('.bmp')) {
                // Lógica para arquivos na raiz de /imagens
                casosDeTeste.push({
                    nome: entrada,
                    caminho: caminhoEntrada,
                    tipo: 'Geral' // Tipo padrão para imagens na raiz
                });
            }
        }
    } catch (error) {
        console.error(`❌ Erro ao ler o diretório "imagens". Verifique se ele existe.`, error);
    }
    return casosDeTeste;
}

/**
 * Salva os resultados da análise em um arquivo CSV.
 */
function salvarResultadosCSV(resultados: ResultadoTeste[]): void {
    try {
        const campos = ['Nome da Imagem', 'Tipo da Imagem', 'Tamanho Original (Bytes)', 'Algoritmo', 'Tamanho Comprimido (Bytes)', 'Taxa de Compressão (%)', 'Tempo de Compressão (ms)', 'Tempo de Descompressão (ms)'];
        const parser = new Parser({ fields: campos });
        const csv = parser.parse(resultados);
        const caminhoSaida = path.join(__dirname, '..', 'resultados_compressao.csv');
        fs.writeFileSync(caminhoSaida, csv);
        console.log(`\n💾 Resultados salvos com sucesso em: ${caminhoSaida}`);
    } catch (error) {
        console.error('❌ Erro ao salvar os resultados em CSV:', error);
    }
}

// ### FUNÇÕES DE TESTE POR ALGORITMO ###

/**
 * Executa o teste de compressão e descompressão com o algoritmo de Huffman.
 */
function executarTesteHuffman(pixelData: number[], bmpData: bpm.BmpDecoder, baseOutputName: string, resultsDirectory: string): Omit<ResultadoTeste, 'Nome da Imagem' | 'Tipo da Imagem' | 'Tamanho Original (Bytes)'> {
    // --- Compressão ---
    const tempoInicioCompressao = performance.now();
    const { encodedData, tree } = Huffman.encode(pixelData);
    const tempoCompressao = performance.now() - tempoInicioCompressao;

    // Salva o arquivo comprimido .bin
    const caminhoSaidaHuff = path.join(resultsDirectory, `${baseOutputName}_huffman.bin`);
    const arvoreJson = JSON.stringify(tree);
    const arvoreBuffer = Buffer.from(arvoreJson, 'utf-8');
    const bufferTamanhoArvore = Buffer.alloc(4);
    bufferTamanhoArvore.writeUInt32BE(arvoreBuffer.length, 0);
    const dadosBuffer = empacotarBitsParaBuffer(encodedData);
    const bufferFinalHuffman = Buffer.concat([bufferTamanhoArvore, arvoreBuffer, dadosBuffer]);
    fs.writeFileSync(caminhoSaidaHuff, bufferFinalHuffman);
    const tamanhoComprimido = bufferFinalHuffman.length;

    // Salva a árvore separadamente para referência
    const caminhoArvore = path.join(resultsDirectory, `${baseOutputName}_huffman_tree.json`);
    fs.writeFileSync(caminhoArvore, arvoreJson);

    // --- Descompressão ---
    const tempoInicioDescompressao = performance.now();
    const dadosDecodificados = Huffman.decode(encodedData, tree);
    const tempoDescompressao = performance.now() - tempoInicioDescompressao;

    // Salva a imagem reconstruída para verificação
    const bmpReconstruido = bpm.encode({ data: Buffer.from(dadosDecodificados), width: bmpData.width, height: bmpData.height });
    fs.writeFileSync(path.join(resultsDirectory, `${baseOutputName}_huffman_reconstruido.bmp`), bmpReconstruido.data);

    return {
        'Algoritmo': 'Huffman',
        'Tamanho Comprimido (Bytes)': tamanhoComprimido,
        'Taxa de Compressão (%)': ((1 - tamanhoComprimido / pixelData.length) * 100).toFixed(2),
        'Tempo de Compressão (ms)': tempoCompressao.toFixed(2),
        'Tempo de Descompressão (ms)': tempoDescompressao.toFixed(2),
    };
}

/**
 * Executa o teste de compressão e descompressão com o algoritmo LZW.
 */
function executarTesteLZW(pixelData: number[], bmpData: bpm.BmpDecoder, baseOutputName: string, resultsDirectory: string): Omit<ResultadoTeste, 'Nome da Imagem' | 'Tipo da Imagem' | 'Tamanho Original (Bytes)'> {
    // --- Compressão ---
    const tempoInicioCompressao = performance.now();
    const dadosComprimidos = LZW.compress(pixelData);
    const tempoCompressao = performance.now() - tempoInicioCompressao;

    // Salva o arquivo comprimido .bin
    const caminhoSaidaLzw = path.join(resultsDirectory, `${baseOutputName}_lzw.bin`);
    const bufferCodigosLzw = Buffer.from(new Uint16Array(dadosComprimidos).buffer);
    fs.writeFileSync(caminhoSaidaLzw, bufferCodigosLzw);
    const tamanhoComprimido = bufferCodigosLzw.length;

    // --- Descompressão ---
    const tempoInicioDescompressao = performance.now();
    const dadosDecodificados = LZW.decompress(dadosComprimidos);
    const tempoDescompressao = performance.now() - tempoInicioDescompressao;

    // Salva a imagem reconstruída para verificação
    const bmpReconstruido = bpm.encode({ data: Buffer.from(dadosDecodificados), width: bmpData.width, height: bmpData.height });
    fs.writeFileSync(path.join(resultsDirectory, `${baseOutputName}_lzw_reconstruido.bmp`), bmpReconstruido.data);

    return {
        'Algoritmo': 'LZW',
        'Tamanho Comprimido (Bytes)': tamanhoComprimido,
        'Taxa de Compressão (%)': ((1 - tamanhoComprimido / pixelData.length) * 100).toFixed(2),
        'Tempo de Compressão (ms)': tempoCompressao.toFixed(2),
        'Tempo de Descompressão (ms)': tempoDescompressao.toFixed(2),
    };
}


// ### FUNÇÃO PRINCIPAL DE EXECUÇÃO ###

async function main() {
    const casosDeTeste = carregarCasosDeTeste();
    if (casosDeTeste.length === 0) {
        console.log('❌ Nenhuma imagem .bmp encontrada em "imagens" ou em seus subdiretórios. Verifique a estrutura de pastas.');
        return;
    }

    // Cria o diretório de resultados se ele não existir
    const diretorioResultados = path.join(__dirname, '..', 'resultados');
    if (!fs.existsSync(diretorioResultados)) {
        fs.mkdirSync(diretorioResultados, { recursive: true });
    }

    const todosResultados: ResultadoTeste[] = [];
    console.log(`🚀 Encontradas ${casosDeTeste.length} imagens. Iniciando análise comparativa...`);
    console.log('-'.repeat(60));

    for (const caso of casosDeTeste) {
        try {
            console.log(`Processando: [${caso.tipo}] ${caso.nome}...`);
            const bmpBuffer = fs.readFileSync(caso.caminho);
            const bmpData = bpm.decode(bmpBuffer);
            const pixelData: number[] = Array.from(bmpData.data);
            const nomeBaseSaida = path.parse(caso.nome).name;

            // Executa e coleta resultados para ambos os algoritmos
            const resultadoHuffman = executarTesteHuffman(pixelData, bmpData, nomeBaseSaida, diretorioResultados);
            const resultadoLZW = executarTesteLZW(pixelData, bmpData, nomeBaseSaida, diretorioResultados);

            const dadosBase = {
                'Nome da Imagem': caso.nome,
                'Tipo da Imagem': caso.tipo,
                'Tamanho Original (Bytes)': pixelData.length,
            };

            todosResultados.push({ ...dadosBase, ...resultadoHuffman });
            todosResultados.push({ ...dadosBase, ...resultadoLZW });

        } catch (error) {
            console.error(`❌ Falha ao processar ${caso.nome}. Erro:`, error);
        }
    }

    console.log('-'.repeat(60));
    console.log('✅ Análise concluída. Resultados Finais:');
    console.table(todosResultados);

    const tabelaCurta = todosResultados.map(r => ({
        Img     : r['Nome da Imagem'],
        StartSizeBytes    : r['Tamanho Original (Bytes)'],
        Alg     : r['Algoritmo'],
        FinalSizeBytes    : r['Tamanho Comprimido (Bytes)'],
        TaxaComp : r['Taxa de Compressão (%)'],
        TcompMs : r['Tempo de Compressão (ms)'],
        TdecompMs : r['Tempo de Descompressão (ms)']
    }));

    console.log('-'.repeat(60));
    console.log('✅ Análise concluída. Resultados Finais:');
    console.table(tabelaCurta);
    

    salvarResultadosCSV(todosResultados);

    calcularMediasPorAlgoritmo(todosResultados)
}

main();

function calcularMediasPorAlgoritmo(resultados: ResultadoTeste[]) {
  type Acumulado = {
    origTotal: number;
    compTotal: number;
    tempoCompTotal: number;
    tempoDecompTotal: number;
    count: number;
  };

  const mapa = resultados.reduce<Record<'Huffman' | 'LZW', Acumulado>>((acc, r) => {
    const alg = r['Algoritmo'];
    if (!acc[alg]) {
      acc[alg] = { origTotal: 0, compTotal: 0, tempoCompTotal: 0, tempoDecompTotal: 0, count: 0 };
    }
    acc[alg].origTotal       += r['Tamanho Original (Bytes)'];
    acc[alg].compTotal       += r['Tamanho Comprimido (Bytes)'];
    acc[alg].tempoCompTotal  += parseFloat(r['Tempo de Compressão (ms)']);
    acc[alg].tempoDecompTotal+= parseFloat(r['Tempo de Descompressão (ms)']);
    acc[alg].count++;
    return acc;
  }, {} as Record<'Huffman' | 'LZW', Acumulado>);

  const medias = Object.entries(mapa).map(([alg, v]) => ({
    Algoritmo: alg,
    'Taxa de Compressão Média (%)': ((1 - v.compTotal / v.origTotal) * 100).toFixed(2), // MÉDIA PONDERADA
    'Tempo Médio Compressão (ms)': (v.tempoCompTotal / v.count).toFixed(2),
    'Tempo Médio Descompressão (ms)': (v.tempoDecompTotal / v.count).toFixed(2)
  }));

  console.log('\nMédias por algoritmo');
  console.table(medias);
  salvarMedias(medias);
}

function salvarMedias(medias: any[]): void {
    try {
        const campos = ['Algoritmo', 'Taxa de Compressão Média (%)', 'Tempo Médio Compressão (ms)', 'Tempo Médio Descompressão (ms)'];
        const parser = new Parser({ fields: campos });
        const csv = parser.parse(medias);
        const caminhoSaida = path.join(__dirname, '..', 'resultados_medias_compressao.csv');
        fs.writeFileSync(caminhoSaida, csv);
        console.log(`\nMédias salvas em: ${caminhoSaida}`);
    } catch (error) {
        console.error('Erro ao salvar as médias em CSV:', error);
    }
}

