import { isObject } from "@vue/shared"
import { reactiveHandler, readonlyHandler, shallowReactiveHandler, shallowReadonlyHandler } from "./baseHandlers"
export function reactive(target){
    return createReactiveObject(target, false, reactiveHandler)
}
export function shallowReactive(target){
    return createReactiveObject(target, false, shallowReactiveHandler)
}
export function readonly(target){
    return createReactiveObject(target, true, readonlyHandler)
}
export function shallowReadonly(target){
    return createReactiveObject(target, true, shallowReadonlyHandler)
}
const reactiveMap = new WeakMap()
const readonlyMap = new WeakMap()
export function createReactiveObject(target, isReadonly, baseHandlers){
    if(!isObject(target)) return target
    const proxyMap = isReadonly?readonlyMap:reactiveMap
    const existProxy = proxyMap.get(target)
    if(existProxy)return existProxy
    const proxy = new Proxy(target, baseHandlers)
    proxyMap.set(target, proxy)
    return proxy
}