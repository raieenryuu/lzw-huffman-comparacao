"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const bpm = require("bmp-js");
const huffman_1 = __importDefault(require("./huffman"));
const lzw_1 = __importDefault(require("./lzw"));
const perf_hooks_1 = require("perf_hooks");
const json2csv_1 = require("json2csv");
// ### FUNÇÕES AUXILIARES ###
/**
 * Converte uma string de bits (ex: "01101001") em um Buffer de bytes.
 */
function empacotarBitsParaBuffer(bitString) {
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
function carregarCasosDeTeste() {
    const casosDeTeste = [];
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
            }
            else if (entrada.toLowerCase().endsWith('.bmp')) {
                // Lógica para arquivos na raiz de /imagens
                casosDeTeste.push({
                    nome: entrada,
                    caminho: caminhoEntrada,
                    tipo: 'Geral' // Tipo padrão para imagens na raiz
                });
            }
        }
    }
    catch (error) {
        console.error(`❌ Erro ao ler o diretório "imagens". Verifique se ele existe.`, error);
    }
    return casosDeTeste;
}
/**
 * Salva os resultados da análise em um arquivo CSV.
 */
function salvarResultadosCSV(resultados) {
    try {
        const campos = ['Nome da Imagem', 'Tipo da Imagem', 'Tamanho Original (Bytes)', 'Algoritmo', 'Tamanho Comprimido (Bytes)', 'Taxa de Compressão (%)', 'Tempo de Compressão (ms)', 'Tempo de Descompressão (ms)'];
        const parser = new json2csv_1.Parser({ fields: campos });
        const csv = parser.parse(resultados);
        const caminhoSaida = path.join(__dirname, '..', 'resultados_compressao.csv');
        fs.writeFileSync(caminhoSaida, csv);
        console.log(`\n💾 Resultados salvos com sucesso em: ${caminhoSaida}`);
    }
    catch (error) {
        console.error('❌ Erro ao salvar os resultados em CSV:', error);
    }
}
// ### FUNÇÕES DE TESTE POR ALGORITMO ###
/**
 * Executa o teste de compressão e descompressão com o algoritmo de Huffman.
 */
function executarTesteHuffman(pixelData, bmpData, baseOutputName, resultsDirectory) {
    // --- Compressão ---
    const tempoInicioCompressao = perf_hooks_1.performance.now();
    const { encodedData, tree } = huffman_1.default.encode(pixelData);
    const tempoCompressao = perf_hooks_1.performance.now() - tempoInicioCompressao;
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
    const tempoInicioDescompressao = perf_hooks_1.performance.now();
    const dadosDecodificados = huffman_1.default.decode(encodedData, tree);
    const tempoDescompressao = perf_hooks_1.performance.now() - tempoInicioDescompressao;
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
function executarTesteLZW(pixelData, bmpData, baseOutputName, resultsDirectory) {
    // --- Compressão ---
    const tempoInicioCompressao = perf_hooks_1.performance.now();
    const dadosComprimidos = lzw_1.default.compress(pixelData);
    const tempoCompressao = perf_hooks_1.performance.now() - tempoInicioCompressao;
    // Salva o arquivo comprimido .bin
    const caminhoSaidaLzw = path.join(resultsDirectory, `${baseOutputName}_lzw.bin`);
    const bufferCodigosLzw = Buffer.from(new Uint16Array(dadosComprimidos).buffer);
    fs.writeFileSync(caminhoSaidaLzw, bufferCodigosLzw);
    const tamanhoComprimido = bufferCodigosLzw.length;
    // --- Descompressão ---
    const tempoInicioDescompressao = perf_hooks_1.performance.now();
    const dadosDecodificados = lzw_1.default.decompress(dadosComprimidos);
    const tempoDescompressao = perf_hooks_1.performance.now() - tempoInicioDescompressao;
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
function main() {
    return __awaiter(this, void 0, void 0, function* () {
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
        const todosResultados = [];
        console.log(`🚀 Encontradas ${casosDeTeste.length} imagens. Iniciando análise comparativa...`);
        console.log('-'.repeat(60));
        for (const caso of casosDeTeste) {
            try {
                console.log(`Processando: [${caso.tipo}] ${caso.nome}...`);
                const bmpBuffer = fs.readFileSync(caso.caminho);
                const bmpData = bpm.decode(bmpBuffer);
                const pixelData = Array.from(bmpData.data);
                const nomeBaseSaida = path.parse(caso.nome).name;
                // Executa e coleta resultados para ambos os algoritmos
                const resultadoHuffman = executarTesteHuffman(pixelData, bmpData, nomeBaseSaida, diretorioResultados);
                const resultadoLZW = executarTesteLZW(pixelData, bmpData, nomeBaseSaida, diretorioResultados);
                const dadosBase = {
                    'Nome da Imagem': caso.nome,
                    'Tipo da Imagem': caso.tipo,
                    'Tamanho Original (Bytes)': pixelData.length,
                };
                todosResultados.push(Object.assign(Object.assign({}, dadosBase), resultadoHuffman));
                todosResultados.push(Object.assign(Object.assign({}, dadosBase), resultadoLZW));
            }
            catch (error) {
                console.error(`❌ Falha ao processar ${caso.nome}. Erro:`, error);
            }
        }
        console.log('-'.repeat(60));
        console.log('✅ Análise concluída. Resultados Finais:');
        console.table(todosResultados);
        const tabelaCurta = todosResultados.map(r => ({
            Img: r['Nome da Imagem'],
            StartSizeBytes: r['Tamanho Original (Bytes)'],
            Alg: r['Algoritmo'],
            FinalSizeBytes: r['Tamanho Comprimido (Bytes)'],
            TaxaComp: r['Taxa de Compressão (%)'],
            TcompMs: r['Tempo de Compressão (ms)'],
            TdecompMs: r['Tempo de Descompressão (ms)']
        }));
        console.log('-'.repeat(60));
        console.log('✅ Análise concluída. Resultados Finais:');
        console.table(tabelaCurta);
        salvarResultadosCSV(todosResultados);
        calcularMediasPorAlgoritmo(todosResultados);
    });
}
main();
function calcularMediasPorAlgoritmo(resultados) {
    const mapa = resultados.reduce((acc, r) => {
        const alg = r['Algoritmo'];
        if (!acc[alg]) {
            acc[alg] = { origTotal: 0, compTotal: 0, tempoCompTotal: 0, tempoDecompTotal: 0, count: 0 };
        }
        acc[alg].origTotal += r['Tamanho Original (Bytes)'];
        acc[alg].compTotal += r['Tamanho Comprimido (Bytes)'];
        acc[alg].tempoCompTotal += parseFloat(r['Tempo de Compressão (ms)']);
        acc[alg].tempoDecompTotal += parseFloat(r['Tempo de Descompressão (ms)']);
        acc[alg].count++;
        return acc;
    }, {});
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
function salvarMedias(medias) {
    try {
        const campos = ['Algoritmo', 'Taxa de Compressão Média (%)', 'Tempo Médio Compressão (ms)', 'Tempo Médio Descompressão (ms)'];
        const parser = new json2csv_1.Parser({ fields: campos });
        const csv = parser.parse(medias);
        const caminhoSaida = path.join(__dirname, '..', 'resultados_medias_compressao.csv');
        fs.writeFileSync(caminhoSaida, csv);
        console.log(`\nMédias salvas em: ${caminhoSaida}`);
    }
    catch (error) {
        console.error('Erro ao salvar as médias em CSV:', error);
    }
}
