import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function LandingPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [propertyData, setPropertyData] = useState(null);
  const [countdown, setCountdown] = useState(20);
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
      setError(err.response?.data?.error || 'Произошла ошибка при анализе ссылки');
      console.error('Error analyzing property:', err);
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
      setCountdown(20);
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

          {/* How it works */}
          {!propertyData && !loading && (
            <div style={{ marginTop: '60px', textAlign: 'center', color: '#555' }}>
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
