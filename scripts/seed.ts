import { config } from 'dotenv'
import pg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import {
  accounts,
  categories,
  connectedBanks,
  subscriptions,
  transactions,
} from '../db/schema'  

config()  

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle(pool)

const accountSeed = [
  { id: 'acc-1',  plaidId: 'plaid-A1', name: 'Checking',    userId: 'user-1' },
  { id: 'acc-2',  plaidId: 'plaid-A2', name: 'Savings',     userId: 'user-1' },
  { id: 'acc-3',  plaidId: 'plaid-A3', name: 'Credit Card', userId: 'user-2' },
  { id: 'acc-4',  plaidId: 'plaid-A4', name: 'Investment',  userId: 'user-3' },
  { id: 'acc-5',  plaidId: null,        name: 'Wallet',     userId: 'user-2' },
]

const categorySeed = [
  { id: 'cat-1', name: 'Groceries',    userId: 'user-1', plaidId: null },
  { id: 'cat-2', name: 'Transport',    userId: 'user-1', plaidId: null },
  { id: 'cat-3', name: 'Utilities',    userId: 'user-1', plaidId: null },
  { id: 'cat-4', name: 'Dining Out',   userId: 'user-2', plaidId: null },
  { id: 'cat-5', name: 'Entertainment',userId: 'user-2', plaidId: null },
  { id: 'cat-6', name: 'Health',       userId: 'user-3', plaidId: null },
  { id: 'cat-7', name: 'Travel',       userId: 'user-3', plaidId: null },
  { id: 'cat-8', name: 'Education',    userId: 'user-3', plaidId: null },
]

const connectedBanksSeed = [
  { id: 'bank-1', userId: 'user-1', accessToken: 'token-AAA' },
  { id: 'bank-2', userId: 'user-2', accessToken: 'token-BBB' },
  { id: 'bank-3', userId: 'user-3', accessToken: 'token-CCC' },
]

const subscriptionSeed = [
  { id: 'sub-1', userId: 'user-1', subscriptionId: 'sub-A1', status: 'active'   },
  { id: 'sub-2', userId: 'user-2', subscriptionId: 'sub-B1', status: 'past_due' },
  { id: 'sub-3', userId: 'user-3', subscriptionId: 'sub-C1', status: 'canceled' },
]

const transactionSeed = [
  { id: 'tx-1',  amount: 1200, payee: 'ShopMart',    notes: 'Weekly groceries', date: new Date('2025-06-02T10:00:00Z'), accountId: 'acc-1', categoryId: 'cat-1' },
  { id: 'tx-2',  amount:  300, payee: 'City Bus',    notes: 'Bus pass',         date: new Date('2025-06-03T08:30:00Z'), accountId: 'acc-1', categoryId: 'cat-2' },
  { id: 'tx-3',  amount:  150, payee: 'Power Co.',   notes: 'Electric bill',    date: new Date('2025-06-04T14:20:00Z'), accountId: 'acc-1', categoryId: 'cat-3' },
  { id: 'tx-4',  amount:   80, payee: 'Cafe Latte',  notes: 'Morning coffee',   date: new Date('2025-06-05T09:15:00Z'), accountId: 'acc-2', categoryId: 'cat-4' },
  { id: 'tx-5',  amount:  250, payee: 'MovieWorld',  notes: 'Weekend movie',    date: new Date('2025-06-06T20:00:00Z'), accountId: 'acc-3', categoryId: 'cat-5' },
  { id: 'tx-6',  amount: 5000, payee: 'Pharmacie',   notes: 'Health supplies',  date: new Date('2025-06-07T11:00:00Z'), accountId: 'acc-3', categoryId: 'cat-6' },
  { id: 'tx-7', amount:10000, payee: 'FlyHigh',     notes: 'Flight ticket',    date: new Date('2025-06-08T06:45:00Z'), accountId: 'acc-4', categoryId: 'cat-7' },
  { id: 'tx-8',  amount: 3000, payee: 'UniBooks',    notes: 'Textbooks',        date: new Date('2025-06-09T13:30:00Z'), accountId: 'acc-4', categoryId: 'cat-8' },
  { id: 'tx-9',   amount: 200, payee: 'Bus Express', notes: 'Intercity bus',    date: new Date('2025-06-10T07:00:00Z'), accountId: 'acc-5', categoryId: 'cat-2' },
  { id: 'tx-10',  amount: 500, payee: 'Dinner Place',notes: 'Family dinner',    date: new Date('2025-06-11T19:45:00Z'), accountId: 'acc-5', categoryId: 'cat-4' },
]

async function seed() {
  try {
    console.log('⏳ Clearing existing data...')
    // Xóa dữ liệu theo thứ tự phụ thuộc FK
    await db.delete(transactions).execute()
    await db.delete(subscriptions).execute()
    await db.delete(connectedBanks).execute()
    await db.delete(categories).execute()
    await db.delete(accounts).execute()

    console.log('🌱 Seeding accounts...')
    await db.insert(accounts).values(accountSeed).execute()

    console.log('🌱 Seeding categories...')
    await db.insert(categories).values(categorySeed).execute()

    console.log('🌱 Seeding connected banks...')
    await db.insert(connectedBanks).values(connectedBanksSeed).execute()

    console.log('🌱 Seeding subscriptions...')
    await db.insert(subscriptions).values(subscriptionSeed).execute()

    console.log('🌱 Seeding transactions...')
    await db.insert(transactions).values(transactionSeed).execute()

    console.log('✅ Seed completed successfully.')
  } catch (err) {
    console.error('❌ Seed failed:', err)
  } finally {
    await pool.end()
  }
}

seed()
