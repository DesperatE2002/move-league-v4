import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kullanım Koşulları — Move League",
};

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isTr = locale === "tr";

  return (
    <div className="min-h-screen bg-ml-black px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <a href={`/${locale}/giris`} className="text-sm text-ml-gray-400 hover:text-ml-white transition-colors">
          ← {isTr ? "Geri" : "Back"}
        </a>

        <div className="mt-6 bg-ml-dark rounded-2xl border border-ml-dark-border p-6 lg:p-10 text-ml-gray-300 space-y-6 text-sm leading-relaxed">
          <h1 className="text-2xl font-bold text-ml-white">
            {isTr ? "Kullanım Koşulları" : "Terms of Service"}
          </h1>
          <p className="text-xs text-ml-gray-500">
            {isTr ? "Son güncelleme: 17 Mart 2026" : "Last updated: March 17, 2026"}
          </p>

          {isTr ? (
            <>
              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">1. Tanımlar</h2>
                <p>"Platform", Move League web uygulamasını; "Kullanıcı", Platforma kayıt olarak hesap oluşturan gerçek kişileri; "Hizmet", Platform üzerinden sunulan dans düellosu, atölye, takım, yarışma ve sıralama hizmetlerini ifade eder.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">2. Hizmet Kapsamı</h2>
                <p>Move League, dansçılar, koçlar, stüdyolar ve hakemlerin bir araya geldiği küresel bir dans yarışma platformudur. Platform aşağıdaki hizmetleri sunar:</p>
                <ul className="list-disc pl-6 space-y-1 mt-2">
                  <li>Dans düelloları oluşturma ve kabul etme</li>
                  <li>ELO tabanlı sıralama sistemi</li>
                  <li>Atölye oluşturma, yayınlama ve kayıt</li>
                  <li>Takım kurma ve üye davet etme</li>
                  <li>Yarışmalara katılım</li>
                  <li>Hakem puanlama sistemi</li>
                  <li>Rozet ve başarım sistemi</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">3. Üyelik Koşulları</h2>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Platforma kayıt için 18 yaşını doldurmuş olmak gerekmektedir</li>
                  <li>Kayıt sırasında verilen bilgilerin doğru ve güncel olması kullanıcının sorumluluğundadır</li>
                  <li>Her kullanıcı yalnızca bir hesap oluşturabilir</li>
                  <li>Hesap bilgilerinin güvenliği kullanıcının sorumluluğundadır</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">4. Kullanıcı Yükümlülükleri</h2>
                <p>Kullanıcılar aşağıdaki kurallara uymakla yükümlüdür:</p>
                <ul className="list-disc pl-6 space-y-1 mt-2">
                  <li>Platform kurallarına ve topluluk kurallarına uymak</li>
                  <li>Diğer kullanıcılara saygılı davranmak, hakaret ve ayrımcılık yapmamak</li>
                  <li>Sahte hesap oluşturmamak veya başka birinin hesabını kullanmamak</li>
                  <li>Platformun teknik altyapısına zarar verecek işlemler yapmamak</li>
                  <li>Fikri mülkiyet haklarına saygı göstermek</li>
                  <li>Düello sonuçlarını manipüle etmemek</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">5. İçerik ve Fikri Mülkiyet</h2>
                <p>Platformda paylaşılan tüm içeriklerin (atölye videoları, profil bilgileri, mesajlar) telif hakkı sahiplerine aittir. Move League, platform hizmetlerinin sunulması amacıyla bu içerikleri kullanma hakkına sahiptir. Move League markası, logosu ve platformun tasarımı Move League'e aittir.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">6. Düello ve Yarışma Kuralları</h2>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Düellolar karşılıklı onay ile gerçekleşir</li>
                  <li>Hakem puanları kesindir ve itiraz edilemez</li>
                  <li>ELO puanları otomatik olarak hesaplanır</li>
                  <li>Hile, manipülasyon veya ayarlı düello yapılması yasaktır ve hesap askıya alınması ile sonuçlanır</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">7. Hesap Askıya Alma ve Sonlandırma</h2>
                <p>Move League, kullanıcı kurallarını ihlal eden hesapları önceden bildirimde bulunarak veya ağır ihlallerde derhal askıya alma veya sonlandırma hakkını saklı tutar. Kullanıcılar, ayarlar sayfasından hesaplarını kapatma talebinde bulunabilir.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">8. Sorumluluk Sınırlaması</h2>
                <p>Platform "olduğu gibi" sunulmaktadır. Move League, platformun kesintisiz veya hatasız çalışacağını garanti etmez. Düello sırasında oluşabilecek fiziksel yaralanmalardan Move League sorumlu değildir. Kullanıcılar kendi güvenliklerinden sorumludur.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">9. Uyuşmazlık Çözümü</h2>
                <p>Bu koşullardan doğan uyuşmazlıklarda Türkiye Cumhuriyeti kanunları uygulanır. Uyuşmazlık halinde İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">10. Değişiklikler</h2>
                <p>Move League, bu kullanım koşullarını herhangi bir zamanda güncelleme hakkını saklı tutar. Önemli değişiklikler bildirim yoluyla kullanıcılara duyurulur.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">11. İletişim</h2>
                <p>Sorularınız için: <strong>info@moveleague.com</strong></p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">1. Definitions</h2>
                <p>"Platform" refers to the Move League web application; "User" refers to individuals who register on the Platform; "Service" refers to dance battles, workshops, teams, competitions, and ranking services provided through the Platform.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">2. Services</h2>
                <p>Move League is a global dance competition platform offering: dance battles, ELO-based rankings, workshops, team management, competitions, judging, and badge systems.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">3. Membership</h2>
                <ul className="list-disc pl-6 space-y-1">
                  <li>You must be 18 years or older to register</li>
                  <li>You are responsible for providing accurate information</li>
                  <li>One account per person</li>
                  <li>You are responsible for account security</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">4. User Obligations</h2>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Follow platform and community rules</li>
                  <li>Treat other users with respect</li>
                  <li>Do not create fake accounts or impersonate others</li>
                  <li>Do not attempt to harm the platform infrastructure</li>
                  <li>Do not manipulate battle results</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">5. Battle Rules</h2>
                <p>Battles require mutual consent. Judge scores are final. ELO ratings are calculated automatically. Cheating or match-fixing results in account suspension.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">6. Limitation of Liability</h2>
                <p>The Platform is provided "as is". Move League does not guarantee uninterrupted service and is not responsible for physical injuries during battles.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">7. Governing Law</h2>
                <p>Turkish law applies. Istanbul courts have jurisdiction over disputes.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">8. Contact</h2>
                <p>Questions: <strong>info@moveleague.com</strong></p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
