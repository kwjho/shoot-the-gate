/**
 * i18n.js — zh-HK / zh-CN / en dictionaries and DOM binding.
 *
 * Markup hooks:
 *   data-i18n="key"                 → textContent
 *   data-i18n-html="key"            → innerHTML (dictionary-authored content only)
 *   data-i18n-attr="attr:key;attr2:key2"
 *
 * `t(key, vars)` interpolates {placeholders}. Missing keys fall back to English,
 * then to the key itself. Game log entries are stored as { k, v } so every
 * peer renders them in its own language.
 */

export const LANGS = ['zh-HK', 'zh-CN', 'en'];
const STORE_KEY = 'stg.lang';

const en = {
  'app.title': 'Shoot the Dragon Gate',
  'brand.zh': '射龍門',
  'meta.title': "射龍門 Shoot the Dragon Gate | Free online card game: solo, pass & play, online rooms",
  'meta.description': "Play 射龍門 (Shoot the Dragon Gate), the Lunar New Year card game, free in your browser. Two posts are dealt; bet the third card lands between them, and pay double if you hit a post (撞柱). Solo vs. the house, 2–6 player pass-and-play, or private online rooms with a 4-letter code. Points only, no real money.",
  'guide.title': "The story and the full rules",
  'a11y.skip': 'Skip to content',
  'nav.home': 'Home',
  'nav.language': 'Language',
  'nav.sound': 'Sound',
  'nav.theme': 'Light / dark',
  'nav.rules': 'Rules',
  'nav.back': 'Back',
  'nav.close': 'Close',
  'room.label': 'Room',
  'ads.label': 'Advertisement',

  'home.eyebrow': 'A Lunar New Year table classic',
  'home.lede': 'Two posts are dealt. Bet that the third card lands between them. Clip a post and you pay double.',
  'mode.single': 'Solo',
  'mode.singleDesc': 'You against the house bank. Break the bank before it breaks you.',
  'mode.local': 'Pass & Play',
  'mode.localDesc': '2–6 players, one device and one shared pot. Hand it round the table.',
  'mode.online': 'Online Room',
  'mode.onlineDesc': 'Peer-to-peer, no sign-up. Share a 4-letter code with friends.',
  'mode.host': 'Host a room',
  'mode.join': 'Join with code',
  'howto.title': 'How a hand plays',
  'howto.s1': 'Open the gate',
  'howto.s1d': 'Two cards are dealt as the posts. A counts 1, K counts 13.',
  'howto.s2': 'Size your shot',
  'howto.s2d': 'Bet up to your stack or the pot, whichever is smaller. Wide gates earn bold bets.',
  'howto.s3': 'Shoot',
  'howto.s3d': 'Between the posts wins from the pot. Outside loses the bet. Matching a post costs double.',
  'howto.more': 'Read the story and the full rules →',

  'setup.nickname': 'Your name',
  'setup.nicknamePh': 'e.g. Lucky Carp',
  'setup.players': 'Players',
  'setup.addPlayer': 'Add player',
  'setup.remove': 'Remove player',
  'setup.playerN': 'Player {n}',
  'setup.deck': 'Shoe',
  'setup.ante': 'Ante per round',
  'setup.chips': 'Starting chips',
  'setup.singleNote': 'The house bank starts at twice your stack. You ante into it every hand.',
  'setup.title.single': 'Take on the house',
  'setup.title.local': 'Gather the table',
  'setup.title.online': 'Open a room',
  'setup.lede.single': 'Every hand costs an ante. Win bets from the bank until it runs dry.',
  'setup.lede.local': 'Everyone antes into one pot. Pass the device when your name comes up.',
  'setup.lede.online': 'You deal, keep the shoe and hold the pot. Friends join with your code.',
  'setup.submit.single': 'Deal me in',
  'setup.submit.local': 'Start the game',
  'setup.submit.online': 'Create room',
  'setup.defaultSolo': 'Player',
  'setup.defaultHost': 'Host',
  'setup.defaultGuest': 'Guest',
  'deck.singleLow': '1 deck · reshuffle when low',
  'deck.singleLowDesc': '52 cards. The shoe is rebuilt when fewer than 12 remain, so card counting pays.',
  'deck.singleEvery': '1 deck · shuffle every hand',
  'deck.singleEveryDesc': 'A fresh, fully shuffled 52 before every hand. Pure odds, no memory.',
  'deck.fourLow': '4 decks · reshuffle when low',
  'deck.fourLowDesc': '208 cards for long sessions. Reshuffled when fewer than 15 remain.',
  'deck.short.single-low': '1 deck',
  'deck.short.single-every': '1 deck · fresh each hand',
  'deck.short.four-low': '4 decks',

  'join.title': 'Join a room',
  'join.lede': 'Ask the host for the four-letter code on their screen.',
  'join.code': 'Room code',
  'join.submit': 'Join room',

  'lobby.eyebrow': 'Room code',
  'lobby.copyCode': 'Copy code',
  'lobby.copyLink': 'Copy invite link',
  'lobby.players': 'At the table',
  'lobby.settings': 'House rules',
  'lobby.host': 'Host',
  'lobby.empty': 'Waiting for a friend…',
  'lobby.postRule': 'Post penalty',
  'lobby.start': 'Start the game',
  'lobby.ready': 'Players can still join after the game starts.',
  'lobby.needMore': 'Need at least 2 players. Share the code.',
  'lobby.waitHost': 'Waiting for the host to start…',

  'table.leftPost': 'Post',
  'table.ball': 'Shot',
  'table.rightPost': 'Post',
  'hud.pot': 'Pot',
  'hud.bank': 'House bank',
  'hud.shoe': '{n} of {total} cards left in the shoe',

  'board.title': 'Scoreboard',
  'board.you': 'you',
  'board.offline': 'Disconnected',
  'board.nextRound': 'Joins next round',
  'board.out': 'Out of chips',
  'board.playing': 'Playing',
  'board.record': '{w} wins · {h} posts',

  'turn.you': 'You',
  'turn.yourDeal': 'Your turn: deal the posts',
  'turn.dealing': 'is about to deal',
  'turn.yourBet': 'Your turn: set your bet',
  'turn.betting': 'is sizing a bet',
  'turn.res.win': 'through the gate',
  'turn.res.miss': 'missed the gate',
  'turn.res.post': 'hit the post',
  'turn.res.nogate': 'no gate this time',
  'turn.res.skip': 'turn skipped',
  'turn.paused': 'Waiting for players to reconnect',
  'turn.gameover': 'Game over',
  'turn.round': 'Round {n}',

  'stamp.win': '過門',
  'stamp.miss': '射偏',
  'stamp.post': '撞柱',
  'stamp.nogate': '無門',
  'stamp.skip': '略過',
  'result.win': '{name} shot through the gate and takes {amount}.',
  'result.miss': '{name} missed the gate and pays {amount} into the pot.',
  'result.post': '{name} hit the post and pays {amount} ({mult}× the bet).',
  'result.nogate': 'Consecutive posts, so no gate. {name} passes with no penalty.',
  'result.skip': "{name}'s turn was skipped.",

  'range.left': '{rank}: {n} left',
  'range.idle': 'Bars show how many of each rank remain in the shoe',
  'range.nogate': 'Consecutive posts leave no gate to shoot through',
  'range.odds': 'Win {win} · Post {post}',
  'range.oddsPair': 'Higher {high} · Lower {low} · Post {post}',
  'range.oddsCall': 'Win {win} · Post {post}',

  'ctl.passTo': 'Pass the device to {name}',
  'ctl.deal': 'Deal the posts',
  'ctl.dealHint': 'Consecutive posts are a free pass. Ante this round: {ante}.',
  'ctl.waitDeal': 'Waiting for {name} to deal',
  'ctl.waitBet': '{name} is lining up a shot',
  'ctl.eyeing': 'eyeing {bet}',
  'ctl.higher': 'Higher',
  'ctl.lower': 'Lower',
  'ctl.callLabel': 'Higher or lower',
  'ctl.pairTitle': 'Pair of {rank}s: call it',
  'ctl.pickCall': 'Pick higher or lower',
  'ctl.bet': 'Your bet',
  'ctl.less': 'Decrease bet',
  'ctl.more': 'Increase bet',
  'ctl.min': 'Min',
  'ctl.max': 'Max',
  'ctl.shoot': 'Shoot',
  'ctl.shootFor': 'Shoot for {bet}',
  'ctl.risk': 'Win +{win} · Miss −{win} · Post −{post}',
  'ctl.nextUp': '{name} is up next',
  'ctl.paused': 'The table is paused until a player reconnects.',

  'log.title': 'Table log',
  'log.start': 'New game: {n} at the table.',
  'log.round': 'Round {round}: antes add {total} to the pot.',
  'log.deal': '{name} opens a gate: {a} to {b}.',
  'log.pair': '{name} draws a pair: {a} and {b}.',
  'log.nogate': '{name}: {a} and {b} are consecutive, so no gate.',
  'log.win': '{name} bets {bet}, draws {ball}: wins {amount}.',
  'log.miss': '{name} bets {bet}, draws {ball}: misses, pays {amount}.',
  'log.post': '{name} bets {bet}, draws {ball}: hits the post, pays {amount}.',
  'log.skip': "{name}'s turn was skipped.",
  'log.join': '{name} sat down (plays from next round).',
  'log.leave': '{name} disconnected.',
  'log.rejoin': '{name} is back.',
  'log.reshuffle': 'Shoe reshuffled ({n} cards).',
  'log.gameover': 'Game over. Winner: {name}.',
  'log.gameoverHouse': 'Game over. The house wins.',

  'game.end': 'End game',
  'game.leave': 'Leave table',
  'game.closeRoom': 'Close room',

  'over.eyebrow': 'Game over',
  'over.bust': 'The house wins this time',
  'over.brokeBank': 'You broke the bank!',
  'over.winner': '{name} takes the table',
  'over.leader': '{name} leads when the game ends',
  'over.ended': 'Final standings',
  'over.again': 'Play again',
  'over.waitHost': 'Waiting for the host to deal a new game…',
  'over.home': 'Back to menu',

  'confirm.cancel': 'Stay',
  'confirm.leaveTitle': 'Leave this table?',
  'confirm.leaveText': 'The game in progress will be lost.',
  'confirm.closeTitle': 'Close the room?',
  'confirm.closeText': 'Everyone in the room will be disconnected.',
  'confirm.endTitle': 'End the game now?',
  'confirm.endText': 'Final standings are taken from current chip counts.',

  'drawer.title': 'Story & rules',
  'drawer.origin': 'Story',
  'drawer.rules': 'Rules',
  'drawer.stats': 'Stats',

  'stats.empty': 'No hands played yet. Deal a few, then check back here.',
  'stats.lede': 'Live numbers for the current game.',
  'stats.hands': 'Hands played',
  'stats.winRate': 'Shot success',
  'stats.postHits': 'Post hits',
  'stats.biggestWin': 'Biggest win',
  'stats.biggestPot': 'Biggest pot',
  'stats.wagered': 'Total wagered',
  'stats.by': 'by {name}',
  'stats.outcomes': 'How hands ended',
  'stats.o.win': 'Through',
  'stats.o.miss': 'Missed',
  'stats.o.post': 'Post hit',
  'stats.o.nogate': 'No gate',
  'stats.player': 'Player',
  'stats.chips': 'Chips',
  'stats.wins': 'Wins',
  'stats.posts': 'Posts',
  'setup.potMode': 'Pot rule',
  'pot.standard': 'Standard pot',
  'pot.standardDesc': 'Traditional rules. Bets are capped at the pot, and an empty pot means a fresh round of antes.',
  'pot.free': 'Free play · no banker',
  'pot.freeDesc': "Bet up to your own chips. The house pays whatever the pot can't cover, so play never stops for an empty pot.",
  'pot.short.standard': 'Standard pot',
  'pot.short.free': 'Free play',
  'hud.noLimit': 'no limit',
  'stats.allTime': 'All-time on this device',
  'stats.since': 'Since {date} · Games: {games}',
  'stats.reset': 'Reset stats',
  'stats.thisGame': 'This game',
  'stats.winsTotal': 'Wins',
  'stats.losses': 'Losses',
  'stats.net': 'Net chips',
  'stats.netSub': 'after {antes} in antes',
  'stats.housePaid': 'Paid by the house',
  'stats.netCol': 'Net',
  'confirm.resetTitle': 'Reset all-time stats?',
  'confirm.resetText': 'This clears the totals saved on this device. The game in progress is not affected.',
  'toast.statsReset': 'Stats reset',

  'toast.reshuffle': 'Fresh shoe: {n} cards shuffled',
  'toast.join': '{name} joined the table',
  'toast.rejoin': '{name} reconnected',
  'toast.leave': '{name} disconnected',
  'toast.copied': 'Copied to clipboard',

  'err.unknownAction': 'That move isn’t recognised.',
  'err.badPlayer': 'Unknown player.',
  'err.duplicate': 'That seat is already taken.',
  'err.full': 'The table is full (6 players).',
  'err.badPhase': 'Not now: wait for the table.',
  'err.needPlayers': 'At least 2 players are needed.',
  'err.notYourTurn': 'It’s not your turn.',
  'err.badBet': 'That bet is outside the limits.',
  'err.needCall': 'Call higher or lower first.',
  'err.emptyDeck': 'The shoe ran out of cards.',
  'err.badCode': 'Room codes are four letters.',
  'err.rejected': 'The host declined the connection.',

  'net.creating': 'Opening a room…',
  'net.joining': 'Connecting to {code}…',
  'net.libLoad': 'Couldn’t load the networking library. Check your connection.',
  'net.roomNotFound': 'No room with that code. Check the letters with your host.',
  'net.timeout': 'Connection timed out. Try again.',
  'net.full': 'That room is full.',
  'net.noCode': 'Couldn’t reserve a room code. Try again.',
  'net.browser-incompatible': 'This browser doesn’t support WebRTC.',
  'net.duplicate': 'You’re already at this table in another tab.',
  'net.network': 'Can’t reach the matchmaking server.',
  'net.generic': 'Something went wrong with the connection.',
  'net.hostClosed': 'The host closed the room.',
  'net.hostLost': 'Lost connection to the host.',
  'net.replaced': 'This seat was opened in another tab.',

  'footer.tag': 'Points only. No real money, no prizes. Play for fun.',
  'footer.privacy': 'Privacy',

  'article.origin': `
    <p class="prose__kicker">射龍門 · sè lóng mén</p>
    <h3>The carp and the gate</h3>
    <p><strong>射龍門</strong>, “Shoot the Dragon Gate”, turns up at Lunar New Year gatherings across Taiwan, Hong Kong, southern China and Chinese communities around the world. English speakers know close cousins of it as <em>In-Between</em> or <em>Acey-Deucey</em>.</p>
    <p>The name comes from the old legend of the carp leaping the Dragon Gate (鯉躍龍門). A carp that swims up the Yellow River and clears the falls at the gate turns into a dragon. The saying still wishes students luck in exams and newcomers luck in their careers. On the table the two posts are the gate and the third card is the leap. Clear it and you are rewarded. Strike the pillar and you pay for it.</p>
    <h3>Why it lasts</h3>
    <p>The game needs one deck and one rule anyone can learn in a minute, and every card is dramatic. The shared pot is the heart of it. It grows as players miss and shrinks when someone takes a bold shot, so everyone leans in when a wide gate opens and the pot is fat.</p>
    <p>Families usually play for sweets, coins from red envelopes (紅包) or plain points. The fun is in the table talk: groans at a narrow 5–7 gate, cheers when a cautious aunt finally bets the pot on an A–K.</p>
    <h3>House rules vary</h3>
    <p>Every household plays slightly differently. Some pay triple for hitting a post on a pair. Some let a player decline a narrow gate, and some redraw “no gate” hands instead of passing. This edition uses a common, balanced set that is spelled out on the Rules tab, so everyone at your table plays the same game.</p>
    <aside class="prose__note"><strong>Points only.</strong> This site has no real money, purchases, payouts or prizes. Chips reset every game.</aside>`,

  'article.rules': `
    <h3>The cards</h3>
    <p>Suits don’t matter. Only rank counts: <strong>A = 1</strong>, 2–10 at face value, <strong>J = 11, Q = 12, K = 13</strong>.</p>
    <h3>Ante and the pot</h3>
    <p>At the start of every round each player pays the <strong>ante</strong> into the central pot. Wins are paid out of the pot and losses go into it. If someone empties the pot, a fresh round of antes starts at once. In Solo the pot is the <strong>house bank</strong>: you ante into it every hand and win the game if you drain it.</p>
    <h3>Your turn</h3>
    <ol>
      <li><strong>Deal the posts.</strong> Two cards are placed face up, the lower on the left.</li>
      <li><strong>Bet.</strong> Choose any amount from 1 up to your chips or the pot, whichever is smaller.</li>
      <li><strong>Shoot.</strong> The third card is turned over.</li>
    </ol>
    <table>
      <thead><tr><th>Third card</th><th>Result</th></tr></thead>
      <tbody>
        <tr><td>Strictly between the posts</td><td><span class="pill pill--win">過門 Win</span> Take your bet from the pot</td></tr>
        <tr><td>Outside the posts</td><td><span class="pill pill--miss">射偏 Miss</span> Pay your bet into the pot</td></tr>
        <tr><td>Same rank as a post</td><td><span class="pill pill--post">撞柱 Post</span> Pay <strong>double</strong> your bet into the pot</td></tr>
      </tbody>
    </table>
    <h3>Special cases</h3>
    <ul>
      <li><strong>Consecutive posts (無門, no gate).</strong> With posts like 5 and 6 nothing can fit between them. The hand is dropped and the turn passes with no penalty.</li>
      <li><strong>Equal posts (對柱, a pair).</strong> With posts like 7 and 7 you call <em>Higher</em> or <em>Lower</em> before the shot. A right call wins, a wrong call loses the bet, and a third 7 hits the post for double. A pair of aces can only go higher and a pair of kings only lower.</li>
      <li><strong>Double penalty cap.</strong> A post hit can never take more chips than you have. If double your bet is more than your stack, you pay everything and sit out.</li>
      <li><strong>Out of chips.</strong> A player with no chips is out. The last player holding chips wins. You can end a game early at any time, and the standings are taken from the current chip counts.</li>
    </ul>
    <h3>Free play (無莊家)</h3>
    <p>Choose <strong>Free play</strong> at setup for a casual table with no pot limit. You can bet up to your whole stack whatever the pot holds. If a win is bigger than the pot, the house pays the difference, and an empty pot never forces a re-ante. In Solo the house can’t go broke, so the game only ends when you run out of chips or stop.</p>
    <h3>Shoe options</h3>
    <ul>
      <li><strong>1 deck, reshuffle when low:</strong> 52 cards, rebuilt when fewer than 12 remain. The rank bars under the table show what’s left, so memory pays.</li>
      <li><strong>1 deck, shuffle every hand:</strong> a fresh 52 each hand. Every shot uses the textbook odds.</li>
      <li><strong>4 decks, reshuffle when low:</strong> 208 cards, rebuilt when fewer than 15 remain. Pairs and post hits show up a bit more often.</li>
    </ul>
    <h3>Reading the odds</h3>
    <p>With a fresh single deck and two different posts, 50 cards remain. Each rank strictly inside the gate has 4 cards and each post rank has 3 left, so a post hit is always about <strong>12%</strong>.</p>
    <table>
      <thead><tr><th>Gate</th><th>Winning ranks</th><th>Win chance</th></tr></thead>
      <tbody>
        <tr><td>A – K</td><td>11</td><td>88%</td></tr>
        <tr><td>2 – Q</td><td>9</td><td>72%</td></tr>
        <tr><td>3 – J</td><td>7</td><td>56%</td></tr>
        <tr><td>4 – 10</td><td>5</td><td>40%</td></tr>
        <tr><td>5 – 9</td><td>3</td><td>24%</td></tr>
        <tr><td>6 – 8</td><td>1</td><td>8%</td></tr>
      </tbody>
    </table>
    <p>A good habit: bet small on gates narrower than about 7 ranks and push on wide ones. The live win and post percentages above the controls use the cards actually left in the shoe.</p>
    <h3>Online rooms</h3>
    <p>The host’s browser shuffles, deals and keeps the pot. Guests connect directly to the host (peer-to-peer WebRTC) using the four-letter room code. If a guest drops out their seat is kept: rejoining from the same tab with the same code puts them back, and a disconnected player’s turn is skipped after 20 seconds.</p>`,
};

// Traditional Chinese for the general public in Hong Kong: standard written
// Chinese with Hong Kong vocabulary and character forms (網上, 網絡, 私隱, 派牌,
// 落注, 梭哈, 買大／買細, 機會率, 利是, 牌枱, 着, 裏). Keep it free of Taiwan
// (線上, 網路, 螢幕, 紀錄) and Mainland (在线, 屏幕→荧幕, 设备) phrasing.
const zhHK = {
  'app.title': '射龍門',
  'brand.zh': '射龍門',
  'meta.title': '射龍門 Shoot the Dragon Gate｜免費網上啤牌遊戲・單人、同機多人、網上對戰',
  'meta.description': '免費網上玩射龍門（Shoot the Dragon Gate）：先派兩張門柱，押第三張牌落在兩柱中間，撞柱要賠雙倍。可單人挑戰莊家、2–6 人共用一部裝置輪流玩，或以四個字母的房號網上對戰，設繁體中文／简体中文／English。只用點數，不涉及真錢。',
  'guide.title': '典故及完整規則',
  'a11y.skip': '跳至主要內容',
  'nav.home': '主頁',
  'nav.language': '語言',
  'nav.sound': '音效',
  'nav.theme': '淺色／深色模式',
  'nav.rules': '規則',
  'nav.back': '返回',
  'nav.close': '關閉',
  'room.label': '房號',
  'ads.label': '廣告',

  'home.eyebrow': '農曆新年經典牌局',
  'home.lede': '先派兩張門柱，押第三張牌落在兩柱中間。撞中門柱，就要賠雙倍。',
  'mode.single': '單人挑戰',
  'mode.singleDesc': '你對莊家。趁莊家未贏清你的籌碼之前，先贏到莊家見底。',
  'mode.local': '同機多人',
  'mode.localDesc': '2–6 人共用一部裝置、一個彩池，輪流傳着玩。',
  'mode.online': '網上房間',
  'mode.onlineDesc': '點對點連線，毋須註冊。將四個字母的房號分享給朋友即可。',
  'mode.host': '建立房間',
  'mode.join': '輸入房號加入',
  'howto.title': '一手牌的玩法',
  'howto.s1': '開門',
  'howto.s1d': '先派兩張牌做門柱。A 當 1，K 當 13。',
  'howto.s2': '落注',
  'howto.s2d': '注碼上限為你的籌碼或彩池，以較少者為準。門越闊，越值得落重注。',
  'howto.s3': '射門',
  'howto.s3d': '落在兩柱中間，從彩池贏錢；落在外面，輸去注碼；與門柱同點，賠雙倍。',
  'howto.more': '閱讀典故及完整規則 →',

  'setup.nickname': '你的暱稱',
  'setup.nicknamePh': '例如：跳龍門的鯉魚',
  'setup.players': '玩家',
  'setup.addPlayer': '增加玩家',
  'setup.remove': '移除玩家',
  'setup.playerN': '玩家 {n}',
  'setup.deck': '牌靴',
  'setup.ante': '每輪底注',
  'setup.chips': '起始籌碼',
  'setup.singleNote': '莊家資金是你起始籌碼的兩倍，每一手你都要向莊家付底注。',
  'setup.title.single': '挑戰莊家',
  'setup.title.local': '開枱',
  'setup.title.online': '建立房間',
  'setup.lede.single': '每手先付底注，從莊家手上贏取籌碼，直至贏到莊家見底。',
  'setup.lede.local': '所有人將底注放入同一個彩池，輪到誰就將裝置交給誰。',
  'setup.lede.online': '由你負責派牌、洗牌及管理彩池。朋友輸入房號就可以加入。',
  'setup.submit.single': '派牌',
  'setup.submit.local': '開始遊戲',
  'setup.submit.online': '建立房間',
  'setup.defaultSolo': '玩家',
  'setup.defaultHost': '房主',
  'setup.defaultGuest': '訪客',
  'deck.singleLow': '1 副牌・牌少時重洗',
  'deck.singleLowDesc': '52 張。少於 12 張時重新洗牌，記牌有優勢。',
  'deck.singleEvery': '1 副牌・每手重洗',
  'deck.singleEveryDesc': '每一手都用洗好的完整 52 張，純粹看機會率。',
  'deck.fourLow': '4 副牌・牌少時重洗',
  'deck.fourLowDesc': '208 張，適合長時間對戰。少於 15 張時重洗。',
  'deck.short.single-low': '1 副牌',
  'deck.short.single-every': '1 副・每手重洗',
  'deck.short.four-low': '4 副牌',

  'join.title': '加入房間',
  'join.lede': '請向房主索取屏幕上的四個字母房號。',
  'join.code': '房號',
  'join.submit': '加入',

  'lobby.eyebrow': '房號',
  'lobby.copyCode': '複製房號',
  'lobby.copyLink': '複製邀請連結',
  'lobby.players': '已入座玩家',
  'lobby.settings': '本枱規則',
  'lobby.host': '房主',
  'lobby.empty': '等待朋友加入…',
  'lobby.postRule': '撞柱罰則',
  'lobby.start': '開始遊戲',
  'lobby.ready': '遊戲開始後仍可加入。',
  'lobby.needMore': '最少需要 2 位玩家，請分享房號。',
  'lobby.waitHost': '等待房主開局…',

  'table.leftPost': '門柱',
  'table.ball': '射門',
  'table.rightPost': '門柱',
  'hud.pot': '彩池',
  'hud.bank': '莊家',
  'hud.shoe': '牌靴尚餘 {n} / {total} 張',
  'hud.noLimit': '無上限',

  'board.title': '計分板',
  'board.you': '你',
  'board.offline': '已離線',
  'board.nextRound': '下一輪加入',
  'board.out': '籌碼已用完',
  'board.playing': '出手中',
  'board.record': '{w} 勝・撞柱 {h}',

  'turn.you': '你',
  'turn.yourDeal': '輪到你：派門柱',
  'turn.dealing': '準備派牌',
  'turn.yourBet': '輪到你：落注',
  'turn.betting': '正在考慮落注',
  'turn.res.win': '射門成功',
  'turn.res.miss': '射偏了',
  'turn.res.post': '撞柱！',
  'turn.res.nogate': '無門，跳過',
  'turn.res.skip': '已略過此回合',
  'turn.paused': '等待玩家重新連線',
  'turn.gameover': '遊戲結束',
  'turn.round': '第 {n} 輪',

  'stamp.win': '過門',
  'stamp.miss': '射偏',
  'stamp.post': '撞柱',
  'stamp.nogate': '無門',
  'stamp.skip': '略過',
  'result.win': '{name} 射門成功，贏得 {amount}。',
  'result.miss': '{name} 射偏，{amount} 撥入彩池。',
  'result.post': '{name} 撞柱！賠 {amount}（注碼的 {mult} 倍）。',
  'result.nogate': '兩柱相連，無門可射。{name} 免罰跳過。',
  'result.skip': '{name} 的回合已略過。',

  'range.left': '{rank}：尚餘 {n} 張',
  'range.idle': '長條顯示牌靴內各點數尚餘的張數',
  'range.nogate': '兩柱相連，無門可射',
  'range.odds': '過門 {win}・撞柱 {post}',
  'range.oddsPair': '大 {high}・細 {low}・撞柱 {post}',
  'range.oddsCall': '過門 {win}・撞柱 {post}',

  'ctl.passTo': '請將裝置交給 {name}',
  'ctl.deal': '派門柱',
  'ctl.dealHint': '兩柱相連可免罰跳過。本輪底注：{ante}。',
  'ctl.waitDeal': '等待 {name} 派牌',
  'ctl.waitBet': '{name} 正在瞄準',
  'ctl.eyeing': '打算落注 {bet}',
  'ctl.higher': '買大',
  'ctl.lower': '買細',
  'ctl.callLabel': '買大或買細',
  'ctl.pairTitle': '對柱 {rank}：請選買大或買細',
  'ctl.pickCall': '先選買大或買細',
  'ctl.bet': '注碼',
  'ctl.less': '減少注碼',
  'ctl.more': '增加注碼',
  'ctl.min': '最少',
  'ctl.max': '梭哈',
  'ctl.shoot': '射門',
  'ctl.shootFor': '落注 {bet} 射門',
  'ctl.risk': '過門 +{win}・射偏 −{win}・撞柱 −{post}',
  'ctl.nextUp': '下一位：{name}',
  'ctl.paused': '牌枱暫停，等待玩家重新連線。',

  'log.title': '牌局記錄',
  'log.start': '新一局開始：{n} 人入座。',
  'log.round': '第 {round} 輪：底注合共 {total} 撥入彩池。',
  'log.deal': '{name} 開門：{a} 至 {b}。',
  'log.pair': '{name} 開出對柱：{a} 及 {b}。',
  'log.nogate': '{name}：{a}、{b} 相連，無門。',
  'log.win': '{name} 落注 {bet}，開出 {ball}：過門，贏 {amount}。',
  'log.miss': '{name} 落注 {bet}，開出 {ball}：射偏，賠 {amount}。',
  'log.post': '{name} 落注 {bet}，開出 {ball}：撞柱，賠 {amount}。',
  'log.skip': '{name} 的回合已略過。',
  'log.join': '{name} 入座（下一輪開始參與）。',
  'log.leave': '{name} 已離線。',
  'log.rejoin': '{name} 已重新連線。',
  'log.reshuffle': '重新洗牌（{n} 張）。',
  'log.gameover': '遊戲結束。贏家：{name}。',
  'log.gameoverHouse': '遊戲結束，莊家勝出。',

  'game.end': '結束遊戲',
  'game.leave': '離開牌枱',
  'game.closeRoom': '關閉房間',

  'over.eyebrow': '遊戲結束',
  'over.bust': '今次莊家勝出',
  'over.brokeBank': '你贏到莊家見底！',
  'over.winner': '{name} 通殺全場',
  'over.leader': '結算時由 {name} 領先',
  'over.ended': '最終排名',
  'over.again': '再玩一局',
  'over.waitHost': '等待房主開新一局…',
  'over.home': '返回主頁',

  'confirm.cancel': '取消',
  'confirm.leaveTitle': '離開這張牌枱？',
  'confirm.leaveText': '進行中的牌局將不會保留。',
  'confirm.closeTitle': '關閉房間？',
  'confirm.closeText': '房內所有玩家都會斷線。',
  'confirm.endTitle': '即時結束遊戲？',
  'confirm.endText': '將以現時的籌碼數目作為最終排名。',

  'drawer.title': '典故及規則',
  'drawer.origin': '典故',
  'drawer.rules': '規則',
  'drawer.stats': '統計',

  'stats.empty': '暫時未有牌局記錄。玩幾手之後再回來看看。',
  'stats.lede': '本局即時數據。',
  'stats.hands': '已玩手數',
  'stats.winRate': '射門成功率',
  'stats.postHits': '撞柱次數',
  'stats.biggestWin': '單手最高贏額',
  'stats.biggestPot': '最大彩池',
  'stats.wagered': '累計投注',
  'stats.by': '由 {name} 贏得',
  'stats.outcomes': '各手結果',
  'stats.o.win': '過門',
  'stats.o.miss': '射偏',
  'stats.o.post': '撞柱',
  'stats.o.nogate': '無門',
  'stats.player': '玩家',
  'stats.chips': '籌碼',
  'stats.wins': '勝',
  'stats.posts': '撞柱',
  'setup.potMode': '彩池規則',
  'pot.standard': '標準彩池',
  'pot.standardDesc': '傳統玩法：注碼不可超過彩池；彩池見底就重新收底注。',
  'pot.free': '自由玩・無莊家',
  'pot.freeDesc': '只受自己的籌碼限制。彩池不夠賠的部分由系統補足，彩池見底亦不會中斷。',
  'pot.short.standard': '標準彩池',
  'pot.short.free': '自由玩',
  'stats.allTime': '此裝置累計',
  'stats.since': '自 {date} 起・共 {games} 局',
  'stats.reset': '重設統計',
  'stats.thisGame': '本局',
  'stats.winsTotal': '勝',
  'stats.losses': '負',
  'stats.net': '淨輸贏',
  'stats.netSub': '已扣除底注 {antes}',
  'stats.housePaid': '系統補賠',
  'stats.netCol': '淨輸贏',
  'confirm.resetTitle': '重設累計統計？',
  'confirm.resetText': '將清除儲存在此裝置上的累計數據，進行中的牌局不受影響。',
  'toast.statsReset': '統計已重設',

  'toast.reshuffle': '重新洗牌：{n} 張',
  'toast.join': '{name} 加入牌枱',
  'toast.rejoin': '{name} 已重新連線',
  'toast.leave': '{name} 已離線',
  'toast.copied': '已複製',

  'err.unknownAction': '無法識別此操作。',
  'err.badPlayer': '找不到此玩家。',
  'err.duplicate': '此座位已有人。',
  'err.full': '牌枱已滿（6 人）。',
  'err.badPhase': '現在未能進行此操作，請稍候。',
  'err.needPlayers': '最少需要 2 位玩家。',
  'err.notYourTurn': '尚未輪到你。',
  'err.badBet': '注碼超出範圍。',
  'err.needCall': '請先選擇買大或買細。',
  'err.emptyDeck': '牌靴已沒有牌。',
  'err.badCode': '房號由四個英文字母組成。',
  'err.rejected': '房主拒絕了連線。',

  'net.creating': '正在建立房間…',
  'net.joining': '正在連線至 {code}…',
  'net.libLoad': '無法載入連線組件，請檢查網絡連線。',
  'net.roomNotFound': '找不到此房號，請向房主確認。',
  'net.timeout': '連線逾時，請再試一次。',
  'net.full': '房間已滿。',
  'net.noCode': '未能取得房號，請再試一次。',
  'net.browser-incompatible': '此瀏覽器不支援 WebRTC。',
  'net.duplicate': '你已在另一個瀏覽器分頁入座。',
  'net.network': '無法連接配對伺服器。',
  'net.generic': '連線出現問題。',
  'net.hostClosed': '房主已關閉房間。',
  'net.hostLost': '與房主的連線已中斷。',
  'net.replaced': '此座位已在另一個分頁開啟。',

  'footer.tag': '只使用點數，不涉及真錢或獎品，純屬娛樂。',
  'footer.privacy': '私隱政策',

  'article.origin': `
    <p class="prose__kicker">射龍門 · Shoot the Dragon Gate</p>
    <h3>鯉躍龍門</h3>
    <p><strong>射龍門</strong>是香港人農曆新年最常玩的啤牌遊戲之一，在澳門、華南以至世界各地的華人社區同樣流行。西方亦有類似玩法，叫 <em>In-Between</em> 或 <em>Acey-Deucey</em>。</p>
    <p>名稱源自「鯉躍龍門」的古老傳說：黃河的鯉魚若能逆流而上、躍過龍門的瀑布，便會化身為龍。這句話至今仍用來祝福考生金榜題名、新人前程似錦。牌枱上，兩張門柱就是龍門，第三張牌就是鯉魚的那一躍。穿門而過，便有獎賞；撞中門柱，就要付出代價。</p>
    <h3>為何歷久不衰</h3>
    <p>只需一副牌，規則一分鐘就學會，但每一張牌都充滿緊張感。彩池是整個遊戲的核心：有人射偏，彩池就越滾越大；有人大膽出手，彩池就隨即縮水。每當彩池滿滿、又開出一道大門，全枱都會屏息以待。</p>
    <p>親友之間多數只押糖果、利是錢或者點數。真正的樂趣在於牌枱上的吆喝聲：開出 5–7 窄門時一片哀嘆，平日一向保守的姨媽在 A–K 大門上梭哈時全場歡呼。</p>
    <h3>每家規矩不同</h3>
    <p>每個家庭的玩法都略有不同：有些對柱撞柱要賠三倍，有些容許遇上窄門時放棄，有些遇到「無門」要重新派牌。本遊戲採用一套常見而平衡的規則，詳列於「規則」一頁，讓同枱每位玩家都依同一套規則進行。</p>
    <aside class="prose__note"><strong>只使用點數。</strong>本網站不涉及任何真錢、增值、兌換或獎品，每局籌碼都會重置。</aside>`,

  'article.rules': `
    <h3>牌面點數</h3>
    <p>不分花色，只計點數：<strong>A = 1</strong>，2–10 按牌面計算，<strong>J = 11、Q = 12、K = 13</strong>。</p>
    <h3>底注及彩池</h3>
    <p>每輪開始時，每位玩家先付<strong>底注</strong>放入中央彩池。贏的注碼由彩池支付，輸的注碼撥回彩池。若有人贏清彩池，便即時開始新一輪收底注。單人模式中，彩池就是<strong>莊家資金</strong>：每一手都要向莊家付底注，贏到莊家見底即告勝出。</p>
    <h3>輪到你時</h3>
    <ol>
      <li><strong>派門柱。</strong>翻開兩張牌，點數較細的放在左邊。</li>
      <li><strong>落注。</strong>最少 1，最多為你的籌碼或彩池，以較少者為準。</li>
      <li><strong>射門。</strong>翻開第三張牌。</li>
    </ol>
    <table>
      <thead><tr><th>第三張牌</th><th>結果</th></tr></thead>
      <tbody>
        <tr><td>落在兩柱中間</td><td><span class="pill pill--win">過門</span> 從彩池贏取與注碼相同的金額</td></tr>
        <tr><td>落在兩柱以外</td><td><span class="pill pill--miss">射偏</span> 注碼撥入彩池</td></tr>
        <tr><td>與任何一條門柱同點</td><td><span class="pill pill--post">撞柱</span> 賠<strong>雙倍</strong>注碼入彩池</td></tr>
      </tbody>
    </table>
    <h3>特殊情況</h3>
    <ul>
      <li><strong>兩柱相連（無門）：</strong>例如 5 和 6，中間放不下任何牌。此手作廢，直接輪到下一位，不設罰則。</li>
      <li><strong>兩柱相同（對柱）：</strong>例如 7 和 7，射門前要先選<em>買大</em>或<em>買細</em>。猜中就贏，猜錯就輸去注碼；如開出第三張 7，即屬撞柱，要賠雙倍。一對 A 只可買大，一對 K 只可買細。</li>
      <li><strong>雙倍罰則上限：</strong>撞柱最多只會賠清你手上的籌碼。如雙倍注碼多於你的籌碼，便全數賠出並出局。</li>
      <li><strong>籌碼用完：</strong>沒有籌碼的玩家出局，最後仍持有籌碼的玩家勝出。亦可隨時提早結束，以當時的籌碼排名。</li>
    </ul>
    <h3>自由玩（無莊家）</h3>
    <p>開局時選擇<strong>自由玩</strong>，就是不設彩池上限的輕鬆玩法：無論彩池有多少，都可以押上自己全部籌碼。贏得的金額若多於彩池，差額由系統補足；彩池見底亦不會強制重收底注。單人模式下莊家不會破產，遊戲只會在你輸清籌碼或主動結束時才完結。</p>
    <h3>牌靴選項</h3>
    <ul>
      <li><strong>1 副牌・牌少時重洗：</strong>52 張，少於 12 張時重洗。牌枱下方的點數長條會顯示尚餘張數，記牌有優勢。</li>
      <li><strong>1 副牌・每手重洗：</strong>每一手都是全新的 52 張，機會率永遠是教科書上的數字。</li>
      <li><strong>4 副牌・牌少時重洗：</strong>208 張，少於 15 張時重洗。對柱及撞柱會稍為常見。</li>
    </ul>
    <h3>看懂機會率</h3>
    <p>用一副新牌、兩柱點數不同時，尚餘 50 張。門內每個點數各有 4 張，兩個門柱點數各餘 3 張，所以撞柱的機會率大約都是 <strong>12%</strong>。</p>
    <table>
      <thead><tr><th>門</th><th>可贏點數</th><th>過門機會率</th></tr></thead>
      <tbody>
        <tr><td>A – K</td><td>11</td><td>88%</td></tr>
        <tr><td>2 – Q</td><td>9</td><td>72%</td></tr>
        <tr><td>3 – J</td><td>7</td><td>56%</td></tr>
        <tr><td>4 – 10</td><td>5</td><td>40%</td></tr>
        <tr><td>5 – 9</td><td>3</td><td>24%</td></tr>
        <tr><td>6 – 8</td><td>1</td><td>8%</td></tr>
      </tbody>
    </table>
    <p>一個好習慣：門闊少於約 7 個點數時落細注，遇上大門才加注。控制區上方的即時過門及撞柱機會率，是按牌靴內實際尚餘的牌計算。</p>
    <h3>網上房間</h3>
    <p>由房主的瀏覽器負責洗牌、派牌及管理彩池，其他玩家透過四個字母的房號直接連線至房主（點對點 WebRTC）。玩家斷線時會保留座位，在同一個瀏覽器分頁以同一房號重新加入便可返回座位；如輪到已斷線的玩家，等候 20 秒後會自動略過。</p>`,
};

// Simplified Chinese: simplified characters and mainland phrasing. Deliberately
// not spread from zhHK, so a missing key falls back to English, never to HK copy.
const zhCN = {
  'app.title': '射龙门',
  'brand.zh': '射龙门',
  'meta.title': "射龙门 Shoot the Dragon Gate｜免费在线扑克牌游戏・单人、同机多人、在线对战",
  'meta.description': "免费在线玩射龙门（Shoot the Dragon Gate）：发两张门柱，押第三张牌落在中间，撞柱赔双倍。支持单人挑战庄家、2–6 人同机轮流、四字房号在线对战，繁中／简中／English。纯点数娱乐，不涉真实金钱。",
  'guide.title': "典故与完整规则",
  'a11y.skip': '跳到主要内容',
  'nav.home': '首页',
  'nav.language': '语言',
  'nav.sound': '音效',
  'nav.theme': '浅色／深色',
  'nav.rules': '规则',
  'nav.back': '返回',
  'nav.close': '关闭',
  'room.label': '房号',
  'ads.label': '广告',

  'home.eyebrow': '春节牌桌经典',
  'home.lede': '先发两张门柱，押第三张牌落在两柱之间。撞到门柱，赔双倍。',
  'mode.single': '单人挑战',
  'mode.singleDesc': '你对庄家。在庄家吃光你之前，先把庄家赢到见底。',
  'mode.local': '同机多人',
  'mode.localDesc': '2–6 人共用一台设备、一个奖池，轮流传着玩。',
  'mode.online': '在线房间',
  'mode.onlineDesc': '点对点连接，免注册。把四个字母的房号分享给朋友。',
  'mode.host': '开房',
  'mode.join': '输入房号加入',
  'howto.title': '一手牌怎么玩',
  'howto.s1': '开门',
  'howto.s1d': '发两张牌当作门柱。A 算 1，K 算 13。',
  'howto.s2': '下注',
  'howto.s2d': '下注上限是你的筹码与奖池中较小者。门越宽，越值得重押。',
  'howto.s3': '射门',
  'howto.s3d': '落在两柱之间，从奖池赢钱；落在外面，输掉注码；与门柱同点，赔双倍。',
  'howto.more': '阅读典故与完整规则 →',

  'setup.nickname': '你的昵称',
  'setup.nicknamePh': '例如：跳龙门的鲤鱼',
  'setup.players': '玩家',
  'setup.addPlayer': '添加玩家',
  'setup.remove': '移除玩家',
  'setup.playerN': '玩家 {n}',
  'setup.deck': '牌靴',
  'setup.ante': '每轮底注',
  'setup.chips': '起始筹码',
  'setup.singleNote': '庄家资金为你起始筹码的两倍，每一手你都要付底注给庄家。',
  'setup.title.single': '挑战庄家',
  'setup.title.local': '开一桌',
  'setup.title.online': '创建房间',
  'setup.lede.single': '每手先付底注，从庄家那里赢筹码，直到把庄家赢到见底。',
  'setup.lede.local': '所有人把底注放进同一个奖池，轮到谁就把设备交给谁。',
  'setup.lede.online': '由你发牌、洗牌、管奖池。朋友输入房号即可加入。',
  'setup.submit.single': '发牌',
  'setup.submit.local': '开始游戏',
  'setup.submit.online': '创建房间',
  'setup.defaultSolo': '玩家',
  'setup.defaultHost': '房主',
  'setup.defaultGuest': '访客',
  'deck.singleLow': '1 副牌・牌少时重洗',
  'deck.singleLowDesc': '52 张。剩不到 12 张时重新洗牌，记牌有利。',
  'deck.singleEvery': '1 副牌・每手重洗',
  'deck.singleEveryDesc': '每一手都用洗好的完整 52 张，纯看概率。',
  'deck.fourLow': '4 副牌・牌少时重洗',
  'deck.fourLowDesc': '208 张，适合长时间对战。剩不到 15 张时重洗。',
  'deck.short.single-low': '1 副牌',
  'deck.short.single-every': '1 副・每手重洗',
  'deck.short.four-low': '4 副牌',

  'join.title': '加入房间',
  'join.lede': '向房主要屏幕上的四个字母房号。',
  'join.code': '房号',
  'join.submit': '加入',

  'lobby.eyebrow': '房号',
  'lobby.copyCode': '复制房号',
  'lobby.copyLink': '复制邀请链接',
  'lobby.players': '入座玩家',
  'lobby.settings': '本桌规则',
  'lobby.host': '房主',
  'lobby.empty': '等待朋友加入…',
  'lobby.postRule': '撞柱罚则',
  'lobby.start': '开始游戏',
  'lobby.ready': '游戏开始后仍可加入。',
  'lobby.needMore': '至少需要 2 位玩家，快分享房号吧。',
  'lobby.waitHost': '等待房主开局…',

  'table.leftPost': '门柱',
  'table.ball': '射门',
  'table.rightPost': '门柱',
  'hud.pot': '奖池',
  'hud.bank': '庄家',
  'hud.shoe': '牌靴剩 {n} / {total} 张',

  'board.title': '记分板',
  'board.you': '你',
  'board.offline': '已离线',
  'board.nextRound': '下一轮加入',
  'board.out': '筹码用尽',
  'board.playing': '出手中',
  'board.record': '{w} 胜・撞柱 {h}',

  'turn.you': '你',
  'turn.yourDeal': '轮到你：发门柱',
  'turn.dealing': '准备发牌',
  'turn.yourBet': '轮到你：下注',
  'turn.betting': '正在考虑下注',
  'turn.res.win': '射门成功',
  'turn.res.miss': '射偏了',
  'turn.res.post': '撞柱！',
  'turn.res.nogate': '无门，跳过',
  'turn.res.skip': '回合跳过',
  'turn.paused': '等待玩家重新连接',
  'turn.gameover': '游戏结束',
  'turn.round': '第 {n} 轮',

  'stamp.win': '过门',
  'stamp.miss': '射偏',
  'stamp.post': '撞柱',
  'stamp.nogate': '无门',
  'stamp.skip': '跳过',
  'result.win': '{name} 射门成功，赢得 {amount}。',
  'result.miss': '{name} 射偏，{amount} 进入奖池。',
  'result.post': '{name} 撞柱！赔 {amount}（注码 {mult} 倍）。',
  'result.nogate': '两柱相连，无门可射。{name} 不罚跳过。',
  'result.skip': '{name} 的回合被跳过。',

  'range.left': '{rank}：剩 {n} 张',
  'range.idle': '长条显示牌靴中各点数剩余张数',
  'range.nogate': '两柱相连，没有门可以射',
  'range.odds': '过门 {win}・撞柱 {post}',
  'range.oddsPair': '比大 {high}・比小 {low}・撞柱 {post}',
  'range.oddsCall': '过门 {win}・撞柱 {post}',

  'ctl.passTo': '请把设备交给 {name}',
  'ctl.deal': '发门柱',
  'ctl.dealHint': '两柱相连可免罚跳过。本轮底注：{ante}。',
  'ctl.waitDeal': '等待 {name} 发牌',
  'ctl.waitBet': '{name} 正在瞄准',
  'ctl.eyeing': '考虑押 {bet}',
  'ctl.higher': '比大',
  'ctl.lower': '比小',
  'ctl.callLabel': '比大或比小',
  'ctl.pairTitle': '对柱 {rank}：猜大小',
  'ctl.pickCall': '先选比大或比小',
  'ctl.bet': '注码',
  'ctl.less': '减少注码',
  'ctl.more': '增加注码',
  'ctl.min': '最小',
  'ctl.max': '全押',
  'ctl.shoot': '射门',
  'ctl.shootFor': '押 {bet} 射门',
  'ctl.risk': '过门 +{win}・射偏 −{win}・撞柱 −{post}',
  'ctl.nextUp': '下一位：{name}',
  'ctl.paused': '牌桌暂停，等待玩家重新连接。',

  'log.title': '牌局记录',
  'log.start': '新局开始：{n} 人入座。',
  'log.round': '第 {round} 轮：底注共 {total} 放入奖池。',
  'log.deal': '{name} 开门：{a} 至 {b}。',
  'log.pair': '{name} 开出对柱：{a} 与 {b}。',
  'log.nogate': '{name}：{a}、{b} 相连，无门。',
  'log.win': '{name} 押 {bet}，开出 {ball}：过门，赢 {amount}。',
  'log.miss': '{name} 押 {bet}，开出 {ball}：射偏，赔 {amount}。',
  'log.post': '{name} 押 {bet}，开出 {ball}：撞柱，赔 {amount}。',
  'log.skip': '{name} 的回合被跳过。',
  'log.join': '{name} 入座（下一轮开始参加）。',
  'log.leave': '{name} 离线。',
  'log.rejoin': '{name} 回来了。',
  'log.reshuffle': '重新洗牌（{n} 张）。',
  'log.gameover': '游戏结束。赢家：{name}。',
  'log.gameoverHouse': '游戏结束，庄家获胜。',

  'game.end': '结束游戏',
  'game.leave': '离开牌桌',
  'game.closeRoom': '关闭房间',

  'over.eyebrow': '游戏结束',
  'over.bust': '这次庄家赢了',
  'over.brokeBank': '你把庄家赢到见底了！',
  'over.winner': '{name} 通杀全场',
  'over.leader': '结算时由 {name} 领先',
  'over.ended': '最终排名',
  'over.again': '再来一局',
  'over.waitHost': '等待房主开新局…',
  'over.home': '回到菜单',

  'confirm.cancel': '留下',
  'confirm.leaveTitle': '离开这一桌？',
  'confirm.leaveText': '进行中的牌局将会丢失。',
  'confirm.closeTitle': '关闭房间？',
  'confirm.closeText': '房内所有玩家都会断线。',
  'confirm.endTitle': '现在结束游戏？',
  'confirm.endText': '将以当前筹码数作为最终排名。',

  'drawer.title': '典故与规则',
  'drawer.origin': '典故',
  'drawer.rules': '规则',
  'drawer.stats': '统计',

  'stats.empty': '还没有牌局记录。先玩几手再回来看。',
  'stats.lede': '本局实时数据。',
  'stats.hands': '已玩手数',
  'stats.winRate': '射门成功率',
  'stats.postHits': '撞柱次数',
  'stats.biggestWin': '单手最大赢额',
  'stats.biggestPot': '最大奖池',
  'stats.wagered': '累计下注',
  'stats.by': '由 {name}',
  'stats.outcomes': '各手结果',
  'stats.o.win': '过门',
  'stats.o.miss': '射偏',
  'stats.o.post': '撞柱',
  'stats.o.nogate': '无门',
  'stats.player': '玩家',
  'stats.chips': '筹码',
  'stats.wins': '胜',
  'stats.posts': '撞柱',
  'setup.potMode': '奖池规则',
  'pot.standard': '标准奖池',
  'pot.standardDesc': '传统玩法：注码不可超过奖池，奖池见底就重新收底注。',
  'pot.free': '自由玩・无庄家',
  'pot.freeDesc': '只受自己的筹码限制。奖池不够赔的部分由系统补足，奖池见底也不中断。',
  'pot.short.standard': '标准奖池',
  'pot.short.free': '自由玩',
  'hud.noLimit': '无上限',
  'stats.allTime': '本设备累计',
  'stats.since': '自 {date} 起・共 {games} 局',
  'stats.reset': '重置统计',
  'stats.thisGame': '本局',
  'stats.winsTotal': '胜',
  'stats.losses': '负',
  'stats.net': '筹码净值',
  'stats.netSub': '已扣底注 {antes}',
  'stats.housePaid': '系统补赔',
  'stats.netCol': '净值',
  'confirm.resetTitle': '重置累计统计？',
  'confirm.resetText': '将清除这台设备上保存的累计数据，进行中的牌局不受影响。',
  'toast.statsReset': '统计已重置',

  'toast.reshuffle': '重新洗牌：{n} 张',
  'toast.join': '{name} 加入牌桌',
  'toast.rejoin': '{name} 重新连接',
  'toast.leave': '{name} 已离线',
  'toast.copied': '已复制',

  'err.unknownAction': '无法识别的操作。',
  'err.badPlayer': '找不到这位玩家。',
  'err.duplicate': '这个座位已有人。',
  'err.full': '牌桌已满（6 人）。',
  'err.badPhase': '现在不能这么做，请稍候。',
  'err.needPlayers': '至少需要 2 位玩家。',
  'err.notYourTurn': '还没轮到你。',
  'err.badBet': '注码超出范围。',
  'err.needCall': '请先选比大或比小。',
  'err.emptyDeck': '牌靴没牌了。',
  'err.badCode': '房号是四个英文字母。',
  'err.rejected': '房主拒绝了连接。',

  'net.creating': '正在创建房间…',
  'net.joining': '正在连接到 {code}…',
  'net.libLoad': '无法加载联机组件，请检查网络。',
  'net.roomNotFound': '找不到这个房号，请向房主确认。',
  'net.timeout': '连接超时，请再试一次。',
  'net.full': '房间已满。',
  'net.noCode': '无法获取房号，请再试一次。',
  'net.browser-incompatible': '这个浏览器不支持 WebRTC。',
  'net.duplicate': '你已经在另一个标签页入座了。',
  'net.network': '无法连到匹配服务器。',
  'net.generic': '连接出现问题。',
  'net.hostClosed': '房主关闭了房间。',
  'net.hostLost': '与房主的连接中断。',
  'net.replaced': '这个座位已在其他标签页打开。',

  'footer.tag': '仅使用点数，不涉及真实金钱或奖品，纯属娱乐。',
  'footer.privacy': '隐私政策',

  'article.origin': `
    <p class="prose__kicker">射龙门 · Shoot the Dragon Gate</p>
    <h3>鲤跃龙门</h3>
    <p><strong>射龙门</strong>是台湾、香港、华南以及世界各地华人社群过年时最常见的扑克游戏之一。西方也有近亲玩法，叫作 <em>In-Between</em> 或 <em>Acey-Deucey</em>。</p>
    <p>名字取自“鲤跃龙门”的古老传说：黄河的鲤鱼若能逆流而上、跃过龙门的瀑布，便会化身为龙。这句话至今仍用来祝福考生金榜题名、新人鹏程万里。牌桌上，两张门柱就是龙门，第三张牌是鲤鱼的那一跃。穿门而过，便有赏；撞上门柱，就得付出代价。</p>
    <h3>为什么历久不衰</h3>
    <p>只要一副牌、一分钟就能学会的规则，却每一张牌都充满张力。奖池是整个游戏的核心：有人射偏，奖池就变肥；有人大胆出手，奖池就缩水。每当奖池满满、又开出一道大门时，全桌都会屏息。</p>
    <p>家人朋友之间多半押糖果、红包里的硬币，或只是点数。真正的乐趣在于牌桌上的吆喝：开出 5–7 窄门时的哀嚎，平时保守的阿姨在 A–K 大门上全押时的欢呼。</p>
    <h3>各家规矩不同</h3>
    <p>每个家庭的玩法都略有差异：有的对柱撞柱要赔三倍，有的允许遇到窄门时放弃，有的遇到“无门”要重发。本版本采用常见而平衡的一套规则，详列于“规则”标签页，让同桌每个人玩的都是同一套游戏。</p>
    <aside class="prose__note"><strong>仅使用点数。</strong>本站不涉及任何真实金钱、充值、兑换或奖品，每局筹码都会重置。</aside>`,

  'article.rules': `
    <h3>牌面点数</h3>
    <p>不分花色，只比点数：<strong>A = 1</strong>，2–10 照牌面，<strong>J = 11、Q = 12、K = 13</strong>。</p>
    <h3>底注与奖池</h3>
    <p>每一轮开始时，每位玩家先付<strong>底注</strong>放入中央奖池。赢的钱从奖池付出，输的钱放回奖池。若有人把奖池赢光，立刻开始新一轮收底注。单人模式中，奖池就是<strong>庄家资金</strong>：每一手都要付底注给庄家，把庄家赢到见底即获胜。</p>
    <h3>轮到你时</h3>
    <ol>
      <li><strong>发门柱。</strong>翻开两张牌，点数小的放左边。</li>
      <li><strong>下注。</strong>最少 1，最多为你的筹码与奖池中较小的一方。</li>
      <li><strong>射门。</strong>翻开第三张牌。</li>
    </ol>
    <table>
      <thead><tr><th>第三张牌</th><th>结果</th></tr></thead>
      <tbody>
        <tr><td>落在两柱之间</td><td><span class="pill pill--win">过门</span> 从奖池赢得等同注码</td></tr>
        <tr><td>落在两柱之外</td><td><span class="pill pill--miss">射偏</span> 注码放入奖池</td></tr>
        <tr><td>与任一门柱同点</td><td><span class="pill pill--post">撞柱</span> 赔<strong>双倍</strong>注码进奖池</td></tr>
      </tbody>
    </table>
    <h3>特殊情况</h3>
    <ul>
      <li><strong>两柱相连（无门）：</strong>例如 5 与 6，中间放不下任何牌。这手作废，直接换下一位，不罚。</li>
      <li><strong>两柱相同（对柱）：</strong>例如 7 与 7，射门前要先猜<em>比大</em>或<em>比小</em>。猜对赢、猜错输注码；开出第三张 7 则撞柱赔双倍。一对 A 只能比大，一对 K 只能比小。</li>
      <li><strong>双倍罚上限：</strong>撞柱最多赔光你手上的筹码。若双倍注码超过你的筹码，就全数赔出并出局。</li>
      <li><strong>筹码用尽：</strong>没有筹码的玩家出局，最后仍持有筹码的人获胜。也可以随时提前结束，以当下筹码排名。</li>
    </ul>
    <h3>自由玩（无庄家）</h3>
    <p>开局时选择<strong>自由玩</strong>，就是不设奖池上限的轻松玩法：无论奖池有多少，都可以押到自己的全部筹码。赢的金额超过奖池时，差额由系统补足；奖池见底也不会强制重收底注。单人模式下庄家不会破产，游戏只会在你输光或主动结束时结束。</p>
    <h3>牌靴选项</h3>
    <ul>
      <li><strong>1 副牌・牌少时重洗：</strong>52 张，剩不到 12 张时重洗。牌桌下方的点数长条会显示剩余张数，记牌有利。</li>
      <li><strong>1 副牌・每手重洗：</strong>每一手都是全新的 52 张，概率永远是教科书数字。</li>
      <li><strong>4 副牌・牌少时重洗：</strong>208 张，剩不到 15 张时重洗。对柱与撞柱会稍微常见一些。</li>
    </ul>
    <h3>看懂概率</h3>
    <p>使用一副新牌、两柱不同点时，还剩 50 张。门内每个点数各有 4 张，两个门柱点数各剩 3 张，所以撞柱概率大约都是 <strong>12%</strong>。</p>
    <table>
      <thead><tr><th>门</th><th>可赢点数</th><th>过门概率</th></tr></thead>
      <tbody>
        <tr><td>A – K</td><td>11</td><td>88%</td></tr>
        <tr><td>2 – Q</td><td>9</td><td>72%</td></tr>
        <tr><td>3 – J</td><td>7</td><td>56%</td></tr>
        <tr><td>4 – 10</td><td>5</td><td>40%</td></tr>
        <tr><td>5 – 9</td><td>3</td><td>24%</td></tr>
        <tr><td>6 – 8</td><td>1</td><td>8%</td></tr>
      </tbody>
    </table>
    <p>一个好习惯：门宽少于约 7 个点数时小注，大门时加码。控制区上方显示的实时过门与撞柱概率，是根据牌靴中实际剩下的牌计算的。</p>
    <h3>在线房间</h3>
    <p>由房主的浏览器负责洗牌、发牌与管理奖池，其他玩家通过四个字母的房号直接连到房主（点对点 WebRTC）。玩家断线时座位会保留，在同一个标签页用同一个房号重新加入即可回座；若轮到断线玩家，等待 20 秒后会自动跳过。</p>`,
};

/** Exported for the SEO pre-render script (scripts/build-seo.mjs). */
export const DICTS = { 'zh-HK': zhHK, 'zh-CN': zhCN, en };

let lang = 'zh-HK';

function detect() {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (LANGS.includes(saved)) return saved;
    if (saved === 'zh-TW') return 'zh-HK'; // preference saved before the HK localisation
  } catch {
    /* ignore */
  }
  for (const l of navigator.languages ?? [navigator.language]) {
    const low = String(l).toLowerCase();
    // Traditional Chinese (HK, MO, TW, Hant) is served in Hong Kong usage.
    if (low.startsWith('zh')) return /(cn|sg|hans)/.test(low) ? 'zh-CN' : 'zh-HK';
    if (low.startsWith('en')) return 'en';
  }
  return 'zh-HK';
}

export function t(key, vars) {
  let s = DICTS[lang]?.[key] ?? en[key] ?? key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
  return s;
}

export function getLang() {
  return lang;
}

export function applyDom(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => (el.textContent = t(el.dataset.i18n)));
  root.querySelectorAll('[data-i18n-html]').forEach((el) => (el.innerHTML = t(el.dataset.i18nHtml)));
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    for (const pair of el.dataset.i18nAttr.split(';')) {
      const [attr, key] = pair.split(':');
      if (attr && key) el.setAttribute(attr.trim(), t(key.trim()));
    }
  });
}

export function setLang(next) {
  if (!LANGS.includes(next)) return;
  lang = next;
  try {
    localStorage.setItem(STORE_KEY, next);
  } catch {
    /* ignore */
  }
  document.documentElement.lang = next;
  applyDom();
  document.dispatchEvent(new CustomEvent('langchange', { detail: next }));
}

export function init() {
  lang = detect();
  document.documentElement.lang = lang;
  applyDom();
}
