const fs = require('fs')
const execa = require('execa')
const dirs = fs.readdirSync('packages').filter(f => {
    if(!fs.statSync(`packages/${f}`).isDirectory()){
        return false
    }
    return true
})
async function build(target){
    await execa("rollup", ["-c", "--environment", `TARGET:${target}`], {
        stdio: "inherit",
      }) 
}
function runParalle(dirs, itemfn){
    let result = []
    for(let item of dirs){
       result.push(itemfn(item)) 
    }
    return Promise.all(result)
}
runParalle(dirs, build).then(()=>{
    console.log('成功');
})