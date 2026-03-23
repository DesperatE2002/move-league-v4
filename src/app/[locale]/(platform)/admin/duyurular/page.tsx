"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Megaphone,
  ArrowLeft,
  Loader2,
  Shield,
  Plus,
  Trash2,
  ImagePlus,
  Paperclip,
  X,
  Send,
  FileText,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  fileUrl: string | null;
  fileName: string | null;
  isPublished: boolean;
  createdAt: string;
  authorName: string;
  authorSurname: string;
}

export default function AdminAnnouncementsPage() {
  const t = useTranslations("admin");
  const params = useParams();
  const { data: session } = useSession();
  const locale = params.locale as string;
  const isTr = locale === "tr";

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [notify, setNotify] = useState(true);

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const imageRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  async function fetchAnnouncements() {
    try {
      const res = await fetch("/api/announcements");
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements);
      }
    } catch {
      // fail
    } finally {
      setLoading(false);
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert(isTr ? "Görsel 5MB'dan büyük olamaz" : "Image must be under 5MB");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      alert(isTr ? "Dosya 20MB'dan büyük olamaz" : "File must be under 20MB");
      return;
    }
    setDocFile(file);
  }

  async function handleCreate() {
    if (!title.trim() || !content.trim()) return;
    setCreating(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("content", content.trim());
      formData.append("notify", notify ? "true" : "false");
      if (imageFile) formData.append("image", imageFile);
      if (docFile) formData.append("file", docFile);

      const res = await fetch("/api/announcements", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        resetForm();
        fetchAnnouncements();
      } else {
        const data = await res.json();
        alert(data.error || "Hata");
      }
    } catch {
      alert(isTr ? "Sunucu hatası" : "Server error");
    } finally {
      setCreating(false);
    }
  }

  function resetForm() {
    setTitle("");
    setContent("");
    setImageFile(null);
    setDocFile(null);
    setImagePreview(null);
    setNotify(true);
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/announcements?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      }
    } catch {
      // fail
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
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

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href={`/${locale}/admin`} className="p-2 rounded-lg text-ml-gray-400 hover:text-ml-white hover:bg-ml-dark-card transition-all">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <h1 className="text-xl font-bold text-ml-white">
            {isTr ? "Duyuru Yönetimi" : "Announcement Management"}
          </h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="p-2 rounded-lg bg-ml-red text-white hover:bg-ml-red/80 transition-all"
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-ml-dark-card rounded-xl border border-ml-red/30 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-ml-white">
            {isTr ? "Yeni Duyuru" : "New Announcement"}
          </h3>

          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isTr ? "Duyuru başlığı" : "Announcement title"}
            className="w-full bg-ml-dark-hover border border-ml-dark-border rounded-lg px-3 py-2.5 text-sm text-ml-white placeholder:text-ml-gray-500 focus:outline-none focus:ring-2 focus:ring-ml-red/40"
          />

          {/* Content */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={isTr ? "Duyuru içeriği..." : "Announcement content..."}
            rows={4}
            className="w-full bg-ml-dark-hover border border-ml-dark-border rounded-lg px-3 py-2.5 text-sm text-ml-white placeholder:text-ml-gray-500 focus:outline-none focus:ring-2 focus:ring-ml-red/40 resize-none"
          />

          {/* Image Upload */}
          <div className="flex items-center gap-2">
            <input ref={imageRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            <button
              onClick={() => imageRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-ml-dark-hover border border-ml-dark-border text-ml-gray-400 hover:text-ml-white hover:border-ml-red/40 transition-all text-xs"
            >
              <ImagePlus className="w-4 h-4" />
              {isTr ? "Görsel Ekle" : "Add Image"}
            </button>

            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar" onChange={handleFileChange} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-ml-dark-hover border border-ml-dark-border text-ml-gray-400 hover:text-ml-white hover:border-ml-red/40 transition-all text-xs"
            >
              <Paperclip className="w-4 h-4" />
              {isTr ? "Dosya Ekle" : "Attach File"}
            </button>
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="relative inline-block">
              <img src={imagePreview} alt="preview" className="max-h-40 rounded-lg border border-ml-dark-border" />
              <button
                onClick={() => { setImageFile(null); setImagePreview(null); }}
                className="absolute -top-2 -right-2 p-1 rounded-full bg-ml-error text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* File Preview */}
          {docFile && (
            <div className="flex items-center gap-2 px-3 py-2 bg-ml-dark-hover rounded-lg border border-ml-dark-border">
              <FileText className="w-4 h-4 text-ml-info" />
              <span className="text-xs text-ml-white truncate flex-1">{docFile.name}</span>
              <span className="text-[10px] text-ml-gray-500">{(docFile.size / 1024 / 1024).toFixed(1)} MB</span>
              <button onClick={() => setDocFile(null)} className="text-ml-error hover:text-ml-error/80">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Notify toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={notify}
              onChange={(e) => setNotify(e.target.checked)}
              className="rounded border-ml-dark-border bg-ml-dark-hover text-ml-red focus:ring-ml-red/40"
            />
            <Bell className="w-3.5 h-3.5 text-ml-info" />
            <span className="text-xs text-ml-gray-300">
              {isTr ? "Tüm kullanıcılara bildirim gönder" : "Notify all users"}
            </span>
          </label>

          {/* Submit */}
          <button
            onClick={handleCreate}
            disabled={creating || !title.trim() || !content.trim()}
            className="w-full py-2.5 bg-ml-red hover:bg-ml-red/80 text-white font-semibold rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          >
            {creating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                {isTr ? "Duyuru Yayınla" : "Publish Announcement"}
              </>
            )}
          </button>
        </div>
      )}

      {/* Announcements List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-ml-red animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-ml-dark-card rounded-xl border border-ml-dark-border p-8 text-center">
          <Megaphone className="w-8 h-8 text-ml-gray-500 mx-auto mb-3" />
          <p className="text-sm text-ml-gray-400">
            {isTr ? "Henüz duyuru yok" : "No announcements yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className="bg-ml-dark-card rounded-xl border border-ml-dark-border overflow-hidden">
              {/* Image */}
              {a.imageUrl && (
                <img src={a.imageUrl} alt={a.title} className="w-full max-h-48 object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-ml-white">{a.title}</h3>
                    <p className="text-xs text-ml-gray-500 mt-0.5">
                      {a.authorName} {a.authorSurname} · {new Date(a.createdAt).toLocaleDateString(isTr ? "tr-TR" : "en-US", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  {/* Delete */}
                  {confirmDeleteId === a.id ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleDelete(a.id)}
                        disabled={deletingId === a.id}
                        className="px-2 py-1 rounded bg-ml-error text-white text-[10px] font-bold disabled:opacity-50"
                      >
                        {deletingId === a.id ? <Loader2 className="w-3 h-3 animate-spin" /> : (isTr ? "Evet" : "Yes")}
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
                      onClick={() => setConfirmDeleteId(a.id)}
                      className="p-1.5 rounded-lg text-ml-error hover:bg-ml-error/20 transition-all shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Content */}
                <p className="text-sm text-ml-gray-300 mt-2 whitespace-pre-wrap">{a.content}</p>

                {/* Attached file */}
                {a.fileUrl && (
                  <a
                    href={a.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 px-3 py-2 rounded-lg bg-ml-dark-hover border border-ml-dark-border text-ml-info hover:border-ml-info/40 transition-all text-xs"
                  >
                    <FileText className="w-4 h-4" />
                    {a.fileName || (isTr ? "Dosya İndir" : "Download File")}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
