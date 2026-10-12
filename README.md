# KataKita — Peta Kata Nusantara

Kamus 39 kata bahasa daerah Indonesia dalam dunia pixel 8-bit yang bisa diseret dan di-zoom. Klik pin berlian di peta buat buka kartu kata ala dialog NPC, kumpulkan favorit, selesaikan quest bareng **Pak Peta**.

**Live:** https://kayzenn123.github.io/agent-katakita/

## Fitur
- Peta Nusantara prosedural 8-bit (canvas, tanpa gambar raster): drag, zoom (wheel/pinch/tombol/keyboard), 39 pin kata
- Kartu kata: ejaan, bahasa, arti, contoh kalimat; simpan favorit, salin ringkasan, deep-link `?kata=`
- Quest "temukan 5 kata makan" + confetti pixel saat selesai
- Cari + filter bahasa (11) & arti (7); unduh favorit sebagai JSON
- Easter egg: ketik `horas` di pencarian
- localStorage berversi (`katakita-v1`) dengan validasi & fallback
- Toggle "Gerak: Nyala/Mati" + hormat `prefers-reduced-motion`; mode ringan otomatis (CPU/RAM kecil, Save-Data, FPS drop)

## Tech
HTML + CSS + JS tanpa build. GSAP 3.12.5 + ScrollTrigger (self-host). Font self-host (OFL): Kaisei Tokumin, Chiron GoRound TC, Tilt Prism via Fontsource. Ikon: pixel-art digambar sendiri sebagai SVG inline.

## Skor
- Lighthouse: (diisi setelah ukur)
- FPS CPU throttle 4x (scroll test): ±56 (lingkungan VM berisik: 34–58 antar run)
- Budget: JS ±115KB (gzip ±46KB), CSS ±10KB, font ±175KB raw, 0 gambar raster, 0 request eksternal

## Menjalankan lokal
```
python3 -m http.server 8000
# buka http://localhost:8000
```

## Kredit
Contoh kosakata umum sehari-hari (bisa beda tiap daerah/dialek) — bukan kamus akademik. Peta bergaya, bukan skala akurat.
