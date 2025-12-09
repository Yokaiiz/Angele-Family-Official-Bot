const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");

class Database {
    constructor() {
        this.db = null;

        // Default user schema
        this.defaultUser = {
            id: null,
            name: "",
            balance: 0,
            experience: 0,
            level: 1,
            roleplayActions: {} // <-- NEW ROLEPLAY STORAGE
        };
    }

    // ---------------------------
    // INITIALIZATION
    // ---------------------------
    async initialize() {
        const adapter = new JSONFile("db.json");

        // initialize LowDB with default structure
        this.db = new Low(adapter, {
            users: [],
            settings: {}
        });

        await this.db.read();
        if (!this.db.data) {
            this.db.data = { users: [], settings: {} };
            await this.db.write();
        }
    }

    async write() {
        if (!this.db) throw new Error("Database not initialized.");
        await this.db.write();
    }

    // ---------------------------
    // USER HANDLING
    // ---------------------------

    async ensureUser(userId) {
        if (!this.db) throw new Error("Database not initialized.");
        if (!userId || typeof userId !== "string") {
            throw new Error("Invalid user ID");
        }

        let user = this.db.data.users.find(u => u.id === userId);

        // Create new user
        if (!user) {
            user = { ...this.defaultUser, id: userId };
            this.db.data.users.push(user);
            await this.write();
            return user;
        }

        // Ensure all default fields exist
        let updated = false;
        for (const [key, def] of Object.entries(this.defaultUser)) {
            if (user[key] == null) {
                user[key] = def;
                updated = true;
            }
        }

        if (updated) await this.write();
        return user;
    }

    async getUser(userId) {
        await this.ensureUser(userId);
        return this.db.data.users.find(u => u.id === userId);
    }

    // ---------------------------
    // ECONOMY / LEVELING
    // ---------------------------

    async setBalance(userId, amount) {
        const user = await this.ensureUser(userId);
        user.balance = Math.max(0, Number(amount) || 0);
        await this.write();
        return user.balance;
    }

    async addBalance(userId, amount) {
        const user = await this.ensureUser(userId);
        user.balance = Math.max(0, user.balance + Number(amount));
        await this.write();
        return user.balance;
    }

    async setExperience(userId, xp) {
        const user = await this.ensureUser(userId);
        xp = Number(xp);
        if (isNaN(xp)) throw new Error("Invalid experience value");

        user.experience = xp;
        user.level = this.calculateLevel(xp);

        await this.write();
        return user.experience;
    }

    async addExperience(userId, amount) {
        const user = await this.ensureUser(userId);
        const newXP = user.experience + Number(amount);

        user.experience = newXP;
        user.level = this.calculateLevel(newXP);

        await this.write();
        return user.experience;
    }

    calculateLevel(xp) {
        // Simple progression: every 1000 XP = +1 level
        return 1 + Math.floor(xp / 1000);
    }

    // ---------------------------
    // ROLEPLAY ACTION STORAGE
    // ---------------------------

    async addRoleplayAction(userId, actionName, data = {}) {
        const user = await this.ensureUser(userId);

        if (typeof actionName !== "string" || actionName.trim() === "") {
            throw new Error("Invalid roleplay action name");
        }

        // Ensure action bucket exists
        if (!user.roleplayActions[actionName]) {
            user.roleplayActions[actionName] = [];
        }

        // Add action entry
        user.roleplayActions[actionName].push({
            timestamp: Date.now(),
            ...data
        });

        await this.write();
        return user.roleplayActions[actionName];
    }

    async getRoleplayActions(userId, actionName) {
        const user = await this.ensureUser(userId);
        return user.roleplayActions[actionName] || [];
    }

    // ---------------------------
    // ADMIN / RESET FUNCTIONS
    // ---------------------------

    async resetUser(userId) {
        if (!this.db) throw new Error("Database not initialized.");

        const index = this.db.data.users.findIndex(u => u.id === userId);
        if (index === -1) throw new Error("User not found");

        this.db.data.users.splice(index, 1);
        await this.write();

        return true;
    }

    async clearRoleplayActions(userId) {
        const user = await this.ensureUser(userId);
        user.roleplayActions = {};
        await this.write();
        return true;
    }
}

module.exports = new Database();