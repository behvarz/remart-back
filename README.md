# Remart AI Chatbot Backend API

## 🚀 Kurulum

### 1. Bağımlılıkları Yükleyin
```bash
cd backend
npm install
```

### 2. .env Dosyası Oluşturun
Backend klasöründe `.env` dosyası oluşturun ve aşağıdaki içeriği ekleyin:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration (Frontend URL)
FRONTEND_URL=http://localhost:3000
```

**Önemli:** `OPENAI_API_KEY` değerini kendi OpenAI API key'inizle değiştirin.

### 3. OpenAI API Key Nasıl Alınır?
1. [OpenAI Platform](https://platform.openai.com/api-keys) adresine gidin
2. Giriş yapın veya hesap oluşturun
3. "Create new secret key" butonuna tıklayın
4. Key'i kopyalayın ve `.env` dosyasına yapıştırın

### 4. Sunucuyu Başlatın

**Development mode (auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Sunucu `http://localhost:3001` adresinde çalışacaktır.

## 📡 API Endpoints

### Health Check
```
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "message": "Remart AI Chatbot API is running"
}
```

### Chat
```
POST /api/chat
Content-Type: application/json
```

**Request Body:**
```json
{
  "message": "Merhaba, workshop'ların hakkında bilgi alabilir miyim?",
  "sessionId": "session_1234567890_abc123" // optional
}
```

**Response:**
```json
{
  "message": "Merhaba! Workshop programlarım hakkında konuşmak çok güzel. Tuval boyama, akrilik teknikler ve karma teknik atölyeleri düzenliyorum. Hangi konuda daha detaylı bilgi istersin? 🎨",
  "sessionId": "session_1234567890_abc123"
}
```

### Clear Conversation
```
POST /api/chat/clear
Content-Type: application/json
```

**Request Body:**
```json
{
  "sessionId": "session_1234567890_abc123"
}
```

## 🎨 Sanatçı Bilgi Bankası

`artist-knowledge.js` dosyası tüm sanatçı bilgilerini içerir:
- Biyografi
- Sanat felsefesi
- Workshop detayları
- Eser bilgileri
- İletişim bilgileri
- SSS

Bu dosyayı düzenleyerek chatbot'un bilgi tabanını güncelleyebilirsiniz.

## ⚙️ Konfigürasyon

### OpenAI Model Ayarları
`server.js` dosyasında model parametrelerini değiştirebilirsiniz:

```javascript
{
  model: 'gpt-3.5-turbo',     // Model: gpt-3.5-turbo veya gpt-4
  max_tokens: 300,            // Maksimum token sayısı
  temperature: 0.8,           // Yaratıcılık (0-2)
  presence_penalty: 0.6,      // Tekrar azaltma
  frequency_penalty: 0.3      // Kelime tekrarı azaltma
}
```

### Session Yönetimi
- Her kullanıcı için unique session ID oluşturulur
- Conversation history 20 mesajla sınırlı
- 1 saatten eski session'lar otomatik silinir

## 🔒 Güvenlik

- ✅ API key backend'de güvenli
- ✅ CORS koruması aktif
- ✅ Input validation
- ✅ Rate limiting (gerekirse eklenebilir)

## 📊 Maliyet

GPT-3.5-turbo fiyatlandırması (yaklaşık):
- Input: ~$0.0005 / 1K tokens
- Output: ~$0.0015 / 1K tokens
- Ortalama bir mesaj: ~$0.0002

## 🐛 Hata Ayıklama

Sunucu loglarını kontrol edin:
```bash
npm run dev
```

API test etmek için:
```bash
curl http://localhost:3001/api/health
```

## 📝 Notlar

- Production'da Redis veya veritabanı kullanın (session storage için)
- Rate limiting ekleyin (DDoS koruması)
- Logging sistemi ekleyin (Winston, Morgan)
- PM2 ile production deployment yapın


