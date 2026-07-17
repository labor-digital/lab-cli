export function makeOptions(options: any, definition: any): any {
    const result: any = {};
    options = options || {};

    for (const key in definition) {
        const def = definition[key];
        let value = options[key];

        if (value === undefined) {
            if (def.default !== undefined) {
                value = typeof def.default === 'function' ? def.default(key, options, definition) : def.default;
            } else {
                throw new Error(`Missing required option: ${key}`);
            }
        }

        if (def.children && typeof value === 'object' && value !== null) {
            value = makeOptions(value, def.children);
        }

        result[key] = value;
    }

    for (const key in options) {
        if (!(key in definition)) {
            throw new Error(`Unknown option: ${key}`);
        }
    }

    return result;
}
