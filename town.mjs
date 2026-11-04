// A pretend town, small enough to read in one sitting.
//
// The real town is a 3D world with places, hours, weather, visitors
// and a shrine. The demos don't need any of that. They need a world that does the
// three things the real one does over the socket:
//
//   1. hand the mind a manifest when it connects (what moves exist)
//   2. answer OBSERVE with an observation (what's true right now)
//   3. answer ACT with a result, and let the act change what's true next time
//
// The frames have the same names and shapes as the real ones, so what's on
// screen is what really goes down the wire. Just a much smaller town behind it.
//
// No imports: it runs in Node and in a browser. You hand it the manifest and the
// starting observation (the two sample json files).

export function makeTown(manifestIn, observationIn) {
  // our own copies, so a page can make two towns from the same files
  const manifest = structuredClone(manifestIn)
  const observation = structuredClone(observationIn)
  let turn = 0

  // moves that are resting: a place he just used isn't offered again straight
  // away, same as the real town's cooldowns. name -> the turn it comes back
  const resting = new Map()

  return {
    // what the real town sends after IDENTIFY { protocol: 2 }
    identified() {
      return { type: 'IDENTIFIED', agentId: 'pino', status: 'ready', manifest }
    },

    // what the real town sends after OBSERVE
    observe() {
      const cannot = [...resting.keys()]
      observation.available_actions = manifest.actions
        .map((a) => a.name)
        .filter((name) => !cannot.includes(name))
      observation.cannot = cannot
      // a copy, so what we hand out now doesn't change under the mind's feet
      const frame = { type: 'OBSERVATION', data: structuredClone(observation) }
      // what he was doing is said once, then he's idle again by the next thought
      observation.self.action = 'idle'
      return frame
    },

    // what the real town sends after ACT, and what the act changes
    act(frame) {
      turn += 1
      const move = manifest.actions.find((a) => a.name === frame.action)
      const target = frame.params?.target || ''

      // not a move the world has: refused, with a reason
      if (!move) {
        return result(frame, false, `Unknown action: ${frame.action}`)
      }
      // a move that's resting: refused, AND it goes in his recent events. otherwise
      // he'd try the exact same thing next thought. we learnt this one from the real town
      if (resting.has(frame.action)) {
        observation.recent_events.push(`Pino tried ${move.label} again, but it was resting`)
        return result(frame, false, 'That place is resting. Come back to it later.')
      }

      // the town's answer, in the words the real one uses (bridge/BridgeAction.js)
      let message
      if (frame.action === 'wait') message = 'Waiting and observing'
      else if (frame.action === 'speak') message = `Said: "${frame.params?.text || ''}"`
      else if (frame.action === 'move_to') message = target === 'wander' ? 'Wandering toward a new spot' : `Moving toward ${target}`
      else if (frame.action === 'forage') message = `Moving to forage at ${target}`
      else if (frame.action === 'rest') message = `Moving to rest at ${target}`
      else if (frame.action === 'inspect') message = `Moving to inspect ${target}`
      else message = `Heading to ${placeOf(move)}, then ${move.label}`

      // and now the world changes. this is the bit a bare model call never has.
      // the move goes in his recent events, he's busy with it, and the place rests
      observation.recent_events.push(`Pino: ${move.label}${target && target !== 'wander' ? ` (${target})` : ''}`)
      // reading the note at the shrine is what the unread note was waiting for, so that line changes
      if (frame.action === 'inspect' && /shrine/.test(target)) {
        observation.recent_events = observation.recent_events.map((line) =>
          /has not read it yet/.test(line) ? 'Pino read the note at the shrine: somebody asked him to draw them a frog' : line)
        observation.pending_sacrifices = 0
      }
      observation.recent_events = observation.recent_events.slice(-6)
      observation.self.action = move.label
      if (move.name !== 'wait' && move.name !== 'speak' && move.name !== 'move_to') {
        resting.set(move.name, turn + 2)
      }
      for (const [name, until] of resting) if (until <= turn) resting.delete(name)

      // the clock moves on a quarter hour, and hunger builds unless he ate
      observation.world_clock.hour += 0.25
      observation.clock = clockWords(observation.world_clock)
      if (move.name === 'forage') {
        observation.self.needs.hunger = { level: 0.05, urgency: 'satisfied' }
        observation.body = 'nothing pressing'
      } else {
        observation.self.needs.hunger.level = Math.min(1, observation.self.needs.hunger.level + 0.08)
        observation.body = observation.self.needs.hunger.level > 0.5 ? 'hunger pressing' : 'hunger mild'
      }

      return result(frame, true, message)
    },
  }
}

// the ACTION_RESULT frame, same fields as the real one
function result(frame, success, message) {
  return { type: 'ACTION_RESULT', id: frame.id, success, action: frame.action, message }
}

// "playing the piano" -> "the piano", for the heading-there message
function placeOf(move) {
  return move.practice || move.label.replace(/^[a-z]+ing (at |in |on |down at )?/, '')
}

function clockWords(wc) {
  const h = Math.floor(wc.hour) % 24
  const m = Math.floor((wc.hour % 1) * 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}, day ${wc.day + 1}`
}
