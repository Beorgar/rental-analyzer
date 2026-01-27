/**
 * Generate HTML report from pricing analysis data
 */
function generateReportHTML(data) {
  const { propertyData, analysis } = data;

  const currentDate = new Date().toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Pricing Report - ${propertyData.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1e293b;
      background: #f8fafc;
      padding: 40px 20px;
      line-height: 1.6;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 50px 40px;
      text-align: center;
    }
    .header h1 {
      font-size: 2.5rem;
      margin-bottom: 10px;
      font-weight: 800;
    }
    .header p {
      font-size: 1.2rem;
      opacity: 0.95;
      margin: 5px 0;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    .summary-card {
      padding: 30px 20px;
      text-align: center;
      border-right: 1px solid #e2e8f0;
    }
    .summary-card:last-child { border-right: none; }
    .summary-card h3 {
      font-size: 0.85rem;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 10px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .summary-card .value {
      font-size: 2.5rem;
      font-weight: 800;
      color: #2563eb;
      margin: 10px 0;
    }
    .summary-card .label {
      font-size: 0.9rem;
      color: #64748b;
    }
    .section {
      padding: 50px 40px;
      border-bottom: 1px solid #f1f5f9;
    }
    .section:last-child {
      border-bottom: none;
    }
    .section h2 {
      font-size: 1.8rem;
      font-weight: 700;
      margin-bottom: 30px;
      color: #1e293b;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 15px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    thead { background: #f1f5f9; }
    th {
      padding: 15px;
      text-align: left;
      font-weight: 600;
      color: #475569;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td {
      padding: 15px;
      border-bottom: 1px solid #e2e8f0;
    }
    tr:last-child td { border-bottom: none; }
    tbody tr:hover {
      background: #f8fafc;
    }
    .price-cell {
      font-size: 1.3rem;
      font-weight: 700;
      color: #2563eb;
    }
    .increase {
      color: #10b981;
      font-weight: 600;
    }
    .decrease {
      color: #ef4444;
      font-weight: 600;
    }
    .recommendations {
      background: #f0fdf4;
      border-radius: 15px;
      padding: 30px;
      margin: 30px 0;
      border-left: 4px solid #10b981;
    }
    .recommendations h3 {
      font-size: 1.5rem;
      margin-bottom: 20px;
      color: #1e293b;
    }
    .recommendations ul {
      list-style: none;
      padding: 0;
    }
    .recommendations li {
      padding: 12px 0;
      font-size: 1.05rem;
      color: #334155;
      line-height: 1.6;
      position: relative;
      padding-left: 35px;
    }
    .recommendations li:before {
      content: "✓";
      color: #10b981;
      font-weight: bold;
      font-size: 1.3rem;
      position: absolute;
      left: 0;
      top: 10px;
    }
    .footer {
      background: #1e293b;
      color: white;
      padding: 40px;
      text-align: center;
    }
    .footer p {
      opacity: 0.8;
      margin: 5px 0;
    }
    .footer .logo {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 10px;
    }
    .highlight-box {
      background: #eff6ff;
      border-left: 4px solid #2563eb;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .highlight-box p {
      font-size: 1.1rem;
      line-height: 1.6;
      color: #1e40af;
      margin: 0;
    }
    .property-details {
      background: #f8fafc;
      padding: 20px;
      border-radius: 10px;
      margin: 20px 0;
    }
    .property-details .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .property-details .detail-row:last-child {
      border-bottom: none;
    }
    .property-details .label {
      color: #64748b;
      font-weight: 500;
    }
    .property-details .value {
      color: #1e293b;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 AI Pricing Report</h1>
      <p style="font-size: 1.5rem; margin-top: 15px;">${propertyData.title}</p>
      <p style="font-size: 1rem; margin-top: 10px; opacity: 0.9;">
        📍 ${propertyData.location.city}, ${propertyData.location.country} |
        ⭐ ${propertyData.rating.average}/10 (${propertyData.rating.reviewCount} отзывов)
      </p>
    </div>

    <div class="summary">
      <div class="summary-card">
        <h3>Текущая цена</h3>
        <div class="value">${propertyData.pricing.currency === 'EUR' ? '€' : '$'}${propertyData.pricing.basePrice}</div>
        <div class="label">за ночь</div>
      </div>
      <div class="summary-card">
        <h3>Рекомендуемая</h3>
        <div class="value">${propertyData.pricing.currency === 'EUR' ? '€' : '$'}${analysis.averagePrice}</div>
        <div class="label">средняя цена</div>
      </div>
      <div class="summary-card">
        <h3>Потенциал</h3>
        <div class="value ${analysis.averagePrice > propertyData.pricing.basePrice ? 'increase' : 'decrease'}">
          ${analysis.averagePrice > propertyData.pricing.basePrice ? '+' : ''}${Math.round(((analysis.averagePrice - propertyData.pricing.basePrice) / propertyData.pricing.basePrice) * 100)}%
        </div>
        <div class="label">изменение</div>
      </div>
    </div>

    <div class="section">
      <h2>📊 Детали объекта</h2>
      <div class="property-details">
        <div class="detail-row">
          <span class="label">Вместимость</span>
          <span class="value">${propertyData.capacity.guests} гостей</span>
        </div>
        <div class="detail-row">
          <span class="label">Спален / Кроватей</span>
          <span class="value">${propertyData.capacity.bedrooms} / ${propertyData.capacity.beds}</span>
        </div>
        <div class="detail-row">
          <span class="label">Рейтинг</span>
          <span class="value">${propertyData.rating.average}/10 на основе ${propertyData.rating.reviewCount} отзывов</span>
        </div>
        <div class="detail-row">
          <span class="label">Платформа</span>
          <span class="value">${propertyData.platform === 'booking' ? 'Booking.com' : propertyData.platform}</span>
        </div>
      </div>

      <div class="highlight-box">
        <p>
          💡 <strong>Ключевой инсайт:</strong>
          ${analysis.averagePrice > propertyData.pricing.basePrice
            ? `Вы занижаете цены! Рекомендуем повысить среднюю цену до ${propertyData.pricing.currency === 'EUR' ? '€' : '$'}${analysis.averagePrice}/ночь (+${Math.round(((analysis.averagePrice - propertyData.pricing.basePrice) / propertyData.pricing.basePrice) * 100)}%). Это увеличит доход на ${propertyData.pricing.currency === 'EUR' ? '€' : '$'}${Math.round((analysis.averagePrice - propertyData.pricing.basePrice) * 67)} за 3 месяца при средней загрузке 75%.`
            : `Ваши цены близки к оптимальным. Следуйте помесячным рекомендациям для максимизации дохода.`
          }
        </p>
      </div>
    </div>

    ${analysis.tourismInsights ? `
    <div class="section">
      <h2>🌍 Анализ туризма в регионе</h2>
      <div class="property-details">
        <div class="detail-row">
          <span class="label">Тип региона</span>
          <span class="value">${analysis.tourismInsights.regionType || 'N/A'}</span>
        </div>
        <div class="detail-row">
          <span class="label">Пиковый сезон</span>
          <span class="value">${analysis.tourismInsights.peakSeason || 'N/A'}</span>
        </div>
        <div class="detail-row">
          <span class="label">Основные достопримечательности</span>
          <span class="value">${analysis.tourismInsights.mainAttractions || 'N/A'}</span>
        </div>
        <div class="detail-row">
          <span class="label">Целевая аудитория</span>
          <span class="value">${analysis.tourismInsights.targetAudience || 'N/A'}</span>
        </div>
        ${analysis.tourismInsights.schoolHolidaysImpact ? `
        <div class="detail-row">
          <span class="label">Влияние школьных каникул</span>
          <span class="value">${analysis.tourismInsights.schoolHolidaysImpact}</span>
        </div>
        ` : ''}
      </div>
    </div>
    ` : ''}

    <div class="section">
      <h2>📅 Посуточный прогноз цен (следующие 3 месяца)</h2>

      ${analysis.monthlyPricing && analysis.monthlyPricing[0]?.dailyPrices ?
        // NEW FORMAT: Daily pricing tables
        analysis.monthlyPricing.map((monthData, monthIdx) => `
          <div style="margin-bottom: 50px;">
            <h3 style="font-size: 1.5rem; color: #1e293b; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0;">
              ${monthData.month} ${monthData.year || ''}
            </h3>
            ${monthData.monthSummary ? `
              <div class="highlight-box" style="margin-bottom: 20px;">
                <p style="margin: 0; color: #1e40af; font-size: 1rem;">
                  <strong>Обзор месяца:</strong> ${monthData.monthSummary}
                </p>
              </div>
            ` : ''}

            <table style="font-size: 0.95rem;">
              <thead>
                <tr>
                  <th style="width: 8%;">День</th>
                  <th style="width: 12%;">Дата</th>
                  <th style="width: 15%;">День недели</th>
                  <th style="width: 15%;">Цена</th>
                  <th style="width: 50%;">Причина / Обоснование</th>
                </tr>
              </thead>
              <tbody>
                ${monthData.dailyPrices.map(day => {
                  const isWeekend = day.dayOfWeek === 'Saturday' || day.dayOfWeek === 'Sunday' || day.dayOfWeek === 'Friday';
                  return `
                    <tr style="${isWeekend ? 'background: #fef3c7;' : ''}">
                      <td style="font-weight: 600;">${day.day}</td>
                      <td>${day.date ? day.date.substring(5) : `${monthData.monthIndex || monthIdx + 1}/${day.day}`}</td>
                      <td>${day.dayOfWeek}</td>
                      <td class="price-cell" style="font-size: 1.2rem;">${propertyData.pricing.currency === 'EUR' ? '€' : '$'}${day.price}</td>
                      <td style="color: #64748b; font-size: 0.9rem;">${day.reason || 'Standard pricing'}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>

            <p style="color: #64748b; font-size: 0.9rem; margin-top: 15px; padding: 10px; background: #f8fafc; border-radius: 5px;">
              <strong>Средняя цена за месяц:</strong> ${propertyData.pricing.currency === 'EUR' ? '€' : '$'}${Math.round(monthData.dailyPrices.reduce((sum, d) => sum + d.price, 0) / monthData.dailyPrices.length)}
              | <strong>Мин:</strong> ${propertyData.pricing.currency === 'EUR' ? '€' : '$'}${Math.min(...monthData.dailyPrices.map(d => d.price))}
              | <strong>Макс:</strong> ${propertyData.pricing.currency === 'EUR' ? '€' : '$'}${Math.max(...monthData.dailyPrices.map(d => d.price))}
            </p>
          </div>
        `).join('')
      :
        // OLD FORMAT: Fallback to monthly summary table
        `<table>
          <thead>
            <tr>
              <th>Месяц</th>
              <th>Рекомендуемая цена</th>
              <th>Прогноз загрузки</th>
              <th>Примечания</th>
            </tr>
          </thead>
          <tbody>
            ${analysis.monthlyPricing.map(month => `
              <tr>
                <td><strong>${month.month}</strong></td>
                <td class="price-cell">${propertyData.pricing.currency === 'EUR' ? '€' : '$'}${month.recommendedPrice}</td>
                <td>${month.occupancy || 'N/A'}</td>
                <td style="color: #64748b;">${month.notes || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>`
      }

      <p style="color: #64748b; font-size: 0.95rem; margin-top: 30px;">
        <strong>Примечание:</strong> Выходные дни (пятница-воскресенье) выделены желтым. Цены учитывают сезонность, день недели, школьные каникулы и локальные события.
      </p>
    </div>

    <div class="section">
      <h2>💡 Персональные рекомендации</h2>
      <div class="recommendations">
        <h3>Как увеличить доход:</h3>
        <ul>
          ${analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
      </div>
    </div>

    <div class="footer">
      <div class="logo">AI Pricing Report</div>
      <p>by Alpiko GmbH</p>
      <p style="margin-top: 20px;">📧 info@alpiko.com | 🌐 alpiko.com</p>
      <p style="margin-top: 20px; font-size: 0.9rem; opacity: 0.7;">
        Отчёт создан ${currentDate}
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

module.exports = { generateReportHTML };
