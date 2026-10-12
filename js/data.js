/* Data kata daerah — contoh umum sehari-hari, bisa beda tiap daerah/dialek.
   Sumber: pengetahuan umum kosakata sehari-hari; bukan kamus akademik. */
const LANG_ANCHOR = {
  "Jawa": [0.42, 0.70], "Sunda": [0.33, 0.70], "Bali": [0.545, 0.735],
  "Aceh": [0.10, 0.28], "Minang": [0.17, 0.47], "Batak Toba": [0.13, 0.36],
  "Betawi": [0.355, 0.695], "Bugis": [0.635, 0.50], "Makassar": [0.615, 0.555],
  "Madura": [0.485, 0.68], "Banjar": [0.47, 0.53],
};
// [kata, bahasa, arti, contoh (+terjemahan), konsep]
const WORDS_RAW = [
 ["mangan","Jawa","makan","Aku wis mangan, kowe? — Aku sudah makan, kamu?","makan"],
 ["dahar","Sunda","makan (halus)","Hayu dahar sasarengan. — Ayo makan bersama.","makan"],
 ["ngajeng","Bali","makan (halus)","Tiang sampun ngajeng. — Saya sudah makan.","makan"],
 ["manre","Bugis","makan","Manreki' sibawa. — Mari makan bersama.","makan"],
 ["pajoh","Aceh","makan","Jak pajoh bu. — Ayo makan nasi.","makan"],
 ["ngakan","Madura","makan","Sengkok ngakan dhisik. — Saya makan dulu.","makan"],
 ["turu","Jawa","tidur","Aku arep turu dhisik. — Aku mau tidur dulu.","tidur"],
 ["saré","Sunda","tidur (halus)","Abdi bade saré. — Saya mau tidur.","tidur"],
 ["sirep","Bali","tidur (halus)","Tiang jagi sirep. — Saya mau tidur.","tidur"],
 ["tinro","Bugis & Makassar","tidur","Tinroko' dolo. — Tidurlah dulu.","tidur"],
 ["tedhung","Madura","tidur","Sengkok tedhung dulu. — Saya tidur dulu.","tidur"],
 ["éh","Aceh","tidur","Lôn éh dilee. — Saya tidur dulu.","tidur"],
 ["banyu","Jawa","air","Banyune adem. — Airnya dingin.","air"],
 ["cai","Sunda","air","Cai herang. — Airnya jernih.","air"],
 ["yeh","Bali","air","Yeh anget. — Air hangat.","air"],
 ["aeng","Madura","air","Aengnga' bannya'. — Airnya banyak.","air"],
 ["aia","Minang","air","Aia dingin. — Air dingin.","air"],
 ["ié","Aceh","air","Ié seujok. — Air sejuk.","air"],
 ["omah","Jawa","rumah","Omahku cedhak pasar. — Rumahku dekat pasar.","rumah"],
 ["imah","Sunda","rumah","Imahna ageung. — Rumahnya besar.","rumah"],
 ["umah","Bali","rumah","Umah tiange cenik. — Rumah saya kecil.","rumah"],
 ["rumoh","Aceh","rumah","Rumoh lôn di gampong. — Rumah saya di desa.","rumah"],
 ["bola","Bugis","rumah","Bolaku ri kampong. — Rumahku di kampung.","rumah"],
 ["balla","Makassar","rumah","Ballakku ri kampong. — Rumahku di kampung.","rumah"],
 ["matur nuwun","Jawa","terima kasih","Matur nuwun sanget. — Terima kasih banyak.","terima kasih"],
 ["hatur nuhun","Sunda","terima kasih","Hatur nuhun pisan. — Terima kasih banyak.","terima kasih"],
 ["matur suksma","Bali","terima kasih","Matur suksma. — Terima kasih.","terima kasih"],
 ["mauliate","Batak Toba","terima kasih","Mauliate godang. — Terima kasih banyak.","terima kasih"],
 ["teurimong geunaseh","Aceh","terima kasih","Teurimong geunaseh. — Terima kasih.","terima kasih"],
 ["tarimo kasih","Minang","terima kasih","Tarimo kasih banyak. — Terima kasih banyak.","terima kasih"],
 ["aku","Jawa","saya","Aku lunga pasar. — Saya pergi ke pasar.","saya"],
 ["abdi","Sunda","saya (halus)","Abdi badé angkat. — Saya mau berangkat.","saya"],
 ["tiang","Bali","saya (halus)","Tiang saking Bali. — Saya dari Bali.","saya"],
 ["ambo","Minang","saya","Ambo dari Padang. — Saya dari Padang.","saya"],
 ["ahu","Batak Toba","saya","Ahu sian Medan. — Saya dari Medan.","saya"],
 ["gue","Betawi","saya","Gue duluan ya. — Saya duluan ya.","saya"],
 ["iyya","Bugis","saya","Iyya' pole kampong. — Saya dari kampung.","saya"],
 ["lôn","Aceh","saya","Lôn jak u gampong. — Saya pergi ke desa.","saya"],
 ["ngaso","Betawi","istirahat","Ngaso dulu, capek. — Istirahat dulu, capek.","istirahat"],
];
function slug(s){ return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
const WORDS = (() => {
  const byLang = {};
  WORDS_RAW.forEach((w, i) => {
    const lang = w[1].split(' & ')[0];
    (byLang[lang] = byLang[lang] || []).push(i);
  });
  const slotOf = {};
  Object.values(byLang).forEach(ixs => ixs.forEach((wi, k) => slotOf[wi] = [k, ixs.length]));
  return WORDS_RAW.map((w, i) => {
    const [kata, bahasa, arti, contoh, konsep] = w;
    const anchor = LANG_ANCHOR[bahasa.split(' & ')[0]] || [0.5, 0.5];
    // sebar pin per bahasa dalam pola spiral (golden angle) biar tidak menumpuk
    const [k, n] = slotOf[i], R = 0.038, a = k * 2.39996;
    const rr = n === 1 ? 0 : R * (0.45 + 0.55 * (k / Math.max(n - 1, 1)));
    return {
      id: slug(kata) + '-' + slug(bahasa.split(' & ')[0]),
      kata, bahasa, arti, contoh, konsep,
      px: anchor[0] + Math.cos(a) * rr, py: anchor[1] + Math.sin(a) * rr * 0.75,
    };
  });
})();
const CONCEPTS = ["makan","tidur","air","rumah","terima kasih","saya","istirahat"];
const LANGS = [...new Set(WORDS.map(w => w.bahasa))];
