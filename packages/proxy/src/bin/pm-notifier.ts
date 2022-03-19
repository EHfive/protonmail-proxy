#!/usr/bin/env node
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { yargsCoerceSingle as coerceSingle } from '../utils'
import { notifierLoop } from '../notifier'

const args = yargs(hideBin(process.argv))
  .usage('$0 Start protonmail notifier')
  .option('username', {
    alias: 'u',
    type: 'string',
    requiresArg: true,
    coerce: coerceSingle,
  })
  .option('password', {
    type: 'string',
    requiresArg: true,
    implies: 'username',
    coerce: coerceSingle,
  })
  .option('profile', {
    alias: 'p',
    type: 'string',
    requiresArg: true,
    conflicts: ['username', 'password'],
    array: true,
  })
  .parseSync()

console.log(args)

async function run() {
  // TODO create profile and auth by username/password
  await notifierLoop({
    // TODO use profile instead
    username: args.username || '',
    password: args.password || '',
  })
}

run().catch((e) => {
  throw e
})
