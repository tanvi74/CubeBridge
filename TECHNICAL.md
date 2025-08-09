# 🔍 Technical Deep Dive: How CubeBridge Works

This document explains the internal workings of CubeBridge - how Cube.js processes queries, generates SQL, and delivers data to the frontend.

> **💡 Pro Tip:** CubeBridge includes a built-in SQL viewer in the UI! You can see the exact SQL that Cube.js generates in real-time as you build queries.

## 📊 Complete Query Flow

### **Step 1: User Interaction (Frontend)**
```javascript
// User selects "People" cube in UI
setSelectedCubes(['People'])

// This triggers useEffect that auto-selects dimensions
setSelectedDimensions(['People.name', 'People.age'])
```

### **Step 2: Query Object Creation**
```javascript
const query = {
  measures: [],                           // No aggregations
  dimensions: ['People.name', 'People.age'], // Selected dimensions
  timeDimensions: [],                     // No time filtering
  filters: []                             // No filters
}
```

### **Step 3: QueryRenderer Execution**
```javascript
<QueryRenderer
  query={query}           // The query object
  cubeApi={cubeApi}      // Configured client pointing to localhost:4000
  render={renderChart}   // Function to render results
/>
```

### **Step 4: HTTP Request to Backend**
The QueryRenderer automatically sends a POST request:
```
POST http://localhost:4000/cubejs-api/v1/load
Headers: Authorization: secret
Body: {
  "query": {
    "measures": [],
    "dimensions": ["People.name", "People.age"],
    "timeDimensions": [],
    "filters": []
  }
}
```

### **Step 5: Backend Processing**

1. **Cube.js receives the request** and validates the API secret
2. **Parses the query** and identifies which cubes are needed
3. **Loads cube definitions** from `model/cubes/people.yml`
4. **Generates SQL** based on the cube definition:

```sql
SELECT 
  "people".name "people__name", 
  "people".age "people__age"
FROM (
  SELECT 1 as id, 'John Doe' as name, 30 as age
  UNION ALL SELECT 2, 'Jane Smith', 25
  UNION ALL SELECT 3, 'Bob Johnson', 35
  UNION ALL SELECT 4, 'Alice Brown', 28
  UNION ALL SELECT 5, 'Charlie Wilson', 42
  UNION ALL SELECT 6, 'Diana Lee', 31
  UNION ALL SELECT 7, 'Frank Miller', 29
  UNION ALL SELECT 8, 'Grace Davis', 33
  UNION ALL SELECT 9, 'Henry Garcia', 27
  UNION ALL SELECT 10, 'Ivy Martinez', 36
) AS "people"
```

5. **Executes SQL** against SQLite in-memory database
6. **Returns JSON response** with the data

### **Step 6: Frontend Receives Data**
```javascript
// renderChart function receives:
{
  resultSet: {
    tablePivot: () => [
      { "People.name": "John Doe", "People.age": 30 },
      { "People.name": "Jane Smith", "People.age": 25 },
      { "People.name": "Bob Johnson", "People.age": 35 }
      // ... more rows
    ],
    tableColumns: () => [
      { title: "People Name", dataIndex: "People.name" },
      { title: "People Age", dataIndex: "People.age" }
    ]
  }
}
```

### **Step 7: UI Renders Table**
The Ant Design Table component displays the data in a responsive table.

## 🔄 Join Handling Example

When you select both cubes (`People` + `PersonJobs`):

### **Frontend Query**
```javascript
{
  dimensions: [
    "People.name", 
    "People.age", 
    "PersonJobs.job_title", 
    "PersonJobs.location"
  ]
}
```

### **Generated SQL with JOIN**
```sql
SELECT 
  "people".name "people__name",
  "people".age "people__age",
  "person_jobs".job_title "person_jobs__job_title",
  "person_jobs".location "person_jobs__location"
FROM (
  SELECT 1 as id, 'John Doe' as name, 30 as age
  UNION ALL SELECT 2, 'Jane Smith', 25
  UNION ALL SELECT 3, 'Bob Johnson', 35
  UNION ALL SELECT 4, 'Alice Brown', 28
  UNION ALL SELECT 5, 'Charlie Wilson', 42
  UNION ALL SELECT 6, 'Diana Lee', 31
  UNION ALL SELECT 7, 'Frank Miller', 29
  UNION ALL SELECT 8, 'Grace Davis', 33
  UNION ALL SELECT 9, 'Henry Garcia', 27
  UNION ALL SELECT 10, 'Ivy Martinez', 36
) AS "people"
LEFT JOIN (
  SELECT 1 as person_id, 'Software Engineer' as job_title, 'San Francisco' as location
  UNION ALL SELECT 2, 'Product Manager', 'New York'
  UNION ALL SELECT 3, 'Data Scientist', 'Seattle'
  UNION ALL SELECT 4, 'UX Designer', 'Los Angeles'
  UNION ALL SELECT 5, 'DevOps Engineer', 'Austin'
  UNION ALL SELECT 6, 'Marketing Manager', 'Chicago'
  UNION ALL SELECT 7, 'Sales Representative', 'Boston'
  UNION ALL SELECT 8, 'HR Specialist', 'Denver'
  UNION ALL SELECT 9, 'Financial Analyst', 'Miami'
  UNION ALL SELECT 10, 'Project Manager', 'Portland'
) AS "person_jobs" ON "people".id = "person_jobs".person_id
```

### **Result**
```json
[
  {
    "People.name": "John Doe",
    "People.age": 30,
    "PersonJobs.job_title": "Software Engineer",
    "PersonJobs.location": "San Francisco"
  },
  {
    "People.name": "Jane Smith",
    "People.age": 25,
    "PersonJobs.job_title": "Product Manager",
    "PersonJobs.location": "New York"
  }
  // ... more joined data
]
```

## 🏗️ Architecture Components

### **Frontend Architecture**
```
┌─────────────────┐
│   QueryBuilder  │ ← User selects cubes
│                 │
├─────────────────┤
│   useEffect     │ ← Auto-selects dimensions
│                 │
├─────────────────┤
│ QueryRenderer   │ ← Executes query via cubeApi
│                 │
├─────────────────┤
│   cubeApi       │ ← HTTP client to backend
│                 │
└─────────────────┘
```

### **Backend Architecture**
```
┌─────────────────┐
│   Cube.js API   │ ← Receives HTTP requests
│                 │
├─────────────────┤
│ Query Parser    │ ← Parses JSON query
│                 │
├─────────────────┤
│ Schema Loader   │ ← Loads .yml cube definitions
│                 │
├─────────────────┤
│ SQL Generator   │ ← Converts query to SQL
│                 │
├─────────────────┤
│ SQLite Driver   │ ← Executes SQL queries
│                 │
└─────────────────┘
```

### **Cube Definition Structure**
```yaml
cubes:
  - name: People                    # Cube identifier
    sql: >                         # Data source (inline SQL)
      SELECT 1 as id, 'John' as name, 30 as age
      UNION ALL SELECT 2, 'Jane', 25
      
    joins:                         # Relationships to other cubes
      - name: PersonJobs
        sql: "{CUBE}.id = {PersonJobs}.person_id"
        relationship: one_to_one
        
    measures: []                   # Aggregations (empty in our case)
    
    dimensions:                    # Attributes for filtering/grouping
      - name: id
        sql: id
        type: number
        primary_key: true
      - name: name
        sql: name
        type: string
```

## 🚀 Key Magic Points

### **1. Automatic SQL Generation**
- You never write SQL, just define cubes in YAML
- Cube.js generates optimized SQL based on your query
- Handles complex JOINs automatically

### **2. Intelligent Joins**
- Cube.js uses relationship definitions to join tables
- `{CUBE}` syntax refers to current cube
- `{OtherCube}` syntax refers to joined cubes

### **3. Real-time Execution**
- Every UI change triggers immediate query execution
- No "Submit" button needed
- Results update as you select/deselect cubes

### **4. Metadata API**
- `/meta` endpoint provides cube structure to frontend
- Dynamic UI based on available cubes and dimensions
- Type-safe frontend development

### **5. Caching & Performance**
- Cube.js caches query results automatically
- Uses CubeStore for high-performance caching
- Optimizes repeated queries

## 📡 API Endpoints

### **GET /cubejs-api/v1/meta**
Returns available cubes, measures, and dimensions:
```json
{
  "cubes": [
    {
      "name": "People",
      "measures": [],
      "dimensions": [
        {
          "name": "People.name",
          "title": "People Name",
          "type": "string"
        }
      ]
    }
  ]
}
```

### **POST /cubejs-api/v1/load**
Executes queries and returns data:
```json
{
  "query": {
    "dimensions": ["People.name", "People.age"]
  }
}
```

### **GET /cubejs-api/v1/sql**
Returns generated SQL for debugging:
```json
{
  "sql": {
    "sql": ["SELECT \"people\".name, \"people\".age FROM (...) AS \"people\""],
    "aliasNameToMember": {
      "people__name": "People.name",
      "people__age": "People.age"
    }
  }
}
```

## 🔧 Configuration Details

### **SQLite In-Memory Setup**
```javascript
driverFactory: () => {
  const SqliteDriver = require('@cubejs-backend/sqlite-driver');
  return new SqliteDriver({
    database: ':memory:'  // In-memory database
  });
}
```

### **CORS Configuration**
```javascript
http: {
  cors: {
    origin: ['http://localhost:5173'], // Frontend URL
    credentials: true,
  },
}
```

### **Development Mode**
```javascript
devServer: true,                    // Enable dev features
scheduledRefreshTimer: false,       // Disable auto-refresh
apiSecret: 'secret'                // Development API key
```

## 🎯 Why This Architecture Works

1. **Separation of Concerns** - Data modeling in backend, UI logic in frontend
2. **Declarative Queries** - Describe what you want, not how to get it
3. **Type Safety** - Frontend knows about available cubes/dimensions
4. **Performance** - Automatic caching and query optimization
5. **Scalability** - Easy to add new cubes and relationships

This architecture makes complex analytical queries simple and maintainable! 🚀 