const fs = require('fs')
const execa = require('execa')
const target = 'reactivity'

build(target)

async function build(target){
    await execa("rollup", ["-cw", "--environment", `TARGET:${target}`], {
        stdio: "inherit",
      }) 
}