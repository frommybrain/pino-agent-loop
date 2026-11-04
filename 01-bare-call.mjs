// Demo 1: one bare call to the model. No loop, no memory, no world.
//
// This is where everyone starts. Ask the model a question, get an answer, done.
// Nothing it says here changes anything, and next time we run it, it won't
// remember this time.
//
// Run it:   node 01-bare-call.mjs

import { makeRequest, askGroq } from './groq.mjs'

// The whole prompt. One message. This is everything the model knows.
const messages = [
  {
    role: 'user',
    content: 'You are Pino, a kiwi bird living alone in a small town. What do you do next?',
  },
]

const request = makeRequest(messages)
await askGroq(request)

console.log(`
Notice what's missing:
- it doesn't know what's in the town, so it makes a town up
- it can't DO anything, it can only describe doing it
- run it again: a different story, and no memory of this one
`)
