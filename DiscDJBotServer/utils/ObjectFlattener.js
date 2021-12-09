module.exports = ObjectFlattener = (object, maxLevel = 2, level = 0) => {
    let obj = {};

    Object.keys(object).forEach((key) => {
        item = object[key];
        if (isObject(item) && level < maxLevel - 1) {
            Object.assign(obj, ObjectFlattener(item, maxLevel, level + 1));
        } else {
            obj[key] = item;
        }
    });
    return obj;
};

let isObject = (x) => {
    return x != null && typeof x === "object" && !Array.isArray(x);
};
