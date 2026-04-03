import { Link } from "@/i18n/routing";

export default function NotFound() {
  return (
    <html>
      <body className="bg-[#0A0A0A] text-white min-h-screen flex items-center justify-center">
        <div className="text-center px-6">
          <h1 className="text-7xl font-bold text-[#E31937] mb-4">404</h1>
          <p className="text-xl text-gray-300 mb-2">Sayfa Bulunamadı</p>
          <p className="text-gray-500 mb-8">
            Aradığınız sayfa mevcut değil veya kaldırılmış olabilir.
          </p>
          <Link
            href="/anasayfa"
            className="inline-block px-6 py-3 bg-[#E31937] text-white rounded-xl font-semibold hover:bg-[#c41530] transition"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </body>
    </html>
  );
}
