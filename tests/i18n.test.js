import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DICTS, LANGS } from '../js/i18n.js';

test('every language has exactly the same keys', () => {
  const keys = Object.keys(DICTS.en).sort();
  for (const lang of LANGS) assert.deepEqual(Object.keys(DICTS[lang]).sort(), keys, lang);
});

test('zh-HK uses Hong Kong vocabulary, not Taiwan or Mainland phrasing', () => {
  // [unwanted term, Hong Kong usage]
  const banned = [
    ['線上', '網上'], ['網路', '網絡'], ['螢幕', '屏幕'], ['元件', '組件'], ['隱私', '私隱'],
    ['首頁', '主頁'], ['紀錄', '記錄'], ['記分板', '計分板'], ['下注', '落注'], ['全押', '梭哈'],
    ['比大', '買大'], ['比小', '買細'], ['機率', '機會率'], ['儲值', '增值'], ['紅包', '利是'],
    ['牌桌', '牌枱'], ['一台', '一部'], ['開房', '建立房間'], ['發牌', '派牌'], ['裡', '裏'],
    ['軟體', '軟件'], ['行動裝置', '流動裝置'], ['手機', '智能手機'],
    ['地鐵', '港鐵'], ['設備', '裝置'], ['菜單', '選單'], ['默認', '預設'], ['質量', '質素'],
    ['信息', '訊息'], ['支持', '支援'], ['這麼', '這樣'], ['傳著', '傳着'],
  ];
  const hits = [];
  for (const [key, value] of Object.entries(DICTS['zh-HK'])) {
    for (const [bad, good] of banned) if (value.includes(bad)) hits.push(`${key}: "${bad}" → use ${good}`);
  }
  assert.deepEqual(hits, []);
});

test('zh-HK copy carries the Hong Kong terms players expect', () => {
  const hk = DICTS['zh-HK'];
  assert.equal(hk['mode.online'], '網上房間');
  assert.equal(hk['ctl.higher'], '買大');
  assert.equal(hk['ctl.lower'], '買細');
  assert.equal(hk['ctl.max'], '梭哈');
  assert.equal(hk['footer.privacy'], '私隱政策');
  assert.match(hk['article.origin'], /利是/);
});

test('zh-CN is not mixed with Traditional Chinese copy', () => {
  const traditionalOnly = /[們這個說開門龍關會來時們對發網]/;
  const leaks = Object.entries(DICTS['zh-CN'])
    .filter(([k]) => !['app.title', 'brand.zh'].includes(k))
    .filter(([, v]) => traditionalOnly.test(v.replace(/射龍門|Shoot the Dragon Gate/g, '')))
    .map(([k]) => k);
  assert.deepEqual(leaks, []);
});
