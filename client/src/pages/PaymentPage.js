import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';

// Stripe publishable key from environment variable
const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY ||
  'pk_test_51SHXW9Rrj9EnQ17aJQzjpy5UiCisIZq3gDFpMb8pbqeTS0FjWNGIOQGMcVRdwn3PNVUslQtPrZfY36Vw0EBZlUGO00mNKFfAHe'
);

function CheckoutForm({ propertyData }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  // Pricing
  const basePrice = 49.99; // Price in dollars
  const upsellDescriptionPrice = 29.99;
  const upsellPhotosPrice = 99.99;

  const [selectedUpsells, setSelectedUpsells] = useState({
    description: false,
    photos: false,
  });

  const totalPrice =
    basePrice +
    (selectedUpsells.description ? upsellDescriptionPrice : 0) +
    (selectedUpsells.photos ? upsellPhotosPrice : 0);

  useEffect(() => {
    // Create payment intent
    const createPaymentIntent = async () => {
      try {
        const response = await axios.post('/api/payment/create-intent', {
          amount: Math.round(totalPrice * 100), // Convert to cents
          email,
          propertyId: propertyData?.id,
        });
        setClientSecret(response.data.clientSecret);
      } catch (err) {
        console.error('Error creating payment intent:', err);
        setError('Ошибка при создании платежа');
      }
    };

    if (email && email.includes('@')) {
      createPaymentIntent();
    }
  }, [email, totalPrice, propertyData]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !email) {
      return;
    }

    if (!email.includes('@')) {
      setError('Введите корректный email');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const cardElement = elements.getElement(CardElement);

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: email,
          },
        },
      });

      if (error) {
        setError(error.message);
        setProcessing(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Generate and send report
        await axios.post('/api/report/generate', {
          propertyData,
          email,
          paymentIntentId: paymentIntent.id,
        });

        navigate('/success', {
          state: {
            email,
            selectedUpsells
          }
        });
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('Произошла ошибка при обработке платежа');
      setProcessing(false);
    }
  };

  const toggleUpsell = (type) => {
    setSelectedUpsells((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  return (
    <div className="payment-container">
      <div className="payment-header">
        <h2>Оформление заказа</h2>
        {propertyData && (
          <div className="order-summary-compact">
            <p>
              <strong>{propertyData.title}</strong>
            </p>
            <p className="location-text">
              {propertyData.location.city}, {propertyData.location.country}
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="payment-form">
        {/* Email Input */}
        <div className="form-group">
          <label htmlFor="email">Email для получения отчета *</label>
          <input
            type="email"
            id="email"
            className="form-input"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <small>Отчет будет отправлен на этот адрес после оплаты</small>
        </div>

        {/* Base Report */}
        <div className="pricing-section">
          <div className="price-item base-report">
            <div>
              <h3>📊 Базовый отчет</h3>
              <ul>
                <li>Глубокий анализ рынка и локации</li>
                <li>Стратегия ценообразования на 3 месяца</li>
                <li>Прогноз доходности и загрузки</li>
                <li>Рекомендации по конкурентному позиционированию</li>
              </ul>
            </div>
            <div className="price">${basePrice.toFixed(2)}</div>
          </div>

          {/* Upsells */}
          <div className="upsells">
            <h3>🚀 Дополнительные услуги</h3>

            <div
              className={`upsell-item ${selectedUpsells.description ? 'selected' : ''}`}
              onClick={() => toggleUpsell('description')}
            >
              <div className="upsell-checkbox">
                <input
                  type="checkbox"
                  checked={selectedUpsells.description}
                  onChange={() => toggleUpsell('description')}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="upsell-content">
                <h4>✍️ Улучшение описания объекта</h4>
                <p>
                  Профессиональный копирайтер создаст продающее описание,
                  оптимизированное для поисковых систем и увеличения конверсии
                </p>
              </div>
              <div className="upsell-price">+${upsellDescriptionPrice.toFixed(2)}</div>
            </div>

            <div
              className={`upsell-item ${selectedUpsells.photos ? 'selected' : ''}`}
              onClick={() => toggleUpsell('photos')}
            >
              <div className="upsell-checkbox">
                <input
                  type="checkbox"
                  checked={selectedUpsells.photos}
                  onChange={() => toggleUpsell('photos')}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="upsell-content">
                <h4>📸 Улучшение фотографий</h4>
                <p>
                  Профессиональная обработка ваших фотографий или организация
                  фотосессии. Качественные фото увеличивают бронирования на 40%
                </p>
              </div>
              <div className="upsell-price">+${upsellPhotosPrice.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Card Element */}
        <div className="form-group">
          <label>Данные карты</label>
          <div className="card-element-container">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                  invalid: {
                    color: '#9e2146',
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Total */}
        <div className="total-section">
          <div className="total-row">
            <span>Итого:</span>
            <span className="total-amount">${totalPrice.toFixed(2)}</span>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Submit Button */}
        <button
          type="submit"
          className="submit-payment-btn"
          disabled={!stripe || processing || !email}
        >
          {processing ? 'Обработка...' : `Оплатить $${totalPrice.toFixed(2)}`}
        </button>

        <p className="security-note">
          🔒 Ваши данные защищены и обрабатываются через Stripe
        </p>
      </form>
    </div>
  );
}

function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const propertyData = location.state?.propertyData;

  useEffect(() => {
    if (!propertyData) {
      navigate('/');
    }
  }, [propertyData, navigate]);

  if (!propertyData) {
    return null;
  }

  return (
    <div>
      <div className="header" style={{ padding: '40px 20px 20px' }}>
        <h1>💳 Оплата</h1>
      </div>

      <div className="container">
        <div className="main-content" style={{ maxWidth: '700px' }}>
          <Elements stripe={stripePromise}>
            <CheckoutForm propertyData={propertyData} />
          </Elements>
        </div>
      </div>
    </div>
  );
}

export default PaymentPage;
