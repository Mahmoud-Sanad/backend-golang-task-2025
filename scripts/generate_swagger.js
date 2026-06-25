const fs = require('fs');
const path = require('path');

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'Backend Golang Task API',
    version: '1.0.0',
    description: 'OpenAPI specification for all routes and methods supported by the app.'
  },
  servers: [
    { url: 'http://localhost:3000/api/v1', description: 'Local standard server' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  paths: {
    '/accounts/login': {
      post: {
        summary: 'Authenticate user',
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Login successful' } }
      }
    },
    '/accounts/register': {
      post: {
        summary: 'Register new account',
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Registration successful' } }
      }
    },
    '/accounts/me': {
      get: {
        summary: 'Get authenticated account profile',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Profile retrieved' } }
      },
      post: {
        summary: 'Update authenticated account profile',
        security: [{ bearerAuth: [] }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Profile updated' } }
      }
    },
    '/accounts': {
      post: {
        summary: 'Create a new account (admin)',
        security: [{ bearerAuth: [] }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Account created' } }
      },
      get: {
        summary: 'List all accounts (admin)',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Accounts retrieved' } }
      }
    },
    '/accounts/{id}': {
      get: {
        summary: 'Get account by ID (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Account retrieved' } }
      },
      put: {
        summary: 'Update account by ID (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Account updated' } }
      },
      delete: {
        summary: 'Delete account by ID (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Account deleted' } }
      }
    },
    '/server/notifications': {
      post: {
        summary: 'Create server notification',
        security: [{ bearerAuth: [] }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Server notification created' } }
      },
      get: {
        summary: 'List server notifications',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Server notifications listed' } }
      }
    },
    '/server/notifications/{id}': {
      get: {
        summary: 'Get server notification',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Server notification retrieved' } }
      },
      put: {
        summary: 'Update server notification',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Server notification updated' } }
      },
      delete: {
        summary: 'Delete server notification',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Server notification deleted' } }
      }
    },
    '/server/logs': {
      post: {
        summary: 'Create server log',
        security: [{ bearerAuth: [] }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Server log created' } }
      },
      get: {
        summary: 'List server logs',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Server logs listed' } }
      }
    },
    '/server/logs/{id}': {
      get: {
        summary: 'Get server log',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Server log retrieved' } }
      },
      put: {
        summary: 'Update server log',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Server log updated' } }
      },
      delete: {
        summary: 'Delete server log',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Server log deleted' } }
      }
    },
    '/payments/products': {
      post: {
        summary: 'Create product',
        security: [{ bearerAuth: [] }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Product created' } }
      },
      get: {
        summary: 'List products',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Products listed' } }
      }
    },
    '/payments/products/{id}': {
      get: {
        summary: 'Get product',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Product retrieved' } }
      },
      put: {
        summary: 'Update product',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Product updated' } }
      },
      delete: {
        summary: 'Delete product',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Product deleted' } }
      }
    },
    '/payments/product-stocks': {
      post: {
        summary: 'Create product stock',
        security: [{ bearerAuth: [] }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Product stock created' } }
      },
      get: {
        summary: 'List product stocks',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Product stocks listed' } }
      }
    },
    '/payments/product-stocks/{id}': {
      get: {
        summary: 'Get product stock',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Product stock retrieved' } }
      },
      put: {
        summary: 'Update product stock',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Product stock updated' } }
      },
      delete: {
        summary: 'Delete product stock',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Product stock deleted' } }
      }
    },
    '/payments/orders': {
      post: {
        summary: 'Create order',
        security: [{ bearerAuth: [] }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Order created' } }
      },
      get: {
        summary: 'List orders',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Orders listed' } }
      }
    },
    '/payments/orders/my': {
      get: {
        summary: 'Get orders for authenticated user',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'User orders returned' } }
      }
    },
    '/payments/orders/report/daily': {
      get: {
        summary: 'Get daily order report',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Daily report returned' } }
      }
    },
    '/payments/orders/{id}/status': {
      get: {
        summary: 'Get order status',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Order status returned' } }
      },
      put: {
        summary: 'Update order status',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Order status updated' } }
      }
    },
    '/payments/orders/{id}/cancel': {
      post: {
        summary: 'Cancel an order',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Order canceled' } }
      }
    },
    '/payments/orders/{id}': {
      get: {
        summary: 'Get order by ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Order retrieved' } }
      },
      put: {
        summary: 'Update order',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Order updated' } }
      },
      delete: {
        summary: 'Delete order',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Order deleted' } }
      }
    },
    '/payments/transactions': {
      post: {
        summary: 'Create transaction',
        security: [{ bearerAuth: [] }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Transaction created' } }
      },
      get: {
        summary: 'List transactions',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Transactions listed' } }
      }
    },
    '/payments/transactions/{id}': {
      get: {
        summary: 'Get transaction',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Transaction retrieved' } }
      },
      put: {
        summary: 'Update transaction',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Transaction updated' } }
      },
      delete: {
        summary: 'Delete transaction',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Transaction deleted' } }
      }
    },
    '/payments/notifications': {
      post: {
        summary: 'Create payment notification',
        security: [{ bearerAuth: [] }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Payment notification created' } }
      },
      get: {
        summary: 'List payment notifications',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Payment notifications listed' } }
      }
    },
    '/payments/notifications/{id}': {
      get: {
        summary: 'Get payment notification',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Payment notification retrieved' } }
      },
      put: {
        summary: 'Update payment notification',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Payment notification updated' } }
      },
      delete: {
        summary: 'Delete payment notification',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Payment notification deleted' } }
      }
    },
    '/payments/logs': {
      post: {
        summary: 'Create payment log',
        security: [{ bearerAuth: [] }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Payment log created' } }
      },
      get: {
        summary: 'List payment logs',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Payment logs listed' } }
      }
    },
    '/payments/logs/{id}': {
      get: {
        summary: 'Get payment log',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Payment log retrieved' } }
      },
      put: {
        summary: 'Update payment log',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Payment log updated' } }
      },
      delete: {
        summary: 'Delete payment log',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Payment log deleted' } }
      }
    },
    '/servers': {
      post: {
        summary: 'Create server configuration',
        security: [{ bearerAuth: [] }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Server created' } }
      },
      get: {
        summary: 'List servers',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Servers listed' } }
      }
    },
    '/servers/{serverId}': {
      get: {
        summary: 'Get server by ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'serverId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Server retrieved' } }
      },
      put: {
        summary: 'Update server by ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'serverId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Server updated' } }
      },
      delete: {
        summary: 'Delete server by ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'serverId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Server deleted' } }
      }
    },
    '/standard/notifications': {
      post: {
        summary: 'Create standard notification',
        security: [{ bearerAuth: [] }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Standard notification created' } }
      },
      get: {
        summary: 'List standard notifications',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Standard notifications listed' } }
      }
    },
    '/standard/notifications/{id}': {
      get: {
        summary: 'Get standard notification',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Standard notification retrieved' } }
      },
      put: {
        summary: 'Update standard notification',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Standard notification updated' } }
      },
      delete: {
        summary: 'Delete standard notification',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Standard notification deleted' } }
      }
    },
    '/standard/logs': {
      post: {
        summary: 'Create standard log',
        security: [{ bearerAuth: [] }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Standard log created' } }
      },
      get: {
        summary: 'List standard logs',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Standard logs listed' } }
      }
    },
    '/standard/logs/{id}': {
      get: {
        summary: 'Get standard log',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Standard log retrieved' } }
      },
      put: {
        summary: 'Update standard log',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Standard log updated' } }
      },
      delete: {
        summary: 'Delete standard log',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Standard log deleted' } }
      }
    },
    '/peers': {
      get: {
        summary: 'List connected peers',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Peer list returned' } }
      }
    },
    '/health': {
      get: {
        summary: 'Get peer health status',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Health status returned' } }
      }
    },
    '/send/{peerId}': {
      post: {
        summary: 'Send a message to a peer',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'peerId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Message sent to peer' } }
      }
    },
    '/openapi.json': {
      get: {
        summary: 'Get backend OpenAPI specification',
        responses: { '200': { description: 'OpenAPI JSON document' } }
      }
    }
  }
};

const requestBodySchemas = {
  '/accounts/login': {
    post: {
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: { type: 'string' },
                password: { type: 'string' }
              }
            }
          }
        }
      }
    }
  },
  '/accounts/register': {
    post: {
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: { type: 'string' },
                password: { type: 'string' },
                name: { type: 'string' }
              }
            }
          }
        }
      }
    }
  },
  '/accounts/me': {
    post: {
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                email: { type: 'string' },
                password: { type: 'string' }
              }
            }
          }
        }
      }
    }
  },
  '/accounts': {
    post: {
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                password: { type: 'string' },
                name: { type: 'string' }
              }
            }
          }
        }
      }
    }
  },
  '/payments/orders': {
    post: {
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['items'],
              properties: {
                id: { type: 'string' },
                userId: { type: 'string' },
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['productId', 'quantity'],
                    properties: {
                      productId: { type: 'string' },
                      quantity: { type: 'integer' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  '/payments/orders/{id}/status': {
    put: {
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status'],
              properties: {
                status: { type: 'string' }
              }
            }
          }
        }
      }
    }
  },
  '/send/{peerId}': {
    post: {
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object'
            }
          }
        }
      }
    }
  }
};

function applyRequestBodyOverrides(paths, overrides) {
  for (const [pathKey, methods] of Object.entries(overrides)) {
    const pathItem = paths[pathKey];
    if (!pathItem) continue;
    for (const [method, override] of Object.entries(methods)) {
      if (pathItem[method]) {
        pathItem[method].requestBody = override.requestBody;
      }
    }
  }
}

function markRequiredBodies(node) {
  if (node && typeof node === 'object') {
    if (node.requestBody && node.requestBody.content) {
      node.requestBody.required = true;
    }
    Object.values(node).forEach(markRequiredBodies);
  }
}

markRequiredBodies(spec.paths);
applyRequestBodyOverrides(spec.paths, requestBodySchemas);

const outputPath = path.resolve(__dirname, '../src/openapi.json');
fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));
console.log(`OpenAPI specification written to ${outputPath}`);
