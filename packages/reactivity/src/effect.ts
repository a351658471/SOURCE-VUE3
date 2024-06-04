import { isArray, isIntegerKey } from "@vue/shared";
import { TriggerOrTypes } from "./operators";

export function effect(fn, options: any = {}) {
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
function createReactiveEffect(fn, options: any = {}) {
  const effect = function reactiveEffect() {
    if (!effectStack.includes(effect)) {
      try {
        activeEffect = effect;
        effectStack.push(effect);
        fn();
      } finally {
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
export function track(target, type, key) {
  if (activeEffect === undefined) return;
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
export function trigger(target, type, key?, newValue?, oldValue?) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
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
  } else {
    //可能是对象
    if(key !=undefined){
      add(depsMap.get(key))
    }
    switch(type){
      case TriggerOrTypes.ADD:
        if(isArray(target) && isIntegerKey(key)){
          add(depsMap.get('length'))
        }
    }
  }
  effects.forEach((effect: any) => {
    effect();
  });
}
