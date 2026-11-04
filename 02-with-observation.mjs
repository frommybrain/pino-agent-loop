// Demo 2: the same question, but now the model is told what's actually there.
//
// Two things are new since demo 1:
//   - the manifest: the list of moves the world has (sent once, when the mind connects)
//   - the observation: what's true right now (sent every time the mind asks)
// and the answer has to come back as JSON with a move from the list in it,
// so code can read it instead of a person.
//
// Run it:   node 02-with-observation.mjs

import { readFileSync } from 'node:fs'
import { makeRequest, askGroq } from './groq.mjs'
import { systemPrompt, whatISee, readDecision } from './prompt.mjs'
import { makeTown } from './town.mjs'

const read = (file) => JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8'))
const town = makeTown(read('./sample-manifest.json'), read('./sample-observation.json'))

// 1. connecting: the world sends the manifest with IDENTIFIED
const identified = town.identified()
console.log('===== THE WORLD, WHEN THE MIND CONNECTS (IDENTIFIED) =====')
console.log(JSON.stringify(identified, null, 2))

// 2. asking what's there: the world answers OBSERVE with an observation
const observed = town.observe()
console.log('\n===== THE WORLD, RIGHT NOW (OBSERVATION) =====')
console.log(JSON.stringify(observed, null, 2))

// 3. the mind turns both into words and asks the model to decide
const messages = [
  { role: 'system', content: systemPrompt(identified.manifest, observed.data) },
  { role: 'user', content: whatISee(observed.data) },
]

const request = makeRequest(messages, { json: true })
const reply = await askGroq(request)

// 4. the mind reads the answer back as a decision
if (reply) {
  const decision = readDecision(reply)
  console.log('\n===== THE DECISION, AS THE MIND READS IT =====')
  console.log(decision ? JSON.stringify(decision, null, 2) : '(the answer was not a decision the mind could read)')
}

console.log(`
Notice what changed:
- the model only picked from the moves the world actually has
- it picked by what it could see: the time, what's near, what happened earlier, how hungry he is
- the answer is JSON, so the next step is code, not a person reading it
`)
