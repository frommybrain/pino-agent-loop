# The loop, in four demos

The code from episode 1 of the Pino series ("how I made an AI bird that runs itself"). Pino is a kiwi bird who lives in a town at [pinos.world](https://pinos.world) and decides his own day. Each script here is one step of one of his thoughts, and each prints exactly what it sends to Groq and exactly what comes back.

About 300 lines all in. No framework, no library: Node and `fetch`.

## If you don't code

`agent-brief.md` is a brief to paste into whatever coding tool you use. Add a line at the end saying what your thing is, and it builds you a loop like this one.

## Set up (once)

1. Node 20 or newer (`node --version`). Nothing to install.
2. A Groq key in a file called `.env` in this folder, like `.env.example`:

```
GROQ_API_KEY=gsk_...
```

The scripts read that file themselves and never print the key. `.env` is in `.gitignore`, so it can't be committed by accident. With no `.env`, every script still runs: it prints what it *would* send, says it was a dry run, and (demos 3 and 4) uses a stand-in decision so the rest of the step still shows.

Any OpenAI-shaped API works: change `GROQ_URL` and `MODEL` in `groq.mjs`.

## Run them, one at a time, from this folder

```bash
node 01-bare-call.mjs
node 02-with-observation.mjs
node 03-act-and-answer.mjs
node 04-the-loop.mjs
```

## What each one shows

| Script | What it is | What to look at |
|---|---|---|
| `01-bare-call.mjs` | One prompt to the model. No loop, no memory, no world. | The request is one sentence. The reply is a story. Run it twice: a different story, no memory of the first. |
| `02-with-observation.mjs` | The same question, with the manifest (the moves the world has) and an observation (what's true right now). JSON mode on. | `IDENTIFIED` with the manifest, `OBSERVATION`, the system prompt with the moves list, the reply as JSON with `"do": [...]`. |
| `03-act-and-answer.mjs` | The decision goes to the world as `ACT`, the world answers `ACTION_RESULT`. Then the same move again, refused. | The ACT frame (a name and its settings), the answer: `success` and a `message` in words. The second answer: `success: false` and why. |
| `04-the-loop.mjs` | Three turns of observe, decide, act. Each act changes the next observation. | `earlier` growing, a used place moving from "on offer" to "not on offer", the note at the shrine changing once it's read, the body changing. |

## The other files

- `groq.mjs`: the one HTTP call. Reads the key, prints request and reply.
- `prompt.mjs`: turns the manifest and the observation into words for the model (only the moves on offer go in the list), and reads the JSON answer back as a decision. A cut-down copy of the real mind's prompt.
- `town.mjs`: a pretend town, about 120 lines. Hands out the manifest, answers OBSERVE and ACT with the same frame names and shapes as the real town, and lets an act change the next observation.
- `sample-manifest.json`: a cut-down manifest in the real shape (11 of the town's 50-odd moves, the five forces, the 24-to-1 clock).
- `sample-observation.json`: an observation in the real protocol-2 shape (`room`, `body`, `recent_events`, `cannot`, `clock`...). Made up: no visitor names, no tokens, no ids from the live site.
- `record-replies.mjs`: runs the real thing once and writes `recorded-replies.json`, which the episode's sandbox pages replay (they can't call Groq from inside a video render). The replies in it are real, recorded on 28 Oct 2026.
- `agent-brief.md`: the brief for your coding agent, see above.

## Where the real thing lives

Pino's real mind and town aren't public, so these are cut-down copies with the same shapes.

## If something goes wrong

- `Groq said 401`: the key in `.env` is wrong or missing.
- `Groq said 429`: rate limited, wait a minute.
- `Groq said 400 ... json_validate_failed`: the model ran out of room before it finished the JSON. Run it again; if it keeps happening, raise `max_tokens` in `groq.mjs`.
- "the answer was not a decision the mind could read": the model gave something that wasn't `{"do": [...]}`. The real mind asks again; the demos say so and (3 and 4) use a stand-in.

## Licence

MIT, see `LICENSE`. Copy it, keep the shapes, change the world.
