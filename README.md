# CubeBridge 🚀

A modern query builder interface that enables dynamic data exploration through cube selection and automatic dimension filtering.

## ✨ What it does

- **Cube-Based Query Builder** - Select data cubes to automatically load relevant dimensions
- **Dynamic Joins** - Handles complex joins between related data tables automatically
- **Real-time Queries** - Execute queries instantly and see results in a responsive table
- **Smart Filtering** - Dimensions filter dynamically based on your cube selection
- **Clean Interface** - Focus on dimensional data without aggregation noise

## 🛠️ Tech Stack

### Backend
- **Cube.js** - Analytical API platform
- **SQLite** - In-memory database with sample data
- **Node.js** - Runtime environment

### Frontend
- **React 18** - UI library with TypeScript
- **Vite** - Build tool and dev server
- **Ant Design** - UI component library
- **Cube.js React Client** - Frontend integration

## 📊 Sample Data

The app includes two data cubes:
- **People** - Demographics (name, age)
- **PersonJobs** - Job information (job title, location)

Connected with automatic joins to show complete person profiles.

## 🚀 How to Run Locally

### Prerequisites
- Node.js (v16 or higher)
- npm

### 1. Clone and Setup
```bash
git clone https://github.com/tanvi74/CubeBridge.git
cd CubeBridge
```

### 2. Start Backend
```bash
cd backend/cube-query-builder
npm install
npm run dev
```
Backend runs on **http://localhost:4000**

### 3. Start Frontend
Open new terminal:
```bash
cd frontend/cube-frontend
npm install
npm run dev
```
Frontend runs on **http://localhost:5173**

### 4. Use the App
1. Open **http://localhost:5173** in your browser
2. Select cubes (People, PersonJobs) to auto-load their dimensions
3. View query results in real-time
4. Try selecting multiple cubes to see joined data

---

**Built with Cube.js and React** 