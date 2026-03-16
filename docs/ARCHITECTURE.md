# Move League — Sistem Mimarisi Dokümanı

> **Durum:** Mimari Tasarım (Kod yazımı öncesi onay bekleniyor)
> **Versiyon:** 1.0
> **Tarih:** 16 Mart 2026

---

## 1. GENEL BAKIŞ

Move League, dansçıların birbirleriyle yarıştığı, atölyelere katıldığı, takımlar kurduğu ve sıralama merdivenlerinde yükseldiği küresel bir dans yarışma platformudur.

**Temel Özellikler:**
- Rekabetçi dans düelloları (Battle League)
- Atölye eğitim sistemi (Workshop)
- Takım dans yarışmaları (Move Shows)
- Rol tabanlı kullanıcı yönetimi
- Gerçek zamanlı bildirimler
- PWA desteği (ana ekrana kurulabilir mobil uygulama)
- Çoklu dil desteği (Türkçe / İngilizce)

---

## 2. TEKNOLOJİ STACK'İ

| Katman | Teknoloji | Gerekçe |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) | Vercel-native, SSR/SSG, PWA desteği |
| **UI Kütüphanesi** | Tailwind CSS + shadcn/ui | Mobil öncelikli, hızlı geliştirme |
| **Dil (i18n)** | next-intl | Türkçe/İngilizce çoklu dil |
| **Backend** | Next.js API Routes + Server Actions | Vercel üzerinde serverless |
| **Veritabanı** | Neon DB (Serverless PostgreSQL) | Vercel entegrasyonu, serverless uyumlu |
| **ORM** | Drizzle ORM | Type-safe, Neon DB uyumlu, hafif |
| **Kimlik Doğrulama** | NextAuth.js (Auth.js v5) | Rol tabanlı, sosyal giriş, email doğrulama |
| **Gerçek Zamanlı** | Vercel KV (Redis) + Web Push API | Bildirimler, canlı güncellemeler |
| **Dosya Depolama** | Vercel Blob veya Cloudflare R2 | Profil fotoğrafları, atölye videoları |
| **E-posta** | Resend | Transaksiyonel e-postalar |
| **Deployment** | Vercel | Otomatik CI/CD, Edge Network |
| **PWA** | next-pwa (Serwist) | Service Worker, offline destek |

---

## 3. PROJE KLASÖR YAPISI

```
move_league_v4/
├── public/
│   ├── icons/                    # PWA ikonları
│   ├── manifest.json             # PWA manifest
│   └── sw.js                     # Service Worker
├── src/
│   ├── app/
│   │   ├── [locale]/             # i18n route grubu (tr/en)
│   │   │   ├── (auth)/           # Giriş/Kayıt sayfaları
│   │   │   │   ├── giris/
│   │   │   │   ├── kayit/
│   │   │   │   └── email-dogrula/
│   │   │   ├── (platform)/       # Ana platform (auth gerekli)
│   │   │   │   ├── anasayfa/
│   │   │   │   ├── profil/
│   │   │   │   │   └── [id]/
│   │   │   │   ├── duellolar/
│   │   │   │   │   ├── yeni/
│   │   │   │   │   └── [id]/
│   │   │   │   ├── atolyeler/
│   │   │   │   │   ├── [id]/
│   │   │   │   │   └── olustur/
│   │   │   │   ├── takimlar/
│   │   │   │   │   ├── [id]/
│   │   │   │   │   └── olustur/
│   │   │   │   ├── yarisma/
│   │   │   │   │   └── [id]/
│   │   │   │   ├── siralama/
│   │   │   │   ├── bildirimler/
│   │   │   │   └── ayarlar/
│   │   │   └── (admin)/          # Admin paneli
│   │   │       └── yonetim/
│   │   │           ├── kullanicilar/
│   │   │           ├── duellolar/
│   │   │           ├── hakemler/
│   │   │           ├── sezonlar/
│   │   │           ├── yarisma/
│   │   │           └── atolyeler/
│   │   ├── api/
│   │   │   ├── auth/             # NextAuth API
│   │   │   ├── battles/          # Düello API
│   │   │   ├── workshops/        # Atölye API
│   │   │   ├── teams/            # Takım API
│   │   │   ├── competitions/     # Yarışma API
│   │   │   ├── rankings/         # Sıralama API
│   │   │   ├── notifications/    # Bildirim API
│   │   │   ├── users/            # Kullanıcı API
│   │   │   ├── judges/           # Hakem API
│   │   │   ├── studios/          # Stüdyo API
│   │   │   └── admin/            # Admin API
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                   # shadcn bileşenleri
│   │   ├── layout/               # Navbar, Sidebar, Footer
│   │   ├── battle/               # Düello bileşenleri
│   │   ├── workshop/             # Atölye bileşenleri
│   │   ├── team/                 # Takım bileşenleri
│   │   ├── profile/              # Profil bileşenleri
│   │   └── admin/                # Admin bileşenleri
│   ├── db/
│   │   ├── schema/               # Drizzle şema dosyaları
│   │   │   ├── users.ts
│   │   │   ├── battles.ts
│   │   │   ├── workshops.ts
│   │   │   ├── teams.ts
│   │   │   ├── competitions.ts
│   │   │   ├── ratings.ts
│   │   │   ├── notifications.ts
│   │   │   ├── seasons.ts
│   │   │   ├── badges.ts
│   │   │   └── studios.ts
│   │   ├── index.ts              # DB bağlantısı
│   │   └── migrations/           # Drizzle migration'lar
│   ├── lib/
│   │   ├── auth.ts               # NextAuth yapılandırması
│   │   ├── elo.ts                # ELO hesaplama
│   │   ├── validators.ts         # Zod şemaları
│   │   ├── utils.ts              # Yardımcı fonksiyonlar
│   │   ├── permissions.ts        # Rol bazlı yetkilendirme
│   │   └── notifications.ts      # Bildirim yardımcıları
│   ├── hooks/                    # React custom hooks
│   ├── messages/                 # i18n çeviri dosyaları
│   │   ├── tr.json
│   │   └── en.json
│   ├── types/                    # TypeScript tipleri
│   └── middleware.ts             # Auth + i18n middleware
├── drizzle.config.ts
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.local
```

---

## 4. VERİTABANI ŞEMASI (Neon DB — PostgreSQL)

### 4.1 Kullanıcılar ve Roller

```
┌─────────────────────────────────────────────────────┐
│ users                                               │
├─────────────────────────────────────────────────────┤
│ id              UUID  PK  DEFAULT gen_random_uuid()  │
│ email           VARCHAR(255)  UNIQUE  NOT NULL       │
│ password_hash   VARCHAR(255)                         │
│ name            VARCHAR(100)  NOT NULL               │
│ surname         VARCHAR(100)  NOT NULL               │
│ username        VARCHAR(50)   UNIQUE  NOT NULL       │
│ role            ENUM('dancer','coach','studio',      │
│                      'judge','admin')  NOT NULL      │
│ avatar_url      TEXT                                 │
│ city            VARCHAR(100)                         │
│ country         VARCHAR(100)                         │
│ gender          ENUM('male','female','other')        │
│ dance_style     VARCHAR(100)                         │
│ bio             TEXT                                 │
│ language        ENUM('tr','en')  DEFAULT 'tr'        │
│ email_verified  BOOLEAN  DEFAULT false               │
│ is_active       BOOLEAN  DEFAULT true                │
│ created_at      TIMESTAMP  DEFAULT now()             │
│ updated_at      TIMESTAMP  DEFAULT now()             │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ studios                                             │
├─────────────────────────────────────────────────────┤
│ id              UUID  PK                             │
│ owner_id        UUID  FK → users.id                  │
│ name            VARCHAR(200)  NOT NULL               │
│ description     TEXT                                 │
│ address         TEXT  NOT NULL                       │
│ city            VARCHAR(100)  NOT NULL               │
│ country         VARCHAR(100)  NOT NULL               │
│ phone           VARCHAR(20)                          │
│ photos          TEXT[]                               │
│ is_verified     BOOLEAN  DEFAULT false               │
│ is_available    BOOLEAN  DEFAULT true                │
│ created_at      TIMESTAMP  DEFAULT now()             │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ studio_availability                                 │
├─────────────────────────────────────────────────────┤
│ id              UUID  PK                             │
│ studio_id       UUID  FK → studios.id                │
│ day_of_week     INT  (0-6)                           │
│ start_time      TIME  NOT NULL                       │
│ end_time        TIME  NOT NULL                       │
│ is_available    BOOLEAN  DEFAULT true                │
└─────────────────────────────────────────────────────┘
```

### 4.2 Sezon Sistemi

```
┌─────────────────────────────────────────────────────┐
│ seasons                                             │
├─────────────────────────────────────────────────────┤
│ id              UUID  PK                             │
│ name            VARCHAR(100)  NOT NULL               │
│ start_date      DATE  NOT NULL                       │
│ end_date        DATE  NOT NULL                       │
│ is_active       BOOLEAN  DEFAULT false               │
│ created_at      TIMESTAMP  DEFAULT now()             │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ dancer_ratings                                      │
├─────────────────────────────────────────────────────┤
│ id              UUID  PK                             │
│ user_id         UUID  FK → users.id                  │
│ season_id       UUID  FK → seasons.id                │
│ rating          INT  DEFAULT 1000                    │
│ wins            INT  DEFAULT 0                       │
│ losses          INT  DEFAULT 0                       │
│ draws           INT  DEFAULT 0                       │
│ total_battles   INT  DEFAULT 0                       │
│ peak_rating     INT  DEFAULT 1000                    │
│ created_at      TIMESTAMP  DEFAULT now()             │
│ updated_at      TIMESTAMP  DEFAULT now()             │
│ UNIQUE(user_id, season_id)                           │
└─────────────────────────────────────────────────────┘
```

### 4.3 Düello (Battle) Sistemi

```
┌─────────────────────────────────────────────────────┐
│ battles                                             │
├─────────────────────────────────────────────────────┤
│ id              UUID  PK                             │
│ season_id       UUID  FK → seasons.id                │
│ challenger_id   UUID  FK → users.id                  │
│ opponent_id     UUID  FK → users.id                  │
│ studio_id       UUID  FK → studios.id  NULLABLE      │
│ judge_id        UUID  FK → users.id  NULLABLE        │
│ status          ENUM('pending','accepted','declined',│
│                      'studio_pending','studio_approved│
│                      'studio_rejected','scheduled',  │
│                      'judge_assigned','in_progress',  │
│                      'completed','cancelled')        │
│ scheduled_date  TIMESTAMP  NULLABLE                  │
│ challenger_score INT  NULLABLE                       │
│ opponent_score   INT  NULLABLE                       │
│ winner_id       UUID  FK → users.id  NULLABLE        │
│ rating_change   INT  NULLABLE                        │
│ created_at      TIMESTAMP  DEFAULT now()             │
│ updated_at      TIMESTAMP  DEFAULT now()             │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ battle_studio_preferences                           │
├─────────────────────────────────────────────────────┤
│ id              UUID  PK                             │
│ battle_id       UUID  FK → battles.id                │
│ user_id         UUID  FK → users.id                  │
│ studio_id       UUID  FK → studios.id                │
│ rank            INT  NOT NULL                        │
│ UNIQUE(battle_id, user_id, studio_id)                │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ battle_scores                                       │
├─────────────────────────────────────────────────────┤
│ id              UUID  PK                             │
│ battle_id       UUID  FK → battles.id                │
│ judge_id        UUID  FK → users.id                  │
│ dancer_id       UUID  FK → users.id                  │
│ technique       INT  (1-10)                          │
│ creativity      INT  (1-10)                          │
│ musicality      INT  (1-10)                          │
│ stage_presence  INT  (1-10)                          │
│ total_score     INT  GENERATED                       │
│ notes           TEXT                                 │
│ created_at      TIMESTAMP  DEFAULT now()             │
└─────────────────────────────────────────────────────┘
```

### 4.4 Atölye (Workshop) Sistemi

```
┌─────────────────────────────────────────────────────┐
│ workshops                                           │
├─────────────────────────────────────────────────────┤
│ id              UUID  PK                             │
│ coach_id        UUID  FK → users.id                  │
│ title           VARCHAR(200)  NOT NULL               │
│ description     TEXT                                 │
│ type            ENUM('live','video')  NOT NULL       │
│ dance_style     VARCHAR(100)                         │
│ difficulty      ENUM('beginner','intermediate',      │
│                      'advanced')                     │
│ price           DECIMAL(10,2)  DEFAULT 0             │
│ currency        ENUM('TRY','USD','EUR') DEFAULT 'TRY'│
│ thumbnail_url   TEXT                                 │
│ video_url       TEXT  NULLABLE                       │
│ max_participants INT  NULLABLE                       │
│ scheduled_date  TIMESTAMP  NULLABLE                  │
│ duration_minutes INT                                 │
│ is_published    BOOLEAN  DEFAULT false               │
│ is_approved     BOOLEAN  DEFAULT false               │
│ created_at      TIMESTAMP  DEFAULT now()             │
│ updated_at      TIMESTAMP  DEFAULT now()             │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ workshop_enrollments                                │
├─────────────────────────────────────────────────────┤
│ id              UUID  PK                             │
│ workshop_id     UUID  FK → workshops.id              │
│ user_id         UUID  FK → users.id                  │
│ status          ENUM('enrolled','completed',         │
│                      'cancelled')                    │
│ enrolled_at     TIMESTAMP  DEFAULT now()             │
│ completed_at    TIMESTAMP  NULLABLE                  │
│ UNIQUE(workshop_id, user_id)                         │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ workshop_reviews                                    │
├─────────────────────────────────────────────────────┤
│ id              UUID  PK                             │
│ workshop_id     UUID  FK → workshops.id              │
│ user_id         UUID  FK → users.id                  │
│ rating          INT  (1-5)                           │
│ comment         TEXT                                 │
│ created_at      TIMESTAMP  DEFAULT now()             │
│ UNIQUE(workshop_id, user_id)                         │
└─────────────────────────────────────────────────────┘
```

### 4.5 Takım ve Yarışma (Move Shows) Sistemi

```
┌─────────────────────────────────────────────────────┐
│ teams                                               │
├─────────────────────────────────────────────────────┤
│ id              UUID  PK                             │
│ coach_id        UUID  FK → users.id                  │
│ name            VARCHAR(100)  NOT NULL               │
│ description     TEXT                                 │
│ logo_url        TEXT                                 │
│ city            VARCHAR(100)                         │
│ country         VARCHAR(100)                         │
│ created_at      TIMESTAMP  DEFAULT now()             │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ team_members                                        │
├─────────────────────────────────────────────────────┤
│ id              UUID  PK                             │
│ team_id         UUID  FK → teams.id                  │
│ user_id         UUID  FK → users.id                  │
│ status          ENUM('invited','active','removed')   │
│ joined_at       TIMESTAMP  DEFAULT now()             │
│ UNIQUE(team_id, user_id)                             │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ competitions                                        │
├─────────────────────────────────────────────────────┤
│ id              UUID  PK                             │
│ season_id       UUID  FK → seasons.id                │
│ name            VARCHAR(200)  NOT NULL               │
│ description     TEXT                                 │
│ type            ENUM('solo','team')  NOT NULL         │
│ city            VARCHAR(100)                         │
│ country         VARCHAR(100)                         │
│ venue           TEXT                                 │
│ start_date      DATE  NOT NULL                       │
│ end_date        DATE  NOT NULL                       │
│ max_teams       INT                                  │
│ registration_deadline  DATE                          │
│ status          ENUM('upcoming','registration_open', │
│                      'registration_closed',          │
│                      'in_progress','completed',      │
│                      'cancelled')                    │
│ created_at      TIMESTAMP  DEFAULT now()             │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ competition_registrations                           │
├─────────────────────────────────────────────────────┤
│ id              UUID  PK                             │
│ competition_id  UUID  FK → competitions.id           │
│ team_id         UUID  FK → teams.id                  │
│ status          ENUM('pending','approved','rejected')│
│ registered_at   TIMESTAMP  DEFAULT now()             │
│ UNIQUE(competition_id, team_id)                      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ competition_results                                 │
├─────────────────────────────────────────────────────┤
│ id              UUID  PK                             │
│ competition_id  UUID  FK → competitions.id           │
│ team_id         UUID  FK → teams.id                  │
│ placement       INT  NOT NULL                        │
│ total_score     DECIMAL(10,2)                        │
│ notes           TEXT                                 │
│ created_at      TIMESTAMP  DEFAULT now()             │
└─────────────────────────────────────────────────────┘
```

### 4.6 Rozet ve Bildirim Sistemi

```
┌─────────────────────────────────────────────────────┐
│ badges                                              │
├─────────────────────────────────────────────────────┤
│ id              UUID  PK                             │
│ key             VARCHAR(50)  UNIQUE  NOT NULL         │
│ name_tr         VARCHAR(100)  NOT NULL               │
│ name_en         VARCHAR(100)  NOT NULL               │
│ description_tr  TEXT                                 │
│ description_en  TEXT                                 │
│ icon_url        TEXT                                 │
│ criteria        JSONB                                │
│ created_at      TIMESTAMP  DEFAULT now()             │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ user_badges                                         │
├─────────────────────────────────────────────────────┤
│ id              UUID  PK                             │
│ user_id         UUID  FK → users.id                  │
│ badge_id        UUID  FK → badges.id                 │
│ earned_at       TIMESTAMP  DEFAULT now()             │
│ UNIQUE(user_id, badge_id)                            │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ notifications                                       │
├─────────────────────────────────────────────────────┤
│ id              UUID  PK                             │
│ user_id         UUID  FK → users.id                  │
│ type            ENUM('battle_request','battle_accepted│
│                      'battle_declined','battle_scheduled│
│                      'battle_reminder','battle_result',│
│                      'judge_assigned','workshop_purchased│
│                      'team_invite','competition_announce│
│                      'season_end','badge_earned',    │
│                      'admin_announcement')            │
│ title           VARCHAR(200)  NOT NULL               │
│ message         TEXT  NOT NULL                       │
│ data            JSONB                                │
│ is_read         BOOLEAN  DEFAULT false               │
│ channel         ENUM('in_app','email','push')        │
│ created_at      TIMESTAMP  DEFAULT now()             │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ push_subscriptions                                  │
├─────────────────────────────────────────────────────┤
│ id              UUID  PK                             │
│ user_id         UUID  FK → users.id                  │
│ endpoint        TEXT  NOT NULL                       │
│ p256dh          TEXT  NOT NULL                       │
│ auth            TEXT  NOT NULL                       │
│ created_at      TIMESTAMP  DEFAULT now()             │
└─────────────────────────────────────────────────────┘
```

---

## 5. İLİŞKİ DİYAGRAMI (ER OVERVIEW)

```
users ─────┬──── dancer_ratings ──── seasons
           │
           ├──── battles ──────────── battle_scores
           │        │
           │        └──── battle_studio_preferences
           │
           ├──── studios ──── studio_availability
           │
           ├──── workshops ──── workshop_enrollments
           │                     workshop_reviews
           │
           ├──── teams ──── team_members
           │                 │
           │                 └── competition_registrations ── competitions
           │                                                      │
           │                                                 competition_results
           │
           ├──── user_badges ──── badges
           │
           ├──── notifications
           │
           └──── push_subscriptions
```

---

## 6. TEMEL API ENDPOINT'LERİ

### 6.1 Kimlik Doğrulama (Auth)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/auth/register` | Yeni kullanıcı kaydı |
| POST | `/api/auth/login` | Giriş yap |
| POST | `/api/auth/logout` | Çıkış yap |
| POST | `/api/auth/verify-email` | Email doğrulama |
| POST | `/api/auth/forgot-password` | Şifre sıfırlama talebi |
| POST | `/api/auth/reset-password` | Şifre sıfırlama |

### 6.2 Kullanıcı (Users)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/users/me` | Mevcut kullanıcı profili |
| PATCH | `/api/users/me` | Profil güncelle |
| PATCH | `/api/users/me/language` | Dil ayarını güncelle |
| GET | `/api/users/:id` | Kullanıcı profili görüntüle |
| POST | `/api/users/me/avatar` | Profil fotoğrafı yükle |
| GET | `/api/users/:id/badges` | Kullanıcı rozetleri |
| GET | `/api/users/:id/stats` | İstatistikler |

### 6.3 Düello (Battles)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/battles` | Düello talebi oluştur |
| GET | `/api/battles` | Düellolarımı listele |
| GET | `/api/battles/:id` | Düello detayı |
| PATCH | `/api/battles/:id/accept` | Düelloyu kabul et |
| PATCH | `/api/battles/:id/decline` | Düelloyu reddet |
| POST | `/api/battles/:id/studio-preferences` | Stüdyo tercihi ekle |
| PATCH | `/api/battles/:id/studio-approve` | Stüdyo onayı (studio rolü) |
| PATCH | `/api/battles/:id/studio-reject` | Stüdyo reddi |
| PATCH | `/api/battles/:id/assign-judge` | Hakem ata (admin) |
| POST | `/api/battles/:id/score` | Puanlama yap (hakem) |
| PATCH | `/api/battles/:id/complete` | Düelloyu tamamla |

### 6.4 Stüdyolar (Studios)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/studios` | Stüdyo kaydet |
| GET | `/api/studios` | Stüdyoları listele |
| GET | `/api/studios/:id` | Stüdyo detayı |
| PATCH | `/api/studios/:id` | Stüdyo güncelle |
| GET | `/api/studios/:id/availability` | Müsaitlik durumu |
| PATCH | `/api/studios/:id/availability` | Müsaitlik güncelle |

### 6.5 Sıralama (Rankings)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/rankings` | Sıralama tablosu |
| GET | `/api/rankings?country=TR` | Ülkeye göre filtrele |
| GET | `/api/rankings?city=Istanbul` | Şehre göre filtrele |
| GET | `/api/rankings?gender=male` | Cinsiyete göre filtrele |
| GET | `/api/rankings/season/:id` | Sezon sıralaması |

### 6.6 Atölyeler (Workshops)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/workshops` | Atölye oluştur (coach) |
| GET | `/api/workshops` | Atölyeleri listele |
| GET | `/api/workshops/:id` | Atölye detayı |
| PATCH | `/api/workshops/:id` | Atölye güncelle |
| POST | `/api/workshops/:id/enroll` | Atölyeye kaydol |
| POST | `/api/workshops/:id/review` | Yorum yap |
| PATCH | `/api/workshops/:id/approve` | Atölye onayla (admin) |

### 6.7 Takımlar (Teams)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/teams` | Takım oluştur (coach) |
| GET | `/api/teams` | Takımları listele |
| GET | `/api/teams/:id` | Takım detayı |
| POST | `/api/teams/:id/invite` | Dansçı davet et |
| PATCH | `/api/teams/:id/members/:userId` | Üyelik güncelle |

### 6.8 Yarışmalar (Competitions)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/competitions` | Yarışma oluştur (admin) |
| GET | `/api/competitions` | Yarışmaları listele |
| GET | `/api/competitions/:id` | Yarışma detayı |
| POST | `/api/competitions/:id/register` | Yarışmaya kaydol |
| POST | `/api/competitions/:id/results` | Sonuç gir (admin) |

### 6.9 Bildirimler (Notifications)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/notifications` | Bildirimleri listele |
| PATCH | `/api/notifications/:id/read` | Okundu işaretle |
| PATCH | `/api/notifications/read-all` | Tümünü okundu yap |
| POST | `/api/notifications/subscribe-push` | Push aboneliği |
| DELETE | `/api/notifications/subscribe-push` | Push aboneliği iptal |

### 6.10 Admin

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/admin/users` | Kullanıcı yönetimi |
| PATCH | `/api/admin/users/:id` | Kullanıcı düzenle |
| POST | `/api/admin/seasons` | Sezon oluştur |
| PATCH | `/api/admin/seasons/:id` | Sezon güncelle |
| POST | `/api/admin/announcements` | Duyuru gönder |
| GET | `/api/admin/dashboard` | Dashboard verileri |

---

## 7. SAYFA YAPISI

### 7.1 Genel (Auth Gerektirmeyen)

| Sayfa | Route | Açıklama |
|-------|-------|----------|
| Giriş | `/[locale]/giris` | Email + şifre ile giriş |
| Kayıt | `/[locale]/kayit` | Rol seçimli kayıt formu |
| Email Doğrulama | `/[locale]/email-dogrula` | Email doğrulama sayfası |
| Şifre Sıfırlama | `/[locale]/sifre-sifirla` | Şifre sıfırlama |

### 7.2 Platform (Auth Gerekli)

| Sayfa | Route | Açıklama |
|-------|-------|----------|
| Ana Sayfa | `/[locale]/anasayfa` | Feed, hızlı erişim kartları |
| Profil | `/[locale]/profil/[id]` | Kullanıcı profili, istatistikler, rozetler |
| Profil Düzenleme | `/[locale]/ayarlar` | Profil bilgileri, dil ayarı |
| **Düellolar** | `/[locale]/duellolar` | Aktif ve geçmiş düellolar |
| Düello Oluştur | `/[locale]/duellolar/yeni` | Rakip seç, düello talebi gönder |
| Düello Detay | `/[locale]/duellolar/[id]` | Düello durumu, puanlar, sonuç |
| **Sıralama** | `/[locale]/siralama` | Filtrelenebilir lider tablosu |
| **Atölyeler** | `/[locale]/atolyeler` | Atölye kataloğu |
| Atölye Detay | `/[locale]/atolyeler/[id]` | Atölye bilgileri, kayıt |
| Atölye Oluştur | `/[locale]/atolyeler/olustur` | Atölye oluşturma formu (coach) |
| **Takımlar** | `/[locale]/takimlar` | Takım listesi |
| Takım Detay | `/[locale]/takimlar/[id]` | Takım üyeleri, yarışmalar |
| Takım Oluştur | `/[locale]/takimlar/olustur` | Takım oluştur (coach) |
| **Yarışmalar** | `/[locale]/yarisma` | Yarışma listesi |
| Yarışma Detay | `/[locale]/yarisma/[id]` | Yarışma detayları, kayıt |
| **Bildirimler** | `/[locale]/bildirimler` | Bildirim merkezi |

### 7.3 Admin Paneli

| Sayfa | Route | Açıklama |
|-------|-------|----------|
| Dashboard | `/[locale]/yonetim` | Genel istatistikler |
| Kullanıcılar | `/[locale]/yonetim/kullanicilar` | Kullanıcı yönetimi |
| Düellolar | `/[locale]/yonetim/duellolar` | Düello izleme, hakem atama |
| Hakemler | `/[locale]/yonetim/hakemler` | Hakem yönetimi |
| Sezonlar | `/[locale]/yonetim/sezonlar` | Sezon yönetimi |
| Yarışmalar | `/[locale]/yonetim/yarisma` | Yarışma yönetimi |
| Atölyeler | `/[locale]/yonetim/atolyeler` | Atölye moderasyonu |

---

## 8. ELO PUANLAMA SİSTEMİ

### Formül

```
Beklenen Skor: E_a = 1 / (1 + 10^((R_b - R_a) / 400))
Yeni Rating:   R'_a = R_a + K × (S_a - E_a)
```

**K Faktörü:**
- İlk 30 düello: K = 40 (hızlı yükseliş/düşüş)
- 30+ düello: K = 20 (dengeli)
- 2000+ rating: K = 10 (stabil)

**Sezon Geçiş Formülü:**
```
Yeni Sezon Rating = 1500 + (Önceki Sezon Rating × 0.20)
```

Örnek: Önceki sezon 2000 puan → Yeni sezon: 1500 + 400 = 1900

---

## 9. DÜELLO AKIŞ DİYAGRAMI

```
[Dansçı A] ── Düello Talebi Gönder ──→ [Durum: PENDING]
                                              │
                              ┌────────────────┤
                              ↓                ↓
                         [DECLINED]       [ACCEPTED]
                         (son)                 │
                                               ↓
                              Her iki dansçı stüdyo tercihlerini sıralar
                                               │
                                               ↓
                              Sistem en uygun ortak stüdyoyu bulur
                                               │
                                               ↓
                                    [Durum: STUDIO_PENDING]
                                               │
                              ┌────────────────┤
                              ↓                ↓
                      [STUDIO_REJECTED]  [STUDIO_APPROVED]
                      (sonraki stüdyo       │
                       denenir)              ↓
                                    Tarih + Saat + Yer belirlenir
                                               │
                                               ↓
                                    [Durum: SCHEDULED]
                                               │
                                               ↓
                                    Admin hakem atar
                                               │
                                               ↓
                                    [Durum: JUDGE_ASSIGNED]
                                               │
                                               ↓
                                    Hakem puanlama yapar
                                               │
                                               ↓
                                    [Durum: COMPLETED]
                                               │
                                               ↓
                                    ELO güncellenir
                                    Rozetler kontrol edilir
                                    Bildirimler gönderilir
```

---

## 10. BİLDİRİM SİSTEMİ MİMARİSİ

```
┌──────────────────┐
│   Olay Tetikçisi │  (Battle kabul, Atölye satın alım, vs.)
└────────┬─────────┘
         │
         ↓
┌──────────────────┐
│ Bildirim Servisi │  (lib/notifications.ts)
└────────┬─────────┘
         │
         ├──→ [Uygulama İçi]  → notifications tablosuna kaydet
         │
         ├──→ [E-posta]       → Resend API ile gönder
         │
         └──→ [Web Push]      → Web Push API ile gönder
```

**Kullanıcı Tercihleri:** Her kullanıcı hangi bildirim kanallarını aktif tutacağını ayarlardan seçebilir.

---

## 11. PWA YAPISI

```json
// public/manifest.json
{
  "name": "Move League",
  "short_name": "MoveLeague",
  "description": "Küresel dans yarışma platformu",
  "start_url": "/tr/anasayfa",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#6366f1",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**Offline Stratejisi:**
- **Cache First:** Statik varlıklar (CSS, JS, ikonlar)
- **Network First:** API çağrıları, dinamik içerik
- **Stale While Revalidate:** Profil sayfaları, sıralama tablosu

---

## 12. GÜVENLİK MİMARİSİ

| Alan | Uygulama |
|------|----------|
| **Kimlik Doğrulama** | NextAuth.js v5 — JWT session |
| **Şifre Hashleme** | bcrypt (salt rounds: 12) |
| **Rol Yetkilendirme** | Middleware + API seviyesinde kontrol |
| **Email Doğrulama** | Kayıt sonrası zorunlu doğrulama tokeni |
| **Rate Limiting** | Vercel Edge Middleware + upstash/ratelimit |
| **CSRF Koruması** | NextAuth dahili CSRF token |
| **Input Validasyonu** | Zod şemaları, tüm API giriş noktalarında |
| **SQL Injection** | Drizzle ORM parametrik sorgular |
| **XSS Koruması** | React otomatik escape + CSP headerları |
| **Anti-Spam** | Düello talebi limiti (günde max 5), kayıt rate limit |

---

## 13. FAZLI GELİŞTİRME PLANI

### Faz 1 — Temel Altyapı ✦
- [x] Proje kurulumu (Next.js + Tailwind + shadcn/ui)
- [x] Neon DB bağlantısı + Drizzle ORM
- [x] Kimlik doğrulama sistemi (kayıt, giriş, email doğrulama)
- [x] Rol tabanlı kullanıcı yönetimi
- [x] Kullanıcı profili (görüntüleme, düzenleme)
- [x] Dil ayarı (Türkçe / İngilizce)
- [x] PWA manifest + Service Worker
- [x] Vercel deployment

### Faz 2 — Düello Sistemi
- [ ] Düello talebi oluşturma
- [ ] Düello kabul/red akışı
- [ ] Stüdyo tercih sistemi
- [ ] Stüdyo onay akışı
- [ ] Düello planlama

### Faz 3 — Puanlama ve Sıralama
- [ ] Hakem atama
- [ ] Hakem puanlama formu
- [ ] ELO hesaplama motoru
- [ ] Sıralama tablosu (filtreli)
- [ ] Sezon sistemi
- [ ] Rozet sistemi

### Faz 4 — Atölye Modülü
- [ ] Atölye oluşturma (coach)
- [ ] Atölye kataloğu
- [ ] Atölye kaydı
- [ ] Video atölye desteği
- [ ] Değerlendirme sistemi
- [ ] Admin moderasyonu

### Faz 5 — Move Shows
- [ ] Takım oluşturma
- [ ] Dansçı daveti
- [ ] Yarışma oluşturma (admin)
- [ ] Yarışmaya kayıt
- [ ] Sonuç girişi
- [ ] Yarışma sıralaması

---

## 14. ORTAM DEĞİŞKENLERİ (.env.local)

```env
# Neon DB
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/move_league?sslmode=require

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Email (Resend)
RESEND_API_KEY=re_xxx

# Web Push (VAPID)
NEXT_PUBLIC_VAPID_KEY=BPxxx
VAPID_PRIVATE_KEY=xxx

# Vercel Blob (dosya yükleme)
BLOB_READ_WRITE_TOKEN=xxx

# Genel
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## ONAY BEKLENİYOR

Bu mimari dokümanı inceleyip onaylayın. Onaylandıktan sonra **Faz 1** implementasyonuna başlayacağım:

1. Next.js proje kurulumu
2. Neon DB + Drizzle ORM entegrasyonu
3. Auth sistemi (NextAuth v5)
4. Kullanıcı profili + rol yönetimi
5. Türkçe/İngilizce dil desteği
6. PWA yapılandırması
7. Vercel deployment hazırlığı

**Onaylıyor musunuz?**
