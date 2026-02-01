# REA Group Technical Stack

## 🏗️ Architecture Philosophy

REA Group follows a **"micro-everything"** architectural style:
- Small, composable units
- 70 cross-functional tech teams ("tribes")
- Polyglot organization - use the right tool for the job
- "You build it, you run it" ownership model

---

## 💻 Programming Languages & Frameworks

| Category | Technologies |
|----------|--------------|
| **Backend** | Ruby, Scala, Java, Python |
| **Frontend** | JavaScript, TypeScript, React |
| **Mobile** | Micro-frontend architecture |
| **Data** | SQL, Python (data engineering) |

---

## ☁️ Cloud Infrastructure

### Primary: Amazon Web Services (AWS)

| Service | Use Case |
|---------|----------|
| **EC2** | Compute instances |
| **S3** | Static assets, image storage |
| **Lambda** | Serverless functions, event-driven |
| **SQS** | Message queuing |
| **API Gateway** | API management |
| **Rekognition** | Image analysis, compliance |
| **ECS** | Container orchestration |
| **Redshift** | Data warehousing |
| **Route53** | DNS, latency-based routing |
| **EFS** | File storage for metadata |
| **Elasticsearch** | Search and analytics |

### Secondary: Google Cloud Platform (GCP)

| Service | Use Case |
|---------|----------|
| **BigQuery** | Enterprise data warehouse |
| **Cloud Storage** | Data lake |

### Multi-Region Architecture
- **Production:** Multiple Availability Zones by default
- **Critical Systems:** Cross-region (e.g., Frankfurt + Sydney)
- **Eventual Consistency:** For multi-region deployments
- **Failover:** Route53 health checks + latency-based routing

---

## 🤖 AI/ML Technology Stack

### Machine Learning
- **Property Valuation:** realEstimate (ML models)
- **Recommendation Systems:** Behavioral insights, user preferences
- **Image Tagging:** AI-powered property attribute identification

### Generative AI
- **OpenAI Partnership:** realAssist conversational AI
- **Natural Language Search:** Conversational property queries
- **Suggested Properties:** GenAI-powered recommendations

### Computer Vision
- **Amazon Rekognition:** Automated image compliance
  - Trademark detection
  - Contact detail identification
  - Reduces manual review effort

### Example: Image Compliance System
```
Property Image Upload
         ↓
    Amazon S3
         ↓
  Amazon SQS (Queue)
         ↓
  AWS Lambda (Trigger)
         ↓
Amazon Rekognition (Analysis)
         ↓
  Compliance Decision
```

---

## 📊 Data Engineering Stack

### Data Warehouse
- **Google BigQuery** - Enterprise data warehouse
- **AWS Redshift** - Analytics workloads

### Data Storage
- **Neo4j on EC2** - Metadata storage (graph database)
- **AWS EFS** - Elastic File System for Neo4j
- **AWS Managed Elasticsearch** - Search and indexing

### Data Discovery
- **Amundsen** - Data discovery and metadata management
  - Deployed as microservices on AWS ECS
  - Neo4j for metadata backend
  - Elasticsearch for search

---

## 🔧 Development Practices

### Methodologies
- **Agile** - Sprint-based development
- **Test-Driven Development (TDD)** - Quality first
- **Continuous Integration/Deployment** - Automated pipelines

### Architecture Patterns
- **Microservices** - Small, independent services
- **API-First** - RESTful APIs
- **Event-Driven** - Serverless with Lambda + SQS
- **Micro-Frontend** - Modular mobile app architecture

---

## 🎨 Frontend Stack

### Web
- **React.js** - Component-based UI
- **TypeScript** - Type-safe JavaScript
- **Responsive Design** - Mobile-first approach

### Mobile
- **Micro-Frontend Architecture** - Modular, independent features
- **Native + Web Hybrid** - Best of both worlds

---

## 🔐 Security & Compliance

- **Image Compliance:** Automated detection of violations
- **Data Privacy:** GDPR/Australian privacy law compliance
- **Secure APIs:** Authentication and authorization
- **Cloud Security:** AWS IAM, security groups

---

## 📈 Observability & Monitoring

- **Logging:** Centralized logging (likely ELK or CloudWatch)
- **Monitoring:** Application and infrastructure monitoring
- **Alerting:** Proactive issue detection
- **Performance:** APM tools for optimization

---

## 🎯 PropTech-Specific Technologies

### Property Search
- **Elasticsearch** - Fast, relevant search results
- **Natural Language Processing** - Conversational queries
- **Geospatial Indexing** - Location-based search

### Property Valuation
- **Machine Learning Models** - Price prediction
- **PropTrack** - Market data and analytics
- **Historical Data Analysis** - Trend identification

### User Experience
- **Personalization Engine** - ML-based recommendations
- **A/B Testing** - Feature experimentation
- **Analytics** - User behavior tracking

---

## 💡 Interview Preparation Tips

### Technical Discussion Points
1. **Polyglot Experience:** Discuss your experience with multiple languages
2. **Cloud Architecture:** AWS services you've used
3. **Microservices:** Design patterns, challenges, solutions
4. **AI/ML:** Any ML projects or interest in PropTech applications
5. **Ownership:** Examples of "you build it, you run it" mindset

### Sample Questions to Expect
- "How would you design a property recommendation system?"
- "Explain how you'd implement image compliance checking at scale"
- "Design a real-time property search with millions of listings"
- "How would you approach property valuation using ML?"
