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
});
