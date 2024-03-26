import * as core from '@actions/core'
import { existsSync, readFileSync } from 'fs'
import run from './run'

// The functions "existsSync, readFileSync" are used as arguments to stub them in unit-tests
// In the FS library these functions are non-configurable and non-writable
run(core, existsSync, readFileSync)
