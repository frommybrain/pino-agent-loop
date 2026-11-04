// How the mind turns the world's JSON into words for the model, and the
// model's words back into a decision. A cut-down copy of what Pino's real
// mind does: same shape, shorter, so it fits on a screen.
//
// No imports. This file runs in Node and in a browser as it is, which is how the
// sandbox pages use it.

// The "system" message: who he is, where he is, and what he can do.
// The moves come from the manifest the world sent when the mind connected, but
// ONLY the ones the observation says are on offer right now. Anything in the
// observation's `cannot` list (shut, resting) is simply left off, so the model
// can't pick it. Not "please don't pick these". Just not there.
export function systemPrompt(manifest, observation) {
  const onOffer = manifest.actions.filter((move) => observation.available_actions.includes(move.name))
  const moves = onOffer.map((move) => {
    // each setting a move takes, with the choices the world gave for it
    const settings = Object.entries(move.params || {})
      .filter(([, spec]) => spec.role !== 'words')   // what he says out loud is written after, not decided here
      .map(([name, spec]) => {
        const choices = spec.values ? `one of ${spec.values.join(' | ')}` : ''
        const hint = spec.hint ? `${choices ? '. ' : ''}${spec.hint}` : ''
        return `    ${name}: ${choices}${hint}`
      })
      .join('\n')
    return `- ${move.name}: ${move.description}${settings ? `\n${settings}` : ''}`
  }).join('\n')

  return `You are Pino, ${manifest.part}.

WHERE YOU ARE: ${manifest.description}
${manifest.glossary.map((line) => `- ${line}`).join('\n')}

${manifest.stance} What you do comes from how you feel, what's on your mind and what's in front of you. You can only do the things listed below.

HOW YOU WORK:
- Decide one to three moves at a time, in order. They happen one after another. If something happens halfway through you will get to think again.

WHAT YOU CAN DO:
${moves}

RESPOND WITH JSON ONLY:
{"consider": "one short line to yourself before you choose, fifteen words at most: what's pulling at you here", "do": [{"action": "<name>", "params": {...}}], "because": "your reason for what you chose, in a few plain words"}
"do" holds one to three moves from the list above, never none: if you're leaving things as they are, pick the move that does that.`
}

// The "user" message: what he can see right now, as lines. This is the observation
// the world sent, read out. The model never sees the raw JSON, and thats on purpose:
// an id like activity_studio in the middle of a thought ends up in his diary.
export function whatISee(observation) {
  const lines = []
  lines.push(`THE TIME: ${observation.clock}. ${observation.environment}`)
  lines.push(`THE ROOM: ${observation.room}`)
  if (observation.recent_events.length) {
    lines.push(`EARLIER:\n${observation.recent_events.map((e) => `- ${e}`).join('\n')}`)
  }
  if (observation.waiting) {
    lines.push(`WAITING ON YOUR ANSWER:\n${observation.waiting}`)
  }
  if (observation.self.action && observation.self.action !== 'idle') {
    lines.push(`RIGHT NOW: ${observation.self.action}.`)
  }
  lines.push(`YOUR BODY: ${observation.body}.`)
  lines.push("What do you do? It's your call. JSON only.")
  return lines.join('\n\n')
}

// The model's answer, read back as a decision: the first move in "do".
// Not JSON, or no moves in it: null, and the caller decides what to do about that.
// (the real mind asks again. the demos use a stand-in and say so)
export function readDecision(text) {
  try {
    const answer = JSON.parse(text)
    const first = answer.do?.[0]
    if (!first?.action) return null
    return { action: first.action, params: first.params || {}, because: answer.because || '', consider: answer.consider || '' }
  } catch {
    return null
  }
}
