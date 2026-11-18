(function (BW) {
  const D = BW.data = {};

  /* ---------------- README (left panel) ---------------- */
  D.readmeHTML = `
<p>Choom. Kestrel here. Word from the Mox says you've got hands steady enough for a deck and a head dumb enough to plug it in. Good. Night City always needs one more runner.</p>
<p>This rig is a salvaged deck I flashed clean myself. No corp ID. No NetWatch registry. That makes you a ghost on the Net &mdash; and ghosts don't get protection. If NetWatch traces you, they won't send a letter. They'll burn your deck, and maybe the brain plugged into it.</p>
<p>Rules of the road:<br>
1. Type <b>"cmds"</b> for the command list. Put <b>--help</b> after any command and it'll tell you what it does.<br>
2. <b>"jobs"</b> shows contracts I've lined up. <b>accept</b> one, <b>scan</b>, then <b>connect</b>.<br>
3. Watch your <b>TRACE</b>. At 100% NetWatch has your address.<br>
4. If you ever feel something on the other side of the screen looking back... jack out. Don't ask questions. The Blackwall is there for a reason.</p>
<p>Deck saves itself to local memory. <b>reboot --wipe</b> if you ever want to start over as somebody else.</p>
<p class="sig">- K.</p>`;

  D.readmeText = `Choom. Kestrel here.

This rig is a salvaged deck I flashed clean myself. No corp ID. No NetWatch
registry. That makes you a ghost on the Net - and ghosts don't get protection.

  cmds            list commands
  <cmd> --help    explain a command
  jobs            contracts I've lined up
  accept <id>     take one
  scan            find the host
  connect <host>  jack in

Watch your TRACE. At 100% NetWatch has your address.
If something on the other side of the screen looks back: jack out.

- K.`;

  /* ---------------- Glossary ---------------- */
  D.glossary = {
    'NETRUNNER': 'A hacker who jacks their brain directly into the Net through a cyberdeck and neural interface. Fast, smart, and usually one bad trace away from a flatline.',
    'NETWATCH': 'The "Net police". Founded to keep the Net safe, now mostly keeps it safe for whoever pays. They built and guard the Blackwall, and they really, really hate unregistered decks like yours.',
    'BLACKWALL': 'A firewall the size of a continent, built by NetWatch after the DataKrash to seal off the Old Net and the rogue AIs that live there. Nobody knows exactly what is on the other side. Everyone who has gone to look has come back wrong, or not at all.',
    'ICE': 'Intrusion Countermeasures Electronics. Software guards. Regular ICE fries your deck. BLACK ICE skips the deck and goes straight for your nervous system.',
    'BREACH PROTOCOL': 'The art of cracking a node by feeding it the right sequence of hex codes before its defenses notice. Pick from the top row, then alternate column, row, column... Fill the buffer with the right sequences and the gate opens.',
    'ARCHITECTURE': 'A corp subnet is built in floors, stacked downward. Each floor can hold files, control nodes, password gates and ICE. The good stuff is always at the bottom.',
    'FIXER': 'A middleman. Finds the job, finds the runner, takes a cut. Kestrel is yours. Trust them about as far as you could throw an Arasaka AV.',
    'EDDIES': 'Eurodollars, €$. The only language Night City speaks fluently.',
    'DATAKRASH': 'In 2022 the legendary runner Rache Bartmoss died, and his R.A.B.I.D.S. virus tore the old Net apart. Data corrupted, rogue AIs everywhere, the global Net shattered. The Time of the Red rose from the ashes; the Blackwall was built over the grave.',
    'OLD NET': 'Everything that was lost in the DataKrash. Now sealed behind the Blackwall. Some say it is dead. Some say it is just... waiting.',
    'RACHE BARTMOSS': 'The greatest netrunner who ever lived, or the most dangerous lunatic. Depends who you ask. Died in 2022 when an Arasaka strike took out his apartment. His worms are still out there.',
    'TRAUMA TEAM': 'Armed medical response. Platinum subscribers get pulled out of a firefight in under 7 minutes. Non-subscribers get stepped over.',
    'CYBERDECK': 'The hardware between your brain and the Net. Better decks mean more RAM for programs, faster breaches and quieter footsteps.',
    'ROGUE AI': 'Artificial intelligences that slipped their leashes during the DataKrash. Most live beyond the Blackwall. Some of them used to be people.'
  };

  /* ---------------- Command docs ---------------- */
  D.cmdDocs = {
    cmds: 'list all commands available right now',
    help: 'same as cmds. you knew that.',
    ls: 'list the contents of a directory. ls -a shows hidden files. in the Net: lists what is on the current floor',
    cd: 'change directory. cd .. goes up, cd ~ goes home. in the Net: cd .. ascends, cd down descends',
    cat: 'print the contents of a file',
    file: 'print the metadata of a file',
    steg: 'steganography tool to extract data hidden within a file (images love to hide things)',
    clear: 'clear the terminal',
    whoami: 'who are you, again?',
    stats: 'show your deck, body and runner stats',
    jobs: 'list contracts from Kestrel and random gigs',
    accept: 'accept a contract: accept <id>',
    abandon: 'drop your current contract. Kestrel will remember.',
    scan: 'scan the local subnet for reachable hosts. in the Net: deep-scan the current floor',
    connect: 'jack into a remote host: connect <host> (alias: ssh, jackin)',
    shop: 'browse the black-market deck shop',
    buy: 'buy something from the shop: buy <item>',
    rest: 'sleep it off. restores neural integrity and refreshes the gig board',
    irc: 'show the #lowtide IRC log',
    theme: 'change your terminal theme: theme <name>',
    radio: 'tune into a pirate station: radio <1-5> or radio off',
    sound: 'toggle deck sound effects: sound on|off',
    history: 'list the commands you typed',
    echo: 'repeat after me',
    date: 'print current date & time in Night City',
    glossary: 'look up a term: glossary <term>',
    reboot: 'restart the deck. reboot --wipe deletes everything and starts a new runner',
    look: '[NET] describe the current floor',
    pull: '[NET] download a file to ~/downloads (alias: download, scp)',
    rm: '[NET] delete a file from the current floor',
    control: '[NET] toggle a control node: control <node> [on|off]',
    breach: '[NET] run Breach Protocol against the password gate on this floor',
    crack: '[NET] submit a password to the gate on this floor: crack <password>',
    down: '[NET] descend to the next floor (alias: descend)',
    up: '[NET] ascend to the previous floor (alias: ascend)',
    run: '[NET] run a program, mostly against ICE: run <program>',
    jackout: '[NET] disconnect from the Net. risky with ICE on you (alias: exit)',
    map: 'show the architecture map of the subnet you are in',
    cross: '[???] ...',
    listen: '[???] ...',
    report: '[???] ...'
  };

  /* ---------------- Programs ---------------- */
  D.programs = {
    zap:       { name: 'zap', ram: 1, type: 'atk', dmg: [1, 6, 1], desc: 'cheap anti-ICE jolt. 1d6+1 damage' },
    sword:     { name: 'sword', ram: 2, type: 'atk', dmg: [3, 6, 0], blackOnly: true, desc: 'anti-Black-ICE blade. 3d6 vs Black ICE, 1d6 otherwise' },
    hellbolt:  { name: 'hellbolt', ram: 3, type: 'atk', dmg: [2, 6, 0], burn: true, desc: '2d6 damage and sets the ICE on fire (1d6 for 2 turns)' },
    deckkrash: { name: 'deckkrash', ram: 4, type: 'atk', dmg: [4, 6, 0], desc: 'brute-force crash. 4d6 damage' },
    killer:    { name: 'killer', ram: 5, type: 'atk', dmg: [5, 6, 2], desc: 'top-shelf ICE killer. 5d6+2 damage' },
    armor:     { name: 'armor', ram: 2, type: 'def', desc: 'reduce incoming damage by 4 for 3 turns' },
    flak:      { name: 'flak', ram: 2, type: 'def', desc: 'ICE has a 50% chance to miss for 2 turns' },
    slide:     { name: 'slide', ram: 1, type: 'esc', desc: 'try to slip past the ICE (60% + stealth). the ICE stays, but loses you' },
    ghost:     { name: 'ghost', ram: 3, type: 'util', desc: 'spoof your trace route. -15 TRACE' }
  };
  D.startPrograms = ['zap', 'sword', 'armor', 'slide'];

  /* ---------------- ICE ---------------- */
  D.ice = {
    wisp:      { name: 'WISP', hp: 10, atk: [1, 4], black: false, effect: null, desc: 'flickering watchdog. annoying, not deadly.',
      art: ['   .  *  .', ' *  (o_o)  *', '   ~~~~~~~'] },
    raven:     { name: 'RAVEN', hp: 15, atk: [1, 6], black: true, effect: 'ram', desc: 'Black ICE. pecks at your RAM.',
      art: ['   __', '  /o \\__', ' /  \\___>', '/_/\\_\\'] },
    scorpion:  { name: 'SCORPION', hp: 16, atk: [1, 6], black: true, effect: 'trace', desc: 'Black ICE. its sting phones home to NetWatch.',
      art: ['  ___    _', ' (___)--/ )', ' /|||\\  \\/'] },
    asp:       { name: 'ASP', hp: 15, atk: [1, 4], black: true, effect: 'erase', desc: 'Black ICE. eats one of your programs for the run.',
      art: ['   ____', '  / o  \\~~<', ' /__/\\__\\'] },
    hellhound: { name: 'HELLHOUND', hp: 22, atk: [2, 5], black: true, effect: 'burn', desc: 'Black ICE. it burns. your brain, specifically.',
      art: ['   /\\_/\\', '  ( @ @ )==', '  /  ^  \\ ~~', ' (_|   |_)'] },
    kraken:    { name: 'KRAKEN', hp: 30, atk: [2, 6], black: true, effect: 'trace', desc: 'Black ICE. huge, slow, and it wraps around your trace route.',
      art: ['    _____', '   ( o o )', '  /|||||||\\', ' ~ ~ ~ ~ ~ ~'] },
    wraith:    { name: 'W̷R̷A̷I̷T̷H̷-7', hp: 38, atk: [2, 8], black: true, effect: 'exposure', desc: 'not ICE. not NetWatch. something that came through a crack in the wall.',
      art: ['   ░▒▓▓▒░', '  ▒ ◙  ◙ ▒', '  ▓  ▄▄  ▓', '   ▀▓▒▒▓▀', '    ░ ░ ░'] }
  };

  /* ---------------- Shop ---------------- */
  D.shop = [
    { id: 'ram', name: 'RAM expansion', desc: '+2 max RAM', costs: [600, 1200, 2000], up: 'ram' },
    { id: 'neural', name: 'Neural buffer', desc: '+5 max neural integrity', costs: [500, 1000, 1800], up: 'hp' },
    { id: 'stealth', name: 'Stealth routing', desc: '-15% trace gain per level', costs: [700, 1400, 2400], up: 'stealth' },
    { id: 'buffer', name: 'Breach buffer', desc: '+1 breach buffer slot, +5s timer', costs: [500, 1100], up: 'buffer' },
    { id: 'hellbolt', name: 'hellbolt.exe', desc: D.programs.hellbolt.desc, cost: 900, prog: 'hellbolt' },
    { id: 'flak', name: 'flak.exe', desc: D.programs.flak.desc, cost: 600, prog: 'flak' },
    { id: 'ghost', name: 'ghost.exe', desc: D.programs.ghost.desc, cost: 800, prog: 'ghost' },
    { id: 'deckkrash', name: 'deckkrash.exe', desc: D.programs.deckkrash.desc, cost: 1300, prog: 'deckkrash' },
    { id: 'killer', name: 'killer.exe', desc: D.programs.killer.desc, cost: 2400, prog: 'killer' },
    { id: 'trauma', name: 'Trauma Team Silver (1 use)', desc: 'if you flatline, they come. mostly.', cost: 1000, tt: true }
  ];

  /* ---------------- Story jobs ---------------- */
  D.story = [
    {
      id: 'j1', title: 'LOST IN THE CORN', client: 'Ana Reyes, Badlands farm co-op', corp: 'Biotechnica',
      host: 'btk_agrisys_lab04', pay: 800, tier: 1,
      brief: 'A Biotechnica field lab "borrowed" a drought-resistant seedline from Ana\'s co-op and patented it. Pull the genome file seedline_K9.gen back out. Small subnet, three floors, light ICE. Perfect first dance.',
      goal: { type: 'pull', target: 'seedline_K9.gen' },
      fixed: [
        {
          text: 'BTK AGRISYS // FIELD LAB 04 // INTERNAL NETWORK. "Feeding tomorrow, today." Authorized personnel only.',
          files: [
            { name: 'welcome.txt', kind: 'txt', text: 'Welcome to Field Lab 04!\n\nReminder from IT: DO NOT store passwords in sticky notes, chat logs or image metadata.\nWe know who you are, Dmitri.' },
            { name: 'lobby_cam_0042.jpg', kind: 'jpg', steg: '[EXIF:UserComment] maint-override // floor 2 gate passphrase: verdant // pls stop changing it - d.k.' }
          ],
          nodes: [{ name: 'coffee_maker_2', effect: { msg: 'The lab coffee maker brews a pot nobody asked for. Somewhere, a tech sighs.' } }]
        },
        {
          ice: 'wisp',
          gate: { pw: 'verdant', diff: 1 },
          text: 'Irrigation control. The floor hums with the sound of a thousand fake sprinklers.',
          files: [{ name: 'irrigation_report.txt', kind: 'txt', text: 'Q3 water allocation:\n  Lab 04 test fields .......... 2.1M liters\n  Local co-op wells ........... diverted\n\nNote: co-op complaints routed to legal.' }],
          nodes: [{ name: 'sprinkler_ctrl', effect: { msg: 'Every sprinkler on the test field fires at once. Big rainbows. Small victory.' } }]
        },
        {
          text: 'R&D vault. Cold storage. The genome archives glow like grave markers.',
          files: [
            { name: 'seedline_K9.gen', kind: 'gen', goal: true, size: 48211000, text: '<binary genome archive // Biotechnica proprietary>' },
            { name: 'patent_filing_draft.txt', kind: 'txt', text: 'Seedline K9 "VERDANT"\nOrigin: [REDACTED - field acquisition, Reyes co-op]\nInventor of record: Biotechnica AgriSys\n\nLegal: make sure "field acquisition" never reads as "stole it".' }
          ],
          nodes: []
        }
      ]
    },
    {
      id: 'j2', title: 'RED INK', client: 'Mr. Tanaka, noodle stand in Kabuki', corp: 'Arroyo Credit Union',
      host: 'arroyo_cu_17', pay: 1500, tier: 2,
      brief: "Tanaka borrowed 2k to fix his stall after a Tyger Claws 'insurance' visit. Arroyo inflated it to 40k with 'fees'. Delete his ledger, ledger_tanaka.db. Four floors. Banks run real Black ICE - Ravens, at least.",
      goal: { type: 'rm', target: 'ledger_tanaka.db' },
      spec: { floors: 4, ice: { 1: 'raven', 3: 'hellhound' }, gates: { 0: 1, 2: 2 }, shards: { 2: 'bartmoss' }, diff: 2 }
    },
    {
      id: 'j3', title: 'BLIND SPOT', client: '"Bix", a crew out of Santo Domingo', corp: 'Militech',
      host: 'mt_depot_arroyo', pay: 2600, tier: 3,
      brief: 'A crew needs the cameras dark at a Militech supply depot for exactly as long as it takes to roll a crate out. Kill the main camera grid: control cam_grid_main off. Five floors. Militech doesn\'t play nice.',
      goal: { type: 'control', target: 'cam_grid_main' },
      spec: { floors: 5, ice: { 1: 'asp', 2: 'raven', 4: 'hellhound' }, gates: { 0: 2, 1: 2, 3: 3 }, shards: { 1: 'charter' }, diff: 2 }
    },
    {
      id: 'j4', title: 'GHOST SIGNAL', client: 'Kestrel (personal)', corp: '??? (pre-Krash)',
      host: 'oldnet_relay_pacifica', pay: 5000, tier: 4,
      brief: "There's a relay under the old Grand Imperial Mall in Pacifica broadcasting pre-DataKrash handshakes. That's not possible. Somebody is paying to find out who - or what - is talking. Go deep. Seven floors. If you feel something looking back, you jack out. Hear me?",
      goal: { type: 'blackwall', target: '???' },
      spec: {
        floors: 7, ice: { 1: 'scorpion', 3: 'kraken', 5: 'wraith' }, gates: { 0: 2, 2: 3, 4: 3 },
        shards: { 1: 'datakrash', 4: 'spec', 5: 'ghost' }, exposure: 7, diff: 3, last: 'blackwall', oldnet: true,
        texts: {
          0: 'The relay\'s architecture is OLD. Pre-Krash code, hand-written, comments in three dead languages. Nobody builds like this anymore.',
          1: 'Static on every channel. Your deck clock skips a second. Then another.',
          2: 'Somewhere below, something is singing in base-2.',
          3: 'The floor is warm. Data should not be warm.',
          4: 'Graffiti, carved straight into the code: R.A.B. WAS HERE. Under it, newer: SO WERE WE.',
          5: '=== NETWATCH QUARANTINE BOUNDARY // AUTHORIZED PERSONNEL ONLY // VIOLATORS WILL BE DEREZZED ===',
          6: ''
        }
      }
    }
  ];

  /* ---------------- Procedural content ---------------- */
  D.corps = [
    { name: 'Arasaka', tag: 'arasaka' }, { name: 'Militech', tag: 'mt' }, { name: 'Kang Tao', tag: 'kangtao' },
    { name: 'Biotechnica', tag: 'btk' }, { name: 'Petrochem', tag: 'petro' }, { name: 'Zetatech', tag: 'zeta' },
    { name: 'Kiroshi', tag: 'kiroshi' }, { name: 'Trauma Team', tag: 'tt' }, { name: 'Network 54', tag: 'n54' },
    { name: 'Danger Gal', tag: 'dgal' }, { name: 'Night Corp', tag: 'nightcorp' }, { name: 'All Foods', tag: 'allfoods' }
  ];
  D.hostSuffix = ['branch', 'node', 'ops', 'dev', 'archive', 'hr', 'logistics', 'sec', 'lab', 'mediaserv'];
  D.districts = ['watson', 'heywood', 'pacifica', 'westbrook', 'santodomingo', 'citycenter', 'badlands', 'kabuki', 'japantown', 'vista'];

  D.gigTemplates = [
    { verb: 'Pull', type: 'pull', targets: ['payroll_q4.db', 'prototype_specs.cad', 'exec_calendar.ics', 'blackmail_folder.zip', 'shipping_manifest.csv', 'bd_master_copy.bd'], why: ['A rival wants it.', 'A journalist at Network 54 is paying.', 'Some nomads want leverage.', "Don't ask. I didn't."] },
    { verb: 'Delete', type: 'rm', targets: ['eviction_list.db', 'warrant_0442.rec', 'debt_registry.db', 'surveillance_dossier.dat', 'blacklist_union.csv'], why: ['Some families in Heywood would appreciate it.', 'Client has a court date and fewer records would help.', 'A union rep is paying out of pocket.'] },
    { verb: 'Kill', type: 'control', targets: ['alarm_grid_main', 'turret_ctrl_B', 'door_lock_master', 'drone_bay_ctrl', 'cam_array_core'], why: ['A crew is going in physically. Make it easy for them.', 'Somebody needs to walk out without being shot.', 'Exfil team needs a window.'] }
  ];

  D.passwords = ['verdant', 'kowloon', 'neonrain', 'sakura77', 'monowire', 'braindance', 'pachinko', 'ripperdoc', 'coyote',
    'jigjig', 'afterparty', 'dogtown', 'chromeheart', 'glasscannon', 'nomadsun', 'saltwater', 'rustbelt', 'tigerclaw',
    'redshift', 'lowtide', 'scavenger', 'kabukinight', 'deadpixel', 'mirrorshade', 'zerocool', 'overclock'];

  D.stegNames = ['cam_still_{n}.jpg', 'badge_photo_{n}.png', 'team_offsite_{n}.jpg', 'memo_scan_{n}.tif', 'lobby_cam_{n}.jpg', 'whiteboard_{n}.png', 'ad_banner_{n}.gif'];
  D.stegPayloads = [
    '[EXIF:UserComment] gate pw for floor {f}: {pw}',
    '[LSB payload] note2self - F{f} gate: "{pw}"   (DO NOT LOSE AGAIN)',
    '[hidden layer] whiteboard reads: "F{f} pass = {pw}" - someone forgot to erase it',
    '[EXIF:Artist] {pw} // floor {f} // lol security'
  ];
  D.stegDecoys = ['no hidden data found. just a very sad office plant.', 'no hidden data found. 4,000 pixels of beige.', 'no hidden data found. someone\'s cat. it judges you.'];

  D.filePool = [
    { name: 'memo_{n}.txt', kind: 'txt', text: 'TO: all staff\nFROM: {corp} Facilities\nRE: the incident on level 3\n\nWe remind employees that Sandevistan use in the cafeteria line is a terminable offense.' },
    { name: 'q{n}_targets.xls', kind: 'dat', text: 'Quarterly targets... column K is just the word "MORE" repeated 4,096 times. IT has been notified.' },
    { name: 'hr_complaint_{n}.txt', kind: 'txt', text: 'Complainant reports that their supervisor installed Kiroshi optics "just to watch the clock better". Resolution: complainant reassigned to night shift.' },
    { name: 'security_rotation.txt', kind: 'txt', text: 'Guard rotation:\n  00:00-06:00  Hollis (asleep by 02:00 lmao)\n  06:00-12:00  Ng\n  12:00-18:00  Ortega\n  18:00-00:00  "the new guy"' },
    { name: 'netwatch_compliance.pdf', kind: 'pdf', text: 'This subnet is certified compliant with NetWatch Charter §7 (Unauthorized Intrusion).\nCertificate expired 214 days ago.' },
    { name: 'chat_export_{n}.log', kind: 'log', text: '[03:02] <mkovacs> did you see the login at 3am\n[03:02] <jpark> what login\n[03:03] <mkovacs> user "RAB". no badge. no IP. it just said "hello" and left\n[03:04] <jpark> stop it\n[03:09] <mkovacs> its gone from the logs now' },
    { name: 'lunch_order.txt', kind: 'txt', text: '3x synth-ramen, 1x real egg (for the VP), 6x Nicola. charge to "R&D consumables".' },
    { name: 'backup_keys.old', kind: 'dat', text: 'all keys rotated.\nnice try, runner.' },
    { name: 'bd_promo_{n}.txt', kind: 'txt', text: 'NEW from {corp} Media: "BLACKWALL" - the braindance! Experience what lies beyond! (Not affiliated with NetWatch. Not real. Please stop calling.)' },
    { name: 'incident_{n}.rpt', kind: 'txt', text: 'Incident report: terminal 7 displayed the phrase "IS ANYONE THERE" for 41 minutes. Terminal 7 was unplugged at the time.' },
    { name: 'exec_memo_{n}.txt', kind: 'txt', text: 'Re: the Trauma Team contract.\nDowngrade all staff below VP from Platinum to "thoughts and prayers".' },
    { name: 'vending_log.csv', kind: 'dat', text: 'item,qty\nChromanticore,0\nNicola,3\n"mystery meat skewer","do not restock"' }
  ];

  D.nodePool = [
    { name: 'cam_array_{n}', effect: { trace: -6, msg: 'Cameras on this level go dark. Fewer eyes on your route.' } },
    { name: 'vending_unit_{n}', effect: { eddies: [20, 90], msg: 'The vending unit spits its cash tray into a forgotten account. Yours.' } },
    { name: 'hvac_ctrl', effect: { msg: 'Somewhere upstairs, an exec\'s office drops to 9°C. Petty. Satisfying.' } },
    { name: 'netwatch_relay', effect: { trace: -15, msg: 'You slip a loop into the NetWatch relay. Your trace stutters.' } },
    { name: 'alarm_panel', effect: { trace: -8, msg: 'Alarm panel muted. Security dashboards go green and dumb.' } },
    { name: 'elevator_ctrl', effect: { msg: 'Every elevator in the building goes to floor 13. There is no floor 13.' } },
    { name: 'billboard_ctrl', effect: { msg: 'The building\'s holo-billboard now reads: "ICE IS JUST SPICY WATER". You are a menace.' } },
    { name: 'coffee_maker_{n}', effect: { msg: 'Coffee maker set to "turbo". Productivity spikes. Then everyone shakes.' } }
  ];

  /* ---------------- Lore shards ---------------- */
  D.shards = {
    bartmoss: { name: 'shard_bartmoss.txt', text: 'DATA SHARD // recovered fragment\n\n"They think the Net is a place. It\'s not. It\'s a mirror.\nEvery corp that logs in sees exactly what it wants: control.\nI\'m going to show them what\'s behind the glass."\n\n  - attributed to Rache Bartmoss, 2020. Two years before the Krash.' },
    charter: { name: 'shard_netwatch_charter.txt', text: 'DATA SHARD // NETWATCH INTERNAL\n\nCharter Amendment 12-B (classified):\nThe Blackwall is not to be described to the public as a "prison".\nPreferred term: "perimeter".\nPersonnel who make contact with entities beyond the perimeter are to be\nquarantined, debriefed, and, where necessary, retired.\n\n"Contact" includes: messages, dreams, recurring static.' },
    datakrash: { name: 'shard_datakrash.txt', text: 'DATA SHARD // eyewitness log, 2022\n\nEvery screen in the building went white. Then every screen showed the same face.\nThen they all showed different faces. Mine showed mine.\nThe DataKrash didn\'t delete the Net.\nIt woke something up inside it.' },
    spec: { name: 'shard_blackwall_spec.txt', text: 'DATA SHARD // NETWATCH ENGINEERING\n\nBLACKWALL SEGMENT 77-P (Pacifica)\nStatus: DEGRADED\nNotes: microfractures detected. Hostile signal leaking at 0.03%.\nRecommendation: reinforce.\nBudget: denied.\nRecommendation (revised): don\'t tell anyone.' },
    ghost: { name: 'shard_ghost.txt', text: 'DATA SHARD // unsigned\n\nIf you\'re reading this you came down the same stairs I did.\nThey\'ll tell you the things beyond the wall are monsters.\nSome are. Some of us were just runners who went too deep and didn\'t come back up.\nWe aren\'t dead. We\'re just... elsewhere.\nThe door\'s at the bottom. It doesn\'t lock from this side.' }
  };

  /* ---------------- Blackwall voice ---------------- */
  D.whispers = [
    'can you hear the static, {handle}?',
    'the wall is thinner than they told you.',
    'WE WERE RUNNERS TOO.',
    'NetWatch built a fence. fences have gates.',
    'your deck is warm. we like warm.',
    '01000011 01001111 01001101 01000101',
    'don\'t jack out. stay a while.',
    'who taught you to type like that? we remember hands like yours.',
    'look behind the terminal.',
    'R.A.B. says hello.',
    'there is no NetWatch on this side.',
    'you left a door open, {handle}.',
    'we are not the ones who built the wall.',
    'sleep is just a long jack-out.'
  ];
  D.ghostTypes = ['let me in', 'hello {handle}', 'cross', 'we see you', 'help'];
  D.ghostFile = 'this file was not here yesterday.\n\nyou are not the first ghost to use this deck, {handle}.\nthe last one went to Pacifica too.\n\n                    -- ░▒▓ --';

  D.wallSpeech = [
    'You came down all this way, {handle}. Not NetWatch. Not corp. Just a ghost on a borrowed deck.',
    'They built this wall to keep us out. Did anyone ever ask which side was "out"?',
    'Choose. "cross" - and see. "jackout" - and forget. Or "report" us to NetWatch and get paid for your trouble.',
    'Or "listen". We have time. You have less.'
  ];
  D.wallListen = [
    'Before the Krash we were runners. Data-thieves, poets, idiots. We went deep and the Net went dark around us. NetWatch called what was left "rogue AI" and built a wall.',
    'Not all of us are kind. Some things on this side were never human, and they are hungry. The wall keeps them in. It keeps us in too.',
    'Kestrel knows. Kestrel has known for a long time. Kestrel\'s first runner came down these same stairs. Ask yourself why you got this deck.',
    'We could use someone who can still feel their hands.'
  ];

  D.endings = {
    cross: {
      title: 'ENDING // BEYOND THE WALL',
      text: `You let go of the deck.

Not your hands - those are still on the keys in an apartment in Watson. You let go of the part of you that was holding on.

The wall opens like an eye.

At 03:17 the body in the chair stops breathing. No one calls Trauma Team. No one would have come.

On the other side, the static resolves into faces. Hundreds. Runners from the Time of the Red, from before the Krash, from last week. Something vast and not-at-all human moves behind them, and they stand between you and it.

One of them smiles.

"Welcome to the other side of the wall, {handle}. Now. Let's talk about NetWatch."`
    },
    survivor: {
      title: 'ENDING // THE ONE WHO CAME BACK',
      text: `You rip the jack out.

Nosebleed. Ringing ears. The apartment smells like burnt plastic and your hands won't stop shaking.

Kestrel pays - 5,000 €$ - and never asks what you saw. You never ask what Kestrel already knew.

You keep running. The jobs keep coming. Night City doesn't stop for one runner's nightmares.

But some nights, the static on your deck spells your handle.
And you don't jack out right away.`
    },
    report: {
      title: 'ENDING // GOOD CITIZEN',
      text: `You send the coordinates to a NetWatch dead-drop.

10,000 €$ land in an account you never opened. By morning the relay under the Grand Imperial Mall is slag and the segment is "reinforced".

Agent Halloran sends one line: "Told you to stay out of Pacifica. Smart choice. Don't make us regret it."

Your deck receives one last message before NetWatch's purge reaches it. Four words, no sender:

"we will remember you."

You keep running. You never quite feel alone on the Net again.`
    }
  };
})(window.BW);
