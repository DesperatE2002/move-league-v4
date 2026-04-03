export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-[#E31937] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Yükleniyor...</p>
      </div>
    </div>
  );
}
