import * as core from '@actions/core'
import * as github from '@actions/github'
import run from './run'

run(core, github.context.payload)
