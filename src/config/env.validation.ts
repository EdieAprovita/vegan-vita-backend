import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Database
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  // JWT
  JWT_SECRET: Joi.when('NODE_ENV', {
    is: 'test',
    then: Joi.string().min(16).required().messages({
      'string.min':
        'JWT_SECRET must be at least 16 characters long in test environment',
    }),
    otherwise: Joi.string()
      .min(32)
      .pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&\-])[A-Za-z\d@$!%*?&\-]{32,}$/,
      )
      .required()
      .messages({
        'string.pattern.base':
          'JWT_SECRET must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&-)',
      }),
  }),
  JWT_EXPIRES_IN: Joi.string().default('7d'),

  // Node Environment
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Payments Mode
  // 'stripe' = Real Stripe payments (production)
  // 'dummy' = Mock payments for development/testing (NO real charges)
  PAYMENTS_MODE: Joi.string()
    .valid('stripe', 'dummy')
    .default('dummy')
    .messages({
      'any.only': 'PAYMENTS_MODE must be either "stripe" or "dummy"',
    }),

  // SMTP (optional in test)
  SMTP_HOST: Joi.when('NODE_ENV', {
    is: Joi.string().valid('production', 'development'),
    then: Joi.string().required(),
    otherwise: Joi.string().optional(),
  }),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASS: Joi.string().optional(),
  SMTP_FROM: Joi.string().optional(),

  // Frontend
  FRONTEND_URL: Joi.string().uri().optional(),

  // Stripe - Required only when PAYMENTS_MODE=stripe and NOT in test environment
  STRIPE_SECRET_KEY: Joi.when('PAYMENTS_MODE', {
    is: 'stripe',
    then: Joi.when('NODE_ENV', {
      is: 'test',
      then: Joi.string().optional(),
      otherwise: Joi.string()
        .pattern(/^sk_(test|live)_[a-zA-Z0-9]{24,}$/)
        .required()
        .messages({
          'string.pattern.base':
            'STRIPE_SECRET_KEY must start with sk_test_ or sk_live_ followed by at least 24 characters',
        }),
    }),
    otherwise: Joi.string().optional(), // Not required in dummy mode
  }),
  STRIPE_WEBHOOK_SECRET: Joi.when('PAYMENTS_MODE', {
    is: 'stripe',
    then: Joi.when('NODE_ENV', {
      is: 'test',
      then: Joi.string().optional(),
      otherwise: Joi.string()
        .pattern(/^whsec_[a-zA-Z0-9]{32,}$/)
        .required()
        .messages({
          'string.pattern.base':
            'STRIPE_WEBHOOK_SECRET must start with whsec_ followed by at least 32 characters',
        }),
    }),
    otherwise: Joi.string().optional(), // Not required in dummy mode
  }),
  STRIPE_PUBLISHABLE_KEY: Joi.string()
    .pattern(/^pk_(test|live)_[a-zA-Z0-9]{24,}$/)
    .optional()
    .messages({
      'string.pattern.base':
        'STRIPE_PUBLISHABLE_KEY must start with pk_test_ or pk_live_ followed by at least 24 characters',
    }),
});
