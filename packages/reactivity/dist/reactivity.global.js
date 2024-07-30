var VueReactivity = (function (exports) {
  'use strict';

  const isObject = (value) => typeof value === 'object' && value != null;
  const extend = Object.assign;
  const isArray = Array.isArray;
  const isIntegerKey = (key) => parseInt(key) + '' === key;
  let hasOwnProperty = Object.prototype.hasOwnProperty;
  const hasOwn = (target, key) => hasOwnProperty.call(target, key);
  const hasChanged = (oldValue, value) => value !== oldValue;

  function effect(fn, options = {}) {
      const effect = createReactiveEffect(fn, options);
      if (!options.lazy) {
          //effect 默认会执行一次
          effect();
      }
      return effect;
  }
  let uid = 0;
  let activeEffect;
  const effectStack = [];
  function createReactiveEffect(fn, options = {}) {
      const effect = function reactiveEffect() {
          if (!effectStack.includes(effect)) {
              try {
                  activeEffect = effect;
                  effectStack.push(effect);
                  fn();
              }
              finally {
                  effectStack.pop();
                  activeEffect = effectStack[effectStack.length - 1];
              }
          }
      };
      effect.id = uid++;
      effect._isEffect = true;
      effect.raw = fn;
      effect.options = options;
      return effect;
  }
  const targetMap = new WeakMap();
  function track(target, type, key) {
      if (activeEffect === undefined)
          return;
      let depsMap = targetMap.get(target);
      if (!depsMap) {
          targetMap.set(target, (depsMap = new Map()));
      }
      let dep = depsMap.get(key);
      if (!dep) {
          depsMap.set(key, (dep = new Set()));
      }
      if (!dep.has(activeEffect)) {
          dep.add(activeEffect);
      }
  }
  //找属性对应的effect 让其执行（数组、对象）
  function trigger(target, type, key, newValue, oldValue) {
      const depsMap = targetMap.get(target);
      if (!depsMap)
          return;
      const effects = new Set();
      const add = (effectsToAdd) => {
          if (effectsToAdd) {
              effectsToAdd.forEach((effect) => effects.add(effect));
          }
      };
      if (key === "length" && isArray(target)) {
          depsMap.forEach((dep, key) => {
              if (key === "length" || key > newValue) {
                  add(dep);
              }
          });
      }
      else {
          //可能是对象
          if (key != undefined) {
              add(depsMap.get(key));
          }
          switch (type) {
              case 0 /* TriggerOrTypes.ADD */:
                  if (isArray(target) && isIntegerKey(key)) {
                      add(depsMap.get('length'));
                  }
          }
      }
      effects.forEach((effect) => {
          effect();
      });
  }

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
          if (!isReadonly) {
              //如果不是仅读的则需要收集当前以来，以便修改值时通知依赖更新
              console.log('执行effect时会取值', '收集effect');
              track(target, 0 /* TrackOpTypes.GET */, key);
          }
          if (isObject(res)) {
              //如果当前值还是对象 则需要继续递归代理
              return isReadonly ? readonly(res) : reactive(res);
          }
          return res;
      };
  }
  function createSetter(shallow = false) {
      return (target, key, value, receiver) => {
          const oldValue = target[key];
          let hasKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key);
          const result = Reflect.set(target, key, value, receiver);
          if (!hasKey) {
              //新增
              trigger(target, 0 /* TriggerOrTypes.ADD */, key, value);
          }
          else if (hasChanged(oldValue, value)) {
              //修改
              trigger(target, 1 /* TriggerOrTypes.SET */, key, value);
          }
          //当数据更新时 通知对应属性收集的effect重新执行
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

  const convert = (val) => (isObject(val) ? reactive(val) : val);
  function ref(value) {
      return createRef(value);
  }
  function shallowRef(value) {
      return createRef(value, true);
  }
  class RefImpl {
      rawValue;
      shallow;
      _value;
      __v_isRef = true;
      constructor(rawValue, shallow) {
          this.rawValue = rawValue;
          this.shallow = shallow;
          this._value = shallow ? rawValue : convert(rawValue);
      }
      get value() {
          track(this, 0 /* TrackOpTypes.GET */, "value");
          return this._value;
      }
      set value(newValue) {
          if (hasChanged(newValue, this._value)) {
              this.rawValue = newValue;
              this._value = this.shallow ? newValue : convert(newValue);
              trigger(this, 1 /* TriggerOrTypes.SET */, "value", newValue);
          }
      }
  }
  function createRef(rawValue, shallow = false) {
      return new RefImpl(rawValue, shallow);
  }

  exports.effect = effect;
  exports.reactive = reactive;
  exports.readonly = readonly;
  exports.ref = ref;
  exports.shallowReactive = shallowReactive;
  exports.shallowReadonly = shallowReadonly;
  exports.shallowRef = shallowRef;

  return exports;

})({});
//# sourceMappingURL=reactivity.global.js.map
