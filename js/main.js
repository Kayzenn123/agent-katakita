/* main.js — urutan init */
(function () {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lite = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4 ||
               (navigator.connection && navigator.connection.saveData);
  KatakitaMap.init({ onPinOpen: id => KatakitaUI.openWord(id), reduced, lite });
  KatakitaUI.init();
  KatakitaMotion.init();
})();
