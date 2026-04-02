import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "İsim en az 2 karakter olmalıdır")
    .max(100),
  surname: z
    .string()
    .min(2, "Soyisim en az 2 karakter olmalıdır")
    .max(100),
  username: z
    .string()
    .min(3, "Kullanıcı adı en az 3 karakter olmalıdır")
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/, "Kullanıcı adı sadece harf, rakam ve _ içerebilir"),
  email: z
    .string()
    .email("Geçerli bir e-posta adresi girin"),
  password: z
    .string()
    .min(8, "Şifre en az 8 karakter olmalıdır")
    .regex(/[A-Z]/, "Şifre en az bir büyük harf içermelidir")
    .regex(/[0-9]/, "Şifre en az bir rakam içermelidir"),
  role: z.enum(["dancer", "coach", "studio", "judge"]),
  danceStyles: z.array(z.string()).min(1, "En az bir dans stili seçmelisiniz").max(10).optional(),
  kvkkConsent: z.literal(true, { error: "KVKK onayı zorunludur" }),
  termsConsent: z.literal(true, { error: "Kullanım koşulları onayı zorunludur" }),
  marketingConsent: z.boolean().default(false),
});

export const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(1, "Şifre gereklidir"),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  surname: z.string().min(2).max(100).optional(),
  username: z.string().min(3).max(50).optional(),
  role: z.enum(["dancer", "coach", "studio", "judge"]).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  danceStyle: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  language: z.enum(["tr", "en"]).optional(),
});

export const createBattleSchema = z.object({
  opponentId: z.string().uuid("Geçersiz rakip ID"),
  danceStyle: z.string().min(1, "Dans stili seçmelisiniz").max(100),
});

export const battleScoreSchema = z.object({
  challengerTechnique: z.number().min(1).max(10),
  challengerCreativity: z.number().min(1).max(10),
  challengerMusicality: z.number().min(1).max(10),
  challengerStagePresence: z.number().min(1).max(10),
  opponentTechnique: z.number().min(1).max(10),
  opponentCreativity: z.number().min(1).max(10),
  opponentMusicality: z.number().min(1).max(10),
  opponentStagePresence: z.number().min(1).max(10),
  notes: z.string().max(500).optional(),
});

export const createWorkshopSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(["live", "video"]),
  danceStyle: z.string().max(100).optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  price: z.number().min(0).max(99999).optional(),
  currency: z.enum(["TRY", "USD", "EUR"]).optional(),
  videoUrl: z.string().url().max(500).optional(),
  previewUrl: z.string().url().max(500).optional(),
  maxParticipants: z.number().int().min(1).max(1000).optional(),
  scheduledDate: z.string().optional(),
  durationMinutes: z.number().int().min(5).max(480).optional(),
});

export const workshopReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export const createTeamSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
});

export const createCompetitionSchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(["solo", "team"]),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  venue: z.string().max(500).optional(),
  startDate: z.string(),
  endDate: z.string(),
  maxTeams: z.number().int().min(2).max(500).optional(),
  registrationDeadline: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type CreateBattleInput = z.infer<typeof createBattleSchema>;
export type BattleScoreInput = z.infer<typeof battleScoreSchema>;
export type CreateWorkshopInput = z.infer<typeof createWorkshopSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type CreateCompetitionInput = z.infer<typeof createCompetitionSchema>;
