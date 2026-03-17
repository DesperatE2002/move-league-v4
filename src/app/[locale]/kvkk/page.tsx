import { Metadata } from "next";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni — Move League",
};

export default async function KVKKPage({ params }: { params: Promise<{ locale: string }> }) {
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
            {isTr ? "Kişisel Verilerin Korunması Aydınlatma Metni" : "Personal Data Protection Disclosure"}
          </h1>
          <p className="text-xs text-ml-gray-500">
            {isTr ? "Son güncelleme: 17 Mart 2026" : "Last updated: March 17, 2026"}
          </p>

          {isTr ? (
            <>
              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">1. Veri Sorumlusu</h2>
                <p>Move League platformu ("Platform") olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla kişisel verilerinizi aşağıda açıklanan amaçlar doğrultusunda işlemekteyiz.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">2. İşlenen Kişisel Veriler</h2>
                <p>Platform kapsamında aşağıdaki kişisel verileriniz işlenmektedir:</p>
                <ul className="list-disc pl-6 space-y-1 mt-2">
                  <li><strong>Kimlik Bilgileri:</strong> Ad, soyad, kullanıcı adı, cinsiyet</li>
                  <li><strong>İletişim Bilgileri:</strong> E-posta adresi</li>
                  <li><strong>Konum Bilgileri:</strong> Şehir, ülke</li>
                  <li><strong>Hesap Bilgileri:</strong> Şifre (hashlenmiş olarak), rol (dansçı/koç/stüdyo/hakem), dans stilleri</li>
                  <li><strong>Platform Kullanım Verileri:</strong> Düello sonuçları, rating puanları, sezon istatistikleri, rozet bilgileri, atölye kayıtları, takım üyelikleri</li>
                  <li><strong>Teknik Veriler:</strong> Çerez bilgileri, oturum verileri, cihaz bilgileri (PWA bildirimleri için)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">3. Kişisel Verilerin İşlenme Amaçları</h2>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Üyelik hesabınızın oluşturulması ve kimlik doğrulama</li>
                  <li>Platform hizmetlerinin sunulması (düello, atölye, takım, yarışma)</li>
                  <li>Sıralama tablolarının oluşturulması ve ELO puanlama sistemi</li>
                  <li>Bildirim ve e-posta gönderimi (düello daveti, sonuç, sezon bilgisi)</li>
                  <li>Stüdyo eşleştirme ve planlama süreçleri</li>
                  <li>Platform güvenliğinin sağlanması ve kötüye kullanımın önlenmesi</li>
                  <li>Yasal yükümlülüklerin yerine getirilmesi</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">4. Kişisel Verilerin Aktarılması</h2>
                <p>Kişisel verileriniz, yalnızca hizmetin gerektirdiği ölçüde ve aşağıdaki taraflara aktarılmaktadır:</p>
                <ul className="list-disc pl-6 space-y-1 mt-2">
                  <li><strong>Altyapı Sağlayıcıları:</strong> Vercel (hosting), Neon (veritabanı), Resend (e-posta gönderimi)</li>
                  <li><strong>Diğer Kullanıcılar:</strong> Profil bilgileriniz (ad, soyad, kullanıcı adı, şehir, rating) sıralama tabloları ve düello sayfalarında diğer kullanıcılara görünür</li>
                  <li><strong>Yasal Zorunluluklar:</strong> Yetkili kamu kuruluşları ve mahkemeler tarafından talep edilmesi halinde</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">5. Kişisel Veri Toplanma Yöntemleri ve Hukuki Sebepleri</h2>
                <p>Kişisel verileriniz, platformumuza kayıt olurken ve platform hizmetlerini kullanırken elektronik ortamda toplanmaktadır. Hukuki sebepler:</p>
                <ul className="list-disc pl-6 space-y-1 mt-2">
                  <li>Sözleşmenin kurulması ve ifası (KVKK m.5/2-c)</li>
                  <li>Hukuki yükümlülüklerin yerine getirilmesi (KVKK m.5/2-ç)</li>
                  <li>Meşru menfaatler (KVKK m.5/2-f)</li>
                  <li>Açık rıza (pazarlama amaçlı iletişim için)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">6. Kişisel Veri Saklama Süresi</h2>
                <p>Kişisel verileriniz, üyeliğiniz devam ettiği sürece ve üyelik sona erdikten sonra yasal zorunluluklar gereği azami 3 (üç) yıl süreyle saklanır. Bu süre sonunda verileriniz silinir veya anonim hale getirilir.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">7. İlgili Kişi Olarak Haklarınız (KVKK m.11)</h2>
                <p>KVKK'nın 11. maddesi kapsamında aşağıdaki haklara sahipsiniz:</p>
                <ul className="list-disc pl-6 space-y-1 mt-2">
                  <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                  <li>İşlenmişse buna ilişkin bilgi talep etme</li>
                  <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                  <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
                  <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
                  <li>KVKK'nın 7. maddesinde öngörülen şartlar çerçevesinde silinmesini / yok edilmesini isteme</li>
                  <li>Düzeltme/silme işlemlerinin aktarılan üçüncü kişilere bildirilmesini isteme</li>
                  <li>İşlenen verilerin münhasıran otomatik sistemlerle analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
                  <li>Kanuna aykırı işlenmesi sebebiyle zarara uğramanız halinde giderilmesini talep etme</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">8. Başvuru Yöntemi</h2>
                <p>Yukarıdaki haklarınızı kullanmak için <strong>kvkk@moveleague.com</strong> adresine e-posta gönderebilir veya platformdaki profil ayarları üzerinden talepte bulunabilirsiniz. Başvurunuz en geç 30 gün içinde sonuçlandırılacaktır.</p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">1. Data Controller</h2>
                <p>Move League platform ("Platform") acts as the data controller under Turkish Personal Data Protection Law No. 6698 ("KVKK") and processes your personal data for the purposes described below.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">2. Personal Data Collected</h2>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Identity Information:</strong> Name, surname, username, gender</li>
                  <li><strong>Contact Information:</strong> Email address</li>
                  <li><strong>Location Information:</strong> City, country</li>
                  <li><strong>Account Information:</strong> Password (hashed), role, dance styles</li>
                  <li><strong>Platform Usage Data:</strong> Battle results, ratings, season stats, badges, workshop enrollments, team memberships</li>
                  <li><strong>Technical Data:</strong> Cookies, session data, device info (for PWA notifications)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">3. Purposes of Processing</h2>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Creating and authenticating your account</li>
                  <li>Providing platform services (battles, workshops, teams, competitions)</li>
                  <li>Generating rankings and ELO scoring</li>
                  <li>Sending notifications and emails</li>
                  <li>Studio matching and scheduling</li>
                  <li>Ensuring platform security and preventing abuse</li>
                  <li>Fulfilling legal obligations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">4. Data Transfers</h2>
                <p>Your personal data may be transferred to: Vercel (hosting), Neon (database), Resend (email), other users (public profile data), and authorities when legally required.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-ml-white mb-2">5. Your Rights</h2>
                <p>Under KVKK Article 11, you have the right to: learn whether your data is processed, request information, request correction or deletion, object to automated decisions, and claim compensation for damages. Contact: <strong>kvkk@moveleague.com</strong></p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
