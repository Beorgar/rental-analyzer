import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function LandingPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [propertyData, setPropertyData] = useState(null);
  const [countdown, setCountdown] = useState(60);
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError('Пожалуйста, введите URL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/property/parse', { url });

      if (response.data.success) {
        setPropertyData(response.data.data);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Произошла ошибка при анализе ссылки';
      setError(errorMessage);
      console.error('Error analyzing property:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGetReport = () => {
    navigate('/payment', { state: { propertyData } });
  };

  useEffect(() => {
    let timer;
    if (loading) {
      setCountdown(60);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [loading]);

  return (
    <div>
      <div className="header">
        <h1>🏠 Rental Analyzer</h1>
        <p>
          Получите глубокий анализ вашей недвижимости для краткосрочной аренды
          и персональные рекомендации по ценообразованию на ближайшие 3 месяца
        </p>
      </div>

      <div className="container">
        <div className="main-content">
          {/* Features Section */}
          <div className="features">
            <div className="feature-card">
              <div className="icon">📊</div>
              <h3>Глубокий анализ рынка</h3>
              <p>
                Изучаем спрос, сезонность, конкуренцию и целевую аудиторию
                в вашей локации
              </p>
            </div>
            <div className="feature-card">
              <div className="icon">💰</div>
              <h3>Стратегия ценообразования</h3>
              <p>
                Получите рекомендации по ценам на каждый день, включая
                выходные и праздники
              </p>
            </div>
            <div className="feature-card">
              <div className="icon">📈</div>
              <h3>Прогноз доходности</h3>
              <p>
                Прогнозируем загрузку и ежемесячную выручку на основе
                анализа данных
              </p>
            </div>
          </div>

          {/* URL Input Section */}
          <div className="url-input-section">
            <h2>Вставьте ссылку на ваш объект</h2>

            <div className="supported-platforms">
              <div className="platform-badge">Booking.com</div>
              <div className="platform-badge">Airbnb</div>
              <div className="platform-badge">VRBO</div>
            </div>

            <div className="url-input-container">
              <input
                type="text"
                className="url-input"
                placeholder="https://www.airbnb.com/rooms/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
              />
              <button
                className="analyze-btn"
                onClick={handleAnalyze}
                disabled={loading}
              >
                {loading ? 'Анализируем...' : 'Анализировать'}
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="loading">
              <div className="spinner"></div>
              <p style={{ marginTop: '20px', fontSize: '1.1rem', color: '#555' }}>
                Анализируем объект... Примерное время ожидания: <strong>{countdown}с</strong>
              </p>
            </div>
          )}

          {/* Property Preview */}
          {propertyData && !loading && (
            <div className="property-preview">
              <h3>Предварительный просмотр объекта</h3>

              <div className="property-details">
                <div className="property-detail-item">
                  <label>Название</label>
                  <span>{propertyData.title}</span>
                </div>
                <div className="property-detail-item">
                  <label>Местоположение</label>
                  <span>
                    {propertyData.location.city}, {propertyData.location.country}
                  </span>
                </div>
                <div className="property-detail-item">
                  <label>Платформа</label>
                  <span className="platform-badge">{propertyData.platform}</span>
                </div>
              </div>

              <div className="property-details">
                <div className="property-detail-item">
                  <label>Вместимость</label>
                  <span>{propertyData.capacity.guests} гостей</span>
                </div>
                <div className="property-detail-item">
                  <label>Спален</label>
                  <span>{propertyData.capacity.bedrooms}</span>
                </div>
                <div className="property-detail-item">
                  <label>Ванных комнат</label>
                  <span>{propertyData.capacity.bathrooms}</span>
                </div>
                <div className="property-detail-item">
                  <label>Текущая цена</label>
                  <span>
                    От{' '}
                    {propertyData.pricing.currency === 'EUR' ? '€' :
                     propertyData.pricing.currency === 'USD' ? '$' :
                     propertyData.pricing.currency}
                    {propertyData.pricing.basePrice}/ночь
                    <span style={{ fontSize: '0.85em', color: '#777', display: 'block', marginTop: '4px' }}>
                      *Цены варьируются в зависимости от дат
                    </span>
                  </span>
                </div>
              </div>

              <div className="property-detail-item">
                <label>Рейтинг</label>
                <span>
                  ⭐ {propertyData.rating.average} ({propertyData.rating.reviewCount}{' '}
                  отзывов)
                </span>
              </div>

              {propertyData.images && propertyData.images.length > 0 && (
                <>
                  <label style={{ marginTop: '20px', display: 'block' }}>
                    Фотографии
                  </label>
                  <div className="property-images">
                    {propertyData.images.slice(0, 6).map((img, idx) => (
                      <img key={idx} src={img} alt={`Property ${idx + 1}`} />
                    ))}
                  </div>
                </>
              )}

              {propertyData.amenities && propertyData.amenities.length > 0 && (
                <>
                  <label style={{ marginTop: '20px', display: 'block' }}>
                    Удобства
                  </label>
                  <div className="amenities-list">
                    {propertyData.amenities.map((amenity, idx) => (
                      <div key={idx} className="amenity-tag">
                        {amenity}
                      </div>
                    ))}
                  </div>
                </>
              )}

              <button className="get-report-btn" onClick={handleGetReport}>
                Получить полный отчет 📊
              </button>
            </div>
          )}

          {/* AI Improvements Examples */}
          {!propertyData && !loading && (
            <div style={{ marginTop: '60px', textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '30px', color: '#2c3e50' }}>
                ✨ Что может AI для вашего объекта
              </h3>

              {/* Description Improvement Example */}
              <div style={{
                background: '#fff',
                padding: '30px',
                borderRadius: '15px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                marginBottom: '30px',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ fontSize: '2.5rem', marginRight: '15px' }}>✍️</div>
                  <h4 style={{ fontSize: '1.3rem', color: '#2c3e50', margin: 0 }}>
                    Улучшение описания объекта
                  </h4>
                </div>

                <div style={{
                  background: '#f8f9fa',
                  padding: '15px',
                  borderRadius: '10px',
                  borderLeft: '4px solid #e0e0e0',
                  marginBottom: '15px'
                }}>
                  <strong style={{ color: '#999', fontSize: '0.9rem' }}>❌ Обычное описание:</strong>
                  <p style={{ color: '#666', margin: '10px 0 0 0', fontSize: '1rem', lineHeight: '1.6' }}>
                    "Уютная квартира в центре города. Есть кухня и балкон."
                  </p>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  padding: '15px',
                  borderRadius: '10px',
                  color: '#fff'
                }}>
                  <strong style={{ fontSize: '0.9rem' }}>✨ AI-улучшенное описание:</strong>
                  <p style={{ margin: '10px 0 0 0', fontSize: '1rem', lineHeight: '1.6' }}>
                    "Просторная квартира в самом сердце города с панорамными видами.
                    Полностью оборудованная кухня с современной техникой и уютный балкон
                    для утреннего кофе создают идеальные условия для комфортного отдыха."
                  </p>
                </div>
              </div>

              {/* Photo Improvement Example */}
              <div style={{
                background: '#fff',
                padding: '30px',
                borderRadius: '15px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                marginBottom: '40px',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ fontSize: '2.5rem', marginRight: '15px' }}>📸</div>
                  <h4 style={{ fontSize: '1.3rem', color: '#2c3e50', margin: 0 }}>
                    Улучшение фотографий
                  </h4>
                </div>

                <p style={{ color: '#555', marginBottom: '20px', fontSize: '1rem' }}>
                  Превращаем обычные фото в профессиональные продающие снимки:
                </p>

                <div className="features" style={{ marginTop: '20px' }}>
                  <div className="feature-card" style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🎨</div>
                    <p style={{ margin: 0 }}>
                      Профессиональная цветокоррекция и улучшение освещения
                    </p>
                  </div>
                  <div className="feature-card" style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔍</div>
                    <p style={{ margin: 0 }}>
                      Увеличение четкости и детализации изображения
                    </p>
                  </div>
                  <div className="feature-card" style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>✨</div>
                    <p style={{ margin: 0 }}>
                      Создание привлекательной, продающей атмосферы
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* How it works */}
          {!propertyData && !loading && (
            <div style={{ marginTop: '40px', textAlign: 'center', color: '#555' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#2c3e50' }}>
                Как это работает?
              </h3>
              <div className="features">
                <div className="feature-card">
                  <div style={{ fontSize: '2rem', marginBottom: '10px' }}>1️⃣</div>
                  <p>
                    Вставьте ссылку на ваш объект с Booking.com, Airbnb или VRBO
                  </p>
                </div>
                <div className="feature-card">
                  <div style={{ fontSize: '2rem', marginBottom: '10px' }}>2️⃣</div>
                  <p>Мы проанализируем объект и подгрузим информацию</p>
                </div>
                <div className="feature-card">
                  <div style={{ fontSize: '2rem', marginBottom: '10px' }}>3️⃣</div>
                  <p>
                    Оплатите отчет и получите детальный анализ на вашу почту
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
