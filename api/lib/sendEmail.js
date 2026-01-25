const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send report email with PDF attachment using Resend
 */
async function sendReportEmail({ to, propertyName, pdfBuffer, location }) {
  try {
    const fileName = `AI-Pricing-Report-${Date.now()}.pdf`;

    const { data, error } = await resend.emails.send({
      from: 'AI Pricing Report <noreply@yourdomain.com>',
      to: [to],
      subject: `🎯 Ваш AI-отчёт готов: ${propertyName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 50px 30px; text-align: center; border-radius: 15px 15px 0 0;">
            <h1 style="margin: 0; font-size: 2.2rem; font-weight: 800;">🎯 Ваш AI-отчёт готов!</h1>
            <p style="margin-top: 15px; font-size: 1.1rem; opacity: 0.95;">
              Персональный анализ цен для вашего объекта
            </p>
          </div>

          <div style="padding: 40px 30px; background: white;">
            <h2 style="color: #1e293b; margin-bottom: 15px; font-size: 1.5rem;">${propertyName}</h2>
            <p style="color: #64748b; font-size: 1rem; margin-bottom: 5px;">📍 ${location}</p>

            <p style="font-size: 1.1rem; line-height: 1.7; color: #475569; margin-top: 30px;">
              Мы подготовили персональный анализ цен и доходности для вашего объекта на Booking.com с использованием искусственного интеллекта.
            </p>

            <div style="background: #eff6ff; padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #2563eb;">
              <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 1.2rem;">📎 PDF отчёт во вложении</h3>
              <p style="color: #1e40af; line-height: 1.6; margin: 0;">
                Откройте вложенный файл <strong>${fileName}</strong> для просмотра полного анализа с помесячными рекомендациями по ценообразованию.
              </p>
            </div>

            <div style="background: #f0fdf4; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #10b981;">
              <h3 style="color: #166534; margin: 0 0 15px 0; font-size: 1.2rem;">💡 Что внутри:</h3>
              <ul style="color: #166534; line-height: 2; padding-left: 20px; margin: 0;">
                <li>Прогноз оптимальных цен на следующие 6 месяцев</li>
                <li>Анализ сезонности для вашего региона</li>
                <li>Оценка потенциала увеличения дохода</li>
                <li>Персональные рекомендации по улучшению</li>
              </ul>
            </div>

            <div style="background: #fff3cd; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #ffc107;">
              <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 1.2rem;">🚀 Хотите больше бронирований?</h3>
              <p style="color: #856404; line-height: 1.7; margin: 0 0 15px 0;">
                Мы предлагаем дополнительные услуги для максимизации вашего дохода:
              </p>
              <ul style="color: #856404; line-height: 2; padding-left: 20px; margin: 0;">
                <li><strong>AI-улучшение описания</strong> — создаём продающие тексты</li>
                <li><strong>AI-улучшение фотографий</strong> — профессиональная обработка</li>
              </ul>
              <p style="color: #856404; line-height: 1.7; margin: 15px 0 0 0;">
                <strong>Ответьте на это письмо</strong>, чтобы узнать подробности!
              </p>
            </div>
          </div>

          <div style="background: #1e293b; color: white; padding: 35px 30px; text-align: center; border-radius: 0 0 15px 15px;">
            <p style="margin: 0; opacity: 0.9; font-size: 1.1rem;">
              <strong>AI Pricing Report</strong>
            </p>
            <p style="margin: 5px 0; opacity: 0.7; font-size: 0.95rem;">
              by Alpiko GmbH
            </p>
            <p style="margin: 20px 0 0 0; opacity: 0.7; font-size: 0.9rem;">
              📧 info@alpiko.com | 🌐 alpiko.com
            </p>
          </div>

          <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 0.85rem;">
            <p>Если у вас есть вопросы, просто ответьте на это письмо</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: fileName,
          content: pdfBuffer
        }
      ]
    });

    if (error) {
      throw new Error(`Resend API error: ${error.message}`);
    }

    console.log('✓ Email sent successfully via Resend:', data);
    return data;

  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

module.exports = { sendReportEmail };
