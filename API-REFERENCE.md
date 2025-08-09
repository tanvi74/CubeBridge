# 📡 CubeBridge API Reference

This document covers all the built-in Cube.js APIs available in CubeBridge. These endpoints are provided automatically by Cube.js - no custom implementation needed!

## 🚀 Base URL

All APIs are available at: `http://localhost:4000/cubejs-api/v1/`

**Authentication**: Include `Authorization: secret` header in all requests.

## 📊 Core APIs

### **GET /meta**
Returns schema metadata - all available cubes, measures, and dimensions.

**Request:**
```bash
curl -H "Authorization: secret" \
  http://localhost:4000/cubejs-api/v1/meta
```

**Response:**
```json
{
  "cubes": [
    {
      "name": "People",
      "title": "People",
      "measures": [],
      "dimensions": [
        {
          "name": "People.id",
          "title": "People Id",
          "type": "number",
          "shortTitle": "Id",
          "suggestFilterValues": true,
          "isVisible": false,
          "public": false,
          "primaryKey": true
        },
        {
          "name": "People.name",
          "title": "People Name",
          "type": "string",
          "shortTitle": "Name",
          "suggestFilterValues": true,
          "isVisible": true,
          "public": true
        }
      ]
    }
  ]
}
```

**Used by:** Frontend to dynamically discover available cubes and build UI

---

### **POST /load**
Executes queries and returns actual data.

**Request:**
```bash
curl -X POST \
  -H "Authorization: secret" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "measures": [],
      "dimensions": ["People.name", "People.age"],
      "timeDimensions": [],
      "filters": []
    }
  }' \
  http://localhost:4000/cubejs-api/v1/load
```

**Response:**
```json
{
  "query": {
    "measures": [],
    "dimensions": ["People.name", "People.age"],
    "timeDimensions": [],
    "filters": []
  },
  "data": [
    {
      "People.name": "John Doe",
      "People.age": 30
    },
    {
      "People.name": "Jane Smith", 
      "People.age": 25
    }
  ],
  "lastRefreshTime": "2024-01-01T00:00:00.000Z",
  "annotation": {
    "measures": {},
    "dimensions": {
      "People.name": {
        "title": "People Name",
        "shortTitle": "Name",
        "type": "string"
      }
    }
  }
}
```

**Used by:** Frontend QueryRenderer to execute queries and display results

---

### **POST /sql**
Returns the generated SQL without executing it. Perfect for debugging!

**Request:**
```bash
curl -X POST \
  -H "Authorization: secret" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "measures": [],
      "dimensions": ["People.name", "People.age"],
      "timeDimensions": [],
      "filters": []
    }
  }' \
  http://localhost:4000/cubejs-api/v1/sql
```

**Response:**
```json
{
  "sql": {
    "sql": [
      "SELECT \"people\".name \"people__name\", \"people\".age \"people__age\" FROM (SELECT 1 as id, 'John Doe' as name, 30 as age UNION ALL SELECT 2, 'Jane Smith', 25 UNION ALL SELECT 3, 'Bob Johnson', 35 UNION ALL SELECT 4, 'Alice Brown', 28 UNION ALL SELECT 5, 'Charlie Wilson', 42 UNION ALL SELECT 6, 'Diana Lee', 31 UNION ALL SELECT 7, 'Frank Miller', 29 UNION ALL SELECT 8, 'Grace Davis', 33 UNION ALL SELECT 9, 'Henry Garcia', 27 UNION ALL SELECT 10, 'Ivy Martinez', 36) AS \"people\" LIMIT 10000"
    ],
    "aliasNameToMember": {
      "people__name": "People.name",
      "people__age": "People.age"
    },
    "order": {}
  }
}
```

**Used by:** Frontend SQL viewer to show generated queries

---

### **POST /sql** (with joins)
When querying multiple cubes, Cube.js automatically generates JOINs:

**Request:**
```json
{
  "query": {
    "dimensions": [
      "People.name", 
      "People.age", 
      "PersonJobs.job_title", 
      "PersonJobs.location"
    ]
  }
}
```

**Generated SQL:**
```sql
SELECT 
  "people".name "people__name",
  "people".age "people__age", 
  "person_jobs".job_title "person_jobs__job_title",
  "person_jobs".location "person_jobs__location"
FROM (
  SELECT 1 as id, 'John Doe' as name, 30 as age
  UNION ALL SELECT 2, 'Jane Smith', 25
  -- ... more data
) AS "people"
LEFT JOIN (
  SELECT 1 as person_id, 'Software Engineer' as job_title, 'San Francisco' as location
  UNION ALL SELECT 2, 'Product Manager', 'New York' 
  -- ... more data
) AS "person_jobs" ON "people".id = "person_jobs".person_id
LIMIT 10000
```

## 🔧 Development APIs

### **GET /**
Opens the Cube.js Developer Playground - a web interface for testing queries.

**Access:** Visit `http://localhost:4000` in your browser

**Features:**
- Interactive query builder
- Schema explorer
- SQL preview
- Performance metrics
- Chart visualization

---

### **POST /dry-run**
Validates queries without executing them.

**Request:**
```json
{
  "query": {
    "measures": ["InvalidMeasure.count"],
    "dimensions": ["People.name"]
  }
}
```

**Response:**
```json
{
  "error": "Measure 'InvalidMeasure.count' not found"
}
```

**Use case:** Validate user input before execution

---

### **GET /compile**
Compiles and validates the entire schema.

**Response:**
```json
{
  "status": "compiled",
  "cubes": ["People", "PersonJobs"]
}
```

**Use case:** Check for schema errors during development

## 🎯 Query Structure

### **Basic Query Format**
```json
{
  "measures": ["Cube.measureName"],
  "dimensions": ["Cube.dimensionName"], 
  "timeDimensions": [
    {
      "dimension": "Cube.dateField",
      "granularity": "day",
      "dateRange": ["2024-01-01", "2024-01-31"]
    }
  ],
  "filters": [
    {
      "member": "Cube.field",
      "operator": "equals",
      "values": ["value"]
    }
  ],
  "limit": 1000,
  "offset": 0
}
```

### **Filter Operators**
- `equals` / `notEquals`
- `contains` / `notContains` 
- `gt` / `gte` / `lt` / `lte` (greater than, less than)
- `set` / `notSet` (null checks)
- `inDateRange` / `notInDateRange`
- `beforeDate` / `afterDate`

### **Time Granularities**
- `second`, `minute`, `hour`
- `day`, `week`, `month`, `quarter`, `year`

## 🔍 Error Handling

### **Common Error Responses**

**Invalid API Secret:**
```json
{
  "error": "Invalid API secret"
}
```

**Invalid Query:**
```json
{
  "error": "Dimension 'InvalidCube.field' not found"
}
```

**Schema Compilation Error:**
```json
{
  "error": "YAMLException: can not read a block mapping entry"
}
```

## 🚀 Performance Features

### **Automatic Caching**
- Query results are cached automatically
- Cache keys based on query content
- Configurable cache refresh intervals

### **Pre-aggregations**
Build materialized views for faster queries:
```yaml
preAggregations:
  - name: peopleRollup
    measures: [People.count]
    dimensions: [People.age]
    granularity: day
```

### **SQL Optimization**
- Automatic query optimization
- Intelligent JOIN strategies
- Index recommendations

## 📊 Monitoring & Debugging

### **Query Logs**
Backend console shows:
```
Performing query: abc123-span-1
Executing SQL: SELECT "people".name FROM...
Query completed: abc123-span-1 (25ms)
```

### **Performance Metrics**
- Query execution time
- Cache hit/miss ratios
- SQL generation time
- Database response time

## 🔒 Security

### **API Authentication**
```javascript
// Backend configuration
module.exports = {
  apiSecret: process.env.CUBEJS_API_SECRET || 'secret'
};
```

### **CORS Configuration**
```javascript
http: {
  cors: {
    origin: ['http://localhost:5173'],
    credentials: true,
  }
}
```

### **Production Security**
- Use strong API secrets
- Enable HTTPS
- Implement rate limiting
- Add request validation

---

**🎯 Key Takeaway:** All these APIs come built-in with Cube.js! You just define your data model in YAML and get a full analytical API automatically. No custom backend code required! 🚀 