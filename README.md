# Personal Finance Tracker

A full-stack personal finance management application built with React (frontend) and Node.js (backend). It allows users to track income and expenses, view transaction history, and visualize financial data with charts.

## Table of Contents
1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [Backend Setup](#backend-setup)
6. [Frontend Setup](#frontend-setup)
7. [Environment Variables](#environment-variables)
8. [Usage](#usage)
9. [Conventions](#conventions)
10. [Scripts](#scripts)
11. [API Endpoints](#api-endpoints)
12. [License](#license)

## Features
- Track income and expenses
- View transaction history
- Visualize income vs. expenses with interactive charts
- Add, edit, and delete transactions
- Unit tests for both backend and frontend components

## Tech Stack
- **Frontend**: React, Axios, Chart.js (react-chartjs-2), Styled-Components, React Testing Library
- **Backend**: Node.js, Express, MongoDB, Mongoose, Jest
- **Linting & Formatting**: ESLint, Prettier

## Project Structure
```
.
├─ backend/
│   ├─ app.js
│   ├─ models/
│   │   └─ Transaction.js
│   ├─ routes/
│   │   └─ transactions.js
│   ├─ controllers/
│   └─ services/
└─ frontend/
    ├─ src/
    │   ├─ components/
    │   │   ├─ BalanceCard.jsx
    │   │   ├─ TransactionForm.jsx
    │   │   ├─ TransactionList.jsx
    │   │   └─ FinancialChart.jsx
    │   ├─ services/
    │   │   └─ transactionService.js
    │   ├─ App.js
    │   └─ index.js
```

## Prerequisites
- Node.js v14+ and npm
- MongoDB (local or Atlas)

## Backend Setup
1. Navigate to `backend/`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following:
   ```
   MONGO_URI=mongodb://localhost:27017/finance-tracker
   PORT=5000
   ```
4. Start the server:
   ```bash
   npm run start
   ```

## Frontend Setup
1. Navigate to `frontend/`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following (if needed):
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   ```
4. Start the development server:
   ```bash
   npm start
   ```

## Environment Variables
- **MONGO_URI**: MongoDB connection string
- **PORT**: Backend server port (default: 5000)
- **REACT_APP_API_URL**: Base URL for API calls from frontend

## Usage
1. Launch backend and frontend as described above.
2. Open `http://localhost:3000` in your browser.
3. Add income or expense transactions, view history, and analyze charts.

## Conventions
See [`CONVENTIONS.md`](CONVENTIONS.md) for coding style, branch naming, and commit message guidelines.

## Scripts
- **Backend**:
  - `npm run start` – start server
  - `npm run dev` – start with nodemon
  - `npm test` – run Jest tests
- **Frontend**:
  - `npm start` – start React development server
  - `npm run lint` – run ESLint
  - `npm run format` – run Prettier
  - `npm test` – run React Testing Library

## API Endpoints
- `GET /api/transactions` – fetch all transactions
- `POST /api/transactions` – create a new transaction
- `PUT /api/transactions/:id` – update an existing transaction
- `DELETE /api/transactions/:id` – delete a transaction

## License
This project is licensed under the MIT License.
