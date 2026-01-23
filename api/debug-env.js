module.exports = (req, res) => {
  const envVars = {
    hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
    hasStripePublishable: !!process.env.STRIPE_PUBLISHABLE_KEY,
    hasReactAppStripe: !!process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY,
    stripeSecretLength: process.env.STRIPE_SECRET_KEY?.length || 0,
    stripeSecretPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 10) || 'undefined',
    allEnvKeys: Object.keys(process.env).filter(key =>
      key.includes('STRIPE') || key.includes('VERCEL') || key.includes('NODE')
    )
  };

  res.status(200).json(envVars);
};
