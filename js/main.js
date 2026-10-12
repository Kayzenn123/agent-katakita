/* main.js — urutan init: konten dulu (cepat), gerak belakangan (idle) */
(function () {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lite = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4 ||
               (navigator.connection && navigator.connection.saveData);
  // Peta: kerja berat (buildLand) ditunda sampai idle; pin/click tetap siap
  KatakitaMap.init({ onPinOpen: id => KatakitaUI.openWord(id), reduced, lite });
  KatakitaUI.init();
  // Gerak: progressive enhancement — konten sudah terlihat dulu
  const startMotion = () => KatakitaMotion.init();
  if ('requestIdleCallback' in window) requestIdleCallback(startMotion, { timeout: 2000 });
  else setTimeout(startMotion, 300);
})();
