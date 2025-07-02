# ExpenseTracker: Next-Gen Personal Finance Platform

![Architecture Diagram](public/architecture-diagram.png)

## Overview
ExpenseTracker is a state-of-the-art, cloud-native personal finance management platform architected with a robust **microservices** approach. Leveraging the latest advancements in AI, data engineering, and scalable infrastructure, it empowers users to manage, analyze, and optimize their finances with intelligence and security.

## Key Features
- **Microservices Architecture**: Each core domain (accounts, transactions, categories, AI analysis, user management) is an independent service for maximum scalability and maintainability.
- **AI-Powered Insights**: Real-time financial analysis, anomaly detection, and personalized recommendations using advanced machine learning models (NLP, time-series forecasting, LLMs).
- **Conversational AI**: Integrated AI chat assistant for financial Q&A, powered by OpenAI GPT and custom-trained models.
- **Automated Data Import**: Smart import and categorization of bank transactions using AI and OCR.
- **Interactive Data Visualization**: Dynamic charts and dashboards with drill-down analytics.
- **Cloud-Native & DevOps**: Containerized with Docker, orchestrated by Kubernetes, CI/CD pipelines for rapid delivery.
- **Security & Compliance**: End-to-end encryption, OAuth2 authentication, GDPR-ready data handling.

## Tech Stack
- **Frontend**: Next.js, React, TailwindCSS, Chart.js, TypeScript
- **Backend**: Node.js, Express, Python (AI microservices), FastAPI
- **AI/ML**: PyTorch, TensorFlow, HuggingFace Transformers, OpenAI API, ChromaDB (vector DB), LangChain
- **Data**: PostgreSQL, MongoDB, Redis, Apache Kafka (event streaming)
- **Cloud & DevOps**: Docker, Kubernetes, GitHub Actions, AWS/GCP/Azure ready
- **Observability**: Prometheus, Grafana, ELK Stack

## Microservices Architecture
```
[ User ]
   |
[ API Gateway ]
   |
+-------------------+-------------------+-------------------+
|                   |                   |                   |
[ Accounts Service ] [ Transactions ]   [ Categories ]   [ AI Service ]
|                   |                   |                   |
[ PostgreSQL ]      [ MongoDB ]         [ Redis ]          [ ChromaDB, OpenAI ]
```

See the diagram above for a high-level overview.

## AI & Data Science Innovations
- **Custom LLMs**: Fine-tuned language models for financial Q&A and document understanding.
- **Embeddings & Vector Search**: Semantic search over user data using ChromaDB and HuggingFace embeddings.
- **Automated Categorization**: ML models for transaction classification and fraud detection.
- **Time-Series Forecasting**: Predictive analytics for budgeting and cash flow.

## Getting Started
1. **Clone the repository**
2. **Install dependencies** for each service (see respective folders)
3. **Run with Docker Compose**:
   ```bash
   docker-compose up --build
   ```
4. **Access the app** at `http://localhost:3000`

## Project Structure
```
SE334_ExpenseTracker/
  ├─ ai-service/           # AI/ML microservices (Python, FastAPI)
  ├─ app/                  # Next.js frontend & API gateway
  ├─ db/                   # Database schemas & migrations
  ├─ features/             # Domain-driven feature modules
  ├─ scripts/              # DevOps & automation scripts
  └─ ...
```

## Contributing
We welcome contributions in AI, backend, frontend, and DevOps. See [`CONVENTIONS.md`](CONVENTIONS.md) for guidelines.

## License
MIT License. For academic and personal use only.

---
> *Đồ án phát triển bởi nhóm SE334 – 2024. Mọi thông tin chỉ mang tính chất minh họa.*
