# Proposed story/character changes from the 1986 shooting script

Source: W.D. Richter revised shooting script (Sept 17, 1985, w/ revision #3),
pages covering scenes 1-23 only — the opening act: Jack on the highway, the
wholesale market gambling session, the drive to the airport, and the Lords of
Death kidnapping. Everything below is scoped to what those pages establish;
later acts are unverified against the script and left as-is.

Rules for any dialogue work: paraphrase in the characters' voices, never lift
screenplay lines verbatim (same policy as the current story.js). Bitmap-font
constraints still apply: uppercase A-Z 0-9 .,!?'- max 30 chars/line, 3 lines.

**Status: IMPLEMENTED (all items) — see the commit that includes this file.**

---

## 1. Intro cutscene rewrite (js/data/story.js — `intro`)  [HIGH]

What the script establishes vs. what we have:

| Beat | Script (sc. 1-23) | Current game intro |
|---|---|---|
| Opening | Jack alone in the Peterbilt at night, monologuing homespun bravado into his CB radio | No CB framing; opens mid-banter |
| The bet | All-night gambling at the wholesale market ends in a double-or-nothing bet: Wang claims his knife can split a bottle in half; it doesn't — Jack snags the flying bottle out of the air. Wang owes him $2,296 and can't pay | "Jack never loses a bet, pay up" — right idea, no bottle bet, no debt amount |
| Why the airport | Jack drives Wang there to make sure he gets paid — Wang is picking up Miao Yin, his childhood sweetheart from Peking, green eyes, whom he's about to marry | "Drive me to the airport?" — friendly favor framing |
| Gracie | At the airport ALREADY — she's there to collect another arriving girl (Tara) and warns that the Lords of Death are Chinatown street punks | Gracie first appears in the street pre-level as legal aid |
| The kidnap | The Lords of Death came for Tara; Gracie spirits Tara away, and in the brawl they knock out and take Miao Yin instead. Jack fights them barehanded in the terminal | "They grabbed Miao Yin" — correct outcome, missing the Tara mix-up |
| The truck | NOT stolen at the airport in the script | Our intro has the truck stolen at the airport |

Proposed new intro (6-7 entries, original lines in-voice):
1. JACK (CB monologue framing): third-person trucker philosophizing to the
   radio, storm outside — establishes the voice before anyone else speaks.
2. JACK to WANG: the bottle bet aftermath — Wang's trick failed, Jack caught
   the bottle, Wang owes him 2,296 dollars. (Number is a fun period detail.)
3. WANG: can't pay yet — first the airport; Miao Yin lands today, green eyes,
   he's going to marry her. Jack's coming along to protect his money.
4. GRACIE (at the terminal): sharp, unimpressed by Jack; warns that the
   Lords of Death — Chinatown street gang — are working the terminal.
5. Action beat: the Lords of Death go for the girl Gracie came for; Gracie
   gets her out; in the chaos they knock Miao Yin cold and carry her off.
6. WANG + JACK resolve: get her back. Jack: nobody stiffs him AND starts a
   brawl in the same morning. (Debt motive + loyalty motive, per script.)

Drop from intro: the truck theft (see item 2).

## 2. Move the truck theft to the street post-boss scene (story.js — `postBoss.street`)  [HIGH]

In the film the Pork Chop Express is stolen in Chinatown during the alley
ambush chaos, not at the airport. Our `postBoss.street` scene already covers
the alley war and the Three Storms' arrival — add one beat there: Jack turns
around and the truck is gone (Lo Pan's people took it). This also fixes a
visual inconsistency: the street stage main layer shows the truck parked in
Chinatown AFTER our intro claimed it was stolen at the airport.

## 3. Name the Lords of Death — Needles as a stage-1 named miniboss  [MEDIUM]

The script names three gang members: Needles (the leader who carries Miao Yin
off), Joe Lucky, and One Ear. Currently `blade` is a generic "Lords of Death
punk."

- js/main.js: add a `needles` entry to ENEMY_STATS (blade def recolored via
  the existing recolorFrames pipeline, more hp, `title: 'NEEDLES OF THE
  LORDS OF DEATH'` so the existing boss-banner system fires) and put him in
  street wave 3 or 4.
- Optional flavor: Jack or Wang name-drops Joe Lucky / One Ear in the street
  pre-level dialog instead of generic thug talk.
- No new sprite art required (recolor + banner only).

## 4. Gracie voice pass (story.js — all GRACIE lines)  [MEDIUM]

Script Gracie is fast, combative, streetwise — she leads with insults and
warnings, not legal-aid exposition. Current lines are close but a bit polite.
Rewrite her 3 appearances with more bite; keep the green-eyes exposition beat
in `postBoss.sewers` (it's accurate — the script leans hard on how rare green
eyes are, which is exactly why Lo Pan wants Miao Yin).

## 5. Wang backstory beat (story.js — `preLevel.street` or select screen)  [LOW]

Script Wang: came to America alone, worked himself raw, owns the Dragon of
the Black Pool restaurant, waited five years for Miao Yin; his nerves are why
the bottle trick failed. One line of this in the street pre-level would earn
the character. Also: the select-screen bio line "MASTER OF KUNG FU" could
become "DRAGON OF THE BLACK POOL" (his restaurant) — more specific, still
fits the bitmap font width.

## 6. Level-art tie-ins (js/data/levels.js)  [LOW — art, optional]

- The street stage's existing DRAGON marquee could read as Wang's
  "Dragon of the Black Pool" restaurant frontage (shorten to DRAGON or
  BLACK POOL glyphs — must stay pixel-cheap).
- The script opens on the wholesale produce market at dawn in the rain
  (crates, pushcarts, poultry) — our street stage already has a market
  awning module; no change needed, noted as confirmed-accurate.

## 7. Things the script CONFIRMS we got right (no change)

- Jack's cocky third-person bravado and Wang's earnest intensity.
- "Pork Chop Express" truck identity, storm/rain framing, SF 1986 setting.
- Miao Yin: from China, green eyes, Wang's bride-to-be — and our existing
  "green as jade" beat matches the script's own imagery.
- Lords of Death as the airport kidnappers and stage-1 gang.
- Gracie existing as a major character; Egg Shen/Lo Pan/Three Storms beats
  are outside this excerpt's scope (pages end at scene 23) — left untouched.

## Suggested implementation order

1. Item 1 + 2 together (one story.js edit, they interlock).
2. Item 3 (main.js miniboss, ~15 lines).
3. Items 4-5 (story.js polish pass).
4. Item 6 only if another art round happens anyway.

Validation: rerun the story charset/line-length checker from the scratchpad
after any story.js edit; play the intro + stage 1 + street post-boss in the
browser with `?quick` off.
