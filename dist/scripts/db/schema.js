"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptions = exports.connectedBanks = exports.insertTransactionSchema = exports.transactionsRelation = exports.transactions = exports.insertCategorySchema = exports.categoriesRelations = exports.categories = exports.insertAccountSchema = exports.accountsRelations = exports.accounts = void 0;
var zod_1 = require("zod");
var drizzle_zod_1 = require("drizzle-zod");
var drizzle_orm_1 = require("drizzle-orm");
var pg_core_1 = require("drizzle-orm/pg-core");
exports.accounts = (0, pg_core_1.pgTable)('accounts', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    plaidId: (0, pg_core_1.text)('plaid_id'),
    name: (0, pg_core_1.text)('name').notNull(),
    userId: (0, pg_core_1.text)('user_id').notNull(),
});
exports.accountsRelations = (0, drizzle_orm_1.relations)(exports.accounts, function (_a) {
    var many = _a.many;
    return ({
        // 1 account have many transactions
        transactions: many(exports.transactions),
    });
});
// generate Zod schemas from Drizzle ORM schemas
exports.insertAccountSchema = (0, drizzle_zod_1.createInsertSchema)(exports.accounts);
exports.categories = (0, pg_core_1.pgTable)('categories', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    plaidId: (0, pg_core_1.text)('plaid_id'),
    name: (0, pg_core_1.text)('name').notNull(),
    userId: (0, pg_core_1.text)('user_id').notNull(),
});
exports.categoriesRelations = (0, drizzle_orm_1.relations)(exports.categories, function (_a) {
    var many = _a.many;
    return ({
        transactions: many(exports.transactions),
    });
});
exports.insertCategorySchema = (0, drizzle_zod_1.createInsertSchema)(exports.categories);
exports.transactions = (0, pg_core_1.pgTable)('transactions', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    amount: (0, pg_core_1.integer)('amount').notNull(),
    payee: (0, pg_core_1.text)('payee').notNull(),
    notes: (0, pg_core_1.text)('notes'),
    date: (0, pg_core_1.timestamp)('date', { mode: 'date' }).notNull(),
    // creating relation with the account
    accountId: (0, pg_core_1.text)('account_id')
        .references(function () { return exports.accounts.id; }, {
        // Rules
        onDelete: 'cascade',
    })
        .notNull(),
    categoryId: (0, pg_core_1.text)('category_id').references(function () { return exports.categories.id; }, {
        onDelete: 'set null',
    }),
});
// one to many
exports.transactionsRelation = (0, drizzle_orm_1.relations)(exports.transactions, function (_a) {
    var one = _a.one;
    return ({
        // Each transaction has 1 only account
        account: one(exports.accounts, {
            fields: [exports.transactions.accountId],
            references: [exports.accounts.id],
        }),
        categories: one(exports.categories, {
            fields: [exports.transactions.categoryId],
            references: [exports.categories.id],
        }),
    });
});
exports.insertTransactionSchema = (0, drizzle_zod_1.createInsertSchema)(exports.transactions, {
    date: zod_1.z.coerce.date(),
});
exports.connectedBanks = (0, pg_core_1.pgTable)('connected_banks', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    userId: (0, pg_core_1.text)('user_id').notNull(),
    accessToken: (0, pg_core_1.text)('access_token').notNull(),
});
exports.subscriptions = (0, pg_core_1.pgTable)('subscriptions', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    userId: (0, pg_core_1.text)('user_id').notNull().unique(),
    subscriptionId: (0, pg_core_1.text)('subscription_id').notNull().unique(),
    status: (0, pg_core_1.text)('status').notNull(),
});
