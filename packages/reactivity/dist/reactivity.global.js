var VueReactivity = (function (exports) {
    'use strict';

    const isObject = (value) => typeof value === 'object' && value != null;
    const extend = Object.assign;

    const readonlyObj = {
        set: (target, key) => {
            console.log(`set on key ${key} falied`);
        }
    };
    function createGetter(isReadonly = false, shallow = false) {
        return (target, key, receiver) => {
            const res = Reflect.get(target, key, receiver);
            if (shallow) {
                //如果是浅的 直接返回当前值
                return res;
            }
            if (isObject(res)) {
                //如果当前值还是对象 则需要继续递归代理
                return !isReadonly ? readonly(res) : reactive(res);
            }
            return res;
        };
    }
    function createSetter(shallow = false) {
        return (target, key, value, receiver) => {
            const result = Reflect.set(target, key, value, receiver);
            return result;
        };
    }
    const set = createSetter();
    const shallowSet = createSetter(true);
    const get = createGetter();
    const shallowGet = createGetter(false, true);
    const readonlyGet = createGetter(true);
    const shallowReadonlyGet = createGetter(true, true);
    const reactiveHandler = {
        get,
        set
    };
    const shallowReactiveHandler = {
        get: shallowGet,
        set: shallowSet,
    };
    const readonlyHandler = extend({
        get: readonlyGet
    }, readonlyObj);
    const shallowReadonlyHandler = extend({
        get: shallowReadonlyGet
    }, readonlyObj);

    function reactive(target) {
        return createReactiveObject(target, false, reactiveHandler);
    }
    function shallowReactive(target) {
        return createReactiveObject(target, false, shallowReactiveHandler);
    }
    function readonly(target) {
        return createReactiveObject(target, true, readonlyHandler);
    }
    function shallowReadonly(target) {
        return createReactiveObject(target, true, shallowReadonlyHandler);
    }
    const reactiveMap = new WeakMap();
    const readonlyMap = new WeakMap();
    function createReactiveObject(target, isReadonly, baseHandlers) {
        if (!isObject(target))
            return target;
        const proxyMap = isReadonly ? readonlyMap : reactiveMap;
        const existProxy = proxyMap.get(target);
        if (existProxy)
            return existProxy;
        const proxy = new Proxy(target, baseHandlers);
        proxyMap.set(target, proxy);
        return proxy;
    }

    exports.reactive = reactive;
    exports.readonly = readonly;
    exports.shallowReactive = shallowReactive;
    exports.shallowReadonly = shallowReadonly;

    return exports;

})({});
//# sourceMappingURL=reactivity.global.js.map
