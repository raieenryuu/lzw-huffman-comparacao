// Estrutura do nó da árvore de Huffman
class HuffmanNode {
    value: number | null; // Valor do pixel (0-255)
    frequency: number;
    left: HuffmanNode | null = null;
    right: HuffmanNode | null = null;

    constructor(value: number | null, frequency: number) {
        this.value = value;
        this.frequency = frequency;
    }
}

export default class Huffman {
    private static buildFrequencyMap(data: number[]): Map<number, number> {
        const freqMap = new Map<number, number>();
        for (const value of data) {
            freqMap.set(value, (freqMap.get(value) || 0) + 1);
        }
        return freqMap;
    }

    private static buildHuffmanTree(freqMap: Map<number, number>): HuffmanNode {
        // Usamos um array simples como fila de prioridade para simplicidade
        const priorityQueue: HuffmanNode[] = [];
        for (const [value, frequency] of freqMap.entries()) {
            priorityQueue.push(new HuffmanNode(value, frequency));
        }

        while (priorityQueue.length > 1) {
            // Ordena para simular uma min-priority queue
            priorityQueue.sort((a, b) => a.frequency - b.frequency);

            const left = priorityQueue.shift()!;
            const right = priorityQueue.shift()!;
            
            const parent = new HuffmanNode(null, left.frequency + right.frequency);
            parent.left = left;
            parent.right = right;
            
            priorityQueue.push(parent);
        }
        
        return priorityQueue[0];
    }
    
    private static generateCodes(node: HuffmanNode, prefix: string, codeMap: Map<number, string>) {
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

    public static encode(data: number[]): { encodedData: string, tree: HuffmanNode } {
        if (data.length === 0) return { encodedData: '', tree: new HuffmanNode(null, 0) };

        const freqMap = this.buildFrequencyMap(data);
        const tree = this.buildHuffmanTree(freqMap);
        
        const codeMap = new Map<number, string>();
        this.generateCodes(tree, '', codeMap);
        
        let encodedData = '';
        for (const value of data) {
            encodedData += codeMap.get(value);
        }
        
        return { encodedData, tree };
    }

    public static decode(encodedData: string, tree: HuffmanNode): number[] {
        if (!encodedData) return [];
        
        const decodedData: number[] = [];
        let currentNode = tree;
        
        for (const bit of encodedData) {
            if (bit === '0') {
                currentNode = currentNode.left!;
            } else {
                currentNode = currentNode.right!;
            }
            
            if (currentNode.value !== null) {
                decodedData.push(currentNode.value);
                currentNode = tree; // Volta para a raiz
            }
        }
        return decodedData;
    }
}