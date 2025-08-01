export default class LZW {
    public static compress(data: number[]): number[] {
        let dictSize = 256;
        const dictionary = new Map<string, number>();
        for (let i = 0; i < 256; i++) {
            dictionary.set(String.fromCharCode(i), i);
        }

        let p = '';
        const result: number[] = [];
        
        for (const value of data) {
            const c = String.fromCharCode(value);
            const pc = p + c;

            if (dictionary.has(pc)) {
                p = pc;
            } else {
                result.push(dictionary.get(p)!);
                dictionary.set(pc, dictSize++);
                p = c;
            }
        }

        if (p !== '') {
            result.push(dictionary.get(p)!);
        }

        return result;
    }

    public static decompress(data: number[]): number[] {
        if (data.length === 0) return [];

        let dictSize = 256;
        const dictionary: string[] = new Array(4096);
        for (let i = 0; i < 256; i++) {
            dictionary[i] = String.fromCharCode(i);
        }

        let dataIdx = 0;
        let k = data[dataIdx++];
        let p = String.fromCharCode(k);
        const result: number[] = [p.charCodeAt(0)];

        const dataLen = data.length;
        while (dataIdx < dataLen) {
            k = data[dataIdx++];
            let entry: string;

            if (k < dictSize) {
                entry = dictionary[k];
            } else if (k === dictSize) {
                entry = p + p.charAt(0);
            } else {
                throw new Error('Erro na descompressão: código inválido.');
            }

            for (let i = 0, len = entry.length; i < len; i++) {
                result.push(entry.charCodeAt(i));
            }

            dictionary[dictSize++] = p + entry.charAt(0);
            p = entry;
        }

        return result;
    }


}