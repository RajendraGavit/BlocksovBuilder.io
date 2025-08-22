# Universal Digital Sovereignty Platform (UDSP)

A production-grade, cross-platform blockchain identity management platform with microservices architecture.

## 🏗️ Architecture Overview

```
├── services/
│   ├── api-gateway/          # API Gateway with rate limiting
│   ├── identity-service/     # DID creation and wallet management
│   ├── auth-service/         # JWT + WebAuthn authentication
│   ├── credential-service/   # Credential issuance and verification
│   ├── blockchain-adapter/   # Multi-chain blockchain integration
│   └── compliance-service/   # AI compliance and ZKP verification
├── contracts/                # Solidity smart contracts
├── frontend/                 # React dashboard
├── shared/                   # Shared utilities and types
├── infrastructure/           # Docker, Kubernetes configs
└── docs/                     # API documentation
```

## 🚀 Quick Start

1. **Prerequisites**
   ```bash
   docker --version          # Docker 20.10+
   docker-compose --version  # Docker Compose 2.0+
   node --version            # Node.js 18+
   npm --version             # npm 8+
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start All Services**
   ```bash
   docker-compose up -d
   ```

4. **Access Dashboard**
   - Web Dashboard: http://localhost:3000
   - API Gateway: http://localhost:8080
   - API Documentation: http://localhost:8080/docs

## 🔧 Development

### Individual Service Development
```bash
# Start dependencies only
docker-compose up -d mongodb redis

# Run individual service
cd services/identity-service
npm install
npm run dev
```

### Testing
```bash
# Run all tests
npm test

# Run specific service tests
cd services/identity-service
npm test
```

## 📊 Monitoring

- **Health Checks**: http://localhost:8080/health
- **Metrics**: http://localhost:8080/metrics
- **Logs**: `docker-compose logs -f [service-name]`

## 🔒 Security Features

- ✅ End-to-end encryption
- ✅ JWT + WebAuthn authentication
- ✅ Rate limiting and DDoS protection
- ✅ Multi-tenant data isolation
- ✅ Audit logging
- ✅ Zero-knowledge proofs for privacy

## 🌐 Multi-Chain Support

- **Ethereum**: Primary blockchain (testnet: Sepolia)
- **Polygon**: L2 scaling solution
- **Solana**: High-performance alternative
- **Modular**: Easy to add new chains

## 📖 API Documentation

Interactive API documentation available at:
- Swagger UI: http://localhost:8080/docs
- OpenAPI Spec: http://localhost:8080/api-spec.json

## 🛠️ Technology Stack

### Backend
- **Languages**: TypeScript, Python
- **Frameworks**: Express.js, FastAPI
- **Databases**: MongoDB, Redis
- **Blockchain**: Ethers.js, Web3.js
- **Message Queue**: Bull (Redis-based)

### Frontend
- **Framework**: React 18 + TypeScript
- **UI Library**: Material-UI v5
- **State Management**: Redux Toolkit
- **Web3**: MetaMask, WalletConnect

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes (production)
- **Monitoring**: Prometheus + Grafana
- **CI/CD**: GitHub Actions

## 📝 Environment Variables

Required environment variables (see `.env.example`):

```bash
# Database
MONGODB_URI=mongodb://mongodb:27017/udsp
REDIS_URL=redis://redis:6379

# Blockchain
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=your_private_key_here

# Security
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here

# External APIs
OPENAI_API_KEY=your_openai_key_here  # For compliance service
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## �� License

MIT License - see LICENSE file for details.

## 🆘 Support

- Documentation: [docs/](./docs/)
- Issues: GitHub Issues
- Discussions: GitHub Discussions
