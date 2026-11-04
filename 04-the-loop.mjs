// Demo 4: the loop. Observe, decide, act, and round again, with the consequence
// of the last move showing up in the next observation.
//
// The whole idea in one file:
//   OBSERVE  -> the world says what's true
//   decide   -> the model picks a move from the list
//   ACT      -> the world does it (or refuses) and says what happened
//   OBSERVE  -> and the world is different now, because of what he did
//
// Three turns is enough to see it. The real mind runs this all day, every few
// seconds, with memory and feelings in between. This one has none of that, on
// purpose, so you can see the loop itself.
//
// Run it:   node 04-the-loop.mjs

import { readFileSync } from 'node:fs'
import { makeRequest, askGroq } from './groq.mjs'
import { systemPrompt, whatISee, readDecision } from './prompt.mjs'
import { makeTown } from './town.mjs'

const TURNS = 3

const read = (file) => JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8'))
const town = makeTown(read('./sample-manifest.json'), read('./sample-observation.json'))
const manifest = town.identified().manifest

// stand-ins for a dry run, one a turn, so the loop still shows without a key
const standIns = [
  { action: 'inspect', params: { target: 'the shrine' } },
  { action: 'forage', params: { target: 'the bakery' } },
  { action: 'play_piano', params: { target: 'activity_piano' } },
]

for (let turn = 1; turn <= TURNS; turn++) {
  console.log(`\n\n################  TURN ${turn}  ################`)

  // OBSERVE: ask the world what's true now
  const observation = town.observe().data
  console.log('\n===== OBSERVATION (what the world says is true) =====')
  console.log(`clock:        ${observation.clock}`)
  console.log(`doing:        ${observation.self.action}`)
  console.log(`body:         ${observation.body}`)
  console.log(`on offer:     ${observation.available_actions.join(', ')}`)
  console.log(`not on offer: ${observation.cannot.join(', ') || '(nothing)'}`)
  console.log('earlier:')
  for (const line of observation.recent_events) console.log(`  - ${line}`)

  // DECIDE: the model picks a move
  const messages = [
    { role: 'system', content: systemPrompt(manifest, observation) },
    { role: 'user', content: whatISee(observation) },
  ]
  const reply = await askGroq(makeRequest(messages, { json: true }))
  let decision = reply ? readDecision(reply) : null
  if (!decision) {
    decision = standIns[turn - 1]
    console.log('\n(using a stand-in decision, because there was no answer to read)')
  }

  // ACT: send it to the world, and hear back
  const act = { type: 'ACT', id: turn, action: decision.action, params: decision.params }
  console.log('\n===== ACT (what the mind sends) =====')
  console.log(JSON.stringify(act))
  const answer = town.act(act)
  console.log('\n===== ACTION_RESULT (what the world answers) =====')
  console.log(JSON.stringify(answer))
}

console.log(`

That's the loop. Look back at the three observations:
- "earlier" grew by one line each turn, and that line is what he chose
- the place he used dropped off "on offer" and showed up under "not on offer"
- his body changed depending on what he did
None of that came from the model. It came from the world, because the model acted in it.
`)
