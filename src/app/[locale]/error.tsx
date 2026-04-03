"use client";

import { useRouter } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Bir Hata Oluştu
        </h1>
        <p className="text-gray-400 mb-6">
          Beklenmeyen bir sorun oluştu. Lütfen tekrar deneyin.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-[#E31937] text-white rounded-xl font-semibold hover:bg-[#c41530] transition"
          >
            Tekrar Dene
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-6 py-3 bg-[#1a1a1a] text-gray-300 rounded-xl font-semibold border border-[#333] hover:border-[#555] transition"
          >
            Ana Sayfa
          </button>
        </div>
      </div>
    </div>
  );
}
