const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');

const port = process.env.PORT || 3002;

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'AgroScale Cow Weight Monitoring & Analytics API',
    version: '1.0.0',
    description: `
## Overview
AgroScale is a multi-tenant IoT & AI-powered livestock weight monitoring platform.
This API facilitates:
1. **IoT Ingestion:** Secure data capture from ESP32 gateway load-cell scales.
2. **AI / Rule-Based Classification:** Automated evaluation of cow weight against standards or Python ML models.
3. **Multi-Tenant Farmer Dashboard:** Isolated cow records, real-time weight histories, 30-day weight trends, and growth curves.

## Authentication Mechanisms
- **Farmer Authentication (\`BearerAuth\`):** Standard JWT Bearer token required for all Farmer Dashboard endpoints (\`/api/v1/cows/*\`, \`/api/v1/dashboard/*\`). Obtain via \`POST /api/v1/auth/login\`.
- **IoT Hardware Authentication (\`ApiKeyAuth\`):** Custom HTTP header (\`x-api-key\`) required for hardware scale data transmission (\`/api/v1/iot/*\`).
`,
    contact: {
      name: 'AgroScale Engineering Team',
      email: 'support@agroscale.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: `http://localhost:${port}`,
      description: 'Local Development Server'
    },
    {
      url: 'https://api.agroscale.com',
      description: 'Production API Gateway'
    }
  ],
  tags: [
    {
      name: 'Health',
      description: 'System health check and database connectivity verification'
    },
    {
      name: 'Authentication',
      description: 'Farmer authentication and JWT token issuance'
    },
    {
      name: 'IoT Ingestion',
      description: 'ESP32 scale data ingestion and automated weight classification'
    },
    {
      name: 'Cows',
      description: 'Livestock management, individual cow records, measurement logs, and growth charts'
    },
    {
      name: 'Dashboard',
      description: 'Aggregated analytics, herd summaries, and 30-day weight trends'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Bearer token for Farmer Dashboard endpoints. Pass as: `Bearer <token>`'
      },
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
        description: 'Secret API key for IoT scale gateways. Passed in the `x-api-key` header.'
      }
    },
    schemas: {
      // 1. Auth Schemas
      LoginRequest: {
        type: 'object',
        required: ['password'],
        properties: {
          phone: {
            type: 'string',
            example: '012345678',
            description: 'Registered farmer phone number'
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'farmer1@agroscale.com',
            description: 'Optional registered farmer email address'
          },
          password: {
            type: 'string',
            format: 'password',
            example: 'password123',
            description: 'Account password'
          }
        }
      },
      LoginResponse: {
        type: 'object',
        properties: {
          token: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            description: 'Signed JSON Web Token (JWT) valid for 7 days'
          },
          farmer: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              name: { type: 'string', example: 'John Doe' },
              phone: { type: 'string', example: '012345678' },
              email: { type: 'string', example: 'farmer1@agroscale.com' }
            }
          }
        }
      },

      // 2. Cow Schemas
      Cow: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1,
            description: 'Database primary key identifier'
          },
          cowId: {
            type: 'string',
            example: 'COW-1042',
            description: 'Unique tag/identifier for the cow within the farmer farm'
          },
          breed: {
            type: 'string',
            example: 'Holstein',
            description: 'Breed of the cow'
          },
          sex: {
            type: 'string',
            enum: ['male', 'female', 'any'],
            example: 'female',
            description: 'Biological sex of the cow'
          },
          dateOfBirth: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            example: '2024-08-22T00:00:00.000Z',
            description: 'Estimated or recorded date of birth'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-08-22T09:15:30.000Z',
            description: 'Timestamp when the cow was first registered/upserted'
          }
        }
      },
      CowDetail: {
        allOf: [
          { $ref: '#/components/schemas/Cow' },
          {
            type: 'object',
            properties: {
              farmerId: {
                type: 'integer',
                example: 1,
                description: 'ID of the owning farmer'
              }
            }
          }
        ]
      },

      // 3. Weight Measurement Schemas
      WeightMeasurement: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 501,
            description: 'Measurement record ID'
          },
          cowId: {
            type: 'integer',
            example: 1,
            description: 'Internal cow ID reference'
          },
          deviceId: {
            type: 'string',
            example: 'esp32-gateway-01',
            description: 'Identifier of the scale gateway that captured the weight'
          },
          weightKg: {
            type: 'number',
            format: 'float',
            example: 350.5,
            description: 'Measured weight in kilograms'
          },
          ageMonthsAtMeasurement: {
            type: 'integer',
            example: 24,
            description: 'Age of the cow in months at time of measurement'
          },
          status: {
            type: 'string',
            nullable: true,
            enum: ['healthy', 'underweight', 'overweight', null],
            example: 'healthy',
            description: 'Classification result status'
          },
          confidence: {
            type: 'number',
            format: 'float',
            nullable: true,
            example: 0.95,
            description: 'Confidence score from ML model (0.0 to 1.0) or null if standard table fallback used'
          },
          measuredAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-08-22T09:15:30.000Z',
            description: 'Timestamp when the scale physical weighing occurred'
          },
          receivedAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-08-22T09:15:31.000Z',
            description: 'Timestamp when the backend ingested the payload'
          }
        }
      },
      WeightMeasurementWithCow: {
        allOf: [
          { $ref: '#/components/schemas/WeightMeasurement' },
          {
            type: 'object',
            properties: {
              cow: {
                type: 'object',
                properties: {
                  cowId: {
                    type: 'string',
                    example: 'COW-1042',
                    description: 'Cow tag/identifier'
                  }
                }
              }
            }
          }
        ]
      },

      // 4. Growth & Analytics Schemas
      GrowthPoint: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            format: 'date-time',
            example: '2026-08-22T09:15:30.000Z',
            description: 'Measurement timestamp'
          },
          weight_kg: {
            type: 'number',
            format: 'float',
            example: 350.5,
            description: 'Recorded weight in kilograms'
          }
        }
      },
      CowGrowthResponse: {
        type: 'object',
        properties: {
          points: {
            type: 'array',
            items: { $ref: '#/components/schemas/GrowthPoint' },
            description: 'Chronologically sorted historical weight data points for graphing'
          }
        }
      },
      DashboardSummaryResponse: {
        type: 'object',
        properties: {
          totalCows: {
            type: 'integer',
            example: 24,
            description: 'Total number of cows registered under the farmer'
          },
          recentActivity: {
            type: 'array',
            items: { $ref: '#/components/schemas/WeightMeasurementWithCow' },
            description: 'Up to 10 most recent weight measurements across the farm'
          }
        }
      },
      TrendPoint: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            example: '2026-08-22',
            description: 'Date string (YYYY-MM-DD)'
          },
          average_weight_kg: {
            type: 'number',
            format: 'float',
            example: 328.1,
            description: 'Average weight across all cows weighed on this date'
          }
        }
      },
      DashboardTrendsResponse: {
        type: 'object',
        properties: {
          points: {
            type: 'array',
            items: { $ref: '#/components/schemas/TrendPoint' },
            description: 'Past 30 days daily average weight trends'
          }
        }
      },

      // 5. IoT Schemas
      IoTMeasurementRequest: {
        type: 'object',
        required: ['device_id', 'cow_id', 'breed', 'age_months', 'weight_kg'],
        properties: {
          device_id: {
            type: 'string',
            example: 'esp32-gateway-01',
            description: 'Registered hardware scale gateway ID (must exist in Device table)'
          },
          cow_id: {
            type: 'string',
            example: 'COW-1042',
            description: 'Tag / ID of the cow'
          },
          breed: {
            type: 'string',
            example: 'Holstein',
            description: 'Breed of the cow'
          },
          sex: {
            type: 'string',
            enum: ['male', 'female', 'any'],
            default: 'any',
            example: 'female',
            description: 'Biological sex of the cow (optional, defaults to "any")'
          },
          age_months: {
            type: 'integer',
            minimum: 0,
            example: 24,
            description: 'Age in months (must be non-negative)'
          },
          weight_kg: {
            type: 'number',
            format: 'float',
            minimum: 0.1,
            example: 350.5,
            description: 'Weight measured by load-cell sensor in kg (must be positive)'
          },
          measured_at: {
            type: 'string',
            format: 'date-time',
            example: '2026-08-22T09:15:30Z',
            description: 'Optional ISO-8601 timestamp from device NTP clock (max 5 minutes into the future)'
          }
        }
      },
      ClassificationResult: {
        type: 'object',
        nullable: true,
        properties: {
          label: {
            type: 'string',
            enum: ['healthy', 'underweight', 'overweight'],
            example: 'healthy',
            description: 'Calculated health classification'
          },
          confidence: {
            type: 'number',
            format: 'float',
            nullable: true,
            example: 0.95,
            description: 'Model confidence score (null if fallback standard was used)'
          }
        }
      },
      IoTMeasurementResponse: {
        type: 'object',
        properties: {
          measurement_id: {
            type: 'integer',
            example: 501,
            description: 'Newly generated primary key for the measurement'
          },
          cow_id: {
            type: 'string',
            example: 'COW-1042',
            description: 'Cow identifier tag'
          },
          classification: {
            $ref: '#/components/schemas/ClassificationResult'
          }
        }
      },

      // 6. System & Error Schemas
      HealthResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'ok',
            description: 'API operational status'
          },
          db: {
            type: 'string',
            enum: ['ok', 'error'],
            example: 'ok',
            description: 'Database connectivity status'
          }
        }
      },
      ErrorDetail: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            example: 'UNAUTHORIZED',
            description: 'Machine-readable error code'
          },
          message: {
            type: 'string',
            example: 'Invalid or missing credentials',
            description: 'Human-readable error description'
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            $ref: '#/components/schemas/ErrorDetail'
          }
        }
      },
      ValidationErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                example: 'VALIDATION_ERROR',
                description: 'Validation failure error code'
              },
              message: {
                description: 'Zod validation error details or message string',
                oneOf: [
                  {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        path: {
                          type: 'array',
                          items: { type: 'string' }
                        },
                        message: { type: 'string' }
                      }
                    }
                  },
                  {
                    type: 'string',
                    example: 'measured_at cannot be safely in the future'
                  }
                ]
              }
            }
          }
        }
      },
      RateLimitErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                example: 'RATE_LIMIT_EXCEEDED'
              },
              message: {
                type: 'string',
                example: 'Too many requests, please try again later.'
              }
            }
          }
        }
      }
    }
  }
};

const routePaths = path.join(__dirname, '../routes/*.js').split(path.sep).join('/');
const options = {
  swaggerDefinition,
  apis: [routePaths]
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = { swaggerSpec };
