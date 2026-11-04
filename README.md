# Smart Stock – Intelligent Inventory Management System

A web-based inventory management system developed to simplify stock management, track purchases and sales, monitor product expiry dates, and support better inventory decisions.

## Project Overview

**Smart Stock** is a web-based application that provides a centralized platform for managing inventory-related activities. It combines a React frontend, FastAPI backend, and PostgreSQL database to manage product information and inventory records efficiently.

The system also includes demand forecasting, expiry alerts, and reporting features to help users monitor stock levels and business activities.

## Key Features

- **Dashboard:** Displays important inventory and sales summaries.
- **Product Management:** Add, view, update, and delete product records.
- **Inventory Management:** Monitor stock quantities and available inventory.
- **Inventory Batch Management:** Maintain batch details, quantities, and expiry dates.
- **Supplier Management:** Store and manage supplier information.
- **Purchase Management:** Create and maintain purchase records.
- **Sales Management:** Record sales and manage sold product details.
- **Demand Forecasting:** Estimate future product demand using historical sales data.
- **Expiry Alerts:** Identify expired products and products approaching their expiry dates.
- **Reports and Analytics:** View sales, revenue, best-selling products, and low-stock information.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React 19, TypeScript |
| Frontend Development Tool | Vite |
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| API Documentation | FastAPI Swagger UI |

## Project Structure

```text
Smart-Stock-DBMS/
│
├── backend/
│   └── app/
│       ├── models/
│       ├── routers/
│       ├── schemas/
│       ├── services/
│       ├── utils/
│       ├── config.py
│       ├── database.py
│       └── main.py
│
├── frontend/
│   └── src/
│       ├── assets/
│       ├── services/
│       ├── App.tsx
│       ├── Products.tsx
│       ├── InventoryPage.tsx
│       ├── Purchases.tsx
│       ├── Sales.tsx
│       ├── Suppliers.tsx
│       ├── DemandForecast.tsx
│       ├── ExpiryAlerts.tsx
│       └── Reports.tsx
│
├── Smart stock.sql
├── .gitignore
└── README.md
```

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/akashsaha3870-dot/Smart-Stock-DBMS.git
cd Smart-Stock-DBMS
```

### 2. Backend Setup

Create and activate a Python virtual environment:

```bash
python -m venv .venv
```

For Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install the backend dependencies required by the project.

### 3. Database Configuration

1. Install and open PostgreSQL.
2. Create a database named `smart_stock`.
3. Configure the database connection in the root `.env` file.

Example:

```env
DATABASE_URL=postgresql+psycopg2://postgres:YOUR_PASSWORD@localhost:5432/smart_stock
```

Replace `YOUR_PASSWORD` with your PostgreSQL password.

The SQL schema is also provided in `Smart stock.sql`.

### 4. Run the Backend

From the project root, run:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --app-dir backend --reload-dir backend
```

Backend URL:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

### 5. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

## API Documentation

The backend APIs are developed using FastAPI. Swagger UI provides an interactive interface to view and test the available API endpoints.

Open:

`http://127.0.0.1:8000/docs`

## Project Objective

The main objective of Smart Stock is to make inventory operations more organized, reduce manual effort, improve stock visibility, and support better inventory management decisions.

## Future Scope

- User authentication and role-based access control.
- Automated stock synchronization with inventory batches.
- Email and SMS notifications for critical stock and expiry alerts.
- Improved demand forecasting techniques.
- Cloud deployment and remote database access.
- Advanced analytics and customizable reports.

## Author

**Akash Saha**  
B.Tech – Electronics and Communication Engineering  
Institute of Engineering & Management (IEM), Kolkata

## License

This project was developed for academic purposes.
