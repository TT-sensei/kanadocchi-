export const STAGES = [
  { id: 'kuttsuki', name: 'くっつきことば', short: 'は・を・へ', description: 'ぶんに ぴったりな もじを えらぼう', icon: '🔗', color: '#ff7b67', badge: 'kuttsuki-clear' },
  { id: 'youon', name: 'ちいさい「ゃゅょ」', short: 'ゃ・ゅ・ょ', description: 'ちいさい もじを みつけよう', icon: '🔍', color: '#7b6cf6', badge: 'youon-clear' },
  { id: 'sokuon', name: 'ちいさい「っ」', short: 'ちいさい っ', description: 'つまる おとを みつけよう', icon: '🐾', color: '#14a98b', badge: 'sokuon-clear' },
  { id: 'choon', name: 'のばすおと', short: 'う・お・い・え', description: 'のばす おとの かきかたを えらぼう', icon: '🎈', color: '#e59b18', badge: 'choon-clear' }
];

const q = (id, stage, question, choices, answer, image, speak = null) => ({
  id, stage, question, choices, answer, image, speak: speak || question.replace('（　）', '')
});

const relocateSokuon = (word) => {
  const chars = [...word];
  const sokuonIndex = chars.indexOf('っ');
  if (sokuonIndex < 0) return `${word}っ`;
  const base = chars.filter((char) => char !== 'っ');
  const targetIndex = sokuonIndex === base.length ? 0 : base.length;
  return [...base.slice(0, targetIndex), 'っ', ...base.slice(targetIndex)].join('');
};

const sokuonChoices = (word) => [word, relocateSokuon(word)];
const sq = (id, question, answer, image, speak = null) =>
  q(id, 'sokuon', question, sokuonChoices(answer), 0, image, speak);

export const QUESTIONS = [
  // くっつきことば：は/わ、を/お、へ/えを、文脈から選ぶ。正しい方を左右に混ぜる。
  q('k01', 'kuttsuki', 'わたし（　）いちねんせいです。', ['は', 'わ'], 0, '🙋', 'わたしは いちねんせいです'),
  q('k02', 'kuttsuki', 'きょう（　）はれです。', ['わ', 'は'], 1, '☀️', 'きょうは はれです'),
  q('k04', 'kuttsuki', 'みず（　）のみます。', ['お', 'を'], 1, '🥛', 'みずを のみます'),
  q('k05', 'kuttsuki', 'ほん（　）よみます。', ['を', 'お'], 0, '📖', 'ほんを よみます'),
  q('k06', 'kuttsuki', 'えんぴつ（　）つかいます。', ['お', 'を'], 1, '✏️', 'えんぴつを つかいます'),
  q('k07', 'kuttsuki', 'がっこう（　）いきます。', ['へ', 'え'], 0, '🏫', 'がっこうへ いきます'),
  q('k08', 'kuttsuki', 'こうえん（　）いきます。', ['え', 'へ'], 1, '🛝', 'こうえんへ いきます'),
  q('k09', 'kuttsuki', 'うち（　）かえります。', ['へ', 'え'], 0, '🏠', 'うちへ かえります'),
  q('k10', 'kuttsuki', 'ねこ（　）ねています。', ['わ', 'は'], 1, '🐈', 'ねこは ねています'),
  q('k11', 'kuttsuki', 'りんご（　）たべます。', ['を', 'お'], 0, '🍎', 'りんごを たべます'),
  q('k12', 'kuttsuki', 'としょかん（　）いきます。', ['え', 'へ'], 1, '📚', 'としょかんへ いきます'),
  q('k13', 'kuttsuki', 'ぼく（　）はしります。', ['は', 'わ'], 0, '🏃', 'ぼくは はしります'),
  q('k14', 'kuttsuki', 'は（　）みがきます。', ['お', 'を'], 1, '🪥', 'はを みがきます'),
  q('k15', 'kuttsuki', 'そら（　）とびます。', ['へ', 'え'], 0, '🕊️', 'そらへ とびます'),
  q('k16', 'kuttsuki', 'いぬ（　）げんきです。', ['わ', 'は'], 1, '🐕', 'いぬは げんきです'),
  // 「わ」「え」も、助詞ではなく言葉の一部になることを知る。
  q('k17', 'kuttsuki', '（　）が みずに います。', ['わに', 'はに'], 0, '🐊', 'わにが みずに います'),
  q('k18', 'kuttsuki', '（　）で えを ぬります。', ['えのぐ', 'へのぐ'], 0, '🎨', 'えのぐで えを ぬります'),
  q('k19', 'kuttsuki', '（　）を たべます。', ['おにぎり', 'をにぎり'], 0, '🍙', 'おにぎりを たべます'),
  q('k21', 'kuttsuki', 'うみで（　）を みつけました。', ['えび', 'へび'], 0, '🦐', 'うみで えびを みつけました'),
  q('k22', 'kuttsuki', '（　）は もりに います。', ['へび', 'えび'], 0, '🐍', 'へびは もりに います'),
  q('k23', 'kuttsuki', 'あさ（　）パンを たべます。', ['は', 'わ'], 0, '🍞', 'あさは パンを たべます'),
  q('k24', 'kuttsuki', 'おちゃ（　）のみます。', ['お', 'を'], 1, '🍵', 'おちゃを のみます'),
  q('k25', 'kuttsuki', 'がっこう（　）べんきょうします。', ['え', 'へ'], 1, '🏫', 'がっこうへ べんきょうします'),
  q('k26', 'kuttsuki', 'おとうさん（　）りんごを かいます。', ['わ', 'は'], 1, '🍎', 'おとうさんは りんごを かいます'),
  q('k27', 'kuttsuki', 'て（　）あらいます。', ['を', 'お'], 0, '🧼', 'てを あらいます'),
  q('k28', 'kuttsuki', 'こうえん（　）ともだちと あそびます。', ['え', 'へ'], 1, '🛝', 'こうえんへ ともだちと あそびます'),
  q('k29', 'kuttsuki', 'わたし（　）えんぴつを もちます。', ['わ', 'は'], 1, '✏️', 'わたしは えんぴつを もちます'),
  q('k30', 'kuttsuki', 'せんせい（　）おはなしを します。', ['は', 'わ'], 0, '🧑‍🏫', 'せんせいは おはなしを します'),

  // 拗音：短い文の空欄に、正しい語を入れる。
  q('y01', 'youon', '（　）しんを とります。', ['しゃ', 'しゅ'], 0, '📷', 'しゃしんを とります'),
  q('y02', 'youon', '（　）くだいを します。', ['しゅ', 'しゃ'], 0, '✏️', 'しゅくだいを します'),
  q('y03', 'youon', '（　）うりを たべます。', ['きゅ', 'きゃ'], 0, '🥒', 'きゅうりを たべます'),
  q('y04', 'youon', '（　）べつを きります。', ['きゃ', 'きゅ'], 0, '🥬', 'きゃべつを きります'),
  q('y05', 'youon', 'でん（　）に のります。', ['しゃ', 'しゅ'], 0, '🚃', 'でんしゃに のります'),
  q('y06', 'youon', '（　）うにゅうを のみます。', ['ぎゅ', 'ぎゃ'], 0, '🥛', 'ぎゅうにゅうを のみます'),
  q('y07', 'youon', 'なつに（　）こうへ いきます。', ['りょ', 'りゅ'], 0, '🧳', 'なつに りょこうへ いきます'),
  q('y08', 'youon', '（　）うしつで べんきょうします。', ['きょ', 'きゅ'], 0, '🏫', 'きょうしつで べんきょうします'),
  q('y09', 'youon', '（　）ういんへ いきます。', ['びょ', 'びゅ'], 0, '🏥', 'びょういんへ いきます'),
  q('y10', 'youon', '（　）んけんを します。', ['じゃ', 'じゅ'], 0, '✊', 'じゃんけんを します'),
  q('y11', 'youon', '（　）うしゃを します。', ['ちゅ', 'ちゃ'], 0, '💉', 'ちゅうしゃを します'),
  q('y12', 'youon', '（　）くまで かぞえます。', ['ひゃ', 'ひゅ'], 0, '💯', 'ひゃくまで かぞえます'),
  q('y13', 'youon', '（　）うがくします。', ['にゅ', 'にゃ'], 0, '🎒', 'にゅうがくします'),
  q('y14', 'youon', 'えほんに（　）うが でます。', ['りゅ', 'りょ'], 0, '🐉', 'えほんに りゅうが でます'),
  q('y15', 'youon', '（　）うしょくを たべます。', ['きゅ', 'きょ'], 0, '🍱', 'きゅうしょくを たべます'),
  q('y16', 'youon', '（　）うざを つくります。', ['ぎょ', 'ぎゅ'], 0, '🥟', 'ぎょうざを つくります'),
  q('y17', 'youon', '（　）うしつで えを かきます。', ['きょ', 'きゅ'], 0, '🏫', 'きょうしつで えを かきます'),
  q('y18', 'youon', '（　）うりを うえます。', ['きゅ', 'きょ'], 0, '🥒', 'きゅうりを うえます'),
  q('y19', 'youon', '（　）こうへ いきます。', ['りょ', 'りゅ'], 0, '🧳', 'りょこうへ いきます'),
  q('y20', 'youon', '（　）うがっこうに いきます。', ['ちゅ', 'ちょ'], 0, '🎒', 'ちゅうがっこうに いきます'),
  q('y21', 'youon', 'せんせいの（　）ういを ききます。', ['ちゅ', 'ちょ'], 0, '👂', 'せんせいの ちゅういを ききます'),
  q('y22', 'youon', '（　）うしゃじょうで まちます。', ['ちゅ', 'ちゃ'], 0, '🚗', 'ちゅうしゃじょうで まちます'),
  q('y23', 'youon', '（　）うもんを ときます。', ['じゅ', 'じょ'], 0, '📝', 'じゅうもんを ときます'),
  q('y24', 'youon', '（　）うが そらを とびます。', ['りゅ', 'りょ'], 0, '🐉', 'りゅうが そらを とびます'),

  // 促音：正しい語と、同じ語の「っ」の位置を動かした語を比べる。
  sq('s01', '（　）で べんきょうします。', 'がっこう', '🏫', 'がっこうで べんきょうします'),
  sq('s02', 'はがきに（　）を はります。', 'きって', '✉️', 'はがきに きってを はります'),
  sq('s03', '（　）の おとが します。', 'らっぱ', '🎺', 'らっぱの おとが します'),
  sq('s04', 'でんしゃの（　）を かいます。', 'きっぷ', '🎫', 'でんしゃの きっぷを かいます'),
  sq('s05', '（　）が でました。', 'つき', '🌙', 'つきが でました'),
  sq('s06', '（　）で べんきょうします。', 'つくえ', '🪑', 'つくえで べんきょうします'),
  sq('s07', '（　）で あそびます。', 'さっかー', '⚽', 'さっかーで あそびます'),
  sq('s08', '（　）に おちゃを いれます。', 'こっぷ', '🥤', 'こっぷに おちゃを いれます'),
  sq('s09', '（　）で ねます。', 'べっど', '🛏️', 'べっどで ねます'),
  sq('s10', 'てを（　）で あらいます。', 'せっけん', '🧼', 'てを せっけんで あらいます'),
  sq('s11', '（　）を たべます。', 'まっちゃ', '🍵', 'まっちゃを たべます'),
  sq('s12', '（　）で おちゃを のみます。', 'きっさてん', '☕', 'きっさてんで おちゃを のみます'),
  sq('s13', 'とりの（　）が ひろがります。', 'つばさ', '🕊️', 'とりの つばさが ひろがります'),
  sq('s14', '（　）を きります。', 'つめ', '💅', 'つめを きります'),
  sq('s15', 'いぬが（　）を ふります。', 'しっぽ', '🐕', 'いぬが しっぽを ふります'),
  sq('s16', '（　）たべたいです。', 'もっと', '🍽️', 'もっと たべたいです'),
  sq('s17', '（　）を よみます。', 'ざっし', '📰', 'ざっしを よみます'),
  sq('s18', '（　）を かきます。', 'にっき', '📓', 'にっきを かきます'),
  sq('s19', 'おちた（　）を ひろいます。', 'はっぱ', '🍃', 'おちた はっぱを ひろいます'),
  sq('s20', 'ともだちと（　）に あるきます。', 'いっしょ', '🚶', 'ともだちと いっしょに あるきます'),
  sq('s21', '（　）まって ください。', 'ちょっと', '✋', 'ちょっと まって ください'),
  sq('s22', '（　）たべます。', 'いっぱい', '🍚', 'いっぱい たべます'),
  sq('s23', 'みちを（　）あるきます。', 'まっすぐ', '🛣️', 'みちを まっすぐ あるきます'),
  sq('s24', '（　）できます。', 'きっと', '⭐', 'きっと できます'),

  // 長音：短い文の空欄に、正しい語を入れる。
  q('c01', 'choon', '（　）が かえって きました。', ['おとうさん', 'おとおさん'], 0, '👨', 'おとうさんが かえって きました'),
  q('c02', 'choon', '（　）と あそびます。', ['おとうと', 'おとおと'], 0, '👦', 'おとうとと あそびます'),
  q('c03', 'choon', '（　）で あそびます。', ['こうえん', 'こおえん'], 0, '🛝', 'こうえんで あそびます'),
  q('c04', 'choon', 'あたまに（　）を かぶります。', ['ぼうし', 'ぼおし'], 0, '🧢', 'あたまに ぼうしを かぶります'),
  q('c05', 'choon', 'へやの（　）を します。', ['そうじ', 'そおじ'], 0, '🧹', 'へやの そうじを します'),
  q('c06', 'choon', '（　）に おはなしを ききます。', ['せんせい', 'せんせえ'], 0, '🧑‍🏫', 'せんせいに おはなしを ききます'),
  q('c07', 'choon', '（　）を みます。', ['とけい', 'とけえ'], 0, '🕰️', 'とけいを みます'),
  q('c08', 'choon', 'ともだちと（　）を みます。', ['えいが', 'ええが'], 0, '🎬', 'ともだちと えいがを みます'),
  q('c09', 'choon', 'ぞうは（　）です。', ['おおきい', 'おうきい'], 0, '🐘', 'ぞうは おおきいです'),
  q('c10', 'choon', 'もりに（　）が います。', ['おおかみ', 'おうかみ'], 0, '🐺', 'もりに おおかみが います'),
  q('c11', 'choon', 'やまが（　）です。', ['とおい', 'とうい'], 0, '🗻', 'やまが とおいです'),
  q('c12', 'choon', 'つめたい（　）を さわります。', ['こおり', 'こうり'], 0, '🧊', 'つめたい こおりを さわります'),
  q('c13', 'choon', '（　）に てを ふります。', ['おねえさん', 'おねいさん'], 0, '👩', 'おねえさんに てを ふります'),
  q('c14', 'choon', '（　）を さわります。', ['ほお', 'ほう'], 0, '😊', 'ほおを さわります'),
  q('c15', 'choon', 'りんごが（　）です。', ['おおい', 'おうい'], 0, '🍎', 'りんごが おおいです'),
  q('c16', 'choon', 'みちを（　）て いきます。', ['とおって', 'とうって'], 0, '🚪', 'みちを とおって いきます')
  q('c17', 'choon', '（　）を つかいます。', ['ほうき', 'ほおき'], 0, '🧹', 'ほうきを つかいます'),
  q('c18', 'choon', '（　）を たべます。', ['とうもろこし', 'とおもろこし'], 0, '🌽', 'とうもろこしを たべます'),
  q('c19', 'choon', '（　）せんせいに おじぎします。', ['こうちょう', 'こおちょう'], 0, '🧑‍🏫', 'こうちょうせんせいに おじぎします'),
  q('c20', 'choon', '（　）を かぞえます。', ['すうじ', 'すおじ'], 0, '🔢', 'すうじを かぞえます'),
  q('c21', 'choon', '（　）を みつけました。', ['ほうせき', 'ほおせき'], 0, '💎', 'ほうせきを みつけました'),
  q('c22', 'choon', '（　）さまが います。', ['おう', 'おお'], 0, '👑', 'おうさまが います'),
  q('c23', 'choon', '（　）を べんきょうします。', ['えいご', 'ええご'], 0, '📘', 'えいごを べんきょうします'),
  q('c24', 'choon', '（　）へ いきます。', ['どうぶつえん', 'どおぶつえん'], 0, '🦁', 'どうぶつえんへ いきます')
];

export const BADGES = [
  { id: 'kuttsuki-clear', name: 'ことば つなぎ', hint: 'くっつきことばを 1かい おわる', image: 'https://tt-sensei.github.io/edu-assets/assets/web/badges/japanese/words-connect/badge.webp' },
  { id: 'youon-clear', name: 'ちいさいもじ はっけん', hint: 'ちいさい「ゃゅょ」を 1かい おわる', image: 'https://tt-sensei.github.io/edu-assets/assets/web/badges/japanese/word-detective/badge.webp' },
  { id: 'sokuon-clear', name: 'ことばの リズム', hint: 'ちいさい「っ」を 1かい おわる', image: 'https://tt-sensei.github.io/edu-assets/assets/web/badges/japanese/language-rhythm/badge.webp' },
  { id: 'choon-clear', name: 'ていねい かな', hint: 'のばすおとを 1かい おわる', image: 'https://tt-sensei.github.io/edu-assets/assets/web/badges/japanese/careful-writing/badge.webp' },
  { id: 'first-step', name: 'はじめの いっぽ', hint: 'はじめて 10もん おわる', image: 'https://tt-sensei.github.io/edu-assets/assets/web/badges/common/first-step/badge.webp' },
  { id: 'two-stages', name: 'ふたつ クリア', hint: '2つの ステージを おわる', image: 'https://tt-sensei.github.io/edu-assets/assets/web/badges/common/clear/badge.webp' },
  { id: 'three-stages', name: 'あと ひとつ！', hint: '3つの ステージを おわる', image: 'https://tt-sensei.github.io/edu-assets/assets/web/badges/common/mission-complete/badge.webp' },
  { id: 'moji-master', name: 'もじマスター', hint: '4つの ステージを おわる', image: 'https://tt-sensei.github.io/edu-assets/assets/web/badges/common/mastery/badge.webp' },
  { id: 'score-five', name: 'いい ちょうし', hint: '1かいで 5もん せいかい', image: 'https://tt-sensei.github.io/edu-assets/assets/web/badges/common/great-answer/badge.webp' },
  { id: 'score-seven', name: 'しっかり かな', hint: '1かいで 7もん せいかい', image: 'https://tt-sensei.github.io/edu-assets/assets/web/badges/common/accuracy/badge.webp' },
  { id: 'score-nine', name: 'あと いっぽ！', hint: '1かいで 9もん せいかい', image: 'https://tt-sensei.github.io/edu-assets/assets/web/badges/common/champion/badge.webp' },
  { id: 'perfect', name: 'かんぺき！', hint: '10もん ぜんぶ せいかい', image: 'https://tt-sensei.github.io/edu-assets/assets/web/badges/common/perfect/badge.webp' },
  { id: 'play-two', name: 'もう いっかい', hint: 'あわせて 2かい あそぶ', image: 'https://tt-sensei.github.io/edu-assets/assets/web/badges/common/challenger/badge.webp' },
  { id: 'play-three', name: 'こつこつ かな', hint: 'あわせて 3かい あそぶ', image: 'https://tt-sensei.github.io/edu-assets/assets/web/badges/common/steady-progress/badge.webp' },
  { id: 'play-five', name: 'がんばりや', hint: 'あわせて 5かい あそぶ', image: 'https://tt-sensei.github.io/edu-assets/assets/web/badges/common/hard-worker/badge.webp' },
  { id: 'play-eight', name: 'れんしゅう めいじん', hint: 'あわせて 8かい あそぶ', image: 'https://tt-sensei.github.io/edu-assets/assets/web/badges/common/practice-master/badge.webp' },
  { id: 'play-twelve', name: 'かな しゅうかん', hint: 'あわせて 12かい あそぶ', image: 'https://tt-sensei.github.io/edu-assets/assets/web/badges/common/streak/badge.webp' },
  { id: 'play-twenty', name: 'ずっと ちょうせん', hint: 'あわせて 20かい あそぶ', image: 'https://tt-sensei.github.io/edu-assets/assets/web/badges/common/keep-going/badge.webp' },
  { id: 'correct-ten', name: '10この ことば', hint: 'あわせて 10もん せいかい', image: 'https://tt-sensei.github.io/edu-assets/assets/web/badges/common/knowledge/badge.webp' },
  { id: 'correct-twenty-five', name: 'ことばの め', hint: 'あわせて 25もん せいかい', image: 'https://tt-sensei.github.io/edu-assets/assets/web/badges/japanese/word-sprout/badge.webp' },
  { id: 'correct-fifty', name: 'ことばの き', hint: 'あわせて 50もん せいかい', image: 'https://tt-sensei.github.io/edu-assets/assets/web/badges/japanese/word-tree/badge.webp' },
  { id: 'correct-eighty', name: 'かな たんけんか', hint: 'あわせて 80もん せいかい', image: 'https://tt-sensei.github.io/edu-assets/assets/web/badges/japanese/language-explorer/badge.webp' },
  { id: 'correct-one-twenty', name: 'ことば しょくにん', hint: 'あわせて 120もん せいかい', image: 'https://tt-sensei.github.io/edu-assets/assets/web/badges/japanese/word-weaver/badge.webp' },
  { id: 'try-again', name: 'まちがいも だいじ', hint: 'まちがえても さいごまで がんばる', image: 'https://tt-sensei.github.io/edu-assets/assets/web/badges/common/try-again/badge.webp' },
  { id: 'review-correct', name: 'できたに かわった', hint: 'まえに まちがえた もんだいに せいかい', image: 'https://tt-sensei.github.io/edu-assets/assets/web/badges/japanese/self-correction/badge.webp' },
  { id: 'kuttsuki-twice', name: 'つなぎ はかせ', hint: 'くっつきことばを 2かい おわる', image: 'https://tt-sensei.github.io/edu-assets/assets/web/badges/common/connection/badge.webp' },
  { id: 'youon-twice', name: 'こもじ はかせ', hint: 'ちいさい「ゃゅょ」を 2かい おわる', image: 'https://tt-sensei.github.io/edu-assets/assets/web/badges/common/discovery/badge.webp' },
  { id: 'sokuon-twice', name: 'つまるおと はかせ', hint: 'ちいさい「っ」を 2かい おわる', image: 'https://tt-sensei.github.io/edu-assets/assets/web/badges/common/focus/badge.webp' },
  { id: 'choon-twice', name: 'のばすおと はかせ', hint: 'のばすおとを 2かい おわる', image: 'https://tt-sensei.github.io/edu-assets/assets/web/badges/common/observer/badge.webp' },
  { id: 'listen-three', name: 'みみで ことば', hint: '「きく」を 3かい つかう', image: 'https://tt-sensei.github.io/edu-assets/assets/web/badges/japanese/reading-aloud/badge.webp' }
];
