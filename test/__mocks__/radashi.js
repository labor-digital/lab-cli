module.exports = {
    isArray: Array.isArray,
    isEmpty: (val) => val === null || val === undefined || val === '' || (Array.isArray(val) && val.length === 0) || (typeof val === 'object' && Object.keys(val).length === 0),
    isObject: (val) => val !== null && typeof val === 'object' && !Array.isArray(val),
    isString: (val) => typeof val === 'string',
};