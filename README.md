# NewEra Web

Frontend React + TypeScript + Vite untuk menampilkan history market, paito, AI/BBFS, audit, evaluator, generator line, dan share prediction.

## Data flow

```text
Firestore collection: markets
  -> marketService.ts
  -> parse history/history_days
  -> local analytical details
  -> validated production-state overlay
  -> UI
```

Aplikasi membaca Firestore melalui REST dan mengikuti pagination `nextPageToken`. Jika live fetch gagal, aplikasi menggunakan `src/services/initialMarkets.json` sebagai cached fallback.

## Production prediction state

Backend Python adalah source-of-truth untuk prediction production. Web hanya menerima `next_prediction` Firestore jika metadata berikut cocok dengan history aktif:

- `engine_version === 2026.09.11-v2`
- `basis_draw_count === jumlah history aktif`
- `basis_last_draw === draw terakhir aktif`

State legacy atau stale ditolak dan UI memakai kalkulasi lokal sebagai fallback sampai backend memigrasikan state Firestore.

Server state yang valid dapat meng-overlay:

- AI tier 3/4/5/6
- BBFS tier 6/7/8/9
- dead digits
- Paito
- Pola Tarung
- Paito-BBFS7
- wheeling
- bobot calibration/tuning

## Audit

Untuk source `live`, hanya `last_audit` Firestore yang diperlakukan sebagai audit production. Jika audit production belum ada, UI tidak merekonstruksi audit lalu menyamarkannya sebagai audit live.

Timeline 7 periode adalah **rekonstruksi walk-forward diagnostik**, bukan log production Firestore.

## Evaluator

Panel Evaluasi menjalankan walk-forward engine lokal TypeScript. Hasilnya berguna untuk diagnostik out-of-sample lokal tetapi **tidak identik dengan histori performa engine production Python**.

Metrik Sniper/Super Sniper memisahkan:

- hit-rate saat sistem aktif menghasilkan line;
- participation rate;
- PnL terhadap seluruh periode.

Periode 0-line diperlakukan sebagai abstain untuk hit-rate, bukan miss.

## History/Paito

`history_data` berisi result 4D dan `history_days` menyimpan hari yang sejajar dengan setiap result. Jumlah/Biji 2D dihitung dari Kepala + Ekor lalu direduksi ke satu digit.

Contoh:

```text
Kepala 7 + Ekor 8 = 15 -> 1 + 5 = Biji 6
```

## Development

```bash
npm ci
npm run dev
```

Validasi production build:

```bash
npm run build
npm run lint
```

CI menjalankan `npm ci`, build, dan lint pada branch correctness serta `main`.
