"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/seed.ts
var dotenv_1 = require("dotenv");
var pg_1 = require("pg");
var node_postgres_1 = require("drizzle-orm/node-postgres");
var schema_1 = require("../db/schema"); // chỉnh path nếu cần
(0, dotenv_1.config)(); // load process.env.DATABASE_URL
// Khởi tạo pool và drizzle
var pool = new pg_1.default.Pool({ connectionString: process.env.DATABASE_URL });
var db = (0, node_postgres_1.drizzle)(pool);
var accountSeed = [
    { id: 'acc-1', plaidId: 'plaid-A1', name: 'Checking', userId: 'user-1' },
    { id: 'acc-2', plaidId: 'plaid-A2', name: 'Savings', userId: 'user-1' },
    { id: 'acc-3', plaidId: 'plaid-A3', name: 'Credit Card', userId: 'user-2' },
    { id: 'acc-4', plaidId: 'plaid-A4', name: 'Investment', userId: 'user-3' },
    { id: 'acc-5', plaidId: null, name: 'Wallet', userId: 'user-2' },
];
var categorySeed = [
    { id: 'cat-1', name: 'Groceries', userId: 'user-1', plaidId: null },
    { id: 'cat-2', name: 'Transport', userId: 'user-1', plaidId: null },
    { id: 'cat-3', name: 'Utilities', userId: 'user-1', plaidId: null },
    { id: 'cat-4', name: 'Dining Out', userId: 'user-2', plaidId: null },
    { id: 'cat-5', name: 'Entertainment', userId: 'user-2', plaidId: null },
    { id: 'cat-6', name: 'Health', userId: 'user-3', plaidId: null },
    { id: 'cat-7', name: 'Travel', userId: 'user-3', plaidId: null },
    { id: 'cat-8', name: 'Education', userId: 'user-3', plaidId: null },
];
var connectedBanksSeed = [
    { id: 'bank-1', userId: 'user-1', accessToken: 'token-AAA' },
    { id: 'bank-2', userId: 'user-2', accessToken: 'token-BBB' },
    { id: 'bank-3', userId: 'user-3', accessToken: 'token-CCC' },
];
var subscriptionSeed = [
    { id: 'sub-1', userId: 'user-1', subscriptionId: 'sub-A1', status: 'active' },
    { id: 'sub-2', userId: 'user-2', subscriptionId: 'sub-B1', status: 'past_due' },
    { id: 'sub-3', userId: 'user-3', subscriptionId: 'sub-C1', status: 'canceled' },
];
var transactionSeed = [
    { id: 'tx-1', amount: 1200, payee: 'ShopMart', notes: 'Weekly groceries', date: new Date('2025-06-02T10:00:00Z'), accountId: 'acc-1', categoryId: 'cat-1' },
    { id: 'tx-2', amount: 300, payee: 'City Bus', notes: 'Bus pass', date: new Date('2025-06-03T08:30:00Z'), accountId: 'acc-1', categoryId: 'cat-2' },
    { id: 'tx-3', amount: 150, payee: 'Power Co.', notes: 'Electric bill', date: new Date('2025-06-04T14:20:00Z'), accountId: 'acc-1', categoryId: 'cat-3' },
    { id: 'tx-4', amount: 80, payee: 'Cafe Latte', notes: 'Morning coffee', date: new Date('2025-06-05T09:15:00Z'), accountId: 'acc-2', categoryId: 'cat-4' },
    { id: 'tx-5', amount: 250, payee: 'MovieWorld', notes: 'Weekend movie', date: new Date('2025-06-06T20:00:00Z'), accountId: 'acc-3', categoryId: 'cat-5' },
    { id: 'tx-6', amount: 5000, payee: 'Pharmacie', notes: 'Health supplies', date: new Date('2025-06-07T11:00:00Z'), accountId: 'acc-3', categoryId: 'cat-6' },
    { id: 'tx-7', amount: 10000, payee: 'FlyHigh', notes: 'Flight ticket', date: new Date('2025-06-08T06:45:00Z'), accountId: 'acc-4', categoryId: 'cat-7' },
    { id: 'tx-8', amount: 3000, payee: 'UniBooks', notes: 'Textbooks', date: new Date('2025-06-09T13:30:00Z'), accountId: 'acc-4', categoryId: 'cat-8' },
    { id: 'tx-9', amount: 200, payee: 'Bus Express', notes: 'Intercity bus', date: new Date('2025-06-10T07:00:00Z'), accountId: 'acc-5', categoryId: 'cat-2' },
    { id: 'tx-10', amount: 500, payee: 'Dinner Place', notes: 'Family dinner', date: new Date('2025-06-11T19:45:00Z'), accountId: 'acc-5', categoryId: 'cat-4' },
];
function seed() {
    return __awaiter(this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 11, 12, 14]);
                    console.log('⏳ Clearing existing data...');
                    // Xóa dữ liệu theo thứ tự phụ thuộc FK
                    return [4 /*yield*/, db.delete(schema_1.transactions).execute()];
                case 1:
                    // Xóa dữ liệu theo thứ tự phụ thuộc FK
                    _a.sent();
                    return [4 /*yield*/, db.delete(schema_1.subscriptions).execute()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, db.delete(schema_1.connectedBanks).execute()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, db.delete(schema_1.categories).execute()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, db.delete(schema_1.accounts).execute()];
                case 5:
                    _a.sent();
                    console.log('🌱 Seeding accounts...');
                    return [4 /*yield*/, db.insert(schema_1.accounts).values(accountSeed).execute()];
                case 6:
                    _a.sent();
                    console.log('🌱 Seeding categories...');
                    return [4 /*yield*/, db.insert(schema_1.categories).values(categorySeed).execute()];
                case 7:
                    _a.sent();
                    console.log('🌱 Seeding connected banks...');
                    return [4 /*yield*/, db.insert(schema_1.connectedBanks).values(connectedBanksSeed).execute()];
                case 8:
                    _a.sent();
                    console.log('🌱 Seeding subscriptions...');
                    return [4 /*yield*/, db.insert(schema_1.subscriptions).values(subscriptionSeed).execute()];
                case 9:
                    _a.sent();
                    console.log('🌱 Seeding transactions...');
                    return [4 /*yield*/, db.insert(schema_1.transactions).values(transactionSeed).execute()];
                case 10:
                    _a.sent();
                    console.log('✅ Seed completed successfully.');
                    return [3 /*break*/, 14];
                case 11:
                    err_1 = _a.sent();
                    console.error('❌ Seed failed:', err_1);
                    return [3 /*break*/, 14];
                case 12: return [4 /*yield*/, pool.end()];
                case 13:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 14: return [2 /*return*/];
            }
        });
    });
}
seed();
