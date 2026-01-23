import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function SuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, selectedUpsells } = location.state || {};

  return (
    <div>
      <div className="header">
        <h1>✅ Оплата успешна!</h1>
      </div>

      <div className="container">
        <div className="main-content" style={{ maxWidth: '700px', textAlign: 'center' }}>
          <div className="success-animation">
            <div style={{ fontSize: '5rem', margin: '30px 0' }}>🎉</div>
          </div>

          <h2 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '20px' }}>
            Спасибо за ваш заказ!
          </h2>

          <div className="success-message" style={{ fontSize: '1.1rem', padding: '20px' }}>
            Ваш отчет формируется и будет отправлен на
            <br />
            <strong style={{ fontSize: '1.3rem', color: '#667eea' }}>{email}</strong>
            <br />в течение нескольких минут.
          </div>

          <div style={{ margin: '40px 0', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#2c3e50' }}>
              Что включено в ваш заказ:
            </h3>

            <div className="order-items">
              <div className="order-item">
                <div className="order-item-icon">📊</div>
                <div>
                  <h4>Базовый отчет по анализу недвижимости</h4>
                  <ul style={{ marginTop: '10px', color: '#555' }}>
                    <li>Глубокий анализ рынка и локации</li>
                    <li>Стратегия ценообразования на 3 месяца</li>
                    <li>Прогноз доходности и загрузки</li>
                    <li>Рекомендации по позиционированию</li>
                  </ul>
                </div>
              </div>

              {selectedUpsells?.description && (
                <div className="order-item">
                  <div className="order-item-icon">✍️</div>
                  <div style={{ width: '100%' }}>
                    <h4>Улучшение описания объекта с помощью AI</h4>

                    <div style={{ marginTop: '15px' }}>
                      <div style={{
                        background: '#fff',
                        padding: '12px',
                        borderRadius: '8px',
                        borderLeft: '3px solid #e0e0e0',
                        marginBottom: '10px'
                      }}>
                        <strong style={{ color: '#999', fontSize: '0.9rem' }}>❌ Было:</strong>
                        <p style={{ color: '#666', margin: '8px 0 0 0', fontSize: '0.95rem' }}>
                          "Уютная квартира в центре города. Есть кухня и балкон."
                        </p>
                      </div>

                      <div style={{
                        background: '#f0f9ff',
                        padding: '12px',
                        borderRadius: '8px',
                        borderLeft: '3px solid #667eea'
                      }}>
                        <strong style={{ color: '#667eea', fontSize: '0.9rem' }}>✨ Стало:</strong>
                        <p style={{ color: '#555', margin: '8px 0 0 0', fontSize: '0.95rem' }}>
                          "Просторная квартира в самом сердце города с панорамными видами.
                          Полностью оборудованная кухня с современной техникой и уютный балкон
                          для утреннего кофе создают идеальные условия для комфортного отдыха."
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedUpsells?.photos && (
                <div className="order-item">
                  <div className="order-item-icon">📸</div>
                  <div style={{ width: '100%' }}>
                    <h4>Улучшение фотографий с помощью AI</h4>
                    <p style={{ color: '#555', marginBottom: '15px' }}>
                      Мы берем фотографии вашей квартиры и улучшаем их с помощью AI:
                    </p>

                    <ul style={{
                      listStyle: 'none',
                      padding: 0,
                      color: '#555',
                      fontSize: '0.95rem',
                      lineHeight: '1.8'
                    }}>
                      <li style={{ paddingLeft: '25px', position: 'relative', marginBottom: '8px' }}>
                        <span style={{ position: 'absolute', left: 0, color: '#667eea' }}>✨</span>
                        Профессиональная цветокоррекция и улучшение освещения
                      </li>
                      <li style={{ paddingLeft: '25px', position: 'relative', marginBottom: '8px' }}>
                        <span style={{ position: 'absolute', left: 0, color: '#667eea' }}>✨</span>
                        Увеличение четкости и детализации
                      </li>
                      <li style={{ paddingLeft: '25px', position: 'relative', marginBottom: '8px' }}>
                        <span style={{ position: 'absolute', left: 0, color: '#667eea' }}>✨</span>
                        Создание привлекательной, продающей атмосферы
                      </li>
                    </ul>

                    <div style={{
                      background: '#f0f9ff',
                      padding: '12px',
                      borderRadius: '8px',
                      marginTop: '15px',
                      textAlign: 'center',
                      fontSize: '0.9rem',
                      color: '#667eea',
                      fontWeight: '500'
                    }}>
                      📷 Превращаем обычные фото в профессиональные продающие снимки
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              background: '#f8f9fa',
              padding: '30px',
              borderRadius: '15px',
              margin: '30px 0',
            }}
          >
            <h3 style={{ fontSize: '1.3rem', marginBottom: '15px', color: '#2c3e50' }}>
              Что дальше?
            </h3>
            <ol
              style={{
                textAlign: 'left',
                lineHeight: '2',
                color: '#555',
                paddingLeft: '20px',
              }}
            >
              <li>Проверьте вашу почту (включая папку "Спам")</li>
              <li>Изучите детальный отчет с рекомендациями</li>
              <li>Примените стратегию ценообразования</li>
              <li>Отслеживайте результаты и корректируйте цены</li>
            </ol>
          </div>

          <div style={{ margin: '30px 0' }}>
            <p style={{ color: '#555', marginBottom: '15px' }}>
              Если у вас возникли вопросы, просто ответьте на письмо с отчетом
            </p>
          </div>

          <button
            className="get-report-btn"
            onClick={() => navigate('/')}
            style={{ maxWidth: '300px' }}
          >
            Вернуться на главную
          </button>
        </div>
      </div>

      <style jsx>{`
        .order-items {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .order-item {
          display: flex;
          gap: 20px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 12px;
          align-items: flex-start;
        }

        .order-item-icon {
          font-size: 2.5rem;
          flex-shrink: 0;
        }

        .order-item h4 {
          font-size: 1.2rem;
          color: #2c3e50;
          margin-bottom: 8px;
        }

        .order-item ul {
          list-style: none;
          padding-left: 0;
        }

        .order-item li {
          padding: 4px 0;
          position: relative;
          padding-left: 20px;
        }

        .order-item li:before {
          content: '✓';
          position: absolute;
          left: 0;
          color: #4caf50;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}

export default SuccessPage;
