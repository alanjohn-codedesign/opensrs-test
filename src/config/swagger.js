const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'OpenSRS API Backend',
      version: '1.0.0',
      description: 'A comprehensive Node.js backend for OpenSRS API integration to manage domain registrations, lookups, renewals, and other domain-related operations.',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.yourdomain.com',
        description: 'Production server'
      }
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Validation failed'
            },
            message: {
              type: 'string',
              example: 'Invalid input data'
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    example: 'domain'
                  },
                  message: {
                    type: 'string',
                    example: 'Domain name must be a valid domain format'
                  }
                }
              }
            }
          }
        },
        Contact: {
          type: 'object',
          required: ['first_name', 'last_name', 'address1', 'city', 'state', 'country', 'postal_code', 'phone', 'email'],
          properties: {
            first_name: {
              type: 'string',
              maxLength: 64,
              example: 'John'
            },
            last_name: {
              type: 'string',
              maxLength: 64,
              example: 'Doe'
            },
            org_name: {
              type: 'string',
              maxLength: 128,
              example: 'Example Corp'
            },
            address1: {
              type: 'string',
              maxLength: 128,
              example: '123 Main St'
            },
            address2: {
              type: 'string',
              maxLength: 128,
              example: 'Suite 100'
            },
            city: {
              type: 'string',
              maxLength: 128,
              example: 'New York'
            },
            state: {
              type: 'string',
              maxLength: 128,
              example: 'NY'
            },
            country: {
              type: 'string',
              minLength: 2,
              maxLength: 2,
              example: 'US'
            },
            postal_code: {
              type: 'string',
              maxLength: 16,
              example: '10001'
            },
            phone: {
              type: 'string',
              minLength: 10,
              maxLength: 17,
              example: '+1-555-123-4567'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com'
            },
            fax: {
              type: 'string',
              maxLength: 17,
              example: '+1-555-123-4568'
            }
          }
        },
        DomainLookupRequest: {
          type: 'object',
          required: ['domain'],
          properties: {
            domain: {
              type: 'string',
              pattern: '^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$',
              example: 'example.com'
            }
          }
        },
        DomainLookupResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            domain: {
              type: 'string',
              example: 'example.com'
            },
            available: {
              type: 'boolean',
              example: true
            },
            responseCode: {
              type: 'string',
              example: '210'
            },
            responseText: {
              type: 'string',
              example: 'Domain available'
            }
          }
        },
        BulkDomainLookupRequest: {
          type: 'object',
          required: ['domains'],
          properties: {
            domains: {
              type: 'array',
              items: {
                type: 'string',
                pattern: '^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'
              },
              minItems: 1,
              maxItems: 100,
              example: ['example.com', 'test.com', 'domain.org']
            }
          }
        },
        BulkDomainLookupResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  domain: {
                    type: 'string',
                    example: 'example.com'
                  },
                  available: {
                    type: 'boolean',
                    example: true
                  },
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  responseCode: {
                    type: 'string',
                    example: '210'
                  },
                  responseText: {
                    type: 'string',
                    example: 'Domain available'
                  },
                  error: {
                    type: 'string',
                    nullable: true
                  }
                }
              }
            },
            total: {
              type: 'integer',
              example: 3
            },
            available: {
              type: 'integer',
              example: 2
            }
          }
        },
        DomainRegistrationRequest: {
          type: 'object',
          required: ['domain', 'registrant_contact'],
          properties: {
            domain: {
              type: 'string',
              pattern: '^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$',
              example: 'example.com'
            },
            period: {
              type: 'integer',
              minimum: 1,
              maximum: 10,
              default: 1,
              example: 1
            },
            auto_renew: {
              type: 'boolean',
              default: false,
              example: false
            },
            whois_privacy: {
              type: 'boolean',
              default: false,
              example: false
            },
            registrant_contact: {
              $ref: '#/components/schemas/Contact'
            },
            admin_contact: {
              $ref: '#/components/schemas/Contact'
            },
            tech_contact: {
              $ref: '#/components/schemas/Contact'
            },
            billing_contact: {
              $ref: '#/components/schemas/Contact'
            },
            nameservers: {
              type: 'array',
              items: {
                type: 'string',
                pattern: '^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'
              },
              minItems: 1,
              maxItems: 13,
              example: ['ns1.example.com', 'ns2.example.com']
            }
          }
        },
        DomainRegistrationResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            domain: {
              type: 'string',
              example: 'example.com'
            },
            period: {
              type: 'integer',
              example: 1
            },
            responseCode: {
              type: 'string',
              example: '200'
            },
            responseText: {
              type: 'string',
              example: 'Domain registered successfully'
            },
            orderId: {
              type: 'string',
              nullable: true,
              example: '12345'
            }
          }
        },
        DomainRenewalRequest: {
          type: 'object',
          properties: {
            period: {
              type: 'integer',
              minimum: 1,
              maximum: 10,
              default: 1,
              example: 1
            }
          }
        },
        DomainModificationRequest: {
          type: 'object',
          properties: {
            nameservers: {
              type: 'array',
              items: {
                type: 'string',
                pattern: '^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'
              },
              minItems: 1,
              maxItems: 13,
              example: ['ns1.example.com', 'ns2.example.com']
            },
            auto_renew: {
              type: 'boolean',
              example: true
            },
            whois_privacy: {
              type: 'boolean',
              example: true
            }
          }
        },
        ContactUpdateRequest: {
          type: 'object',
          properties: {
            registrant_contact: {
              $ref: '#/components/schemas/Contact'
            },
            admin_contact: {
              $ref: '#/components/schemas/Contact'
            },
            tech_contact: {
              $ref: '#/components/schemas/Contact'
            },
            billing_contact: {
              $ref: '#/components/schemas/Contact'
            }
          }
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'OK'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2025-08-31T14:31:05.415Z'
            },
            environment: {
              type: 'string',
              example: 'test'
            },
            version: {
              type: 'string',
              example: '1.0.0'
            }
          }
        },
        AccountBalanceResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                responseCode: {
                  type: 'string',
                  example: '200'
                },
                responseText: {
                  type: 'string',
                  example: 'Balance retrieved successfully'
                },
                isSuccess: {
                  type: 'boolean',
                  example: true
                },
                balance: {
                  type: 'number',
                  example: 1000.50
                },
                currency: {
                  type: 'string',
                  example: 'USD'
                }
              }
            }
          }
        },
        NameSuggestionsRequest: {
          type: 'object',
          required: ['searchString'],
          properties: {
            searchString: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
              example: 'test'
            },
            services: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['lookup', 'suggestion']
              },
              default: ['lookup', 'suggestion'],
              example: ['lookup', 'suggestion']
            },
            tlds: {
              type: 'array',
              items: {
                type: 'string',
                pattern: '^\\.[a-zA-Z0-9]+$'
              },
              default: ['.com', '.net', '.org', '.info', '.biz', '.us', '.mobi'],
              example: ['.com', '.net', '.org']
            },
            languages: {
              type: 'array',
              items: {
                type: 'string',
                minLength: 2,
                maxLength: 5
              },
              default: ['en'],
              example: ['en']
            },
            maxWaitTime: {
              type: 'integer',
              minimum: 10,
              maximum: 60,
              default: 30,
              example: 30
            }
          }
        },
        NameSuggestionsResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            responseCode: {
              type: 'string',
              example: '200'
            },
            responseText: {
              type: 'string',
              example: 'Command Successful'
            },
            suggestions: {
              type: 'object',
              properties: {
                count: {
                  type: 'integer',
                  example: 50
                },
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      domain: {
                        type: 'string',
                        example: 'example.com'
                      },
                      status: {
                        type: 'string',
                        example: 'available'
                      },
                      available: {
                        type: 'boolean',
                        example: true
                      }
                    }
                  }
                }
              }
            },
            lookups: {
              type: 'object',
              properties: {
                count: {
                  type: 'integer',
                  example: 6
                },
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      domain: {
                        type: 'string',
                        example: 'example.com'
                      },
                      status: {
                        type: 'string',
                        example: 'available'
                      },
                      available: {
                        type: 'boolean',
                        example: true
                      }
                    }
                  }
                }
              }
            },
            premium: {
              type: 'object',
              properties: {
                count: {
                  type: 'integer',
                  example: 20
                },
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      domain: {
                        type: 'string',
                        example: 'premium.com'
                      },
                      status: {
                        type: 'string',
                        example: 'available'
                      },
                      available: {
                        type: 'boolean',
                        example: true
                      },
                      price: {
                        type: 'number',
                        example: 1349.00
                      }
                    }
                  }
                }
              }
            },
            personalNames: {
              type: 'object',
              properties: {
                count: {
                  type: 'integer',
                  example: 6
                },
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      domain: {
                        type: 'string',
                        example: 'personal.example.com'
                      },
                      status: {
                        type: 'string',
                        example: 'available'
                      },
                      available: {
                        type: 'boolean',
                        example: true
                      }
                    }
                  }
                }
              }
            },
            isSearchCompleted: {
              type: 'boolean',
              example: true
            },
            responseTime: {
              type: 'number',
              example: 0.367
            }
          }
        },
        DomainPriceResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            domain: {
              type: 'string',
              example: 'example.com'
            },
            data: {
              type: 'object',
              properties: {
                price: {
                  type: 'string',
                  example: '10.85'
                },
                currency: {
                  type: 'string',
                  example: 'USD'
                },
                responseCode: {
                  type: 'string',
                  example: '200'
                },
                responseText: {
                  type: 'string',
                  example: 'Command Successful'
                }
              }
            }
          }
        },
        BulkPriceRequest: {
          type: 'object',
          required: ['domains'],
          properties: {
            domains: {
              type: 'array',
              items: {
                type: 'string',
                pattern: '^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'
              },
              minItems: 1,
              maxItems: 20,
              example: ['example.com', 'test.net', 'mycompany.org']
            }
          }
        },
        BulkPriceResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  domain: {
                    type: 'string',
                    example: 'example.com'
                  },
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  price: {
                    type: 'string',
                    example: '10.85'
                  },
                  error: {
                    type: 'string',
                    nullable: true
                  }
                }
              }
            },
            total: {
              type: 'integer',
              example: 3
            },
            successful: {
              type: 'integer',
              example: 3
            }
          }
        },
        DnsZoneRequest: {
          type: 'object',
          required: ['domain'],
          properties: {
            domain: {
              type: 'string',
              pattern: '^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$',
              example: 'example.com'
            },
            nameservers: {
              type: 'array',
              items: {
                type: 'string',
                pattern: '^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'
              },
              minItems: 1,
              maxItems: 13,
              example: ['ns1.example.com', 'ns2.example.com']
            }
          }
        },
        DnsZoneResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            domain: {
              type: 'string',
              example: 'example.com'
            },
            responseCode: {
              type: 'string',
              example: '200'
            },
            responseText: {
              type: 'string',
              example: 'DNS zone created successfully'
            },
            data: {
              type: 'object',
              properties: {
                zone_id: {
                  type: 'string',
                  example: '12345'
                },
                nameservers: {
                  type: 'array',
                  items: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        DnsRecordsRequest: {
          type: 'object',
          required: ['domain', 'records'],
          properties: {
            domain: {
              type: 'string',
              pattern: '^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$',
              example: 'example.com'
            },
            records: {
              type: 'object',
              properties: {
                A: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string',
                        example: '@'
                      },
                      value: {
                        type: 'string',
                        example: '192.168.1.1'
                      },
                      ttl: {
                        type: 'integer',
                        example: 3600
                      }
                    }
                  }
                },
                CNAME: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string',
                        example: 'www'
                      },
                      value: {
                        type: 'string',
                        example: 'example.com'
                      },
                      ttl: {
                        type: 'integer',
                        example: 3600
                      }
                    }
                  }
                },
                MX: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string',
                        example: '@'
                      },
                      value: {
                        type: 'string',
                        example: 'mail.example.com'
                      },
                      priority: {
                        type: 'integer',
                        example: 10
                      },
                      ttl: {
                        type: 'integer',
                        example: 3600
                      }
                    }
                  }
                }
              }
            }
          }
        },
        NameserverRequest: {
          type: 'object',
          required: ['nameserver', 'ip_address'],
          properties: {
            nameserver: {
              type: 'string',
              pattern: '^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$',
              example: 'ns1.example.com'
            },
            ip_address: {
              type: 'string',
              pattern: '^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$',
              example: '192.168.1.1'
            }
          }
        },
        NameserverResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            nameserver: {
              type: 'string',
              example: 'ns1.example.com'
            },
            responseCode: {
              type: 'string',
              example: '200'
            },
            responseText: {
              type: 'string',
              example: 'Nameserver created successfully'
            },
            data: {
              type: 'object',
              properties: {
                ip_address: {
                  type: 'string',
                  example: '192.168.1.1'
                },
                status: {
                  type: 'string',
                  example: 'active'
                }
              }
            }
          }
        },
        TransferRequest: {
          type: 'object',
          required: ['domain', 'auth_info'],
          properties: {
            domain: {
              type: 'string',
              pattern: '^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$',
              example: 'example.com'
            },
            auth_info: {
              type: 'string',
              minLength: 6,
              maxLength: 16,
              example: 'ABC123XYZ'
            },
            registrant_contact: {
              $ref: '#/components/schemas/Contact'
            }
          }
        },
        TransferResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            domain: {
              type: 'string',
              example: 'example.com'
            },
            responseCode: {
              type: 'string',
              example: '200'
            },
            responseText: {
              type: 'string',
              example: 'Transfer initiated successfully'
            },
            data: {
              type: 'object',
              properties: {
                transfer_id: {
                  type: 'string',
                  example: 'TR123456'
                },
                status: {
                  type: 'string',
                  example: 'pending'
                }
              }
            }
          }
        },
        TransfersListResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            responseCode: {
              type: 'string',
              example: '200'
            },
            responseText: {
              type: 'string',
              example: 'Command successful'
            },
            data: {
              type: 'object',
              properties: {
                total: {
                  type: 'string',
                  example: '5'
                },
                page: {
                  type: 'string',
                  example: '1'
                },
                page_size: {
                  type: 'string',
                  example: '40'
                },
                transfers: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      domain: {
                        type: 'string',
                        example: 'example.com'
                      },
                      status: {
                        type: 'string',
                        example: 'pending'
                      },
                      transfer_id: {
                        type: 'string',
                        example: 'TR123456'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      }
    },
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints'
      },
      {
        name: 'Domains',
        description: 'Domain management operations'
      },
      {
        name: 'Account',
        description: 'Account-related operations'
      },
      {
        name: 'DNS',
        description: 'DNS zone management operations'
      },
      {
        name: 'Nameservers',
        description: 'Nameserver management operations'
      },
      {
        name: 'Transfers',
        description: 'Domain transfer operations'
      },
      {
        name: 'Bulk Operations',
        description: 'Bulk domain operations'
      },
      {
        name: 'Suggestions',
        description: 'Domain name suggestions'
      },
      {
        name: 'Pricing',
        description: 'Domain pricing operations'
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/server.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs;

