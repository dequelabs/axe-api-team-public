import * as core from '@actions/core'
// We don't have to use "createReadStream" because files "package.json" and "lerna.json" are less than 64 Kb
import { readFileSync } from 'fs'
import run from './run'

// The function "readFileSync" is used as an argument to stub it in unit-tests
// In the FS library this function is non-configurable and non-writable
run(core, readFileSync)
