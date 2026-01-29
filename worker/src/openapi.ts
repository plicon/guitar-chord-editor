/**
 * OpenAPI 3.1 Specification for FretKit API
 * 
 * This file defines the complete API specification for the FretKit worker.
 * The spec is served at /api/docs/openapi.json and powers the interactive
 * API documentation UI at /api/docs
 */

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'FretKit API',
    version: '1.0.0',
    description: 'REST API for managing guitar chord charts and presets. Built with Cloudflare Workers and D1.',
    contact: {
      name: 'FretKit',
      url: 'https://fretkit.io'
    },
    license: {
      name: 'Proprietary',
      identifier: 'Proprietary'
    }
  },
  servers: [
    {
      url: '/api',
      description: 'API Base Path'
    }
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Health Check',
        description: 'Check if the API is running and get version information',
        operationId: 'healthCheck',
        tags: ['System'],
        security: [],
        responses: {
          '200': {
            description: 'API is healthy and operational',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      example: 'ok',
                      description: 'Health status indicator'
                    },
                    timestamp: {
                      type: 'string',
                      format: 'date-time',
                      example: '2026-01-29T10:30:00.000Z',
                      description: 'Current server timestamp'
                    },
                    version: {
                      type: 'string',
                      example: '1.0.0',
                      description: 'API version'
                    }
                  },
                  required: ['status', 'timestamp', 'version']
                }
              }
            }
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/presets/chords': {
      get: {
        summary: 'List Chord Presets',
        description: 'Get all available chord presets from the database. Returns common chord shapes with fingering information.',
        operationId: 'listChordPresets',
        tags: ['Presets'],
        security: [],
        responses: {
          '200': {
            description: 'List of chord presets retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/ChordPreset'
                  }
                }
              }
            }
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/presets/chords/{id}': {
      get: {
        summary: 'Get Chord Preset',
        description: 'Retrieve a specific chord preset by its ID',
        operationId: 'getChordPreset',
        tags: ['Presets'],
        security: [],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Unique identifier of the chord preset',
            schema: {
              type: 'string',
              example: 'c-major-1'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Chord preset found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ChordPreset'
                }
              }
            }
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '404': {
            description: 'Chord preset not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/presets/strumming': {
      get: {
        summary: 'List Strumming Patterns',
        description: 'Get all available strumming pattern presets from the database',
        operationId: 'listStrummingPresets',
        tags: ['Presets'],
        security: [],
        responses: {
          '200': {
            description: 'List of strumming pattern presets retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/StrummingPreset'
                  }
                }
              }
            }
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/presets/strumming/{id}': {
      get: {
        summary: 'Get Strumming Pattern',
        description: 'Retrieve a specific strumming pattern preset by its ID',
        operationId: 'getStrummingPreset',
        tags: ['Presets'],
        security: [],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Unique identifier of the strumming pattern preset',
            schema: {
              type: 'string',
              example: 'basic-down'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Strumming pattern found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/StrummingPreset'
                }
              }
            }
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '404': {
            description: 'Strumming pattern not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/charts': {
      get: {
        summary: 'List Chord Charts',
        description: 'Get all saved chord charts for the current user',
        operationId: 'listCharts',
        tags: ['Charts'],
        security: [],
        responses: {
          '200': {
            description: 'List of chord charts retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/ChordChart'
                  }
                }
              }
            }
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/charts/{id}': {
      get: {
        summary: 'Get Chord Chart',
        description: 'Retrieve a specific chord chart by its ID',
        operationId: 'getChart',
        tags: ['Charts'],
        security: [],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Unique identifier of the chord chart',
            schema: {
              type: 'string',
              format: 'uuid'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Chord chart found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ChordChart'
                }
              }
            }
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '404': {
            description: 'Chord chart not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/admin/charts': {
        post: {
          summary: 'Create Chord Chart',
          description: 'Save a new chord chart to the database (admin)',
          operationId: 'createChart',
          tags: ['Admin', 'Charts'],
          security: [
            {
              cfAccessClientId: [],
              cfAccessClientSecret: []
            }
          ],
          requestBody: {
            required: true,
            description: 'Chord chart data to save',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ChordChartInput'
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Chord chart created successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ChordChart'
                  }
                }
              }
            },
            '400': {
              description: 'Invalid request body',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error'
                  }
                }
              }
            },
            '500': {
              description: 'Internal server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error'
                  }
                }
              }
            }
          }
        }
      },
      '/admin/charts/{id}': {
        put: {
          summary: 'Update Chord Chart',
          description: 'Update an existing chord chart (admin)',
          operationId: 'updateChart',
          tags: ['Admin', 'Charts'],
            security: [
              {
                cfAccessClientId: [],
                cfAccessClientSecret: []
              }
            ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Unique identifier of the chord chart',
              schema: {
                type: 'string',
                format: 'uuid'
              }
            }
          ],
          requestBody: {
            required: true,
            description: 'Updated chord chart data',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ChordChartInput'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Chord chart updated successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ChordChart'
                  }
                }
              }
            },
            '404': {
              description: 'Chord chart not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error'
                  }
                }
              }
            },
            '400': {
              description: 'Invalid request body',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error'
                  }
                }
              }
            }
          }
        },
        delete: {
          summary: 'Delete Chord Chart',
          description: 'Delete a chord chart from the database (admin)',
          operationId: 'deleteChart',
          tags: ['Admin', 'Charts'],
          security: [
            {
              cfAccessClientId: [],
              cfAccessClientSecret: []
            }
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Unique identifier of the chord chart',
              schema: {
                type: 'string',
                format: 'uuid'
              }
            }
          ],
          responses: {
            '204': {
              description: 'Chord chart deleted successfully'
            },
            '404': {
              description: 'Chord chart not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error'
                  }
                }
              }
            }
          }
        }
      },
      '/admin/presets/chords': {
        post: {
          summary: 'Create Chord Preset',
          description: 'Create a new chord preset (admin)',
          operationId: 'createChordPreset',
          tags: ['Admin', 'Presets'],
            security: [
              {
                cfAccessClientId: [],
                cfAccessClientSecret: []
              }
            ],
          requestBody: {
            required: true,
            description: 'Chord preset data to save',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ChordPreset'
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Chord preset created successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ChordPreset'
                  }
                }
              }
            },
            '400': {
              description: 'Invalid request body',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error'
                  }
                }
              }
            }
          }
        }
      },
      '/admin/presets/chords/{id}': {
        put: {
          summary: 'Update Chord Preset',
          description: 'Update an existing chord preset (admin)',
          operationId: 'updateChordPreset',
          tags: ['Admin', 'Presets'],
            security: [
              {
                cfAccessClientId: [],
                cfAccessClientSecret: []
              }
            ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Unique identifier of the chord preset',
              schema: {
                type: 'string'
              }
            }
          ],
          requestBody: {
            required: true,
            description: 'Updated chord preset data',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ChordPreset'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Chord preset updated successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ChordPreset'
                  }
                }
              }
            },
            '404': {
              description: 'Chord preset not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error'
                  }
                }
              }
            }
          }
        },
        delete: {
          summary: 'Delete Chord Preset',
          description: 'Delete a chord preset (admin)',
          operationId: 'deleteChordPreset',
          tags: ['Admin', 'Presets'],
          security: [
            {
              cfAccessClientId: [],
              cfAccessClientSecret: []
            }
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Unique identifier of the chord preset',
              schema: {
                type: 'string'
              }
            }
          ],
          responses: {
            '204': {
              description: 'Chord preset deleted successfully'
            },
            '404': {
              description: 'Chord preset not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error'
                  }
                }
              }
            }
          }
        }
      },
      '/admin/presets/strumming': {
        post: {
          summary: 'Create Strumming Preset',
          description: 'Create a new strumming preset (admin)',
          operationId: 'createStrummingPreset',
          tags: ['Admin', 'Presets'],
            security: [
              {
                cfAccessClientId: [],
                cfAccessClientSecret: []
              }
            ],
          requestBody: {
            required: true,
            description: 'Strumming preset data to save',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/StrummingPreset'
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Strumming preset created successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/StrummingPreset'
                  }
                }
              }
            },
            '400': {
              description: 'Invalid request body',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error'
                  }
                }
              }
            }
          }
        }
      },
      '/admin/presets/strumming/{id}': {
        put: {
          summary: 'Update Strumming Preset',
          description: 'Update an existing strumming preset (admin)',
          operationId: 'updateStrummingPreset',
          tags: ['Admin', 'Presets'],
            security: [
              {
                cfAccessClientId: [],
                cfAccessClientSecret: []
              }
            ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Unique identifier of the strumming preset',
              schema: {
                type: 'string'
              }
            }
          ],
          requestBody: {
            required: true,
            description: 'Updated strumming preset data',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/StrummingPreset'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Strumming preset updated successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/StrummingPreset'
                  }
                }
              }
            },
            '404': {
              description: 'Strumming preset not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error'
                  }
                }
              }
            }
          }
        },
        delete: {
          summary: 'Delete Strumming Preset',
          description: 'Delete a strumming preset (admin)',
          operationId: 'deleteStrummingPreset',
          tags: ['Admin', 'Presets'],
          security: [
            {
              cfAccessClientId: [],
              cfAccessClientSecret: []
            }
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Unique identifier of the strumming preset',
              schema: {
                type: 'string'
              }
            }
          ],
          responses: {
            '204': {
              description: 'Strumming preset deleted successfully'
            },
            '404': {
              description: 'Strumming preset not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error'
                  }
                }
              }
            }
          }
        }
      }
    },
  components: {
    securitySchemes: {
      cfAccessClientId: {
        type: 'apiKey',
        in: 'header',
        name: 'CF-Access-Client-Id',
        description: 'Cloudflare Access client ID header'
      },
      cfAccessClientSecret: {
        type: 'apiKey',
        in: 'header',
        name: 'CF-Access-Client-Secret',
        description: 'Cloudflare Access client secret header'
      }
    },
    schemas: {
      ChordPreset: {
        type: 'object',
        description: 'A preset chord shape with fingering information',
        properties: {
          id: {
            type: 'string',
            example: 'c-major-1',
            description: 'Unique identifier for the chord preset'
          },
          name: {
            type: 'string',
            example: 'C Major',
            description: 'Display name of the chord'
          },
          frets: {
            type: 'array',
            description: 'Fret positions for each string (low E to high e). "x" = muted, null = open',
            items: {
              oneOf: [
                { type: 'number', minimum: 0, maximum: 24 },
                { type: 'string', enum: ['x'] },
                { type: 'null' }
              ]
            },
            example: [null, 3, 2, 0, 1, 0]
          },
          fingers: {
            type: 'array',
            description: 'Finger numbers for each string (0-4, null for open/muted)',
            items: {
              oneOf: [
                { type: 'number', minimum: 0, maximum: 4 },
                { type: 'null' }
              ]
            },
            example: [null, 3, 2, null, 1, null]
          },
          barreInfo: {
            oneOf: [
              {
                type: 'object',
                description: 'Barre chord information if applicable',
                properties: {
                  fret: {
                    type: 'number',
                    description: 'Fret where the barre is placed'
                  },
                  fromString: {
                    type: 'number',
                    description: 'Starting string (1-6)',
                    minimum: 1,
                    maximum: 6
                  },
                  toString: {
                    type: 'number',
                    description: 'Ending string (1-6)',
                    minimum: 1,
                    maximum: 6
                  }
                }
              },
              { type: 'null' }
            ]
          }
        },
        required: ['id', 'name', 'frets']
      },
      StrummingPreset: {
        type: 'object',
        description: 'A preset strumming pattern',
        properties: {
          id: {
            type: 'string',
            example: 'basic-down',
            description: 'Unique identifier for the strumming pattern'
          },
          name: {
            type: 'string',
            example: 'Basic Down',
            description: 'Display name of the strumming pattern'
          },
          pattern: {
            type: 'object',
            description: 'Strumming pattern configuration',
            properties: {
              bars: {
                type: 'number',
                example: 1,
                description: 'Number of bars in the pattern'
              },
              timeSignature: {
                type: 'string',
                example: '4/4',
                description: 'Time signature'
              },
              subdivision: {
                type: 'string',
                example: '1/4',
                description: 'Note subdivision'
              },
              pattern: {
                type: 'array',
                description: 'Array of strum directions (D=down, U=up, -=rest)',
                items: {
                  type: 'string',
                  enum: ['D', 'U', '-']
                },
                example: ['D', 'D', 'D', 'D']
              }
            },
            required: ['bars', 'timeSignature', 'subdivision', 'pattern']
          }
        },
        required: ['id', 'name', 'pattern']
      },
      ChordChart: {
        type: 'object',
        description: 'A complete chord chart/song',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique identifier for the chart'
          },
          title: {
            type: 'string',
            example: 'My Song',
            description: 'Title of the chord chart'
          },
          artist: {
            type: ['string', 'null'],
            example: 'Artist Name',
            description: 'Artist or author name'
          },
          data: {
            type: 'object',
            description: 'Chart data (structure varies)',
            additionalProperties: true
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'When the chart was created'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'When the chart was last updated'
          }
        },
        required: ['id', 'title', 'data', 'createdAt', 'updatedAt']
      },
      ChordChartInput: {
        type: 'object',
        description: 'Input data for creating or updating a chord chart',
        properties: {
          title: {
            type: 'string',
            example: 'My Song',
            description: 'Title of the chord chart'
          },
          artist: {
            type: ['string', 'null'],
            example: 'Artist Name',
            description: 'Artist or author name'
          },
          data: {
            type: 'object',
            description: 'Chart data containing chords, lyrics, etc.',
            additionalProperties: true
          }
        },
        required: ['title', 'data']
      },
      Error: {
        type: 'object',
        description: 'Error response',
        properties: {
          error: {
            type: 'string',
            description: 'Error message',
            example: 'Not Found'
          },
          status: {
            type: 'number',
            description: 'HTTP status code',
            example: 404
          },
          details: {
            description: 'Additional error details (only in development)',
            type: ['object', 'null']
          }
        },
        required: ['error', 'status']
      }
    }
  },
  tags: [
    {
      name: 'System',
      description: 'System health and status endpoints'
    },
    {
      name: 'Presets',
      description: 'Chord and strumming pattern presets'
    },
    {
      name: 'Charts',
      description: 'User-created chord charts management'
    },
    {
      name: 'Admin',
      description: 'Protected write operations for charts and presets'
    }
  ]
};
