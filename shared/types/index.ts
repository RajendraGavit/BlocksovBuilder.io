/**
 * Shared TypeScript types for UDSP platform
 * These types are used across all microservices
 */

// Base interfaces
export interface BaseDocument {
  _id?: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

// DID (Decentralized Identifier) Types
export interface DIDDocument extends BaseDocument {
  id: string; // did:udsp:...
  method: 'udsp';
  document: {
    '@context': string[];
    id: string;
    controller?: string;
    verificationMethod: VerificationMethod[];
    authentication?: string[];
    assertionMethod?: string[];
    keyAgreement?: string[];
    capabilityInvocation?: string[];
    capabilityDelegation?: string[];
    service?: ServiceEndpoint[];
  };
  metadata: {
    created: Date;
    updated: Date;
    deactivated: boolean;
    versionId: number;
  };
}

export interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyJwk?: object;
  publicKeyMultibase?: string;
}

export interface ServiceEndpoint {
  id: string;
  type: string;
  serviceEndpoint: string;
}

// User Types
export interface User extends BaseDocument {
  did: string;
  email: string;
  publicKey: string;
  profile: {
    name?: string;
    avatar?: string;
    bio?: string;
  };
  preferences: {
    notifications: boolean;
    privacy: 'public' | 'private' | 'selective';
    defaultChain: 'ethereum' | 'polygon' | 'solana';
  };
  status: 'active' | 'suspended' | 'pending_verification';
}

// Credential Types
export interface VerifiableCredential extends BaseDocument {
  id: string;
  type: string[];
  issuer: string; // DID
  subject: string; // DID
  credentialSubject: Record<string, any>;
  issuanceDate: Date;
  expirationDate?: Date;
  proof: CryptographicProof;
  status: 'active' | 'revoked' | 'expired' | 'suspended';
}

export interface CryptographicProof {
  type: string;
  created: Date;
  verificationMethod: string;
  proofPurpose: string;
  jws?: string;
  proofValue?: string;
}

// Authentication Types
export interface JWTPayload {
  sub: string; // DID
  iat: number;
  exp: number;
  aud: string;
  iss: string;
  tenantId: string;
  permissions: string[];
}

export interface Session extends BaseDocument {
  sessionId: string;
  userId: string; // DID
  data: Record<string, any>;
  expiresAt: Date;
  lastAccessedAt: Date;
}

// Audit Log Types
export interface AuditLog extends BaseDocument {
  action: string;
  actor: string; // DID
  resource: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

// Blockchain Types
export interface BlockchainTransaction {
  hash: string;
  blockNumber: number;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: Date;
}

export interface SmartContractCall {
  contractAddress: string;
  methodName: string;
  parameters: any[];
  transactionHash?: string;
  blockNumber?: number;
  gasUsed?: string;
}

// Zero-Knowledge Proof Types
export interface ZKProof {
  type: 'age_verification' | 'identity_verification' | 'attribute_proof';
  proof: string; // Serialized zk-SNARK proof
  publicSignals: string[];
  verificationKey: string;
  circuit: string;
  timestamp: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: Date;
    requestId: string;
    version: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Service Communication Types
export interface ServiceEvent {
  type: string;
  payload: any;
  source: string;
  timestamp: Date;
  correlationId: string;
  tenantId: string;
}

export interface ServiceHealth {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  uptime: number;
  version: string;
  dependencies: {
    [service: string]: 'healthy' | 'unhealthy' | 'unknown';
  };
  metrics: {
    requestsPerSecond: number;
    averageResponseTime: number;
    errorRate: number;
  };
}

// Configuration Types
export interface ServiceConfig {
  port: number;
  host: string;
  environment: 'development' | 'staging' | 'production';
  database: {
    uri: string;
    options: Record<string, any>;
  };
  redis: {
    url: string;
    options: Record<string, any>;
  };
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
    format: 'json' | 'text';
  };
  security: {
    jwtSecret: string;
    encryptionKey: string;
    rateLimiting: {
      windowMs: number;
      maxRequests: number;
    };
  };
}

// Multi-chain support types
export type SupportedChain = 'ethereum' | 'polygon' | 'solana';

export interface ChainConfig {
  name: SupportedChain;
  rpcUrl: string;
  chainId?: number; // For EVM chains
  explorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  contracts?: {
    didRegistry?: string;
    credentialRegistry?: string;
  };
}

// Error Types
export class UDSPError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    details?: any
  ) {
    super(message);
    this.name = 'UDSPError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
