// MongoDB initialization script for UDSP
// This script creates the database, collections, and initial indexes

// Switch to UDSP database
db = db.getSiblingDB('udsp');

// Create collections with validation schemas
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['did', 'email', 'createdAt'],
      properties: {
        did: {
          bsonType: 'string',
          pattern: '^did:udsp:[a-zA-Z0-9]{43}$',
          description: 'Decentralized Identifier'
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          description: 'User email address'
        },
        publicKey: {
          bsonType: 'string',
          description: 'User public key for cryptographic operations'
        },
        profile: {
          bsonType: 'object',
          properties: {
            name: { bsonType: 'string' },
            avatar: { bsonType: 'string' },
            bio: { bsonType: 'string' }
          }
        },
        preferences: {
          bsonType: 'object',
          properties: {
            notifications: { bsonType: 'bool' },
            privacy: { bsonType: 'string', enum: ['public', 'private', 'selective'] },
            defaultChain: { bsonType: 'string', enum: ['ethereum', 'polygon', 'solana'] }
          }
        },
        tenantId: {
          bsonType: 'string',
          description: 'Multi-tenant identifier'
        },
        status: {
          bsonType: 'string',
          enum: ['active', 'suspended', 'pending_verification'],
          description: 'User account status'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Account creation timestamp'
        },
        updatedAt: {
          bsonType: 'date',
          description: 'Last update timestamp'
        }
      }
    }
  }
});

db.createCollection('credentials', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'type', 'issuer', 'subject', 'issuanceDate'],
      properties: {
        id: {
          bsonType: 'string',
          description: 'Unique credential identifier'
        },
        type: {
          bsonType: 'array',
          items: { bsonType: 'string' },
          description: 'Credential types'
        },
        issuer: {
          bsonType: 'string',
          pattern: '^did:',
          description: 'DID of the credential issuer'
        },
        subject: {
          bsonType: 'string',
          pattern: '^did:',
          description: 'DID of the credential subject'
        },
        credentialSubject: {
          bsonType: 'object',
          description: 'Claims about the subject'
        },
        issuanceDate: {
          bsonType: 'date',
          description: 'When the credential was issued'
        },
        expirationDate: {
          bsonType: 'date',
          description: 'When the credential expires'
        },
        proof: {
          bsonType: 'object',
          description: 'Cryptographic proof'
        },
        status: {
          bsonType: 'string',
          enum: ['active', 'revoked', 'expired', 'suspended'],
          description: 'Credential status'
        },
        tenantId: {
          bsonType: 'string',
          description: 'Multi-tenant identifier'
        }
      }
    }
  }
});

db.createCollection('dids', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'method', 'document', 'createdAt'],
      properties: {
        id: {
          bsonType: 'string',
          pattern: '^did:udsp:[a-zA-Z0-9]{43}$',
          description: 'Decentralized Identifier'
        },
        method: {
          bsonType: 'string',
          enum: ['udsp'],
          description: 'DID method'
        },
        document: {
          bsonType: 'object',
          description: 'DID Document according to W3C spec'
        },
        metadata: {
          bsonType: 'object',
          properties: {
            created: { bsonType: 'date' },
            updated: { bsonType: 'date' },
            deactivated: { bsonType: 'bool' },
            versionId: { bsonType: 'int' }
          }
        },
        tenantId: {
          bsonType: 'string',
          description: 'Multi-tenant identifier'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Creation timestamp'
        },
        updatedAt: {
          bsonType: 'date',
          description: 'Last update timestamp'
        }
      }
    }
  }
});

db.createCollection('audit_logs', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['action', 'actor', 'resource', 'timestamp'],
      properties: {
        action: {
          bsonType: 'string',
          description: 'Action performed'
        },
        actor: {
          bsonType: 'string',
          pattern: '^did:',
          description: 'DID of the actor'
        },
        resource: {
          bsonType: 'string',
          description: 'Resource affected'
        },
        details: {
          bsonType: 'object',
          description: 'Additional details'
        },
        ipAddress: {
          bsonType: 'string',
          description: 'IP address of the request'
        },
        userAgent: {
          bsonType: 'string',
          description: 'User agent string'
        },
        tenantId: {
          bsonType: 'string',
          description: 'Multi-tenant identifier'
        },
        timestamp: {
          bsonType: 'date',
          description: 'When the action occurred'
        }
      }
    }
  }
});

db.createCollection('sessions', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['sessionId', 'userId', 'createdAt', 'expiresAt'],
      properties: {
        sessionId: {
          bsonType: 'string',
          description: 'Unique session identifier'
        },
        userId: {
          bsonType: 'string',
          pattern: '^did:',
          description: 'User DID'
        },
        data: {
          bsonType: 'object',
          description: 'Session data'
        },
        tenantId: {
          bsonType: 'string',
          description: 'Multi-tenant identifier'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Session creation time'
        },
        expiresAt: {
          bsonType: 'date',
          description: 'Session expiration time'
        },
        lastAccessedAt: {
          bsonType: 'date',
          description: 'Last access time'
        }
      }
    }
  }
});

// Create indexes for performance
print('Creating indexes...');

// Users collection indexes
db.users.createIndex({ 'did': 1 }, { unique: true });
db.users.createIndex({ 'email': 1 }, { unique: true });
db.users.createIndex({ 'tenantId': 1 });
db.users.createIndex({ 'status': 1 });
db.users.createIndex({ 'createdAt': 1 });

// Credentials collection indexes
db.credentials.createIndex({ 'id': 1 }, { unique: true });
db.credentials.createIndex({ 'subject': 1 });
db.credentials.createIndex({ 'issuer': 1 });
db.credentials.createIndex({ 'type': 1 });
db.credentials.createIndex({ 'status': 1 });
db.credentials.createIndex({ 'tenantId': 1 });
db.credentials.createIndex({ 'issuanceDate': 1 });
db.credentials.createIndex({ 'expirationDate': 1 });

// DIDs collection indexes
db.dids.createIndex({ 'id': 1 }, { unique: true });
db.dids.createIndex({ 'tenantId': 1 });
db.dids.createIndex({ 'createdAt': 1 });

// Audit logs indexes
db.audit_logs.createIndex({ 'actor': 1 });
db.audit_logs.createIndex({ 'action': 1 });
db.audit_logs.createIndex({ 'resource': 1 });
db.audit_logs.createIndex({ 'tenantId': 1 });
db.audit_logs.createIndex({ 'timestamp': 1 });

// Sessions collection indexes
db.sessions.createIndex({ 'sessionId': 1 }, { unique: true });
db.sessions.createIndex({ 'userId': 1 });
db.sessions.createIndex({ 'tenantId': 1 });
db.sessions.createIndex({ 'expiresAt': 1 }, { expireAfterSeconds: 0 });

print('Database initialization completed successfully!');
print('Collections created: users, credentials, dids, audit_logs, sessions');
print('Indexes created for optimal performance');
