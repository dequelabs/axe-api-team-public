import * as core from '@actions/core'
import * as github from '@actions/github'
import run from './run'

run(core, github, ms => new Promise(resolve => setTimeout(resolve, ms)))
