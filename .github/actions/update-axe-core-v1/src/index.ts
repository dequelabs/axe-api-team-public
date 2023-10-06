import * as core from '@actions/core'
import run from './run'
import getPackageManager from './getPackageManager'

run(core, getPackageManager)
