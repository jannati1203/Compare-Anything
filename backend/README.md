# Compare Anything — AI Backend Service

ASP.NET Core 10 Web API service powering evidence-based page comparison for the **Compare Anything** Chrome Extension.

---

## 🏗️ Architecture & Principles

- **Framework**: ASP.NET Core 10 (.NET 10.0 Web API)
- **AI Providers**: Modular provider abstraction (`IAIProvider`) with implementations for **Groq** (primary) and **OpenRouter** (fallback structure).
- **Evidence-Only Engine**: Enforces strict grounding rules in the AI prompt. The AI cannot use general knowledge to fill missing facts. Inconclusive or absent information returns `"Not stated"` or `null`.
- **Untrusted Webpage Data**: Webpage content is safely wrapped in XML delimiters (`<PAGE_SNAPSHOT>`) and treated strictly as inert data to defend against prompt injection attacks.
- **Privacy & Sanitized Logging**: Page snapshots, text content, and user goals are **never** logged to disk/console. Logs contain only hashed anonymous install IDs, timestamps, page counts, durations, and status codes.
- **In-Memory Rate Limiting**: Abuse prevention limiting comparisons per anonymous installation ID (default: 10/day) and client IP without requiring a database.

---

## ⚙️ Configuration & Environment Variables

Create your local `.env` file (or set system environment variables) using [backend/.env.example](.env.example) as a guide:

| Variable | Description | Default |
|---|---|---|
| `GROQ_API_KEY` | **Required for Groq**. Your API key from [Groq Console](https://console.groq.com/keys). | *None* |
| `AI__Provider` | Active AI provider (`Groq` or `OpenRouter`). | `Groq` |
| `AI__Model` | LLM model to query. | `openai/gpt-oss-20b` |
| `OPENROUTER_API_KEY` | Optional. Your API key from [OpenRouter](https://openrouter.ai/keys) if using OpenRouter. | *None* |
| `RateLimit__ComparisonsPerInstallPerDay` | Maximum comparisons allowed per anonymous install ID per 24 hours. | `10` |
| `RateLimit__ComparisonsPerIpPerHour` | Maximum comparisons allowed per IP per hour. | `30` |
| `ASPNETCORE_URLS` | Local hosting URL. | `http://127.0.0.1:5123` |

> [!CAUTION]
> Never hardcode API keys or commit a `.env` file containing secrets to version control.

---

## 🚀 Running Locally

### 1. Prerequisites
- .NET 10 SDK (`10.0.401` or later)

### 2. Run Commands
```bash
cd backend

# Restore and build
dotnet build

# Run the API server
dotnet run --launch-profile "http"
```

The service will start listening on `http://127.0.0.1:5123`.

### 3. Run Automated Tests
```bash
cd backend.Tests
dotnet test
```

---

## 📡 API Reference

### Health Check
`GET /health`

**Response (`200 OK`)**:
```json
{
  "status": "healthy",
  "service": "Compare Anything AI Backend",
  "timestamp": "2026-09-12T08:06:24.1043515Z"
}
```

---

### Compare Pages
`POST /api/v1/compare`

**Headers**:
`Content-Type: application/json`

#### Sample Request:
```json
{
  "installId": "09a5ce9c-984b-4b71-8406-03f5ce401824",
  "goal": "Best laptop for software engineering with long battery life",
  "pages": [
    {
      "id": "page-1",
      "url": "https://apple.com/macbook-air-m3",
      "domain": "apple.com",
      "title": "MacBook Air 15-inch with M3",
      "importantText": "--- Specifications ---\nProcessor: Apple M3 chip (8-core CPU, 10-core GPU)\nMemory: 16GB unified memory\nStorage: 512GB SSD\nBattery: Up to 18 hours Apple TV app movie playback\nDisplay: 15.3-inch Liquid Retina display\nWeight: 3.3 pounds (1.51 kg)"
    },
    {
      "id": "page-2",
      "url": "https://dell.com/xps-14",
      "domain": "dell.com",
      "title": "Dell XPS 14 Laptop",
      "importantText": "--- Specifications ---\nProcessor: Intel Core Ultra 7 155H\nMemory: 16GB LPDDR5X\nStorage: 512GB PCIe Gen 4 SSD\nBattery: 69.5Whr, up to 14 hours battery life\nDisplay: 14.5-inch FHD+ InfinityEdge\nWeight: 3.7 pounds (1.68 kg)"
    }
  ]
}
```

#### Sample Successful Response (`200 OK`):
```json
{
  "comparisonTitle": "MacBook Air 15-inch M3 vs Dell XPS 14",
  "comparisonType": "Product",
  "goal": "Best laptop for software engineering with long battery life",
  "items": [
    {
      "id": "page-1",
      "displayName": "MacBook Air 15-inch with M3",
      "shortDescription": "Thin and light laptop with M3 chip, unified memory, and 18-hour battery life."
    },
    {
      "id": "page-2",
      "displayName": "Dell XPS 14 Laptop",
      "shortDescription": "Compact Windows laptop powered by Intel Core Ultra 7 155H with FHD+ InfinityEdge display."
    }
  ],
  "criteria": [
    {
      "name": "Battery Life",
      "importance": "high",
      "values": [
        { "itemId": "page-1", "value": "Up to 18 hours", "confidence": "high" },
        { "itemId": "page-2", "value": "Up to 14 hours", "confidence": "high" }
      ],
      "winnerItemIds": ["page-1"]
    },
    {
      "name": "Processor",
      "importance": "high",
      "values": [
        { "itemId": "page-1", "value": "Apple M3 (8-core CPU, 10-core GPU)", "confidence": "high" },
        { "itemId": "page-2", "value": "Intel Core Ultra 7 155H", "confidence": "high" }
      ],
      "winnerItemIds": []
    },
    {
      "name": "Weight & Portability",
      "importance": "medium",
      "values": [
        { "itemId": "page-1", "value": "3.3 lbs (1.51 kg)", "confidence": "high" },
        { "itemId": "page-2", "value": "3.7 lbs (1.68 kg)", "confidence": "high" }
      ],
      "winnerItemIds": ["page-1"]
    }
  ],
  "bestOverall": {
    "itemId": "page-1",
    "reason": "Offers longer stated battery life (18 hours vs 14 hours) and lighter weight while maintaining strong performance for programming."
  },
  "bestFor": [
    {
      "label": "Best Battery Life",
      "itemId": "page-1",
      "reason": "Provides up to 18 hours of battery life compared to 14 hours on the Dell XPS 14."
    }
  ],
  "keyDifferences": [
    "MacBook Air states up to 18 hours of battery life vs up to 14 hours on Dell XPS 14.",
    "MacBook Air is lighter at 3.3 lbs compared to 3.7 lbs for the Dell XPS 14."
  ],
  "missingInformation": [
    {
      "itemId": "page-1",
      "fields": ["Price"]
    },
    {
      "itemId": "page-2",
      "fields": ["Price"]
    }
  ]
}
```

---

## 🛡️ Error Responses

| Status Code | Error Message | Scenario |
|---|---|---|
| `400 Bad Request` | `"Add at least one more page to compare."` | Fewer than 2 pages sent. |
| `400 Bad Request` | `"Maximum 4 pages can be compared."` | More than 4 pages sent. |
| `400 Bad Request` | `"This page is already in your comparison."` | Duplicate URLs in payload. |
| `400 Bad Request` | `"We couldn't extract enough information from this page."` | Empty or insufficient page text. |
| `429 Too Many Requests` | `"Today's free comparison limit has been reached. Please try again later."` | Install ID exceeded daily limit (10/day). |
| `429 Too Many Requests` | `"Free AI capacity is temporarily unavailable."` | AI Provider rate limit encountered. |
| `502 Bad Gateway` | `"Groq API key is not configured. Please set the GROQ_API_KEY environment variable."` | Server missing provider API key. |
| `502 Bad Gateway` | `"Comparison couldn't be generated. Please try again."` | AI output malformed or failed validation. |
| `500 Internal Server Error` | `"Compare Anything is temporarily unavailable."` | Unexpected server error (sanitized). |
