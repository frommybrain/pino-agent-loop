# Notes for your coding agent: build me an agent loop like Pino's

Paste this into whatever coding tool you use, and add
one line at the end saying what your thing is.

## What to build

A small program, in plain Node (no framework), that runs a loop:

1. A WORLD that describes itself. It sends a manifest once: every
   move the thing can make, by name, with the settings each one
   takes and the choices for each. Then, every time it is asked, an
   observation: what is true right now, in words (the room, what
   happened earlier, how the body feels), plus two lists for code:
   `available_actions` (on offer now) and `cannot` (not on offer
   now).
2. A MODEL CALL that returns a decision, not a story. Turn the
   manifest and the observation into words. List only the moves that
   are on offer. Ask for JSON only: `{"consider": "...", "do":
   [{"action": "<name>", "params": {...}}], "because": "..."}`. Use
   JSON mode.
3. An ACT the world answers. Send the first move as `{type: "ACT",
   id, action, params}`. The world does it, or refuses with a
   reason, and answers `{type: "ACTION_RESULT", id, success,
   message}`.
4. The ANSWER FED BACK. The world changes because of the act: the
   move goes into "what happened earlier", the thing he used rests
   for a while, the body changes. The next observation carries all
   of that.

Run three turns and print every request, every reply, every frame.

## The rules we learnt the hard way

- Only list what is on offer. Never "please don't pick the studio,
  it's shut". If it isn't on the list, the model can't pick it.
- Tell the mind what happened, in words, every time: a yes, or a no
  and why. A refusal goes into "what happened earlier" too, or it
  will try the same move again.
- Never put ids in front of the model. Names in words. An id in the
  prompt ends up in the diary.
- When it goes round in circles, read the observation before
  touching the prompt. Nearly always the world is telling it
  something untrue, or not telling it something true.
- A cheap, fast model is fine (we use openai/gpt-oss-20b on Groq).
  Give it room to think: 1500 max_tokens, reasoning effort low.
- One `fetch`, no SDK. Any OpenAI-shaped API works: swap the URL and
  the key.

## Start from the working example

The four demos from the video are here:
https://github.com/frommybrain/pino-agent-loop
(01-bare-call.mjs, 02-with-observation.mjs, 03-act-and-answer.mjs,
04-the-loop.mjs, with groq.mjs, prompt.mjs, town.mjs and the two
sample json files). Copy them, keep the shapes, change the world.

## My thing is:

(say what it is here: a plant on a windowsill, a shop, a fish in a
tank, a robot in a kitchen. What can it do, where is it, what does
it want.)

