**PRD - Product Requirements Document**

**AquaWatch AI**

Sistem Pemantauan Sampah Sungai Berbasis Computer Vision

**IYREF 2026 Hackathon · Sub-Tema: Circular Economy & Waste Revolution**

Versi 1.0 · Mei 2026

# **1\. Overview**

AquaWatch AI adalah platform pemantauan sungai berbasis computer vision yang beroperasi secara real-time menggunakan jaringan kamera CCTV yang terpasang di titik-titik rawan sepanjang sungai Kota Surabaya. Sistem ini dibangun sebagai respons atas kondisi nyata di lapangan: penumpukan sampah di saluran air menjadi penyebab utama banjir, sementara sistem pengawasan yang ada masih sepenuhnya bergantung pada tenaga manusia dan bersifat reaktif.

Per April 2026, Wali Kota Surabaya Eri Cahyadi telah mengumumkan rencana pemasangan infrastruktur CCTV di sepanjang bantaran sungai. Namun infrastruktur ini belum dilengkapi analisis otomatis - pengawasannya masih manual. AquaWatch AI hadir untuk meng-upgrade CCTV yang sudah ada menggunakan kecerdasan buatan, sehingga setiap kamera menjadi sensor cerdas yang mampu mendeteksi anomali dan mengirimkan notifikasi ke petugas lapangan secara real-time.

## **Tujuan Utama**

- Mendeteksi keberadaan sampah padat (plastik, styrofoam, material lain) di permukaan air sungai secara otomatis menggunakan model deep learning.
- Mengirimkan notifikasi beserta bukti visual (screenshot otomatis) ke petugas lapangan saat anomali terdeteksi melampaui confidence threshold.
- Menyediakan web dashboard terpusat yang dapat diakses petugas dari mana saja untuk memantau seluruh titik kamera secara bersamaan.
- Memungkinkan intervensi preventif sebelum sampah menyumbat saluran dan memicu banjir, menggantikan pola penanganan reaktif yang selama ini berjalan.

## **Lingkup MVP (Fase 2 Hackathon)**

MVP difokuskan pada komponen inti yang dapat didemonstrasikan secara nyata dalam waktu yang tersedia:

- Deteksi sampah di permukaan air menggunakan YOLOv8 yang berjalan di atas video stream sungai.
- Auto-screenshot dan event logging ketika confidence threshold terlampaui.
- Web dashboard React untuk pemantauan multi-kamera dan riwayat kejadian.
- Sistem notifikasi via push notification (FCM) dan alert di dashboard.
- Simulasi minimal dua feed kamera berbeda untuk demonstrasi redundansi.

Fitur deteksi perilaku manusia (optical flow + trajectory) dicatat sebagai roadmap fitur lanjutan pasca-MVP.

## **Input Mode yang Didukung**

Sistem mendukung dua mode input video yang dapat digunakan secara bergantian:

| **Mode**                  | **Mekanisme**                                                                                                                                               | **Kapan Digunakan**                                               |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Mode A - Video Upload     | Pengguna mengunggah file video (MP4/AVI/MOV) melalui dashboard. Sistem memproses video frame-by-frame dan menampilkan hasil deteksi beserta timeline event. | Demo MVP, pengujian model, situasi tanpa infrastruktur CCTV fisik |
| Mode B - RTSP/HTTP Stream | Sistem terhubung ke URL stream kamera CCTV secara real-time dan memproses frame secara kontinu selama kamera aktif.                                         | Deployment produksi dengan infrastruktur CCTV Pemkot Surabaya     |

Untuk MVP Hackathon, Mode A (Video Upload) menjadi mode utama demonstrasi karena tidak memerlukan infrastruktur kamera fisik. Mode B diimplementasikan sebagai fitur tambahan jika waktu memungkinkan.

# **2\. Requirements**

## **Persyaratan Fungsional**

**F-00 · Input Video Upload (Mode Utama MVP)**

- Pengguna dapat mengunggah file video dengan format MP4, AVI, atau MOV melalui halaman dashboard.
- Ukuran file maksimal yang diterima: 200 MB. Sistem memvalidasi format dan ukuran sebelum memproses.
- Setelah upload, sistem memproses video secara asinkron frame-by-frame menggunakan model YOLOv8.
- Selama pemrosesan berlangsung, dashboard menampilkan progress bar persentase frame yang sudah dianalisis.
- Setelah selesai, sistem menampilkan: jumlah total event yang terdeteksi, timeline event berdasarkan timestamp video, dan gallery screenshot frame-frame yang mengandung anomali.
- Pengguna dapat mengunduh laporan hasil analisis video dalam format ringkasan (JSON atau PDF sederhana).

**F-01 · Deteksi Sampah pada Video**

- Sistem harus mampu memproses video yang diupload dengan kecepatan minimum 10 fps (diproses lebih cepat dari real-time karena tidak perlu menunggu stream).
- Model harus menghasilkan bounding box beserta confidence score untuk setiap objek sampah yang terdeteksi per frame.
- Sistem harus memiliki confidence threshold yang dapat dikonfigurasi (default: 0.6). Frame dengan deteksi di atas threshold dianggap mengandung anomali.
- Untuk menghindari penumpukan event dari frame yang hampir identik, sistem menerapkan event deduplication: event baru hanya dibuat jika jarak dari event sebelumnya minimal 2 detik dalam timeline video.

**F-02 · Event Generation & Screenshot Otomatis**

- Ketika deteksi melampaui threshold, sistem secara otomatis membuat event yang menyertakan: screenshot frame, nama & koordinat titik kamera, timestamp, dan kategori anomali.
- Setiap event disimpan ke database dan diteruskan ke sistem notifikasi.

**F-03 · Sistem Notifikasi**

- Petugas menerima push notification via Firebase Cloud Messaging (FCM) ke perangkat mobile.
- Alert juga ditampilkan secara real-time di web dashboard tanpa perlu refresh halaman (WebSocket atau Server-Sent Events).
- Notifikasi menyertakan: nama lokasi kamera, waktu kejadian, thumbnail screenshot, dan kategori anomali.

**F-04 · Web Dashboard**

- Dashboard menampilkan grid live feed dari seluruh titik kamera yang terhubung.
- Riwayat event dapat difilter berdasarkan rentang waktu, lokasi kamera, dan kategori anomali.
- Setiap event di riwayat dapat diklik untuk melihat detail lengkap beserta screenshot bukti.
- Status online/offline setiap kamera ditampilkan secara visual.

**F-05 · Manajemen Kamera**

- Admin dapat menambah, mengedit, dan menonaktifkan titik kamera melalui dashboard.
- Setiap kamera menyimpan atribut: nama lokasi, koordinat GPS, status aktif, dan URL stream.

## **Persyaratan Non-Fungsional**

- Latensi deteksi ke notifikasi: maksimal 10 detik dari saat anomali terjadi di frame video.
- Sistem harus mampu memproses minimal 2 stream video secara paralel untuk MVP.
- Dashboard harus responsif dan dapat diakses dari browser desktop maupun mobile.
- Semua event dan screenshot harus tersimpan persisten di database.
- Source code harus terdokumentasi dengan README instalasi dalam format .md di repositori GitHub.

# **3\. Core Features**

## **3.1 · Modul Computer Vision (Processing Layer)**

Ini adalah inti dari sistem. Bertugas mengonsumsi input video dan menghasilkan deteksi. Mendukung dua sub-mode:

**Sub-mode A: Video Upload Processing (Prioritas MVP)**

- Input: File video (MP4/AVI/MOV) yang diupload pengguna via dashboard.
- Pipeline: File disimpan sementara di server → dibuka dengan OpenCV (cv2.VideoCapture) → diproses frame-by-frame → setiap Nth frame diinferensikan oleh YOLOv8 (default N=6, setara ~5 fps dari video 30fps).
- Output per frame: Array \[{class, confidence, bbox_coords, frame_number, timestamp_in_video}\].
- Deduplication: Event hanya dibuat jika gap dari event sebelumnya >= 2 detik dalam timeline video, mencegah ratusan event dari scene sampah yang panjang.
- Hasil akhir: Ringkasan {total_frames, total_events, events: \[...\], processing_time} dikirim ke frontend setelah seluruh video selesai diproses.

**Sub-mode B: RTSP/HTTP Stream (Untuk Deployment Produksi)**

- Input: URL stream RTSP atau HTTP dari kamera CCTV.
- Pipeline: Stream dibuka dengan OpenCV → frame diambil secara kontinu → inferensi YOLOv8 dijalankan asinkron.
- Threshold engine: Jika confidence >= threshold DAN objek terdeteksi selama N frame berturut-turut (default N=3), sistem membuat event real-time.
- Fallback: Jika stream terputus, sistem mencatat status offline dan mencoba reconnect setiap 30 detik.

**Konfigurasi Model (Berlaku untuk Kedua Sub-mode)**

- Model: YOLOv8n atau YOLOv8s pretrained COCO, fine-tuned untuk deteksi sampah perairan.
- Confidence threshold: Default 0.6, dapat dikonfigurasi per sesi upload atau per kamera.
- Device: CPU (wajib berjalan tanpa GPU untuk portabilitas demo); GPU digunakan otomatis jika tersedia (CUDA/MPS).

## **3.2 · Backend & API (Decision Layer)**

Dibangun dengan FastAPI (Python), arsitektur event-driven, memproses stream dari banyak kamera secara paralel menggunakan asyncio.

- Endpoint stream processor: Menerima koneksi dari kamera, menjalankan inferensi YOLOv8, dan mempublish event ke message queue internal.
- Event service: Mengonsumsi event dari queue, menyimpan ke database, men-trigger screenshot, dan memanggil FCM API.
- REST API: CRUD untuk manajemen kamera, pengambilan riwayat event, dan konfigurasi threshold.
- WebSocket endpoint: Mendistribusikan event real-time ke dashboard yang sedang terbuka.

## **3.3 · Web Dashboard (Frontend Layer)**

Antarmuka utama petugas lapangan, dibangun dengan React.

- Live Monitor: Grid card per kamera menampilkan feed live (atau snapshot terkini) beserta status dan jumlah event hari ini.
- Alert Panel: Notifikasi real-time muncul di sudut layar ketika event baru masuk via WebSocket.
- Event Log: Tabel riwayat kejadian yang dapat difilter dan dipaginasi. Klik baris menampilkan modal detail dengan screenshot.
- Camera Management: Form tambah/edit kamera, toggle aktif/nonaktif.
- Settings: Konfigurasi confidence threshold per kamera.

## **3.4 · Sistem Notifikasi Mobile**

- Firebase Cloud Messaging (FCM) digunakan untuk push notification ke perangkat Android/iOS petugas.
- Payload notifikasi: { title: "\[ALERT\] Sampah Terdeteksi", body: "{lokasi} - {timestamp}", data: { event_id, screenshot_url } }.
- Untuk MVP: Jika integrasi FCM belum selesai, alert dashboard (3.3) menjadi fallback yang cukup untuk demonstrasi.

## **3.5 · Sistem Redundansi Lintas Titik**

- Setiap kamera memiliki status health yang di-ping setiap 30 detik.
- Jika kamera di hilir offline, dashboard menandai status "Offline" dan menggunakan data kamera upstream sebagai indikator kegentingan area tersebut.
- Semua event tetap disimpan secara lokal (database) sebelum dikirim, sehingga tidak ada data yang hilang jika koneksi internet sementara terputus.

# **4\. Strategi Dataset & Model**

Ini adalah salah satu aspek paling kritis dalam sistem. Berikut adalah strategi bertahap yang realistis untuk timeline hackathon.

## **4.1 · Dataset Publik (Base Training)**

Model dasar di-pretrain menggunakan dataset sampah publik yang sudah berlabel:

| **Dataset**                         | **Jumlah Data** | **Fokus**                                | **Relevansi**                        |
| ----------------------------------- | --------------- | ---------------------------------------- | ------------------------------------ |
| TrashNet (Stanford)                 | ~2.500 gambar   | Klasifikasi sampah (plastik, kaca, dll.) | Sedang - kondisi bersih/studio       |
| TACO (Trash Annotations in Context) | ~1.500 gambar   | Deteksi objek sampah di alam liar        | Lebih tinggi - konteks outdoor       |
| Floating Waste Dataset (Roboflow)   | ~800 gambar     | Sampah di permukaan air                  | Tinggi - paling relevan untuk sungai |
| Open Images V7 (subset sampah)      | Ratusan ribu    | Deteksi objek umum                       | Sedang - perlu filtering label       |

Rekomendasi: Prioritaskan Floating Waste Dataset dari Roboflow sebagai base, lalu augmentasi dengan TACO untuk variasi konteks outdoor. TrashNet dapat digunakan untuk augmentasi kelas plastik dan styrofoam.

## **4.2 · Fine-Tuning dengan Data Lokal**

Dataset publik memiliki distribusi visual yang sangat berbeda dari kondisi sungai Surabaya (air keruh, pencahayaan dinamis, pantulan tidak stabil). Fine-tuning dengan data lokal sangat kritis untuk akurasi di lapangan.

**Strategi Pengumpulan Data Lokal (untuk MVP):**

- Pengambilan screenshot atau klip video singkat dari YouTube/media sosial yang menampilkan kondisi sungai-sungai di Surabaya atau kota Indonesia lainnya dengan karakteristik serupa.
- Labeling manual menggunakan Roboflow Annotate (gratis) atau Label Studio (self-hosted). Target minimal 200-300 gambar berlabel untuk fine-tuning awal.
- Kelas yang dilabeli: plastik_botol, kantong_plastik, styrofoam, sampah_organik_mengapung, sampah_padat_lain.

**Augmentasi Data untuk Simulasi Kondisi Sungai:**

- Brightness & contrast variation: Mensimulasikan perubahan pencahayaan siang-sore-malam.
- Blur & noise: Mensimulasikan kualitas kamera CCTV yang bervariasi.
- Hue shift ke coklat/hijau: Mensimulasikan warna air sungai yang keruh.
- Gaussian noise overlay: Mensimulasikan pantulan permukaan air.

Augmentasi ini dapat dikonfigurasi langsung di Roboflow sebelum ekspor dataset, atau menggunakan library Albumentations di pipeline training.

## **4.3 · Transfer Learning Strategy**

Pipeline training menggunakan pendekatan transfer learning bertahap:

- Mulai dari YOLOv8n (nano) atau YOLOv8s (small) pretrained pada COCO - bobot awal sudah memahami bentuk objek umum.
- Fine-tune pada gabungan dataset publik (TrashNet + TACO + Floating Waste) selama ~50 epoch.
- Fine-tune lanjutan pada dataset lokal Surabaya (200-300 gambar) selama ~30 epoch dengan learning rate lebih kecil.
- Evaluasi menggunakan metrik mAP@0.5 pada validation set. Target minimum mAP 0.50 untuk MVP yang dapat didemonstrasikan.

Catatan untuk MVP: Jika waktu tidak memungkinkan untuk fine-tuning penuh, model YOLOv8 pretrained COCO sudah cukup untuk mendeteksi objek seperti botol dan kantong plastik dalam kondisi ideal - ini masih dapat didemonstrasikan kepada juri dengan catatan bahwa akurasi kondisi lapangan akan ditingkatkan dengan fine-tuning pasca-hackathon.

# **5\. User Flow**

## **Primary User: Petugas Lapangan Satgas DSDABM**

**Flow A · Upload & Analisis Video (Mode Utama MVP)**

- Petugas atau admin membuka halaman "Analisis Video" di dashboard.
- Petugas menekan tombol "Unggah Video" dan memilih file rekaman dari perangkat (MP4/AVI/MOV, maks. 200 MB).
- Sistem menampilkan preview video dan form opsional: nama lokasi, tanggal rekaman, confidence threshold.
- Petugas menekan "Mulai Analisis". Progress bar menampilkan persentase frame yang sudah diproses.
- Setelah selesai, halaman hasil menampilkan:
  - Ringkasan: jumlah event terdeteksi, durasi video, waktu pemrosesan.
  - Timeline horizontal: titik-titik waktu dalam video di mana anomali ditemukan - dapat diklik untuk jump ke frame tersebut.
  - Gallery screenshot: grid thumbnail semua frame yang mengandung deteksi, dilengkapi bounding box dan confidence score.
  - Tabel event detail: timestamp video, kategori, confidence score, status.
- Petugas dapat mengunduh ringkasan hasil atau menyimpan event ke Event Log untuk ditindaklanjuti.

**Flow B · Menerima & Menindaklanjuti Alert (Mode Stream)**

- Petugas menerima push notification di smartphone: "\[ALERT\] Sampah Terdeteksi - Kali Tebu Titik 3 - 14:32:07".
- Petugas membuka aplikasi dashboard melalui browser mobile atau desktop.
- Di halaman Event Log, petugas melihat alert terbaru dengan screenshot otomatis sebagai bukti visual.
- Petugas menekan tombol "Tandai Sedang Ditangani" untuk mengubah status event.
- Petugas bergerak ke lokasi yang tertera dan menangani penumpukan sampah.
- Setelah selesai, petugas menekan "Tandai Selesai" di dashboard dan opsional menambahkan catatan tindakan.

**Flow C · Monitoring Rutin via Dashboard**

- Petugas membuka dashboard di awal shift.
- Halaman Live Monitor menampilkan grid semua kamera aktif dengan status real-time.
- Kamera yang memiliki event belum ditangani ditandai dengan indikator merah.
- Petugas mengklik kamera tertentu untuk melihat feed dan riwayat event-nya.

**Flow D · Setup Titik Kamera Baru (Admin)**

- Admin membuka menu Camera Management di dashboard.
- Admin mengisi form: Nama Lokasi, Koordinat GPS, URL Stream RTSP, Confidence Threshold.
- Sistem memvalidasi koneksi ke stream. Jika berhasil, kamera muncul di Live Monitor.
- Admin mengaktifkan kamera. Sistem mulai memproses stream secara real-time.

# **6\. Architecture**

Sistem terdiri dari tiga lapisan utama yang saling terhubung:

## **6.1 · Gambaran Komponen**

| **Lapisan**        | **Komponen**  | **Teknologi**                                     | **Fungsi**                                                                              |
| ------------------ | ------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Processing Layer   | Vision Engine | Python 3.10+, YOLOv8 (Ultralytics), OpenCV        | Proses file video upload ATAU stream RTSP; jalankan inferensi YOLOv8; publish event     |
| Decision Layer     | Backend API   | FastAPI + Uvicorn, asyncio, WebSocket             | Terima upload video, serve REST API, trigger notifikasi, distribusi event via WebSocket |
| Decision Layer     | Task Queue    | FastAPI BackgroundTasks (MVP) / Celery (produksi) | Jalankan pemrosesan video secara asinkron agar upload endpoint tidak blocking           |
| Decision Layer     | Database      | SQLite (MVP lokal) / PostgreSQL (produksi)        | Simpan kamera, events, analysis_sessions, screenshot path, user data                    |
| Frontend Layer     | Web Dashboard | React + Vite + TailwindCSS                        | UI petugas: upload video, progress tracking, hasil analisis, live monitor, event log    |
| Notification Layer | Push Notif    | Firebase Cloud Messaging (FCM)                    | Kirim push notification ke mobile petugas (mode stream)                                 |
| Storage            | File Storage  | Local filesystem (MVP) / S3 (produksi)            | Simpan file video yang diupload (sementara) dan screenshot hasil deteksi                |

## **6.2 · Alur Data - Mode Video Upload (Prioritas MVP)**

- Pengguna memilih file video di dashboard dan mengisi form opsional (nama lokasi, tanggal, threshold).
- Frontend mengirim file via multipart/form-data ke endpoint POST /api/analyze.
- Backend menyimpan file sementara, membuat record analysis_session di database, lalu merespons dengan session_id.
- Backend menjalankan pemrosesan video secara asinkron (BackgroundTasks): OpenCV membuka file, YOLOv8 menginferensikan setiap Nth frame.
- Setiap kali event terdeteksi (deduplication 2 detik), backend menyimpan event + screenshot ke database dan filesystem, lalu mempublish progress update via WebSocket.
- Frontend menerima update progress via WebSocket dan memperbarui progress bar secara real-time.
- Setelah seluruh video selesai, backend mempublish status "completed" beserta ringkasan hasil.
- Frontend menampilkan halaman hasil: ringkasan, timeline, gallery screenshot, tabel event detail.

## **6.3 · Alur Data - Mode Stream Real-Time**

- Kamera CCTV mengirimkan video stream (RTSP/HTTP) ke Vision Engine secara kontinu.
- Vision Engine menjalankan YOLOv8 pada setiap Nth frame (configurable, default setiap 6 frame / ~5 fps).
- Jika deteksi memenuhi threshold selama N frame berturut-turut: Vision Engine membuat payload event dan memasukkannya ke internal queue.
- Event Service mengambil event dari queue, menyimpan ke database, dan menyimpan screenshot ke file storage.
- Event Service memanggil FCM API secara asinkron untuk push notification ke perangkat terdaftar.
- Event Service mempublish event ke WebSocket channel. Dashboard menampilkan alert real-time tanpa refresh.

## **6.4 · Catatan Arsitektur untuk MVP**

- Pemrosesan video upload menggunakan FastAPI BackgroundTasks (in-process) - tidak perlu Redis atau Celery untuk MVP.
- File video yang diupload dihapus dari server setelah pemrosesan selesai; hanya screenshot yang disimpan permanen.
- Progress update via WebSocket menggunakan endpoint yang sama dengan sistem notifikasi event stream - satu koneksi WS per sesi pengguna.
- Multi-kamera pada mode stream disimulasikan dengan menjalankan dua coroutine Vision Engine secara paralel menggunakan asyncio.

# **7\. Database Schema**

Berikut adalah tabel-tabel utama dalam sistem beserta atribut dan fungsinya.

## **Tabel: analysis_sessions**

Tabel khusus untuk menyimpan sesi analisis video yang diupload pengguna.

| **Kolom**            | **Tipe**     | **Constraint**    | **Deskripsi**                                    |
| -------------------- | ------------ | ----------------- | ------------------------------------------------ |
| id                   | INTEGER      | PK, AUTOINCREMENT | Primary key                                      |
| user_id              | INTEGER      | FK → users.id     | Pengguna yang mengupload video                   |
| original_filename    | VARCHAR(200) | NOT NULL          | Nama file asli yang diupload                     |
| location_name        | VARCHAR(100) |                   | Nama lokasi opsional yang diisi pengguna         |
| video_duration_sec   | FLOAT        |                   | Durasi video dalam detik (diisi setelah parsing) |
| total_frames         | INTEGER      |                   | Total frame dalam video                          |
| frames_processed     | INTEGER      | DEFAULT 0         | Frame yang sudah diproses (untuk progress bar)   |
| confidence_threshold | FLOAT        | DEFAULT 0.6       | Threshold yang digunakan saat analisis           |
| status               | VARCHAR(20)  | DEFAULT queued    | Status: queued / processing / completed / failed |
| total_events         | INTEGER      | DEFAULT 0         | Jumlah event yang ditemukan setelah selesai      |
| recorded_at          | DATE         |                   | Tanggal rekaman video (diisi pengguna, opsional) |
| created_at           | DATETIME     | NOT NULL          | Waktu sesi dibuat (upload dilakukan)             |
| completed_at         | DATETIME     |                   | Waktu analisis selesai                           |

## **Tabel: cameras**

| **Kolom**            | **Tipe**     | **Constraint**    | **Deskripsi**                                        |
| -------------------- | ------------ | ----------------- | ---------------------------------------------------- |
| id                   | INTEGER      | PK, AUTOINCREMENT | Primary key                                          |
| name                 | VARCHAR(100) | NOT NULL          | Nama lokasi kamera (contoh: Kali Tebu Titik 3)       |
| stream_url           | TEXT         | NOT NULL          | URL stream RTSP atau HTTP kamera                     |
| latitude             | FLOAT        | NOT NULL          | Koordinat GPS lintang                                |
| longitude            | FLOAT        | NOT NULL          | Koordinat GPS bujur                                  |
| confidence_threshold | FLOAT        | DEFAULT 0.6       | Threshold deteksi untuk kamera ini                   |
| is_active            | BOOLEAN      | DEFAULT TRUE      | Status kamera aktif atau nonaktif                    |
| created_at           | DATETIME     | NOT NULL          | Waktu kamera ditambahkan                             |
| last_seen_at         | DATETIME     |                   | Terakhir kali stream berhasil diakses (health check) |

## **Tabel: events**

| **Kolom**           | **Tipe**    | **Constraint**                      | **Deskripsi**                                              |
| ------------------- | ----------- | ----------------------------------- | ---------------------------------------------------------- |
| id                  | INTEGER     | PK, AUTOINCREMENT                   | Primary key                                                |
| camera_id           | INTEGER     | FK → cameras.id, NULLABLE           | Kamera sumber event (NULL jika dari video upload)          |
| session_id          | INTEGER     | FK → analysis_sessions.id, NULLABLE | Sesi analisis sumber event (NULL jika dari stream)         |
| category            | VARCHAR(50) | NOT NULL                            | Kategori anomali (waste_surface, dll.)                     |
| confidence_score    | FLOAT       | NOT NULL                            | Nilai confidence tertinggi dari deteksi pada frame         |
| screenshot_path     | TEXT        |                                     | Path file screenshot otomatis yang tersimpan               |
| detected_objects    | JSON        |                                     | Array bounding box dan kelas objek yang terdeteksi         |
| video_timestamp_sec | FLOAT       |                                     | Posisi waktu dalam video (khusus mode upload, dalam detik) |
| status              | VARCHAR(20) | DEFAULT pending                     | Status penanganan: pending / in_progress / resolved        |
| notes               | TEXT        |                                     | Catatan tindakan petugas saat menyelesaikan event          |
| occurred_at         | DATETIME    | NOT NULL                            | Waktu anomali terdeteksi (timestamp frame atau waktu real) |
| resolved_at         | DATETIME    |                                     | Waktu event ditandai selesai oleh petugas                  |

## **Tabel: users**

| **Kolom**     | **Tipe**     | **Constraint**    | **Deskripsi**                                   |
| ------------- | ------------ | ----------------- | ----------------------------------------------- |
| id            | INTEGER      | PK, AUTOINCREMENT | Primary key                                     |
| name          | VARCHAR(100) | NOT NULL          | Nama petugas                                    |
| email         | VARCHAR(150) | UNIQUE, NOT NULL  | Email untuk login                               |
| password_hash | TEXT         | NOT NULL          | Hash bcrypt dari password                       |
| role          | VARCHAR(20)  | DEFAULT officer   | Role: admin atau officer                        |
| fcm_token     | TEXT         |                   | Token FCM untuk push notification perangkat ini |
| created_at    | DATETIME     | NOT NULL          | Waktu akun dibuat                               |

## **Tabel: notification_logs**

| **Kolom** | **Tipe**    | **Constraint**    | **Deskripsi**                    |
| --------- | ----------- | ----------------- | -------------------------------- |
| id        | INTEGER     | PK, AUTOINCREMENT | Primary key                      |
| event_id  | INTEGER     | FK → events.id    | Event yang memicu notifikasi ini |
| user_id   | INTEGER     | FK → users.id     | Petugas yang menerima notifikasi |
| channel   | VARCHAR(20) | NOT NULL          | Kanal: fcm atau websocket        |
| status    | VARCHAR(20) | NOT NULL          | Status pengiriman: sent / failed |
| sent_at   | DATETIME    | NOT NULL          | Waktu notifikasi dikirim         |

# **8\. Design & Technical Constraints**

## **8.1 · Stack Teknologi**

| **Layer**      | **Pilihan Teknologi**                    | **Justifikasi**                                                                                                                        |
| -------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Vision Engine  | Python 3.10+, Ultralytics YOLOv8, OpenCV | Ekosistem paling matang untuk computer vision; YOLOv8 memiliki API Python yang sangat mudah digunakan untuk fine-tuning dan inferensi. |
| Backend API    | FastAPI + Uvicorn                        | Async-native, performa tinggi, built-in WebSocket support, dokumentasi otomatis dengan Swagger.                                        |
| Database       | SQLite (MVP) → PostgreSQL (produksi)     | SQLite tanpa setup untuk MVP lokal; migrasi ke PostgreSQL untuk deployment.                                                            |
| Frontend       | React + Vite + TailwindCSS               | Ekosistem matang, build cepat, komponen UI yang fleksibel.                                                                             |
| Notifikasi     | Firebase Cloud Messaging (FCM)           | Gratis, mendukung Android & iOS, SDK Python tersedia.                                                                                  |
| Training       | Google Colab (GPU gratis) + Roboflow     | Tidak memerlukan GPU lokal; Roboflow untuk manajemen dataset dan augmentasi.                                                           |
| Deployment MVP | Lokal / ngrok untuk demo                 | Deployment ke cloud bersifat opsional per guidebook; ngrok memudahkan demo live.                                                       |

## **8.2 · Batasan Teknis**

- Model YOLOv8 yang digunakan harus versi nano (YOLOv8n) atau small (YOLOv8s) untuk memastikan inferensi dapat berjalan di CPU standar tanpa GPU dedicated - penting untuk demo live.
- Frame rate pemrosesan untuk MVP ditetapkan minimum 5 fps; tidak perlu 30 fps karena sampah di sungai bergerak lambat.
- Ukuran screenshot yang disimpan dikompres ke maksimal 200 KB per file untuk menghemat storage selama demo.
- Semua komunikasi frontend-backend menggunakan HTTP/WebSocket lokal (localhost) untuk MVP; HTTPS diperlukan jika FCM diaktifkan karena service worker membutuhkan secure context.

## **8.3 · Kriteria Keberhasilan MVP**

| **Kriteria**                 | **Ukuran Keberhasilan**                                                                      | **Prioritas**    |
| ---------------------------- | -------------------------------------------------------------------------------------------- | ---------------- |
| Video upload berjalan        | Pengguna dapat mengupload file MP4 dan sistem memprosesnya tanpa error                       | WAJIB            |
| Deteksi sampah berfungsi     | Model menghasilkan bounding box pada video sungai dengan confidence yang terlihat bermakna   | WAJIB            |
| Progress real-time           | Progress bar di dashboard update secara live selama pemrosesan berlangsung                   | WAJIB            |
| Hasil ditampilkan            | Halaman hasil menampilkan jumlah event, timeline, dan gallery screenshot dengan bounding box | WAJIB            |
| Event & screenshot tersimpan | Semua event tercatat di database dan screenshot dapat dibuka                                 | WAJIB            |
| Mode stream (RTSP)           | Minimal satu kamera stream dapat diproses real-time                                          | DIUSAHAKAN       |
| Push notification FCM        | Notifikasi masuk ke smartphone petugas saat event stream terdeteksi                          | OPSIONAL (bonus) |
| Fine-tuning data lokal       | Model telah dilatih dengan data sungai Indonesia                                             | DIUSAHAKAN       |