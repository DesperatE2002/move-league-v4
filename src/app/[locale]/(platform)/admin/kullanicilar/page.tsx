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
  createdAt: string;
}

const ROLES = ["dancer", "coach", "studio", "judge", "admin"] as const;

export default function AdminUsersPage() {
  const t = useTranslations("admin");
  const tAuth = useTranslations("auth");
  const params = useParams();
  const { data: session } = useSession();
  const locale = params.locale as string;

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

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

  if (session?.user?.role !== "admin") {
    return (
      <div className="text-center py-20">
        <Shield className="w-12 h-12 text-ml-gray-500 mx-auto mb-4" />
        <p className="text-ml-gray-400">{t("noAccess")}</p>
      </div>
    );
  }

  const filtered = searchQ
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(searchQ.toLowerCase()) ||
          u.surname.toLowerCase().includes(searchQ.toLowerCase()) ||
          u.username.toLowerCase().includes(searchQ.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQ.toLowerCase())
      )
    : users;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <a href={`/${locale}/admin`} className="p-2 rounded-lg text-ml-gray-400 hover:text-ml-white hover:bg-ml-dark-card transition-all">
          <ArrowLeft className="w-5 h-5" />
        </a>
        <h1 className="text-xl font-bold text-ml-white">{t("userManagement")}</h1>
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
      ) : (
        <div className="space-y-2">
          {filtered.map((user) => (
            <div
              key={user.id}
              className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-ml-white">
                    {user.name} {user.surname}
                  </p>
                  <p className="text-xs text-ml-gray-400">
                    @{user.username} · {user.email}
                  </p>
                </div>
              </div>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
