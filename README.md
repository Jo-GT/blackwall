# BLACKWALL // NET RUNNER

A terminal netrunning game set in the Cyberpunk universe, mixing Cyberpunk RED (NET architecture floors, Black ICE, the DataKrash and the Old Net) with Cyberpunk 2077 (Breach Protocol, quickhack-style programs, Night City). It's an unofficial fan project.

You're an **unregistered freelance runner** on a salvaged deck. You don't work for NetWatch. NetWatch is the one hunting you.

## Play

Open `index.html` in a browser. There's no build step and no server. The game saves to `localStorage`.

## Loop

1. `jobs` to see contracts from your fixer, Kestrel. Use `accept <id>`, then `scan`, then `connect <host>`.
2. Each host is a stack of floors that can hold files, control nodes, password gates and ICE.
   - `look`, `cat`, `file`, `steg <image>` (admins hide passwords in images)
   - `crack <password>`, or `breach` to play the Breach Protocol minigame
   - `run <program>` against ICE (`zap`, `sword`, `armor`, `slide`, plus more from the `shop`)
   - `pull` / `rm` / `control <node> off` to finish the objective, then `jackout` to get paid
3. Watch **TRACE**. At 100%, NetWatch locks you, fries your brain a bit and seizes some of your eddies.
4. `shop` / `buy` for deck upgrades and programs. `rest` heals you and refreshes the street gigs.

## The Blackwall

Glitches, whispers, and inputs that type themselves get more frequent as your **SIGNAL** exposure climbs. The final contract, *GHOST SIGNAL*, goes down to the wall itself, where three endings are waiting.

Hidden extras: `ls -a` in your home directory, a fifth radio station, a sixth theme, and data shards scattered through the subnets.

## Files

| file | purpose |
|---|---|
| `js/data.js` | lore, jobs, ICE, programs, shop, glossary, whispers |
| `js/game.js` | state/save, terminal, local filesystem and commands, jobs |
| `js/net.js` | architecture generation, net commands, ICE combat, Blackwall ending |
| `js/breach.js` | Breach Protocol minigame |
| `js/fx.js` | background eye canvas and Blackwall glitch events |
| `js/audio.js` | sound effects and procedural pirate radio (WebAudio) |
| `js/ui.js` | side panels, meters, themes |
