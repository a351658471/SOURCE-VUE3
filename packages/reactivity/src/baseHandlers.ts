import { isObject, extend } from "@vue/shared"
const readonlyObj = {
    set:(target, key)=> {
        console.log(`set on key ${key} falied`);
    }
}
function createGetter(isReadonly = false, shallow = false){

}
function createSetter(shallow = false){

}

const set = createSetter()
const shallowSet = createGetter(true)
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