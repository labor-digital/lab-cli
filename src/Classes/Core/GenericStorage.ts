import * as radashi from 'radashi';

export interface GenericStorageInterface {
    get(key?: string | number, fallback?: any): any;
    set(key: string | number, value: any): GenericStorageInterface;
    has(key: string | number): boolean;
    remove(key: string | number): GenericStorageInterface;
    forEach(callback: Function): void;
}

export class GenericStorage implements GenericStorageInterface {
    public storage: Record<string, any> = {};

    public get(key?: string | number, fallback?: any): any {
        if (key === undefined) return this.storage;
        return radashi.get(this.storage, String(key), fallback);
    }

    public set(key: string | number, value: any): GenericStorageInterface {
        // radashi.set doesn't exist, we can use a simple implementation or just assign if it's not a deep path
        // Assuming key is a simple string or number for now, or we can implement deep set
        const path = String(key).split('.');
        let current = this.storage;
        for (let i = 0; i < path.length - 1; i++) {
            if (!current[path[i]]) current[path[i]] = {};
            current = current[path[i]];
        }
        current[path[path.length - 1]] = value;
        return this;
    }

    public has(key: string | number): boolean {
        return radashi.get(this.storage, String(key)) !== undefined;
    }

    public remove(key: string | number): GenericStorageInterface {
        const path = String(key).split('.');
        let current = this.storage;
        for (let i = 0; i < path.length - 1; i++) {
            if (!current[path[i]]) return this;
            current = current[path[i]];
        }
        delete current[path[path.length - 1]];
        return this;
    }

    public forEach(callback: Function): void {
        for (const [k, v] of Object.entries(this.storage)) {
            callback(v, k);
        }
    }
}
