# AWS S3 Presigned URLs - Complete Guide with AWS CDK TypeScript

## Table of Contents
1. [What are Presigned URLs?](#what-are-presigned-urls)
2. [How Presigned URLs Work](#how-presigned-urls-work)
3. [Use Cases](#use-cases)
4. [Security Considerations](#security-considerations)
5. [AWS CDK Infrastructure Setup](#aws-cdk-infrastructure-setup)
6. [Lambda Functions for Presigned URLs](#lambda-functions-for-presigned-urls)
7. [Complete Working Examples](#complete-working-examples)
8. [Best Practices](#best-practices)
9. [Common Pitfalls](#common-pitfalls)

---

## What are Presigned URLs?

**Presigned URLs** are temporary, secure URLs that grant time-limited access to private S3 objects without requiring AWS credentials.

### Key Characteristics

```
┌─────────────────────────────────────────────────────────────┐
│  Regular S3 Access (requires AWS credentials)                │
│                                                              │
│  Client → AWS Credentials → S3 Bucket → Object              │
│           ❌ Security risk: Exposing credentials             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Presigned URL Access (no credentials needed)                │
│                                                              │
│  1. Backend → Generate Presigned URL                         │
│  2. Backend → Send URL to Client                             │
│  3. Client → Use URL directly to access S3                   │
│     ✅ Secure: Time-limited, scoped permissions              │
└─────────────────────────────────────────────────────────────┘
```

### What Does a Presigned URL Look Like?

```
https://my-bucket.s3.amazonaws.com/my-file.jpg?
  X-Amz-Algorithm=AWS4-HMAC-SHA256&
  X-Amz-Credential=AKIAIOSFODNN7EXAMPLE%2F20240115%2Fus-east-1%2Fs3%2Faws4_request&
  X-Amz-Date=20240115T120000Z&
  X-Amz-Expires=3600&
  X-Amz-SignedHeaders=host&
  X-Amz-Signature=abc123def456...

Components:
- Base URL: https://my-bucket.s3.amazonaws.com/my-file.jpg
- X-Amz-Algorithm: Signing algorithm (AWS4-HMAC-SHA256)
- X-Amz-Credential: Temporary credentials (scoped)
- X-Amz-Date: When the URL was generated
- X-Amz-Expires: How long the URL is valid (in seconds)
- X-Amz-Signature: Cryptographic signature
```

---

## How Presigned URLs Work

### The Flow

```
┌──────────────────────────────────────────────────────────────┐
│  STEP 1: Client Requests Upload/Download Permission          │
│                                                               │
│  Frontend                       Backend (Lambda)              │
│     │                                │                        │
│     │  POST /get-upload-url         │                        │
│     │  { fileName: "pic.jpg" }      │                        │
│     │──────────────────────────────>│                        │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  STEP 2: Backend Generates Presigned URL                      │
│                                                               │
│  Backend (Lambda)                                             │
│     │                                                         │
│     │  1. Authenticate user                                   │
│     │  2. Validate request                                    │
│     │  3. Call S3 SDK:                                        │
│     │     s3.getSignedUrlPromise('putObject', {               │
│     │       Bucket: 'my-bucket',                              │
│     │       Key: 'uploads/pic.jpg',                           │
│     │       Expires: 300  // 5 minutes                        │
│     │     })                                                  │
│     │                                                         │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  STEP 3: Backend Returns Presigned URL                        │
│                                                               │
│  Backend                        Frontend                      │
│     │                                │                        │
│     │  { url: "https://..." }        │                        │
│     │<───────────────────────────────│                        │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  STEP 4: Client Uses URL Directly with S3                     │
│                                                               │
│  Frontend                       S3 Bucket                     │
│     │                                │                        │
│     │  PUT {presigned-url}           │                        │
│     │  Body: <file data>             │                        │
│     │───────────────────────────────>│                        │
│     │                                │                        │
│     │  200 OK                        │                        │
│     │<───────────────────────────────│                        │
│     │                                │                        │
│     │  ✅ File uploaded without      │                        │
│     │     AWS credentials!           │                        │
└──────────────────────────────────────────────────────────────┘
```

### Signature Generation Process

```
1. Create Canonical Request:
   PUT
   /my-bucket/uploads/pic.jpg
   
   host:my-bucket.s3.amazonaws.com
   x-amz-date:20240115T120000Z
   
   UNSIGNED-PAYLOAD

2. Create String to Sign:
   AWS4-HMAC-SHA256
   20240115T120000Z
   20240115/us-east-1/s3/aws4_request
   <hash-of-canonical-request>

3. Calculate Signature:
   HMAC-SHA256(signingKey, stringToSign)

4. Add Signature to URL:
   https://...?X-Amz-Signature=<calculated-signature>
```

---

## Use Cases

### 1. **Secure File Uploads**
```
User uploads profile picture → Backend generates presigned PUT URL 
→ User uploads directly to S3 (no backend proxy needed)

Benefits:
- Reduces backend load
- Faster uploads (direct to S3)
- Secure (time-limited access)
```

### 2. **Temporary File Sharing**
```
User wants to share private document → Backend generates presigned GET URL
→ Recipient downloads without login

Benefits:
- No authentication required
- Expires automatically
- Audit trail (who generated URL)
```

### 3. **Media Streaming**
```
Video player requests video → Backend generates presigned GET URL
→ Player streams directly from S3

Benefits:
- CloudFront + S3 integration
- DRM protection possible
- Pay-per-view scenarios
```

### 4. **Large File Downloads**
```
User exports report → Backend generates presigned GET URL
→ User downloads when ready (no server memory usage)

Benefits:
- Async processing
- No backend resource consumption
- Resume support
```

---

## Security Considerations

### 1. **Expiration Time**

```typescript
// ❌ BAD: Too long
const url = s3.getSignedUrl('getObject', {
  Bucket: 'my-bucket',
  Key: 'file.pdf',
  Expires: 86400 * 7  // 7 days - too long!
});

// ✅ GOOD: Short-lived
const url = s3.getSignedUrl('getObject', {
  Bucket: 'my-bucket',
  Key: 'file.pdf',
  Expires: 300  // 5 minutes
});

Rule of thumb:
- Upload URLs: 5-15 minutes
- Download URLs: 5-60 minutes
- Streaming URLs: 1-24 hours (with token refresh)
```

### 2. **Scope Limitation**

```typescript
// ❌ BAD: Allows any file upload
const url = s3.getSignedUrl('putObject', {
  Bucket: 'my-bucket',
  Key: `uploads/${userId}/*`,  // Wildcard - dangerous!
  Expires: 300
});

// ✅ GOOD: Specific file
const url = s3.getSignedUrl('putObject', {
  Bucket: 'my-bucket',
  Key: `uploads/${userId}/${sanitizedFileName}`,
  Expires: 300,
  ContentType: 'image/jpeg'  // Enforce content type
});
```

### 3. **Content-Type Enforcement**

```typescript
// ✅ Prevent malicious file uploads
const url = s3.getSignedUrl('putObject', {
  Bucket: 'my-bucket',
  Key: 'avatar.jpg',
  Expires: 300,
  ContentType: 'image/jpeg',  // Client MUST use this content type
  ContentLength: 5242880  // Max 5MB
});

// Client must match:
fetch(url, {
  method: 'PUT',
  headers: {
    'Content-Type': 'image/jpeg'  // Must match signature
  },
  body: file
});
```

### 4. **Audit Logging**

```typescript
// Log every presigned URL generation
await dynamoDB.putItem({
  TableName: 'PresignedUrlAudit',
  Item: {
    id: uuid(),
    userId: user.id,
    action: 'putObject',
    bucket: 'my-bucket',
    key: 'file.pdf',
    expiresAt: Date.now() + 300000,
    ipAddress: event.requestContext.identity.sourceIp,
    userAgent: event.headers['User-Agent']
  }
});
```

---

## AWS CDK Infrastructure Setup

### Project Structure

```
my-s3-presigned-app/
├── bin/
│   └── app.ts                 # CDK app entry point
├── lib/
│   ├── s3-stack.ts            # S3 bucket + policies
│   └── lambda-stack.ts        # Lambda functions
├── lambda/
│   ├── get-upload-url/
│   │   └── index.ts           # Generate upload URL
│   ├── get-download-url/
│   │   └── index.ts           # Generate download URL
│   └── shared/
│       └── s3-client.ts       # Shared S3 utilities
├── package.json
├── tsconfig.json
└── cdk.json
```

### 1. Initialize CDK Project

```bash
# Create project
mkdir s3-presigned-app && cd s3-presigned-app
cdk init app --language typescript

# Install dependencies
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npm install uuid @types/uuid
npm install @types/aws-lambda
```

### 2. S3 Stack (lib/s3-stack.ts)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class S3Stack extends cdk.Stack {
  public readonly uploadBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create S3 bucket for uploads
    this.uploadBucket = new s3.Bucket(this, 'UploadBucket', {
      bucketName: `user-uploads-${this.account}-${this.region}`,
      
      // CORS configuration (for browser uploads)
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
          ],
          allowedOrigins: ['*'], // ⚠️ Restrict in production!
          allowedHeaders: ['*'],
          exposedHeaders: ['ETag'],
          maxAge: 3000,
        },
      ],

      // Block public access (all uploads are private)
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,

      // Encryption at rest
      encryption: s3.BucketEncryption.S3_MANAGED,

      // Lifecycle rules
      lifecycleRules: [
        {
          id: 'DeleteOldUploads',
          enabled: true,
          prefix: 'temp/',
          expiration: cdk.Duration.days(7),
        },
        {
          id: 'TransitionToIA',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],

      // Versioning (optional, for important files)
      versioned: false,

      // Auto-delete on stack deletion (only for dev!)
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Output bucket name
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.uploadBucket.bucketName,
      description: 'S3 Bucket for user uploads',
    });
  }
}
```

### 3. Lambda Stack (lib/lambda-stack.ts)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

interface LambdaStackProps extends cdk.StackProps {
  uploadBucket: s3.Bucket;
}

export class LambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    // Shared environment variables
    const environment = {
      UPLOAD_BUCKET: props.uploadBucket.bucketName,
      REGION: this.region,
    };

    // Lambda: Generate Upload URL
    const getUploadUrlFunction = new lambdaNodejs.NodejsFunction(
      this,
      'GetUploadUrlFunction',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'handler',
        entry: path.join(__dirname, '../lambda/get-upload-url/index.ts'),
        timeout: cdk.Duration.seconds(10),
        memorySize: 256,
        environment,
        bundling: {
          externalModules: ['@aws-sdk/*'], // Use AWS SDK v3 from runtime
        },
      }
    );

    // Lambda: Generate Download URL
    const getDownloadUrlFunction = new lambdaNodejs.NodejsFunction(
      this,
      'GetDownloadUrlFunction',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'handler',
        entry: path.join(__dirname, '../lambda/get-download-url/index.ts'),
        timeout: cdk.Duration.seconds(10),
        memorySize: 256,
        environment,
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
      }
    );

    // Grant S3 permissions
    props.uploadBucket.grantPut(getUploadUrlFunction); // PutObject
    props.uploadBucket.grantRead(getDownloadUrlFunction); // GetObject

    // API Gateway
    const api = new apigateway.RestApi(this, 'PresignedUrlApi', {
      restApiName: 'Presigned URL Service',
      description: 'API for generating S3 presigned URLs',
      
      // CORS
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS, // ⚠️ Restrict in production
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },

      // Deployment options
      deployOptions: {
        stageName: 'prod',
        throttlingBurstLimit: 100,
        throttlingRateLimit: 50,
      },
    });

    // API Routes
    const uploads = api.root.addResource('uploads');
    const uploadUrl = uploads.addResource('url');
    
    uploadUrl.addMethod(
      'POST',
      new apigateway.LambdaIntegration(getUploadUrlFunction)
    );

    const downloads = api.root.addResource('downloads');
    const downloadUrl = downloads.addResource('url');
    
    downloadUrl.addMethod(
      'POST',
      new apigateway.LambdaIntegration(getDownloadUrlFunction)
    );

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });
  }
}
```

### 4. Main App (bin/app.ts)

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { S3Stack } from '../lib/s3-stack';
import { LambdaStack } from '../lib/lambda-stack';

const app = new cdk.App();

const s3Stack = new S3Stack(app, 'S3PresignedStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});

new LambdaStack(app, 'LambdaPresignedStack', {
  uploadBucket: s3Stack.uploadBucket,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});
```

---

## Lambda Functions for Presigned URLs

### 1. Generate Upload URL (lambda/get-upload-url/index.ts)

```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({ region: process.env.REGION });
const BUCKET_NAME = process.env.UPLOAD_BUCKET!;

interface UploadUrlRequest {
  fileName: string;
  fileType: string;
  fileSize?: number;
  userId?: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Parse request body
    const body: UploadUrlRequest = JSON.parse(event.body || '{}');
    
    // Validate input
    if (!body.fileName || !body.fileType) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'fileName and fileType are required' }),
      };
    }

    // Sanitize filename
    const sanitizedFileName = body.fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .substring(0, 100);

    // Generate unique key
    const userId = body.userId || 'anonymous';
    const fileId = uuidv4();
    const key = `uploads/${userId}/${fileId}-${sanitizedFileName}`;

    // Validate file type (whitelist approach)
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
    ];

    if (!allowedTypes.includes(body.fileType)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'File type not allowed' }),
      };
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (body.fileSize && body.fileSize > maxSize) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'File size exceeds 10MB limit' }),
      };
    }

    // Create presigned URL
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: body.fileType,
      // Metadata
      Metadata: {
        uploadedBy: userId,
        originalFileName: body.fileName,
      },
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300, // 5 minutes
    });

    // Return response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        uploadUrl: presignedUrl,
        key: key,
        expiresIn: 300,
      }),
    };
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
```

### 2. Generate Download URL (lambda/get-download-url/index.ts)

```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({ region: process.env.REGION });
const BUCKET_NAME = process.env.UPLOAD_BUCKET!;

interface DownloadUrlRequest {
  key: string;
  userId?: string;
  expiresIn?: number;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body: DownloadUrlRequest = JSON.parse(event.body || '{}');

    if (!body.key) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'key is required' }),
      };
    }

    // Validate user has access to this file
    const userId = body.userId || 'anonymous';
    if (!body.key.startsWith(`uploads/${userId}/`)) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Access denied' }),
      };
    }

    // Check if file exists
    try {
      await s3Client.send(
        new HeadObjectCommand({
          Bucket: BUCKET_NAME,
          Key: body.key,
        })
      );
    } catch (error) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'File not found' }),
      };
    }

    // Generate presigned URL
    const expiresIn = Math.min(body.expiresIn || 300, 3600); // Max 1 hour

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: body.key,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        downloadUrl: presignedUrl,
        expiresIn,
      }),
    };
  } catch (error) {
    console.error('Error generating download URL:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
```

---

## Complete Working Examples

### Example 1: Upload File from Browser

**Frontend (React/TypeScript):**

```typescript
import React, { useState } from 'react';

interface UploadResponse {
  uploadUrl: string;
  key: string;
  expiresIn: number;
}

export function FileUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedKey, setUploadedKey] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadFile = async () => {
    if (!file) return;

    setUploading(true);

    try {
      // Step 1: Get presigned URL from backend
      const response = await fetch('https://api.example.com/uploads/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          userId: 'user123',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }

      const data: UploadResponse = await response.json();

      // Step 2: Upload file directly to S3
      const uploadResponse = await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      // Step 3: Success!
      setUploadedKey(data.key);
      alert('File uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={uploadFile} disabled={!file || uploading}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
      {uploadedKey && <p>File key: {uploadedKey}</p>}
    </div>
  );
}
```

### Example 2: Download File

**Frontend (React/TypeScript):**

```typescript
export function FileDownloader({ fileKey }: { fileKey: string }) {
  const [downloading, setDownloading] = useState(false);

  const downloadFile = async () => {
    setDownloading(true);

    try {
      // Step 1: Get presigned URL
      const response = await fetch('https://api.example.com/downloads/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: fileKey,
          userId: 'user123',
        }),
      });

      const data = await response.json();

      // Step 2: Download file (opens in new tab or downloads)
      window.open(data.downloadUrl, '_blank');
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button onClick={downloadFile} disabled={downloading}>
      {downloading ? 'Getting download link...' : 'Download'}
    </button>
  );
}
```

### Example 3: Multipart Upload (Large Files)

**Lambda Function (lambda/get-multipart-upload-url/index.ts):**

```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({ region: process.env.REGION });
const BUCKET_NAME = process.env.UPLOAD_BUCKET!;

export const handler: APIGatewayProxyHandler = async (event) => {
  const body = JSON.parse(event.body || '{}');
  const { fileName, fileType, parts, userId } = body;

  // Step 1: Initiate multipart upload
  const createCommand = new CreateMultipartUploadCommand({
    Bucket: BUCKET_NAME,
    Key: `uploads/${userId}/${fileName}`,
    ContentType: fileType,
  });

  const { UploadId } = await s3Client.send(createCommand);

  // Step 2: Generate presigned URLs for each part
  const partUrls = [];
  for (let i = 1; i <= parts; i++) {
    const uploadPartCommand = new UploadPartCommand({
      Bucket: BUCKET_NAME,
      Key: `uploads/${userId}/${fileName}`,
      UploadId,
      PartNumber: i,
    });

    const presignedUrl = await getSignedUrl(s3Client, uploadPartCommand, {
      expiresIn: 3600, // 1 hour for large uploads
    });

    partUrls.push({ partNumber: i, url: presignedUrl });
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      uploadId: UploadId,
      parts: partUrls,
      key: `uploads/${userId}/${fileName}`,
    }),
  };
};
```

---

## Best Practices

### 1. **Always Set Expiration**

```typescript
// ❌ BAD
const url = s3.getSignedUrl('getObject', {
  Bucket: 'bucket',
  Key: 'file.pdf'
  // No expiration = default 15 minutes (but unclear)
});

// ✅ GOOD
const url = s3.getSignedUrl('getObject', {
  Bucket: 'bucket',
  Key: 'file.pdf',
  Expires: 300  // Explicit 5 minutes
});
```

### 2. **Validate Content-Type**

```typescript
// ✅ Enforce content type in presigned URL
const command = new PutObjectCommand({
  Bucket: BUCKET_NAME,
  Key: key,
  ContentType: 'image/jpeg',  // Must match on upload
});

// Client MUST send matching header
await fetch(presignedUrl, {
  method: 'PUT',
  headers: { 'Content-Type': 'image/jpeg' },
  body: file
});
```

### 3. **Use Unique Keys**

```typescript
import { v4 as uuidv4 } from 'uuid';

// ✅ Prevent overwriting
const key = `uploads/${userId}/${uuidv4()}-${sanitizedFileName}`;
```

### 4. **Enable CORS on S3**

```typescript
// In CDK
bucket.addCorsRule({
  allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.POST],
  allowedOrigins: ['https://yourdomain.com'],
  allowedHeaders: ['*'],
  exposedHeaders: ['ETag'],
});
```

### 5. **Log Presigned URL Generation**

```typescript
console.log({
  action: 'presigned-url-generated',
  userId,
  key,
  operation: 'putObject',
  expiresIn: 300,
  timestamp: new Date().toISOString(),
});
```

### 6. **Use AWS SDK v3 (Modular)**

```typescript
// ✅ AWS SDK v3 (smaller bundle size)
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// ❌ AWS SDK v2 (deprecated)
import AWS from 'aws-sdk';
const s3 = new AWS.S3();
```

---

## Common Pitfalls

### 1. **CORS Errors**

**Problem:**
```
Access to fetch at 'https://bucket.s3.amazonaws.com/...' from origin 'https://app.com' 
has been blocked by CORS policy
```

**Solution:**
```typescript
// Add CORS to S3 bucket
bucket.addCorsRule({
  allowedMethods: [s3.HttpMethods.PUT],
  allowedOrigins: ['*'],  // Or specific domains
  allowedHeaders: ['*'],
});
```

### 2. **Content-Type Mismatch**

**Problem:**
```
SignatureDoesNotMatch: The request signature we calculated does not match 
the signature you provided.
```

**Solution:**
```typescript
// Ensure client sends same Content-Type as in signature
const command = new PutObjectCommand({
  Bucket: BUCKET_NAME,
  Key: key,
  ContentType: 'image/jpeg',  // This MUST match client's header
});
```

### 3. **Expired URLs**

**Problem:**
```
Request has expired
```

**Solution:**
```typescript
// Check expiration before using URL
const expiresAt = Date.now() + (expiresIn * 1000);
if (Date.now() > expiresAt) {
  // Re-request new URL
}
```

### 4. **Permission Denied**

**Problem:**
```
Access Denied when generating presigned URL
```

**Solution:**
```typescript
// Ensure Lambda has S3 permissions
bucket.grantPut(lambdaFunction);  // For uploads
bucket.grantRead(lambdaFunction); // For downloads
```

---

## Deployment

```bash
# Bootstrap CDK (first time only)
cdk bootstrap

# Synthesize CloudFormation template
cdk synth

# Deploy stacks
cdk deploy --all

# Get outputs
cdk deploy --all --outputs-file outputs.json
```

**outputs.json:**
```json
{
  "LambdaPresignedStack": {
    "ApiUrl": "https://abc123.execute-api.us-east-1.amazonaws.com/prod/"
  },
  "S3PresignedStack": {
    "BucketName": "user-uploads-123456789012-us-east-1"
  }
}
```

---

## Testing

### Test Upload URL

```bash
# Get upload URL
curl -X POST https://your-api.com/uploads/url \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test.jpg",
    "fileType": "image/jpeg",
    "userId": "testuser"
  }'

# Response:
# {
#   "uploadUrl": "https://bucket.s3.amazonaws.com/uploads/testuser/uuid-test.jpg?...",
#   "key": "uploads/testuser/uuid-test.jpg",
#   "expiresIn": 300
# }

# Upload file
curl -X PUT "https://bucket.s3.amazonaws.com/uploads/testuser/uuid-test.jpg?..." \
  -H "Content-Type: image/jpeg" \
  --data-binary @test.jpg
```

### Test Download URL

```bash
curl -X POST https://your-api.com/downloads/url \
  -H "Content-Type: application/json" \
  -d '{
    "key": "uploads/testuser/uuid-test.jpg",
    "userId": "testuser"
  }'

# Response:
# {
#   "downloadUrl": "https://bucket.s3.amazonaws.com/uploads/testuser/uuid-test.jpg?...",
#   "expiresIn": 300
# }
```

---

## Summary

**Presigned URLs are powerful for:**
- Secure, temporary access to S3 objects
- Direct client-to-S3 uploads/downloads
- Reducing backend load
- Fine-grained access control

**Key Takeaways:**
1. Always set short expiration times (5-15 min for uploads)
2. Validate file types and sizes
3. Use unique keys (UUID) to prevent overwrites
4. Enable CORS on S3 for browser access
5. Log all presigned URL generation for audit
6. Use AWS SDK v3 for better performance
7. Grant minimal IAM permissions to Lambda

**Architecture Pattern:**
```
Client → API Gateway → Lambda (generates presigned URL) → Returns URL
Client → Uses URL directly with S3 → Upload/Download
```

This approach is secure, scalable, and cost-effective! 🚀
