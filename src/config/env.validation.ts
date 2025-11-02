import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Database
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  // JWT
  JWT_SECRET: Joi.string()
    .min(32)
    .pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&\-])[A-Za-z\d@$!%*?&\-]{32,}$/,
    )
    .custom((value, helpers) => {
      // List of known test/CI secrets
      const knownTestSecrets = [
        'VeganVita!Test2024SecureKey@Min32',
        // Add other known test secrets here if needed
      ];
      // Only enforce in production
      if (
        helpers?.state?.ancestors &&
        helpers.state.ancestors[0]?.NODE_ENV === 'production' &&
        knownTestSecrets.includes(value)
      ) {
        return helpers.error('any.invalid');
      }
      return value;
    })
    .required()
    .messages({
      'string.pattern.base':
        'JWT_SECRET must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&-)',
      'any.invalid':
        'JWT_SECRET must not use a known test/CI secret in production. Please generate a secure, random secret.',
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
