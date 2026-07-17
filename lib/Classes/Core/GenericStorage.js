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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenericStorage = void 0;
const radashi = __importStar(require("radashi"));
class GenericStorage {
    constructor() {
        this.storage = {};
    }
    get(key, fallback) {
        if (key === undefined)
            return this.storage;
        return radashi.get(this.storage, String(key), fallback);
    }
    set(key, value) {
        // radashi.set doesn't exist, we can use a simple implementation or just assign if it's not a deep path
        // Assuming key is a simple string or number for now, or we can implement deep set
        const path = String(key).split('.');
        let current = this.storage;
        for (let i = 0; i < path.length - 1; i++) {
            if (!current[path[i]])
                current[path[i]] = {};
            current = current[path[i]];
        }
        current[path[path.length - 1]] = value;
        return this;
    }
    has(key) {
        return radashi.get(this.storage, String(key)) !== undefined;
    }
    remove(key) {
        const path = String(key).split('.');
        let current = this.storage;
        for (let i = 0; i < path.length - 1; i++) {
            if (!current[path[i]])
                return this;
            current = current[path[i]];
        }
        delete current[path[path.length - 1]];
        return this;
    }
    forEach(callback) {
        for (const [k, v] of Object.entries(this.storage)) {
            callback(v, k);
        }
    }
}
exports.GenericStorage = GenericStorage;
//# sourceMappingURL=GenericStorage.js.map