"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Search, Swords, Loader2, ArrowLeft, User, Music, Zap, Trophy, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { DANCE_STYLES } from "@/lib/dance-styles";

interface UserResult {
  id: string;
  name: string;
  surname: string;
  username: string;
  avatarUrl: string | null;
  danceStyle: string | null;
  city: string | null;
  country: string | null;
  rating?: number;
}

export default function NewBattlePage() {
  const t = useTranslations("battles");
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const { data: session } = useSession();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<UserResult | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [battleStyle, setBattleStyle] = useState("");
  const [suggestions, setSuggestions] = useState<UserResult[]>([]);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  async function fetchSuggestions() {
    try {
      const res = await fetch("/api/users/search?suggestions=true");
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        setMyRating(data.myRating ?? null);
      }
    } catch {
      // silently fail
    } finally {
      setSuggestionsLoading(false);
    }
  }

  async function handleSearch(q: string) {
    setQuery(q);
    if (q.length < 2) {
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.users);
      }
    } catch {
      // silently fail
    } finally {
      setSearching(false);
    }
  }

  async function handleSendChallenge() {
    if (!selected) return;
    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/battles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opponentId: selected.id, danceStyle: battleStyle || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Bir hata oluştu");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/${locale}/duellolar`);
      }, 1500);
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setSending(false);
    }
  }

  // Block studio/judge from creating battles
  const userRole = session?.user?.role;
  if (userRole === "studio" || userRole === "judge") {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <a
            href={`/${locale}/duellolar`}
            className="p-2 rounded-lg text-ml-gray-400 hover:text-ml-white hover:bg-ml-dark-card transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </a>
          <h1 className="text-xl font-bold text-ml-white">{t("newBattle")}</h1>
        </div>
        <div className="bg-ml-dark-card rounded-xl border border-ml-warning/30 p-8 text-center">
          <div className="inline-flex p-4 rounded-full bg-ml-warning/10 mb-4">
            <ShieldAlert className="w-8 h-8 text-ml-warning" />
          </div>
          <h2 className="text-lg font-semibold text-ml-white mb-2">
            {t("cannotCreateBattle")}
          </h2>
          <p className="text-sm text-ml-gray-400">
            {t("cannotCreateBattleDesc")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <a
          href={`/${locale}/duellolar`}
          className="p-2 rounded-lg text-ml-gray-400 hover:text-ml-white hover:bg-ml-dark-card transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </a>
        <h1 className="text-xl font-bold text-ml-white">{t("newBattle")}</h1>
      </div>

      {success ? (
        <div className="bg-ml-dark-card rounded-xl border border-ml-success/30 p-8 text-center">
          <div className="inline-flex p-4 rounded-full bg-ml-success/10 mb-4">
            <Swords className="w-8 h-8 text-ml-success" />
          </div>
          <h2 className="text-lg font-semibold text-ml-white mb-2">
            {t("challengeSent")}
          </h2>
          <p className="text-sm text-ml-gray-400">{t("challengeSentDesc")}</p>
        </div>
      ) : (
        <>
          {/* Search */}
          <div>
            <label className="block text-sm text-ml-gray-400 mb-2">
              {t("searchOpponent")}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ml-gray-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-ml-dark-card border border-ml-dark-border rounded-xl text-ml-white placeholder:text-ml-gray-500 focus:border-ml-red focus:ring-1 focus:ring-ml-red transition-all outline-none"
                placeholder={t("searchPlaceholder")}
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ml-red animate-spin" />
              )}
            </div>
          </div>

          {/* Results */}
          {results.length > 0 && !selected && (
            <div className="space-y-2">
              {results.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    setSelected(user);
                    setResults([]);
                    setQuery("");
                  }}
                  className="w-full flex items-center gap-3 p-3 bg-ml-dark-card rounded-xl border border-ml-dark-border hover:border-ml-red/40 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-ml-red/20 flex items-center justify-center text-ml-red font-bold text-sm">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      user.name[0]
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ml-white">
                      {user.name} {user.surname}
                    </p>
                    <p className="text-xs text-ml-gray-400">
                      @{user.username}
                      {user.danceStyle && ` · ${user.danceStyle}`}
                      {user.city && ` · ${user.city}`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* ELO-based Suggestions */}
          {!selected && results.length === 0 && !query && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-ml-gold" />
                <p className="text-sm font-semibold text-ml-white">
                  {t("suggestedOpponents")}
                </p>
                {myRating !== null && (
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-ml-gold/10 text-ml-gold border border-ml-gold/20 font-medium">
                    <Trophy className="w-3 h-3 inline mr-0.5" />
                    {myRating} ELO
                  </span>
                )}
              </div>
              {suggestionsLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 text-ml-gold animate-spin" />
                </div>
              ) : suggestions.length > 0 ? (
                <div className="space-y-2">
                  {suggestions.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setSelected(user);
                        setSuggestions([]);
                      }}
                      className="w-full flex items-center gap-3 p-3 bg-ml-dark-card rounded-xl border border-ml-gold/20 hover:border-ml-gold/40 transition-all text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-ml-gold/10 flex items-center justify-center text-ml-gold font-bold text-sm">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          user.name[0]
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ml-white">
                          {user.name} {user.surname}
                        </p>
                        <p className="text-xs text-ml-gray-400">
                          @{user.username}
                          {user.danceStyle && ` · ${user.danceStyle}`}
                          {user.city && ` · ${user.city}`}
                        </p>
                      </div>
                      {user.rating !== undefined && (
                        <span className="text-xs font-bold text-ml-gold shrink-0">
                          {user.rating}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-ml-gray-500 text-center py-4">
                  {t("noSuggestions")}
                </p>
              )}
            </div>
          )}

          {/* Selected Opponent */}
          {selected && (
            <div className="bg-ml-dark-card rounded-xl border border-ml-red/30 p-4">
              <p className="text-xs text-ml-gray-400 mb-3">{t("selectedOpponent")}</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-ml-red/20 flex items-center justify-center text-ml-red font-bold">
                  {selected.avatarUrl ? (
                    <img src={selected.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    selected.name[0]
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-ml-white">
                    {selected.name} {selected.surname}
                  </p>
                  <p className="text-sm text-ml-gray-400">
                    @{selected.username}
                    {selected.danceStyle && ` · ${selected.danceStyle}`}
                  </p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-xs text-ml-gray-500 hover:text-ml-red transition-colors"
                >
                  {t("change")}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-ml-red/10 border border-ml-red/30 text-ml-red-light text-sm text-center">
              {error}
            </div>
          )}

          {/* Dance Style Selection */}
          {selected && (
            <div>
              <label className="block text-sm text-ml-gray-400 mb-2 flex items-center gap-1.5">
                <Music className="w-4 h-4" />
                {t("selectBattleStyle")}
              </label>
              <div className="flex flex-wrap gap-2">
                {DANCE_STYLES.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setBattleStyle(battleStyle === style ? "" : style)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                      battleStyle === style
                        ? "bg-ml-red/20 border-ml-red/40 text-ml-red"
                        : "bg-ml-dark-card border-ml-dark-border text-ml-gray-400 hover:border-ml-red/30"
                    )}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Send Challenge */}
          {selected && (
            <button
              onClick={handleSendChallenge}
              disabled={sending}
              className="w-full py-3 bg-ml-red hover:bg-ml-red-light text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-ml-red/20 hover:shadow-ml-red/40 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Swords className="w-5 h-5" />
                  {t("sendChallenge")}
                </>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}
