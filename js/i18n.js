/**
 * i18n.js — zh-TW / zh-CN / en dictionaries and DOM binding.
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

export const LANGS = ['zh-TW', 'zh-CN', 'en'];
const STORE_KEY = 'stg.lang';

const en = {
  'app.title': 'Shoot the Dragon Gate',
  'brand.zh': '射龍門',
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

const zhTW = {
  'app.title': '射龍門',
  'brand.zh': '射龍門',
  'a11y.skip': '跳到主要內容',
  'nav.home': '首頁',
  'nav.language': '語言',
  'nav.sound': '音效',
  'nav.theme': '淺色／深色',
  'nav.rules': '規則',
  'nav.back': '返回',
  'nav.close': '關閉',
  'room.label': '房號',
  'ads.label': '廣告',

  'home.eyebrow': '農曆新年牌桌經典',
  'home.lede': '先發兩張門柱，押第三張牌落在兩柱之間。撞到門柱，賠雙倍。',
  'mode.single': '單人挑戰',
  'mode.singleDesc': '你對莊家。在莊家吃光你之前，先把莊家贏到見底。',
  'mode.local': '同機多人',
  'mode.localDesc': '2–6 人共用一台裝置、一個彩池，輪流傳著玩。',
  'mode.online': '線上房間',
  'mode.onlineDesc': '點對點連線，免註冊。把四個字母的房號分享給朋友。',
  'mode.host': '開房',
  'mode.join': '輸入房號加入',
  'howto.title': '一手牌怎麼玩',
  'howto.s1': '開門',
  'howto.s1d': '發兩張牌當作門柱。A 算 1，K 算 13。',
  'howto.s2': '下注',
  'howto.s2d': '下注上限是你的籌碼與彩池中較小者。門越寬，越值得重押。',
  'howto.s3': '射門',
  'howto.s3d': '落在兩柱之間，從彩池贏錢；落在外面，輸掉注碼；與門柱同點，賠雙倍。',
  'howto.more': '閱讀典故與完整規則 →',

  'setup.nickname': '你的暱稱',
  'setup.nicknamePh': '例如：跳龍門的鯉魚',
  'setup.players': '玩家',
  'setup.addPlayer': '新增玩家',
  'setup.remove': '移除玩家',
  'setup.playerN': '玩家 {n}',
  'setup.deck': '牌靴',
  'setup.ante': '每輪底注',
  'setup.chips': '起始籌碼',
  'setup.singleNote': '莊家資金為你起始籌碼的兩倍，每一手你都要付底注給莊家。',
  'setup.title.single': '挑戰莊家',
  'setup.title.local': '開一桌',
  'setup.title.online': '建立房間',
  'setup.lede.single': '每手先付底注，從莊家那裡贏籌碼，直到把莊家贏到見底。',
  'setup.lede.local': '所有人把底注放進同一個彩池，輪到誰就把裝置交給誰。',
  'setup.lede.online': '由你發牌、洗牌、管彩池。朋友輸入房號即可加入。',
  'setup.submit.single': '發牌',
  'setup.submit.local': '開始遊戲',
  'setup.submit.online': '建立房間',
  'setup.defaultSolo': '玩家',
  'setup.defaultHost': '房主',
  'setup.defaultGuest': '訪客',
  'deck.singleLow': '1 副牌・牌少時重洗',
  'deck.singleLowDesc': '52 張。剩不到 12 張時重新洗牌，記牌有利。',
  'deck.singleEvery': '1 副牌・每手重洗',
  'deck.singleEveryDesc': '每一手都用洗好的完整 52 張，純看機率。',
  'deck.fourLow': '4 副牌・牌少時重洗',
  'deck.fourLowDesc': '208 張，適合長時間對戰。剩不到 15 張時重洗。',
  'deck.short.single-low': '1 副牌',
  'deck.short.single-every': '1 副・每手重洗',
  'deck.short.four-low': '4 副牌',

  'join.title': '加入房間',
  'join.lede': '向房主要螢幕上的四個字母房號。',
  'join.code': '房號',
  'join.submit': '加入',

  'lobby.eyebrow': '房號',
  'lobby.copyCode': '複製房號',
  'lobby.copyLink': '複製邀請連結',
  'lobby.players': '入座玩家',
  'lobby.settings': '本桌規則',
  'lobby.host': '房主',
  'lobby.empty': '等待朋友加入…',
  'lobby.postRule': '撞柱罰則',
  'lobby.start': '開始遊戲',
  'lobby.ready': '遊戲開始後仍可加入。',
  'lobby.needMore': '至少需要 2 位玩家，快分享房號吧。',
  'lobby.waitHost': '等待房主開局…',

  'table.leftPost': '門柱',
  'table.ball': '射門',
  'table.rightPost': '門柱',
  'hud.pot': '彩池',
  'hud.bank': '莊家',
  'hud.shoe': '牌靴剩 {n} / {total} 張',

  'board.title': '記分板',
  'board.you': '你',
  'board.offline': '已離線',
  'board.nextRound': '下一輪加入',
  'board.out': '籌碼用盡',
  'board.playing': '出手中',
  'board.record': '{w} 勝・撞柱 {h}',

  'turn.you': '你',
  'turn.yourDeal': '輪到你：發門柱',
  'turn.dealing': '準備發牌',
  'turn.yourBet': '輪到你：下注',
  'turn.betting': '正在考慮下注',
  'turn.res.win': '射門成功',
  'turn.res.miss': '射偏了',
  'turn.res.post': '撞柱！',
  'turn.res.nogate': '無門，跳過',
  'turn.res.skip': '回合略過',
  'turn.paused': '等待玩家重新連線',
  'turn.gameover': '遊戲結束',
  'turn.round': '第 {n} 輪',

  'stamp.win': '過門',
  'stamp.miss': '射偏',
  'stamp.post': '撞柱',
  'stamp.nogate': '無門',
  'stamp.skip': '略過',
  'result.win': '{name} 射門成功，贏得 {amount}。',
  'result.miss': '{name} 射偏，{amount} 進入彩池。',
  'result.post': '{name} 撞柱！賠 {amount}（注碼 {mult} 倍）。',
  'result.nogate': '兩柱相連，無門可射。{name} 不罰跳過。',
  'result.skip': '{name} 的回合被略過。',

  'range.left': '{rank}：剩 {n} 張',
  'range.idle': '長條顯示牌靴中各點數剩餘張數',
  'range.nogate': '兩柱相連，沒有門可以射',
  'range.odds': '過門 {win}・撞柱 {post}',
  'range.oddsPair': '比大 {high}・比小 {low}・撞柱 {post}',
  'range.oddsCall': '過門 {win}・撞柱 {post}',

  'ctl.passTo': '請把裝置交給 {name}',
  'ctl.deal': '發門柱',
  'ctl.dealHint': '兩柱相連可免罰跳過。本輪底注：{ante}。',
  'ctl.waitDeal': '等待 {name} 發牌',
  'ctl.waitBet': '{name} 正在瞄準',
  'ctl.eyeing': '考慮押 {bet}',
  'ctl.higher': '比大',
  'ctl.lower': '比小',
  'ctl.callLabel': '比大或比小',
  'ctl.pairTitle': '對柱 {rank}：猜大小',
  'ctl.pickCall': '先選比大或比小',
  'ctl.bet': '注碼',
  'ctl.less': '減少注碼',
  'ctl.more': '增加注碼',
  'ctl.min': '最小',
  'ctl.max': '全押',
  'ctl.shoot': '射門',
  'ctl.shootFor': '押 {bet} 射門',
  'ctl.risk': '過門 +{win}・射偏 −{win}・撞柱 −{post}',
  'ctl.nextUp': '下一位：{name}',
  'ctl.paused': '牌桌暫停，等待玩家重新連線。',

  'log.title': '牌局紀錄',
  'log.start': '新局開始：{n} 人入座。',
  'log.round': '第 {round} 輪：底注共 {total} 放入彩池。',
  'log.deal': '{name} 開門：{a} 至 {b}。',
  'log.pair': '{name} 開出對柱：{a} 與 {b}。',
  'log.nogate': '{name}：{a}、{b} 相連，無門。',
  'log.win': '{name} 押 {bet}，開出 {ball}：過門，贏 {amount}。',
  'log.miss': '{name} 押 {bet}，開出 {ball}：射偏，賠 {amount}。',
  'log.post': '{name} 押 {bet}，開出 {ball}：撞柱，賠 {amount}。',
  'log.skip': '{name} 的回合被略過。',
  'log.join': '{name} 入座（下一輪開始參加）。',
  'log.leave': '{name} 離線。',
  'log.rejoin': '{name} 回來了。',
  'log.reshuffle': '重新洗牌（{n} 張）。',
  'log.gameover': '遊戲結束。贏家：{name}。',
  'log.gameoverHouse': '遊戲結束，莊家獲勝。',

  'game.end': '結束遊戲',
  'game.leave': '離開牌桌',
  'game.closeRoom': '關閉房間',

  'over.eyebrow': '遊戲結束',
  'over.bust': '這次莊家贏了',
  'over.brokeBank': '你把莊家贏到見底了！',
  'over.winner': '{name} 通殺全場',
  'over.leader': '結算時由 {name} 領先',
  'over.ended': '最終排名',
  'over.again': '再來一局',
  'over.waitHost': '等待房主開新局…',
  'over.home': '回到選單',

  'confirm.cancel': '留下',
  'confirm.leaveTitle': '離開這一桌？',
  'confirm.leaveText': '進行中的牌局將會遺失。',
  'confirm.closeTitle': '關閉房間？',
  'confirm.closeText': '房內所有玩家都會斷線。',
  'confirm.endTitle': '現在結束遊戲？',
  'confirm.endText': '將以目前籌碼數作為最終排名。',

  'drawer.title': '典故與規則',
  'drawer.origin': '典故',
  'drawer.rules': '規則',
  'drawer.stats': '統計',

  'stats.empty': '還沒有牌局紀錄。先玩幾手再回來看。',
  'stats.lede': '本局即時數據。',
  'stats.hands': '已玩手數',
  'stats.winRate': '射門成功率',
  'stats.postHits': '撞柱次數',
  'stats.biggestWin': '單手最大贏額',
  'stats.biggestPot': '最大彩池',
  'stats.wagered': '累計下注',
  'stats.by': '由 {name}',
  'stats.outcomes': '各手結果',
  'stats.o.win': '過門',
  'stats.o.miss': '射偏',
  'stats.o.post': '撞柱',
  'stats.o.nogate': '無門',
  'stats.player': '玩家',
  'stats.chips': '籌碼',
  'stats.wins': '勝',
  'stats.posts': '撞柱',

  'toast.reshuffle': '重新洗牌：{n} 張',
  'toast.join': '{name} 加入牌桌',
  'toast.rejoin': '{name} 重新連線',
  'toast.leave': '{name} 已離線',
  'toast.copied': '已複製',

  'err.unknownAction': '無法辨識的動作。',
  'err.badPlayer': '找不到這位玩家。',
  'err.duplicate': '這個座位已有人。',
  'err.full': '牌桌已滿（6 人）。',
  'err.badPhase': '現在不能這麼做，請稍候。',
  'err.needPlayers': '至少需要 2 位玩家。',
  'err.notYourTurn': '還沒輪到你。',
  'err.badBet': '注碼超出範圍。',
  'err.needCall': '請先選比大或比小。',
  'err.emptyDeck': '牌靴沒牌了。',
  'err.badCode': '房號是四個英文字母。',
  'err.rejected': '房主拒絕了連線。',

  'net.creating': '正在建立房間…',
  'net.joining': '正在連線到 {code}…',
  'net.libLoad': '無法載入連線元件，請檢查網路。',
  'net.roomNotFound': '找不到這個房號，請向房主確認。',
  'net.timeout': '連線逾時，請再試一次。',
  'net.full': '房間已滿。',
  'net.noCode': '無法取得房號，請再試一次。',
  'net.browser-incompatible': '這個瀏覽器不支援 WebRTC。',
  'net.duplicate': '你已經在另一個分頁入座了。',
  'net.network': '無法連到配對伺服器。',
  'net.generic': '連線發生問題。',
  'net.hostClosed': '房主關閉了房間。',
  'net.hostLost': '與房主的連線中斷。',
  'net.replaced': '這個座位已在其他分頁開啟。',

  'footer.tag': '僅使用點數，不涉及真實金錢或獎品，純屬娛樂。',
  'footer.privacy': '隱私權',

  'article.origin': `
    <p class="prose__kicker">射龍門 · Shoot the Dragon Gate</p>
    <h3>鯉躍龍門</h3>
    <p><strong>射龍門</strong>是台灣、香港、華南以及世界各地華人社群過年時最常見的撲克遊戲之一。西方也有近親玩法，叫作 <em>In-Between</em> 或 <em>Acey-Deucey</em>。</p>
    <p>名字取自「鯉躍龍門」的古老傳說：黃河的鯉魚若能逆流而上、躍過龍門的瀑布，便會化身為龍。這句話至今仍用來祝福考生金榜題名、新人鵬程萬里。牌桌上，兩張門柱就是龍門，第三張牌是鯉魚的那一躍。穿門而過，便有賞；撞上門柱，就得付出代價。</p>
    <h3>為什麼歷久不衰</h3>
    <p>只要一副牌、一分鐘就能學會的規則，卻每一張牌都充滿張力。彩池是整個遊戲的核心：有人射偏，彩池就變肥；有人大膽出手，彩池就縮水。每當彩池滿滿、又開出一道大門時，全桌都會屏息。</p>
    <p>家人朋友之間多半押糖果、紅包裡的硬幣，或只是點數。真正的樂趣在於牌桌上的吆喝：開出 5–7 窄門時的哀號，平時保守的阿姨在 A–K 大門上全押時的歡呼。</p>
    <h3>各家規矩不同</h3>
    <p>每個家庭的玩法都略有差異：有的對柱撞柱要賠三倍，有的允許遇到窄門時放棄，有的遇到「無門」要重發。本版本採用常見而平衡的一套規則，詳列於「規則」分頁，讓同桌每個人玩的都是同一套遊戲。</p>
    <aside class="prose__note"><strong>僅使用點數。</strong>本站不涉及任何真實金錢、儲值、兌換或獎品，每局籌碼都會重置。</aside>`,

  'article.rules': `
    <h3>牌面點數</h3>
    <p>不分花色，只比點數：<strong>A = 1</strong>，2–10 照牌面，<strong>J = 11、Q = 12、K = 13</strong>。</p>
    <h3>底注與彩池</h3>
    <p>每一輪開始時，每位玩家先付<strong>底注</strong>放入中央彩池。贏的錢從彩池付出，輸的錢放回彩池。若有人把彩池贏光，立刻開始新一輪收底注。單人模式中，彩池就是<strong>莊家資金</strong>：每一手都要付底注給莊家，把莊家贏到見底即獲勝。</p>
    <h3>輪到你時</h3>
    <ol>
      <li><strong>發門柱。</strong>翻開兩張牌，點數小的放左邊。</li>
      <li><strong>下注。</strong>最少 1，最多為你的籌碼與彩池中較小的一方。</li>
      <li><strong>射門。</strong>翻開第三張牌。</li>
    </ol>
    <table>
      <thead><tr><th>第三張牌</th><th>結果</th></tr></thead>
      <tbody>
        <tr><td>落在兩柱之間</td><td><span class="pill pill--win">過門</span> 從彩池贏得等同注碼</td></tr>
        <tr><td>落在兩柱之外</td><td><span class="pill pill--miss">射偏</span> 注碼放入彩池</td></tr>
        <tr><td>與任一門柱同點</td><td><span class="pill pill--post">撞柱</span> 賠<strong>雙倍</strong>注碼進彩池</td></tr>
      </tbody>
    </table>
    <h3>特殊情況</h3>
    <ul>
      <li><strong>兩柱相連（無門）：</strong>例如 5 與 6，中間放不下任何牌。這手作廢，直接換下一位，不罰。</li>
      <li><strong>兩柱相同（對柱）：</strong>例如 7 與 7，射門前要先猜<em>比大</em>或<em>比小</em>。猜對贏、猜錯輸注碼；開出第三張 7 則撞柱賠雙倍。一對 A 只能比大，一對 K 只能比小。</li>
      <li><strong>雙倍罰上限：</strong>撞柱最多賠光你手上的籌碼。若雙倍注碼超過你的籌碼，就全數賠出並出局。</li>
      <li><strong>籌碼用盡：</strong>沒有籌碼的玩家出局，最後仍持有籌碼的人獲勝。也可以隨時提前結束，以當下籌碼排名。</li>
    </ul>
    <h3>牌靴選項</h3>
    <ul>
      <li><strong>1 副牌・牌少時重洗：</strong>52 張，剩不到 12 張時重洗。牌桌下方的點數長條會顯示剩餘張數，記牌有利。</li>
      <li><strong>1 副牌・每手重洗：</strong>每一手都是全新的 52 張，機率永遠是教科書數字。</li>
      <li><strong>4 副牌・牌少時重洗：</strong>208 張，剩不到 15 張時重洗。對柱與撞柱會稍微常見一些。</li>
    </ul>
    <h3>看懂機率</h3>
    <p>使用一副新牌、兩柱不同點時，還剩 50 張。門內每個點數各有 4 張，兩個門柱點數各剩 3 張，所以撞柱機率大約都是 <strong>12%</strong>。</p>
    <table>
      <thead><tr><th>門</th><th>可贏點數</th><th>過門機率</th></tr></thead>
      <tbody>
        <tr><td>A – K</td><td>11</td><td>88%</td></tr>
        <tr><td>2 – Q</td><td>9</td><td>72%</td></tr>
        <tr><td>3 – J</td><td>7</td><td>56%</td></tr>
        <tr><td>4 – 10</td><td>5</td><td>40%</td></tr>
        <tr><td>5 – 9</td><td>3</td><td>24%</td></tr>
        <tr><td>6 – 8</td><td>1</td><td>8%</td></tr>
      </tbody>
    </table>
    <p>一個好習慣：門寬少於約 7 個點數時小注，大門時加碼。控制區上方顯示的即時過門與撞柱機率，是根據牌靴中實際剩下的牌計算的。</p>
    <h3>線上房間</h3>
    <p>由房主的瀏覽器負責洗牌、發牌與管理彩池，其他玩家透過四個字母的房號直接連到房主（點對點 WebRTC）。玩家斷線時座位會保留，在同一個分頁用同一個房號重新加入即可回座；若輪到斷線玩家，等待 20 秒後會自動略過。</p>`,
};

// Simplified Chinese: same structure, simplified characters and mainland phrasing.
const zhCN = {
  ...zhTW,
  'app.title': '射龙门',
  'brand.zh': '射龙门',
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

const DICTS = { 'zh-TW': zhTW, 'zh-CN': zhCN, en };

let lang = 'zh-TW';

function detect() {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (LANGS.includes(saved)) return saved;
  } catch {
    /* ignore */
  }
  for (const l of navigator.languages ?? [navigator.language]) {
    const low = String(l).toLowerCase();
    if (low.startsWith('zh')) return /(cn|sg|hans)/.test(low) ? 'zh-CN' : 'zh-TW';
    if (low.startsWith('en')) return 'en';
  }
  return 'zh-TW';
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
  document.title = next === 'en' ? 'Shoot the Dragon Gate · 射龍門' : `${t('app.title')} · Shoot the Dragon Gate`;
  applyDom();
  document.dispatchEvent(new CustomEvent('langchange', { detail: next }));
}

export function init() {
  lang = detect();
  document.documentElement.lang = lang;
  document.title = lang === 'en' ? 'Shoot the Dragon Gate · 射龍門' : `${t('app.title')} · Shoot the Dragon Gate`;
  applyDom();
}
