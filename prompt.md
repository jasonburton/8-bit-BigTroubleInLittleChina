# The prompt

This game was built by Claude Code from the following initial prompt:

> I want you to build an 8-bit NES style side scroller game similar to the old
> double dragon video game. This game should be based on the Big Trouble in
> Little China movie storyline with the characters and plot. It should be
> utterly perfect, visually matches the NES 8-bit style, with every single
> thing done at AAA quality—from textures to physics to anything you could
> think of.
>
> Fan out sub-agents and have sub-agents tackle each one individually so that
> the game is utterly perfect. You should /loop on each item and have a
> separate sub-agent check it visually to ensure it looks triple A. That
> separate sub-agent should be a really harsh critic, and if it doesn't look
> triple A, it should keep going.
>
> Don't stop until each sub-agent is utterly wowed with the quality when
> compared with the actual Double Dragon game. It should literally compare
> them side by side blind and say which one looks better. Do this in ThreeJS.
> /loop until it's utterly perfect. Fan out sub-agents and High.

## How it went

Specialist sub-agents built the hero sprites, enemy/boss sprites, level art,
chiptune audio, and story in parallel against a shared spec, then a harsh-critic
agent toured every scene in a browser and scored it blind against NES Double
Dragon II, followed by fix-agent rounds on its findings. Four critique passes
moved the average scene score from 3.2 → 6.9 → 7.9 → 8+, at which point the
critic's blind verdict flipped to this game — after one game-breaking
enemy-death soft-lock was fixed and proven by a scripted headless playthrough
that beat all four stages and every boss.
