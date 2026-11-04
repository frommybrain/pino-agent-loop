// The one bit of plumbing every demo shares: how we talk to Groq.
// Reads the key out of the .env next to this file, never prints it, and prints
// everything else in full: what went out, what came back. That's the whole point.

import { readFileSync } from 'node:fs'

// The model Pino thinks with most of the day. There's a bigger one (gpt-oss-120b)
// for the heavier thoughts, but this is the one that runs his afternoons.
export const MODEL = 'openai/gpt-oss-20b'

// Groq takes the same shape of request as OpenAI, so this is the whole address.
// Swap the URL and the key and any OpenAI-shaped API works here.
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

// GROQ_API_KEY from .env, or null. With null the demo runs "dry": prints what it
// would send and stops. Handy when you just want to read the request.
export function loadKey() {
  try {
    const text = readFileSync(new URL('./.env', import.meta.url), 'utf8')
    for (const line of text.split('\n')) {
      const [name, ...rest] = line.split('=')
      if (name.trim() === 'GROQ_API_KEY') return rest.join('=').trim()
    }
  } catch {
    // no .env yet. fine, dry run it is
  }
  return null
}

// The request body. `messages` is the conversation, `json: true` asks Groq to make
// sure the answer is a JSON object. The real mind does that for every decision,
// so it can read the answer with code instead of squinting at it.
export function makeRequest(messages, { json = false } = {}) {
  const body = {
    model: MODEL,
    messages,
    temperature: 0.9,
    // gpt-oss thinks before it answers and the thinking comes out of this number,
    // so it gets more room than the answer needs. we learnt that one the hard way:
    // at 350 it spent the lot thinking and came back with nothing.
    max_tokens: 1500,
    // and 'low' keeps the thinking short. its a decision, not an essay
    reasoning_effort: 'low',
  }
  if (json) body.response_format = { type: 'json_object' }
  return body
}

// Send it, print both halves, give back the text. Null on a dry run.
export async function askGroq(body) {
  const key = loadKey()

  console.log('\n===== WHAT WE SEND TO GROQ =====')
  console.log(JSON.stringify(body, null, 2))

  if (!key) {
    console.log('\n(no GROQ_API_KEY in .env, so this is a dry run: nothing was sent)')
    return null
  }

  const started = Date.now()
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new Error(`Groq said ${res.status}: ${await res.text()}`)
  }

  const data = await res.json()
  const text = data.choices[0].message.content

  console.log(`\n===== WHAT COMES BACK (${Date.now() - started} ms) =====`)
  console.log(text)
  return text
}
