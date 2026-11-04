// Records real replies from Groq for the episode's sandbox pages.
//
// The sandbox runs in a browser, in the studio's renderer, which captures a page a
// frame at a time and has to get the same picture every time. So it can't call
// Groq live. Instead this runs the real thing once, here, and writes everything
// down: each observation, the prompt built from it, the reply, the act, the
// world's answer. The pages replay that. The replies are real, just recorded.
//
// Run it:   node record-replies.mjs        (needs a key in .env)
// Writes:   recorded-replies.json

import { readFileSync, writeFileSync } from 'node:fs'
import { makeRequest, askGroq } from './groq.mjs'
import { systemPrompt, whatISee, readDecision } from './prompt.mjs'
import { makeTown } from './town.mjs'

const read = (file) => JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8'))
const manifest = read('./sample-manifest.json')
const start = read('./sample-observation.json')

// one turn: observe, build the prompt, ask, read, act, hear back
async function turn(town, id) {
  const observation = town.observe().data
  const messages = [
    { role: 'system', content: systemPrompt(manifest, observation) },
    { role: 'user', content: whatISee(observation) },
  ]
  const request = makeRequest(messages, { json: true })
  const reply = await askGroq(request)
  if (!reply) throw new Error('no key in .env: nothing to record')
  const decision = readDecision(reply)
  if (!decision) throw new Error(`could not read a decision out of: ${reply}`)
  const act = { type: 'ACT', id, action: decision.action, params: decision.params }
  const result = town.act(act)
  return { observation, request, reply, decision, act, result }
}

// the bare call too, for demo 1's page
const bare = makeRequest([{ role: 'user', content: 'You are Pino, a kiwi bird living alone in a small town. What do you do next?' }])
const bareReply = await askGroq(bare)

// one town for the decide/act pages: a turn, then the same move again so it's refused
const townA = makeTown(manifest, start)
const first = await turn(townA, 1)
const again = { type: 'ACT', id: 2, action: first.act.action, params: first.act.params }
const refused = townA.act(again)

// a fresh town for the loop page: three turns
const townB = makeTown(manifest, start)
const loop = []
for (let i = 1; i <= 3; i++) loop.push(await turn(townB, i))

const out = {
  recorded: new Date().toISOString().slice(0, 10),
  model: bare.model,
  bare: { request: bare, reply: bareReply },
  decide: first,
  act: { act: first.act, result: first.result, again, refused },
  loop,
}
writeFileSync(new URL('./recorded-replies.json', import.meta.url), JSON.stringify(out, null, 2))
console.log('\nwritten: recorded-replies.json')
