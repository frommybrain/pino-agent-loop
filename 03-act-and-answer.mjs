// Demo 3: the decision goes to the world as an ACT, and the world answers.
//
// Demo 2 ended with a decision sitting in a variable. That's still nothing: a
// decision nobody acts on is a story with extra steps. This time the mind sends
// it down the socket as an ACT frame, and the world sends back an ACTION_RESULT
// saying whether it happened and what it was.
//
// Run it:   node 03-act-and-answer.mjs

import { readFileSync } from 'node:fs'
import { makeRequest, askGroq } from './groq.mjs'
import { systemPrompt, whatISee, readDecision } from './prompt.mjs'
import { makeTown } from './town.mjs'

const read = (file) => JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8'))
const town = makeTown(read('./sample-manifest.json'), read('./sample-observation.json'))
const manifest = town.identified().manifest
const observation = town.observe().data

// same as demo 2: observe, then ask the model to decide (printed in full)
const messages = [
  { role: 'system', content: systemPrompt(manifest, observation) },
  { role: 'user', content: whatISee(observation) },
]
const reply = await askGroq(makeRequest(messages, { json: true }))

// no key, or an answer we couldn't read: a stand-in, so the rest still runs
let decision = reply ? readDecision(reply) : null
if (!decision) {
  decision = { action: 'move_to', params: { target: 'wander' }, because: '(stand-in decision for a dry run)' }
  console.log('\n(using a stand-in decision, because there was no answer to read)')
}

// the act: this is the frame the mind sends to the world. tiny, isn't it
const act = { type: 'ACT', id: 1, action: decision.action, params: decision.params }
console.log('\n===== THE MIND SENDS (ACT) =====')
console.log(JSON.stringify(act, null, 2))

// the answer: the world either did it, or says why not
const answer = town.act(act)
console.log('\n===== THE WORLD ANSWERS (ACTION_RESULT) =====')
console.log(JSON.stringify(answer, null, 2))

// and now a refusal, on purpose: a sitting at the piano, then straight back for
// another. the piano is resting after the first, so the second is a no, with a reason
// (the synth instead, if the model already picked the piano just now)
const piano = decision.action === 'play_piano'
  ? { type: 'ACT', id: 2, action: 'jam', params: { target: 'activity_rack' } }
  : { type: 'ACT', id: 2, action: 'play_piano', params: { target: 'activity_piano' } }
console.log('\n===== A SITTING AT THE PIANO (ACT) =====')
console.log(JSON.stringify(piano))
console.log(JSON.stringify(town.act(piano)))
const again = { ...piano, id: 3 }
console.log('\n===== AND STRAIGHT BACK FOR ANOTHER (ACT) =====')
console.log(JSON.stringify(again))
console.log('\n===== THE WORLD ANSWERS (ACTION_RESULT) =====')
console.log(JSON.stringify(town.act(again), null, 2))

console.log(`
Notice:
- the mind doesn't do anything itself, it asks the world to, by name
- the world can say no, and the mind is told why
- the message is what the mind is told happened, in words
`)
