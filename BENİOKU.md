# YtDownloader

**Tauri**, **React** ve **Python** ile oluşturulmuş modern, hızlı ve kullanıcı dostu bir YouTube ve Instagram video indirme uygulaması.

![Initial Release](https://img.shields.io/badge/s%C3%BCr%C3%BCm-1.0.0-blue.svg)
![License](https://img.shields.io/badge/lisans-MIT-green.svg)

## 🚀 Temel Özellikler

- **Çoklu Platform Desteği**: **YouTube** ve **Instagram**'dan videoları, Shortsları ve tüm oynatma listelerini kolayca indirin.
- **Kuyruk Yönetimi**: Listenize birden fazla video ekleyin ve bunları dinamik olarak yönetin.
- **Akıllı Organizasyon**: İndirilen videoları yükleyicinin adına göre otomatik olarak alt klasörlere ayırır.
- **Format ve Çözünürlük Seçimi**: 144p'den 4K'ya kadar ihtiyacınız olan en iyi kaliteyi seçin.
- **Modern Arayüz**: En iyi kullanıcı deneyimi için tasarlanmış, özel tooltip detaylarına sahip şık ve duyarlı arayüz.
- **Çoklu Dil Desteği**: Tamamen **İngilizce** ve **Türkçe** dillerine çevrilmiştir.
- **Platformlar Arası**: Yüksek performans ve yerel uygulama hissiyatı için Tauri üzerine inşa edilmiştir.

## 🛠️ Teknoloji Yığını

- **Frontend**: React, Vite, TypeScript, Tailwind CSS
- **Backend/Masaüstü**: Tauri (Rust tabanlı köprü)
- **Mantık Katmanı**: Python (güçlü medya işleme için sidecar olarak entegre edilmiştir)

## 📦 Kurulum ve Çalıştırma

### 🔽 İndir ve Kullan
Herhangi bir kurulum yapmadan hızlıca başlamak için:
1. [Releases](https://github.com/aytackayin/YtDownloader/releases) sayfasından en son yükleyiciyi indirin.
2. Yükleyiciyi çalıştırın ve ekrandaki talimatları izleyin.
3. **YtDownloader**'ı başlatın ve indirmeye başlayın!

### 🛠️ Geliştirici Kurulumu (Kaynaktan Derleme)
Projeyi yerelinizde çalıştırmak veya kendi sürümünüzü oluşturmak isterseniz:

**Gereksinimler:**
- [Node.js](https://nodejs.org/)
- [Rust](https://www.rust-lang.org/)
- [Python 3.10+](https://www.python.org/downloads/)

**Kurulum Adımları:**
1. **Depoyu klonlayın:**
   ```bash
   git clone https://github.com/aytackayin/YtDownloader.git
   cd YtDownloader
   ```
2. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```
3. **Python Kurulumu (Sidecar mantığı için):**
   ```bash
   pip install -r src-tauri/python/requirements.txt
   ```
4. **Geliştirme Modunda Çalıştırın:**
   ```bash
   npm run tauri dev
   ```
5. **Üretim Sürümü Oluşturun:**
   ```bash
   npm run tauri build
   ```

## 📸 Ekran Görüntüleri

![Preview](PREVIEW.png)

## 🤝 Katkıda Bulunma

Katkılarınız bekliyoruz! Bir sorun (issue) açmaktan veya bir çekme isteği (pull request) göndermekten çekinmeyin.

## 📄 Lisans

Bu proje MIT Lisansı ile lisanslanmıştır.

---
**Aytaç KAYIN** tarafından geliştirilmiştir.
