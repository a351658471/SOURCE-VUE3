import { isObject, extend, isArray, isIntegerKey, hasOwn, hasChanged } from "@vue/shared"
import { reactive, readonly } from "./reactive";
import { track, trigger } from "./effect";
import { TrackOpTypes, TriggerOrTypes } from "./operators";
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
            console.log('执行effect时会取值','收集effect');
            track(target, TrackOpTypes.GET, key)
            
        }
        if(isObject(res)){
            //如果当前值还是对象 则需要继续递归代理
            return isReadonly?readonly(res):reactive(res)
        }
        return res
    }
}
function createSetter(shallow = false){
    return (target, key, value, receiver)=> {
        const oldValue = target[key]
        let hasKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key)
        const result = Reflect.set(target, key, value,  receiver)
        if(!hasKey){
            //新增
            trigger(target, TriggerOrTypes.ADD, key, value)
        }else if(hasChanged(oldValue, value)){
            //修改
            trigger(target, TriggerOrTypes.SET, key, value, oldValue)
        }
       
        //当数据更新时 通知对应属性收集的effect重新执行
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