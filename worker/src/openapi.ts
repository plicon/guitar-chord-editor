/**
 * OpenAPI 3.1 Specification for FretKit API
 * 
 * This file defines the complete API specification for the FretKit worker.
 * The spec is served at /api/docs/openapi.json and powers the interactive
 * API documentation UI at /api/docs
 */

import { WORKER_VERSION } from './config/version';

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'FretKit API',
    version: WORKER_VERSION,
    description: 'REST API for managing guitar songs with chord diagrams, tablature, and presets. Built with Cloudflare Workers and D1.',
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
        summary: 'List or Search Chord Presets',
        description: 'Get all available chord presets from the database or search by name. Returns common chord shapes with fingering information.',
        operationId: 'listChordPresets',
        tags: ['Presets'],
        security: [],
        parameters: [
          {
            name: 'search',
            in: 'query',
            required: false,
            description: 'Search query to filter presets by name (case-insensitive, supports partial matches)',
            schema: {
              type: 'string'
            },
            example: 'C'
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            description: 'Maximum number of results to return',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 1000,
              default: 100
            }
          },
          {
            name: 'offset',
            in: 'query',
            required: false,
            description: 'Number of results to skip (for pagination)',
            schema: {
              type: 'integer',
              minimum: 0,
              default: 0
            }
          }
        ],
        responses: {
          '200': {
            description: 'List of chord presets retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/ChordPreset'
                      }
                    },
                    total: {
                      type: 'integer',
                      description: 'Total number of matching presets'
                    },
                    limit: {
                      type: 'integer',
                      description: 'Maximum results per page'
                    },
                    offset: {
                      type: 'integer',
                      description: 'Current offset'
                    }
                  },
                  required: ['data', 'total', 'limit', 'offset']
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
    '/songs': {
      get: {
        summary: 'List Songs',
        description: 'Get all saved songs with optional search and pagination',
        operationId: 'listSongs',
        tags: ['Songs'],
        security: [],
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: false,
            description: 'Search query to filter songs by title or artist (case-insensitive, partial match)',
            schema: {
              type: 'string'
            }
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            description: 'Maximum number of results to return',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 200,
              default: 50
            }
          },
          {
            name: 'offset',
            in: 'query',
            required: false,
            description: 'Number of results to skip (for pagination)',
            schema: {
              type: 'integer',
              minimum: 0,
              default: 0
            }
          }
        ],
        responses: {
          '200': {
            description: 'Paginated list of songs',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Song'
                      }
                    },
                    total: {
                      type: 'integer',
                      description: 'Total number of matching songs'
                    },
                    limit: {
                      type: 'integer',
                      description: 'Maximum results per page'
                    },
                    offset: {
                      type: 'integer',
                      description: 'Current offset'
                    }
                  },
                  required: ['data', 'total', 'limit', 'offset']
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
    '/songs/{id}': {
      get: {
        summary: 'Get Song',
        description: 'Retrieve a specific song by its ID',
        operationId: 'getSong',
        tags: ['Songs'],
        security: [],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Unique identifier of the song',
            schema: {
              type: 'string'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Song found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Song'
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
            description: 'Song not found',
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
    '/admin/songs': {
        post: {
          summary: 'Create Song',
          description: 'Save a new song to the database (admin)',
          operationId: 'createSong',
          tags: ['Admin', 'Songs'],
          security: [
            {
              cfAccessClientId: [],
              cfAccessClientSecret: []
            }
          ],
          requestBody: {
            required: true,
            description: 'Song data to save',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/SongInput'
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Song created successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Song'
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
      '/admin/songs/{id}': {
        put: {
          summary: 'Update Song',
          description: 'Update an existing song (admin)',
          operationId: 'updateSong',
          tags: ['Admin', 'Songs'],
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
              description: 'Unique identifier of the song',
              schema: {
                type: 'string'
              }
            }
          ],
          requestBody: {
            required: true,
            description: 'Updated song data',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/SongInput'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Song updated successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Song'
                  }
                }
              }
            },
            '404': {
              description: 'Song not found',
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
          summary: 'Delete Song',
          description: 'Delete a song from the database (admin)',
          operationId: 'deleteSong',
          tags: ['Admin', 'Songs'],
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
              description: 'Unique identifier of the song',
              schema: {
                type: 'string'
              }
            }
          ],
          responses: {
            '204': {
              description: 'Song deleted successfully'
            },
            '404': {
              description: 'Song not found',
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
            example: 'C',
            description: 'Display name of the chord'
          },
          frets: {
            type: 'number',
            example: 5,
            description: 'Number of frets to display (typically 4-5)'
          },
          startFret: {
            type: 'number',
            example: 1,
            description: 'Starting fret position on the guitar neck (1 for open position)'
          },
          fingers: {
            type: 'array',
            description: 'Array of finger positions on the fretboard',
            items: {
              type: 'object',
              properties: {
                string: {
                  type: 'number',
                  minimum: 1,
                  maximum: 6,
                  description: 'String number (1=high E, 6=low E)'
                },
                fret: {
                  type: 'number',
                  minimum: 1,
                  description: 'Fret number'
                },
                finger: {
                  type: 'number',
                  minimum: 1,
                  maximum: 4,
                  description: 'Finger number (1-4)'
                }
              },
              required: ['string', 'fret']
            },
            example: [
              { string: 2, fret: 3 },
              { string: 4, fret: 2 }
            ]
          },
          barres: {
            type: 'array',
            description: 'Array of barre chords',
            items: {
              type: 'object',
              properties: {
                fret: {
                  type: 'number',
                  description: 'Fret where the barre is placed'
                },
                fromString: {
                  type: 'number',
                  minimum: 1,
                  maximum: 6,
                  description: 'Starting string'
                },
                toString: {
                  type: 'number',
                  minimum: 1,
                  maximum: 6,
                  description: 'Ending string'
                },
                finger: {
                  type: 'number',
                  minimum: 1,
                  maximum: 4,
                  description: 'Finger number'
                }
              },
              required: ['fret', 'fromString', 'toString']
            },
            example: []
          },
          mutedStrings: {
            type: 'array',
            description: 'String numbers that are muted (X)',
            items: {
              type: 'number',
              minimum: 1,
              maximum: 6
            },
            example: [6]
          },
          openStrings: {
            type: 'array',
            description: 'String numbers that are open (O)',
            items: {
              type: 'number',
              minimum: 1,
              maximum: 6
            },
            example: [1, 3]
          },
          fingerLabels: {
            type: 'array',
            description: 'Finger number labels shown at bottom',
            items: {
              type: 'object',
              properties: {
                string: {
                  type: 'number',
                  minimum: 1,
                  maximum: 6
                },
                finger: {
                  type: 'number',
                  minimum: 0,
                  maximum: 4,
                  description: '0 for thumb (T), 1-4 for fingers'
                }
              },
              required: ['string', 'finger']
            },
            example: []
          },
          symbols: {
            type: 'string',
            description: 'Chord symbols (e.g., "M, maj" for major, "m7, min7" for minor 7th)',
            example: 'M, maj'
          },
          steps: {
            type: 'string',
            description: 'Scale steps that make up the chord (e.g., "1-3-5" for major triad, "1-3-5-7" for major 7th)',
            example: '1-3-5'
          },
          notes: {
            type: 'string',
            description: 'Musical notes in the chord (e.g., "C-E-G" for C major)',
            example: 'C-E-G'
          },
          instructions: {
            type: 'string',
            description: 'Step-by-step finger placement instructions for playing the chord',
            example: 'Press the B (2nd) string on the 1st fret with your index finger | With your middle finger, press down on the D (4th) string at the 2nd fret | Position your ring finger on the A (5th) string at the 3rd fret and press down | Now, strum all the strings starting from the 5th string'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'ISO 8601 timestamp of creation'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'ISO 8601 timestamp of last update'
          }
        },
        required: ['id', 'name', 'frets', 'startFret', 'fingers', 'barres', 'mutedStrings', 'openStrings', 'fingerLabels', 'createdAt', 'updatedAt']
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
      Song: {
        type: 'object',
        description: 'A complete song with sections, chords, and optional tablature',
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier for the song',
            example: 'song-1234567890-abc123'
          },
          title: {
            type: 'string',
            example: 'Wonderwall',
            description: 'Title of the song'
          },
          artist: {
            type: 'string',
            example: 'Oasis',
            description: 'Artist or band name'
          },
          description: {
            type: 'string',
            example: 'Classic 90s rock song',
            description: 'Optional description or notes about the song'
          },
          key: {
            type: 'string',
            example: 'Em',
            description: 'Musical key of the song'
          },
          tempo: {
            type: 'integer',
            example: 120,
            description: 'Tempo in beats per minute'
          },
          timeSignature: {
            type: 'string',
            example: '4/4',
            description: 'Time signature'
          },
          sections: {
            type: 'array',
            description: 'Song sections (verse, chorus, bridge, etc.)',
            items: {
              $ref: '#/components/schemas/SongSection'
            }
          },
          strummingPattern: {
            type: 'object',
            description: 'Optional strumming pattern for the song',
            nullable: true
          },
          notes: {
            type: 'string',
            description: 'Additional notes or instructions'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'When the song was created'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'When the song was last updated'
          }
        },
        required: ['id', 'title', 'sections', 'createdAt', 'updatedAt']
      },
      SongSection: {
        type: 'object',
        description: 'A section within a song (e.g., Verse, Chorus, Bridge)',
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier for the section',
            example: 'section-1234567890-abc123'
          },
          name: {
            type: 'string',
            example: 'Verse 1',
            description: 'Name/label for the section'
          },
          type: {
            type: 'string',
            enum: ['intro', 'verse', 'chorus', 'bridge', 'solo', 'outro', 'custom'],
            example: 'verse',
            description: 'Type of section'
          },
          rows: {
            type: 'array',
            description: 'Rows within the section (chord rows or tab rows)',
            items: {
              oneOf: [
                { $ref: '#/components/schemas/ChordRow' },
                { $ref: '#/components/schemas/TabRow' }
              ]
            }
          },
          collapsed: {
            type: 'boolean',
            description: 'UI state: whether the section is collapsed',
            default: false
          }
        },
        required: ['id', 'name', 'type', 'rows']
      },
      ChordRow: {
        type: 'object',
        description: 'A row of chord diagrams',
        properties: {
          kind: {
            type: 'string',
            enum: ['chord-row'],
            description: 'Row type identifier'
          },
          id: {
            type: 'string',
            description: 'Unique identifier for the row'
          },
          chords: {
            type: 'array',
            description: 'Array of chord diagrams',
            items: {
              type: 'object',
              additionalProperties: true
            }
          },
          subtitle: {
            type: 'string',
            description: 'Optional subtitle/label for the row'
          }
        },
        required: ['kind', 'id', 'chords']
      },
      TabRow: {
        type: 'object',
        description: 'A row of guitar tablature',
        properties: {
          kind: {
            type: 'string',
            enum: ['tab-row'],
            description: 'Row type identifier'
          },
          id: {
            type: 'string',
            description: 'Unique identifier for the row'
          },
          measures: {
            type: 'array',
            description: 'Array of tab measures',
            items: {
              type: 'object',
              additionalProperties: true
            }
          },
          subtitle: {
            type: 'string',
            description: 'Optional subtitle/label for the row'
          }
        },
        required: ['kind', 'id', 'measures']
      },
      SongInput: {
        type: 'object',
        description: 'Input data for creating or updating a song',
        properties: {
          title: {
            type: 'string',
            example: 'Wonderwall',
            description: 'Title of the song'
          },
          artist: {
            type: 'string',
            example: 'Oasis',
            description: 'Artist or band name'
          },
          description: {
            type: 'string',
            description: 'Optional description'
          },
          key: {
            type: 'string',
            example: 'Em',
            description: 'Musical key'
          },
          tempo: {
            type: 'integer',
            example: 120,
            description: 'Tempo in BPM'
          },
          timeSignature: {
            type: 'string',
            example: '4/4',
            description: 'Time signature'
          },
          sections: {
            type: 'array',
            description: 'Song sections',
            items: {
              $ref: '#/components/schemas/SongSection'
            }
          },
          strummingPattern: {
            type: 'object',
            description: 'Optional strumming pattern',
            nullable: true
          },
          notes: {
            type: 'string',
            description: 'Additional notes'
          }
        },
        required: ['title', 'sections']
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
