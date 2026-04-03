import { Resend } from "resend";

let resend: Resend | null = null;

function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const FROM_EMAIL = process.env.EMAIL_FROM || "Move League <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://move-league-v4.vercel.app";

// Sanitize user input for safe HTML email embedding
function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendEmail(to: string, subject: string, html: string) {
  const client = getResend();
  if (!client) {
    console.log("[EMAIL] RESEND_API_KEY not set, skipping:", subject, "->", to);
    return;
  }

  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("[EMAIL] Send failed:", error);
  }
}

function layout(content: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="text-align:center;margin-bottom:24px;">
      <img src="${APP_URL}/logo.png" alt="Move League" width="80" height="80" style="border-radius:12px;"/>
    </div>
    <div style="background:#141414;border:1px solid #222;border-radius:16px;padding:28px;color:#e5e5e5;font-size:14px;line-height:1.6;">
      ${content}
    </div>
    <p style="text-align:center;color:#666;font-size:11px;margin-top:20px;">
      © ${new Date().getFullYear()} Move League — Küresel Dans Yarışma Platformu
    </p>
  </div>
</body>
</html>`;
}

function btn(text: string, url: string) {
  return `<a href="${url}" style="display:inline-block;padding:12px 28px;background:#E31937;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;margin-top:12px;">${text}</a>`;
}

// ─── Email Templates ───────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string, verifyToken: string) {
  const url = `${APP_URL}/tr/email-dogrula?token=${encodeURIComponent(verifyToken)}`;
  await sendEmail(to, "Move League'e Hoş Geldiniz! 🎉", layout(`
    <h2 style="color:#fff;margin:0 0 12px;">Hoş Geldiniz, ${esc(name)}!</h2>
    <p>Move League ailesine katıldığınız için teşekkürler. Hesabınızı aktifleştirmek için e-posta adresinizi doğrulayın.</p>
    <p style="text-align:center;">${btn("E-postamı Doğrula", url)}</p>
    <p style="color:#888;font-size:12px;margin-top:16px;">Bu bağlantı 24 saat geçerlidir. Eğer bu hesabı siz oluşturmadıysanız bu e-postayı görmezden gelebilirsiniz.</p>
  `));
}

export async function sendPasswordResetEmail(to: string, name: string, resetToken: string) {
  const url = `${APP_URL}/tr/sifre-sifirla?token=${resetToken}`;
  await sendEmail(to, "Şifre Sıfırlama Talebi", layout(`
    <h2 style="color:#fff;margin:0 0 12px;">Şifre Sıfırlama</h2>
    <p>Merhaba ${esc(name)}, hesabınız için bir şifre sıfırlama talebi aldık.</p>
    <p style="text-align:center;">${btn("Şifremi Sıfırla", url)}</p>
    <p style="color:#888;font-size:12px;margin-top:16px;">Bu talebi siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz. Bağlantı 1 saat geçerlidir.</p>
  `));
}

export async function sendBattleChallengeEmail(to: string, name: string, challengerName: string) {
  const url = `${APP_URL}/tr/duellolar`;
  await sendEmail(to, `${esc(challengerName)} sizi düelloya davet etti! ⚔️`, layout(`
    <h2 style="color:#fff;margin:0 0 12px;">Yeni Düello Daveti</h2>
    <p>Merhaba ${esc(name)}, <strong>${esc(challengerName)}</strong> sizi bir dans düellosuna davet etti!</p>
    <p style="text-align:center;">${btn("Daveti Görüntüle", url)}</p>
  `));
}

export async function sendBattleResultEmail(to: string, name: string, won: boolean, opponentName: string, ratingChange: number) {
  await sendEmail(to, won ? "Düelloyu Kazandınız! 🏆" : "Düello Sonucu", layout(`
    <h2 style="color:#fff;margin:0 0 12px;">${won ? "Tebrikler! 🏆" : "Düello Tamamlandı"}</h2>
    <p>Merhaba ${esc(name)}, <strong>${esc(opponentName)}</strong> ile düellonuz tamamlandı.</p>
    <p style="font-size:16px;font-weight:600;color:${won ? "#22c55e" : "#ef4444"};">
      ${won ? "Kazandınız!" : "Maalesef bu seferlik olmadı."} (${ratingChange > 0 ? "+" : ""}${ratingChange} rating)
    </p>
    <p style="text-align:center;">${btn("Detaylarını Gör", `${APP_URL}/tr/duellolar`)}</p>
  `));
}

export async function sendTeamInviteEmail(to: string, name: string, teamName: string, coachName: string) {
  await sendEmail(to, `${esc(teamName)} takımına davet edildiniz!`, layout(`
    <h2 style="color:#fff;margin:0 0 12px;">Takım Daveti</h2>
    <p>Merhaba ${esc(name)}, <strong>${esc(coachName)}</strong> sizi <strong>${esc(teamName)}</strong> takımına davet etti.</p>
    <p style="text-align:center;">${btn("Daveti Görüntüle", `${APP_URL}/tr/takimlar`)}</p>
  `));
}

export async function sendWorkshopEnrollEmail(to: string, name: string, workshopTitle: string) {
  await sendEmail(to, `"${esc(workshopTitle)}" atölyesine kaydınız tamamlandı`, layout(`
    <h2 style="color:#fff;margin:0 0 12px;">Atölye Kaydı Tamamlandı</h2>
    <p>Merhaba ${esc(name)}, <strong>${esc(workshopTitle)}</strong> atölyesine başarıyla kaydoldunuz.</p>
    <p style="text-align:center;">${btn("Atölyeye Git", `${APP_URL}/tr/atolyeler`)}</p>
  `));
}

export async function sendBadgeEarnedEmail(to: string, name: string, badgeName: string) {
  await sendEmail(to, `Yeni rozet kazandınız: ${esc(badgeName)} 🏅`, layout(`
    <h2 style="color:#fff;margin:0 0 12px;">Yeni Rozet! 🏅</h2>
    <p>Tebrikler ${esc(name)}, <strong>${esc(badgeName)}</strong> rozetini kazandınız!</p>
    <p style="text-align:center;">${btn("Rozetlerimi Gör", `${APP_URL}/tr/profil`)}</p>
  `));
}

// ─── Generic Notification Email ────────────────────────────

const NOTIFICATION_SUBJECTS: Record<string, string> = {
  battle_request: "Yeni Düello Talebi! ⚔️",
  battle_accepted: "Düello Kabul Edildi! ✅",
  battle_declined: "Düello Reddedildi",
  battle_scheduled: "Düello Güncellendi 📅",
  battle_reminder: "Düello Hatırlatması ⏰",
  battle_result: "Düello Sonuçlandı! 🏆",
  judge_assigned: "Hakem Ataması 🏛️",
  workshop_purchased: "Atölye Kaydı ✅",
  team_invite: "Takım Daveti 🤝",
  competition_announce: "Yeni Yarışma! 🎯",
  season_end: "Sezon Sonu 📊",
  badge_earned: "Yeni Rozet! 🏅",
  admin_announcement: "Duyuru 📢",
};

const NOTIFICATION_URLS: Record<string, string> = {
  battle_request: "/tr/duellolar",
  battle_accepted: "/tr/duellolar",
  battle_declined: "/tr/duellolar",
  battle_scheduled: "/tr/duellolar",
  battle_reminder: "/tr/duellolar",
  battle_result: "/tr/duellolar",
  judge_assigned: "/tr/duellolar",
  workshop_purchased: "/tr/atolyeler",
  team_invite: "/tr/takimlar",
  competition_announce: "/tr/yarisma",
  season_end: "/tr/siralama",
  badge_earned: "/tr/profil",
  admin_announcement: "/tr/duyurular",
};

export async function sendNotificationEmail(
  to: string,
  name: string,
  type: string,
  title: string,
  message: string,
  data?: Record<string, unknown>
) {
  const subject = NOTIFICATION_SUBJECTS[type] || title;
  const urlPath = NOTIFICATION_URLS[type] || "/tr/anasayfa";
  const detailUrl = data?.battleId
    ? `${APP_URL}/tr/duellolar/${data.battleId}`
    : `${APP_URL}${urlPath}`;

  await sendEmail(to, subject, layout(`
    <h2 style="color:#fff;margin:0 0 12px;">${esc(title)}</h2>
    <p>${esc(message)}</p>
    <p style="text-align:center;">${btn("Detayları Gör", detailUrl)}</p>
    <p style="color:#888;font-size:11px;margin-top:16px;">Bu e-posta Move League bildirim sistemi tarafından gönderilmiştir.</p>
  `));
}
