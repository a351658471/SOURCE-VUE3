import { isObject, extend } from "@vue/shared"
import { reactive, readonly } from "./reactive";
const readonlyObj = {
    set:(target, key)=> {
        console.log(`set on key ${key} falied`);
    }
}
function createGetter(isReadonly = false, shallow = false){
    return (target,key,receiver)=> {
        const res = Reflect.get(target, key, receiver)
        if(shallow){
            //如果是浅的 直接返回当前值
            return res
        }
        if(!isReadonly){
            //如果不是仅读的则需要收集当前以来，以便修改值时通知依赖更新
        }
        if(isObject(res)){
            //如果当前值还是对象 则需要继续递归代理
            return !isReadonly?readonly(res):reactive(res)
        }
        return res
    }
}
function createSetter(shallow = false){
    return (target, key, value, receiver)=> {
        const result = Reflect.set(target, key,value,  receiver)

        return result
    }
}

const set = createSetter()
const shallowSet = createSetter(true)
const get = createGetter()
const shallowGet = createGetter(false, true)
const readonlyGet = createGetter(true)
const shallowReadonlyGet = createGetter(true, true)


const reactiveHandler = {
    get,
    set
}
const shallowReactiveHandler = {
    get:shallowGet,
    set:shallowSet,
}
const readonlyHandler = extend({
    get:readonlyGet
},readonlyObj)

const shallowReadonlyHandler = extend({
    get:shallowReadonlyGet
},readonlyObj)

export {
    reactiveHandler,
    shallowReactiveHandler,
    readonlyHandler,
    shallowReadonlyHandler
}