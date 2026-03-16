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
});

export const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(1, "Şifre gereklidir"),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  surname: z.string().min(2).max(100).optional(),
  username: z.string().min(3).max(50).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  danceStyle: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  language: z.enum(["tr", "en"]).optional(),
});

export const createBattleSchema = z.object({
  opponentId: z.string().uuid("Geçersiz rakip ID"),
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

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type CreateBattleInput = z.infer<typeof createBattleSchema>;
export type BattleScoreInput = z.infer<typeof battleScoreSchema>;
