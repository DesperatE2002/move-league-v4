import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gizlilik Politikası — Move League",
};

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
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
            {isTr ? "Gizlilik Politikası" : "Privacy Policy"}
          </h1>
          <p className="text-xs text-ml-gray-500">
            {isTr ? "Son güncelleme: 17 Mart 2026" : "Last updated: March 17, 2026"}
          </p>

          {isTr ? (
            <>
              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">1. Giriş</h2>
                <p>Move League ("Platform", "biz") olarak gizliliğinizi ciddiye alıyoruz. Bu Gizlilik Politikası, platformumuzu kullanırken kişisel verilerinizin nasıl toplandığını, işlendiğini, saklandığını ve korunduğunu açıklar. Platformumuzu kullanarak bu politikayı kabul etmiş sayılırsınız.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">2. Toplanan Bilgiler</h2>
                <h3 className="font-medium text-ml-white mt-3 mb-1">2.1 Doğrudan Sağladığınız Bilgiler</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Kayıt bilgileri: ad, soyad, kullanıcı adı, e-posta adresi, şifre</li>
                  <li>Profil bilgileri: cinsiyet, şehir, ülke, biyografi, dans stilleri, profil fotoğrafı</li>
                  <li>Platform içi etkileşimler: düello talepleri, atölye kayıtları, takım katılımları, mesajlar</li>
                </ul>
                <h3 className="font-medium text-ml-white mt-3 mb-1">2.2 Otomatik Olarak Toplanan Bilgiler</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Çerez bilgileri ve oturum verileri</li>
                  <li>Push bildirim abonelik bilgileri (endpoint, anahtarlar)</li>
                  <li>Erişim logları (IP adresi, tarayıcı bilgisi)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">3. Bilgilerin Kullanımı</h2>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Hesabınızı oluşturmak ve yönetmek</li>
                  <li>Platform hizmetlerini sunmak ve iyileştirmek</li>
                  <li>Düello, atölye, takım ve yarışma işlemlerini gerçekleştirmek</li>
                  <li>Sıralama ve puanlama sistemlerini çalıştırmak</li>
                  <li>E-posta ve push bildirimleri göndermek</li>
                  <li>Güvenliği sağlamak ve dolandırıcılığı önlemek</li>
                  <li>Yasal yükümlülükleri yerine getirmek</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">4. Bilgi Paylaşımı</h2>
                <p>Kişisel verilerinizi satmıyoruz. Verileriniz yalnızca:</p>
                <ul className="list-disc pl-6 space-y-1 mt-2">
                  <li><strong>Hizmet Sağlayıcılar:</strong> Vercel (hosting), Neon (veritabanı), Resend (e-posta) — yalnızca hizmetin gereği kadar</li>
                  <li><strong>Diğer Kullanıcılar:</strong> Profiliniz (ad, kullanıcı adı, şehir, rating) sıralama tablolarında ve düello sayfalarında görünür</li>
                  <li><strong>Yasal Gereklilikler:</strong> Kanun, yönetmelik veya mahkeme kararı gereğince yetkili makamlara</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">5. Çerezler</h2>
                <p>Platformumuz aşağıdaki çerezleri kullanmaktadır:</p>
                <ul className="list-disc pl-6 space-y-1 mt-2">
                  <li><strong>Zorunlu Çerezler:</strong> Oturum yönetimi ve kimlik doğrulama için gereklidir</li>
                  <li><strong>Dil Tercihi Çerezleri:</strong> Seçtiğiniz dili hatırlamak için kullanılır</li>
                </ul>
                <p className="mt-2">Platformumuz reklam çerezi veya üçüncü taraf izleme çerezi kullanmamaktadır.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">6. Veri Güvenliği</h2>
                <p>Verilerinizin güvenliği için aşağıdaki önlemler alınmaktadır:</p>
                <ul className="list-disc pl-6 space-y-1 mt-2">
                  <li>Şifreler bcrypt algoritması ile hashlenmiş olarak saklanır</li>
                  <li>Tüm iletişim SSL/TLS şifreleme ile korunur</li>
                  <li>Veritabanı erişimi sınırlı ve şifrelenmiştir</li>
                  <li>JWT tabanlı oturum yönetimi</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">7. Veri Saklama</h2>
                <p>Kişisel verileriniz üyeliğiniz devam ettiği sürece saklanır. Hesabınızı silmeniz halinde verileriniz 30 gün içinde kalıcı olarak silinir. Yasal zorunluluklar gereği bazı veriler 3 yıla kadar muhafaza edilebilir.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">8. Haklarınız</h2>
                <p>KVKK kapsamındaki haklarınız için <a href={`/${locale}/kvkk`} className="text-ml-red hover:text-ml-red-light underline">KVKK Aydınlatma Metnimizi</a> inceleyebilirsiniz.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">9. Politika Değişiklikleri</h2>
                <p>Bu gizlilik politikasını zaman zaman güncelleyebiliriz. Önemli değişiklikler olması halinde platformdaki bildirimleri, e-posta ile veya bu sayfa üzerinden sizi bilgilendiririz.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">10. İletişim</h2>
                <p>Gizlilik ile ilgili sorularınız için: <strong>privacy@moveleague.com</strong></p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">1. Introduction</h2>
                <p>Move League ("Platform", "we") takes your privacy seriously. This Privacy Policy explains how your personal data is collected, processed, stored, and protected when you use our platform.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">2. Information Collected</h2>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Registration info: name, surname, username, email, password</li>
                  <li>Profile info: gender, city, country, bio, dance styles, avatar</li>
                  <li>Platform interactions: battles, workshops, teams, messages</li>
                  <li>Automatic data: cookies, session data, push notification subscriptions</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">3. How We Use Your Information</h2>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Creating and managing your account</li>
                  <li>Providing and improving platform services</li>
                  <li>Processing battles, workshops, teams, and competitions</li>
                  <li>Running ranking and scoring systems</li>
                  <li>Sending emails and push notifications</li>
                  <li>Ensuring security and preventing fraud</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">4. Data Sharing</h2>
                <p>We do not sell your personal data. Data is shared only with: service providers (Vercel, Neon, Resend), other users (public profile data), and authorities when legally required.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">5. Cookies</h2>
                <p>We use essential cookies for session management and language preferences only. No advertising or third-party tracking cookies are used.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">6. Your Rights</h2>
                <p>Under KVKK, you have the right to access, correct, delete your data, and more. See our <a href={`/${locale}/kvkk`} className="text-ml-red hover:text-ml-red-light underline">KVKK Disclosure</a> for details. Contact: <strong>privacy@moveleague.com</strong></p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
