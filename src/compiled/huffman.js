"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Estrutura do nó da árvore de Huffman
class HuffmanNode {
    constructor(value, frequency) {
        this.left = null;
        this.right = null;
        this.value = value;
        this.frequency = frequency;
    }
}
class Huffman {
    static buildFrequencyMap(data) {
        const freqMap = new Map();
        for (const value of data) {
            freqMap.set(value, (freqMap.get(value) || 0) + 1);
        }
        return freqMap;
    }
    static buildHuffmanTree(freqMap) {
        // Usamos um array simples como fila de prioridade para simplicidade
        const priorityQueue = [];
        for (const [value, frequency] of freqMap.entries()) {
            priorityQueue.push(new HuffmanNode(value, frequency));
        }
        while (priorityQueue.length > 1) {
            // Ordena para simular uma min-priority queue
            priorityQueue.sort((a, b) => a.frequency - b.frequency);
            const left = priorityQueue.shift();
            const right = priorityQueue.shift();
            const parent = new HuffmanNode(null, left.frequency + right.frequency);
            parent.left = left;
            parent.right = right;
            priorityQueue.push(parent);
        }
        return priorityQueue[0];
    }
    static generateCodes(node, prefix, codeMap) {
        if (node.value !== null) {
            codeMap.set(node.value, prefix || '0'); // Se a árvore tiver um só nó
            return;
        }
        if (node.left) {
            this.generateCodes(node.left, prefix + '0', codeMap);
        }
        if (node.right) {
            this.generateCodes(node.right, prefix + '1', codeMap);
        }
    }
    static encode(data) {
        if (data.length === 0)
            return { encodedData: '', tree: new HuffmanNode(null, 0) };
        const freqMap = this.buildFrequencyMap(data);
        const tree = this.buildHuffmanTree(freqMap);
        const codeMap = new Map();
        this.generateCodes(tree, '', codeMap);
        let encodedData = '';
        for (const value of data) {
            encodedData += codeMap.get(value);
        }
        return { encodedData, tree };
    }
    static decode(encodedData, tree) {
        if (!encodedData)
            return [];
        const decodedData = [];
        let currentNode = tree;
        for (const bit of encodedData) {
            if (bit === '0') {
                currentNode = currentNode.left;
            }
            else {
                currentNode = currentNode.right;
            }
            if (currentNode.value !== null) {
                decodedData.push(currentNode.value);
                currentNode = tree; // Volta para a raiz
            }
        }
        return decodedData;
    }
}
exports.default = Huffman;
