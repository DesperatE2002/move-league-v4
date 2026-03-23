"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Users,
  ArrowLeft,
  Loader2,
  Shield,
  Search,
  ShieldCheck,
  ShieldX,
  Mail,
  Trash2,
  Ban,
  CheckCircle,
  Bell,
  Send,
  X,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserItem {
  id: string;
  name: string;
  surname: string;
  username: string;
  email: string;
  role: string;
  city: string | null;
  country: string | null;
  isActive: boolean;
  kvkkConsent: boolean | null;
  termsConsent: boolean | null;
  marketingConsent: boolean | null;
  consentAt: string | null;
  createdAt: string;
}

const ROLES = ["dancer", "coach", "studio", "judge", "admin"] as const;

type ViewMode = "all" | "banned";

export default function AdminUsersPage() {
  const t = useTranslations("admin");
  const tAuth = useTranslations("auth");
  const params = useParams();
  const { data: session } = useSession();
  const locale = params.locale as string;
  const isTr = locale === "tr";

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("all");

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Ban state
  const [banningId, setBanningId] = useState<string | null>(null);

  // Notification modal state
  const [notifModal, setNotifModal] = useState<{ type: "bulk" | "individual"; userId?: string; username?: string } | null>(null);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifResult, setNotifResult] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch {
      // fail
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    setUpdatingRole(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) fetchUsers();
    } catch {
      // fail
    } finally {
      setUpdatingRole(null);
    }
  }

  async function handleDelete(userId: string) {
    setDeletingId(userId);
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch {
      // fail
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  async function handleBanToggle(userId: string, currentlyActive: boolean) {
    setBanningId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: currentlyActive ? "ban" : "unban" }),
      });
      if (res.ok) fetchUsers();
    } catch {
      // fail
    } finally {
      setBanningId(null);
    }
  }

  async function sendNotification() {
    if (!notifTitle.trim() || !notifMessage.trim()) return;
    setSendingNotif(true);
    setNotifResult(null);
    try {
      const body: Record<string, string> = { title: notifTitle, message: notifMessage };
      if (notifModal?.type === "individual" && notifModal.userId) {
        body.userId = notifModal.userId;
      }
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setNotifResult({ ok: true, text: isTr ? `${data.count} kişiye gönderildi` : `Sent to ${data.count} user(s)` });
        setNotifTitle("");
        setNotifMessage("");
      } else {
        setNotifResult({ ok: false, text: data.error || "Hata" });
      }
    } catch {
      setNotifResult({ ok: false, text: isTr ? "Sunucu hatası" : "Server error" });
    } finally {
      setSendingNotif(false);
    }
  }

  function closeNotifModal() {
    setNotifModal(null);
    setNotifTitle("");
    setNotifMessage("");
    setNotifResult(null);
  }

  if (session?.user?.role !== "admin") {
    return (
      <div className="text-center py-20">
        <Shield className="w-12 h-12 text-ml-gray-500 mx-auto mb-4" />
        <p className="text-ml-gray-400">{t("noAccess")}</p>
      </div>
    );
  }

  const filtered = users.filter((u) => {
    const matchesSearch = !searchQ || 
      u.name.toLowerCase().includes(searchQ.toLowerCase()) ||
      u.surname.toLowerCase().includes(searchQ.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQ.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQ.toLowerCase());
    const matchesView = viewMode === "all" ? u.isActive : !u.isActive;
    return matchesSearch && matchesView;
  });

  const bannedCount = users.filter((u) => !u.isActive).length;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href={`/${locale}/admin`} className="p-2 rounded-lg text-ml-gray-400 hover:text-ml-white hover:bg-ml-dark-card transition-all">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <h1 className="text-xl font-bold text-ml-white">{t("userManagement")}</h1>
        </div>
        {/* Bulk Notification Button */}
        <button
          onClick={() => setNotifModal({ type: "bulk" })}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-ml-info/20 text-ml-info hover:bg-ml-info/30 transition-all text-xs font-semibold"
        >
          <Bell className="w-4 h-4" />
          {isTr ? "Toplu Bildirim" : "Bulk Notify"}
        </button>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode("all")}
          className={cn(
            "px-4 py-2 rounded-lg text-xs font-semibold transition-all",
            viewMode === "all"
              ? "bg-ml-red text-white"
              : "bg-ml-dark-card text-ml-gray-400 border border-ml-dark-border hover:text-ml-white"
          )}
        >
          <Users className="w-3.5 h-3.5 inline mr-1" />
          {isTr ? "Aktif Kullanıcılar" : "Active Users"} ({users.filter(u => u.isActive).length})
        </button>
        <button
          onClick={() => setViewMode("banned")}
          className={cn(
            "px-4 py-2 rounded-lg text-xs font-semibold transition-all",
            viewMode === "banned"
              ? "bg-ml-error text-white"
              : "bg-ml-dark-card text-ml-gray-400 border border-ml-dark-border hover:text-ml-white"
          )}
        >
          <Ban className="w-3.5 h-3.5 inline mr-1" />
          {isTr ? "Yasaklılar" : "Banned"} ({bannedCount})
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ml-gray-500" />
        <input
          type="text"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder={t("searchUsers")}
          className="w-full bg-ml-dark-card border border-ml-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-ml-white placeholder:text-ml-gray-500 focus:outline-none focus:ring-2 focus:ring-ml-red/40"
        />
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-ml-red animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-ml-gray-500 text-sm">
            {viewMode === "banned"
              ? (isTr ? "Yasaklı kullanıcı yok" : "No banned users")
              : (isTr ? "Kullanıcı bulunamadı" : "No users found")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((user) => (
            <div
              key={user.id}
              className={cn(
                "bg-ml-dark-card rounded-xl border p-4",
                !user.isActive ? "border-ml-error/30 bg-ml-error/5" : "border-ml-dark-border"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-ml-white truncate">
                      {user.name} {user.surname}
                    </p>
                    {!user.isActive && (
                      <span className="shrink-0 px-1.5 py-0.5 bg-ml-error/20 text-ml-error text-[10px] font-bold rounded">
                        {isTr ? "YASAKLI" : "BANNED"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ml-gray-400 truncate">
                    @{user.username} · {user.email}
                  </p>
                </div>
                {/* Action buttons */}
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {/* Notify */}
                  <button
                    onClick={() => setNotifModal({ type: "individual", userId: user.id, username: user.username })}
                    className="p-1.5 rounded-lg text-ml-info hover:bg-ml-info/20 transition-all"
                    title={isTr ? "Bildirim Gönder" : "Send Notification"}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  {/* Ban/Unban */}
                  {user.id !== session?.user?.id && (
                    <button
                      onClick={() => handleBanToggle(user.id, user.isActive)}
                      disabled={banningId === user.id}
                      className={cn(
                        "p-1.5 rounded-lg transition-all disabled:opacity-50",
                        user.isActive
                          ? "text-ml-warning hover:bg-ml-warning/20"
                          : "text-ml-success hover:bg-ml-success/20"
                      )}
                      title={user.isActive ? (isTr ? "Yasakla" : "Ban") : (isTr ? "Yasağı Kaldır" : "Unban")}
                    >
                      {banningId === user.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : user.isActive ? (
                        <Ban className="w-4 h-4" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  {/* Delete */}
                  {user.id !== session?.user?.id && (
                    <>
                      {confirmDeleteId === user.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(user.id)}
                            disabled={deletingId === user.id}
                            className="px-2 py-1 rounded bg-ml-error text-white text-[10px] font-bold disabled:opacity-50"
                          >
                            {deletingId === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : (isTr ? "Evet" : "Yes")}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 rounded bg-ml-dark-hover text-ml-gray-400 text-[10px] font-bold"
                          >
                            {isTr ? "İptal" : "Cancel"}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(user.id)}
                          className="p-1.5 rounded-lg text-ml-error hover:bg-ml-error/20 transition-all"
                          title={isTr ? "Sil" : "Delete"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Role selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-ml-gray-500">{t("role")}:</span>
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  disabled={updatingRole === user.id || user.id === session?.user?.id}
                  className={cn(
                    "text-xs bg-ml-dark-hover border border-ml-dark-border rounded-lg px-2 py-1 text-ml-white disabled:opacity-50",
                    user.role === "admin" && "text-ml-red",
                    user.role === "judge" && "text-ml-gold",
                    user.role === "coach" && "text-ml-info"
                  )}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {tAuth(`roles.${r}`)}
                    </option>
                  ))}
                </select>
                {updatingRole === user.id && <Loader2 className="w-3 h-3 text-ml-red animate-spin" />}
              </div>

              {/* Consent Status */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border",
                  user.kvkkConsent
                    ? "bg-ml-success/10 text-ml-success border-ml-success/20"
                    : "bg-ml-red/10 text-ml-red border-ml-red/20"
                )}>
                  {user.kvkkConsent ? <ShieldCheck className="w-3 h-3" /> : <ShieldX className="w-3 h-3" />}
                  KVKK
                </span>
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border",
                  user.termsConsent
                    ? "bg-ml-success/10 text-ml-success border-ml-success/20"
                    : "bg-ml-red/10 text-ml-red border-ml-red/20"
                )}>
                  {user.termsConsent ? <ShieldCheck className="w-3 h-3" /> : <ShieldX className="w-3 h-3" />}
                  {isTr ? "Koşullar" : "Terms"}
                </span>
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border",
                  user.marketingConsent
                    ? "bg-ml-info/10 text-ml-info border-ml-info/20"
                    : "bg-ml-dark border-ml-dark-border text-ml-gray-500"
                )}>
                  <Mail className="w-3 h-3" />
                  {isTr ? "Pazarlama" : "Marketing"}
                </span>
                {user.consentAt && (
                  <span className="text-[10px] text-ml-gray-600">
                    {new Date(user.consentAt).toLocaleDateString(isTr ? "tr-TR" : "en-US")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notification Modal */}
      {notifModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-ml-dark-card rounded-2xl border border-ml-dark-border w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ml-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-ml-info" />
                {notifModal.type === "bulk"
                  ? (isTr ? "Toplu Bildirim Gönder" : "Send Bulk Notification")
                  : (isTr ? `@${notifModal.username} adlı kullanıcıya bildirim` : `Notify @${notifModal.username}`)}
              </h3>
              <button onClick={closeNotifModal} className="p-1 rounded-lg text-ml-gray-400 hover:text-ml-white hover:bg-ml-dark-hover transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              value={notifTitle}
              onChange={(e) => setNotifTitle(e.target.value)}
              placeholder={isTr ? "Bildirim başlığı" : "Notification title"}
              className="w-full bg-ml-dark-hover border border-ml-dark-border rounded-lg px-3 py-2.5 text-sm text-ml-white placeholder:text-ml-gray-500 focus:outline-none focus:ring-2 focus:ring-ml-info/40"
            />
            <textarea
              value={notifMessage}
              onChange={(e) => setNotifMessage(e.target.value)}
              placeholder={isTr ? "Bildirim mesajı" : "Notification message"}
              rows={3}
              className="w-full bg-ml-dark-hover border border-ml-dark-border rounded-lg px-3 py-2.5 text-sm text-ml-white placeholder:text-ml-gray-500 focus:outline-none focus:ring-2 focus:ring-ml-info/40 resize-none"
            />

            {notifResult && (
              <p className={cn("text-xs font-medium", notifResult.ok ? "text-ml-success" : "text-ml-error")}>
                {notifResult.text}
              </p>
            )}

            <button
              onClick={sendNotification}
              disabled={sendingNotif || !notifTitle.trim() || !notifMessage.trim()}
              className="w-full py-2.5 bg-ml-info hover:bg-ml-info/80 text-white font-semibold rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            >
              {sendingNotif ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {isTr ? "Gönder" : "Send"}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
