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
        let dictSize = 256;
        const dictionary = new Map<number, string>();
        for (let i = 0; i < 256; i++) {
            dictionary.set(i, String.fromCharCode(i));
        }

        let p = String.fromCharCode(data.shift()!);
        const result: number[] = [p.charCodeAt(0)];

        for (const k of data) {
            let entry: string;
            if (dictionary.has(k)) {
                entry = dictionary.get(k)!;
            } else if (k === dictSize) {
                entry = p + p.charAt(0);
            } else {
                throw new Error('Erro na descompressão: código inválido.');
            }

            for (const char of entry) {
                result.push(char.charCodeAt(0));
            }
            
            dictionary.set(dictSize++, p + entry.charAt(0));
            p = entry;
        }

        return result;
    }
}