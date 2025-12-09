const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const { type } = require('os');

class Database {
    constructor() {
        this.db = null;

        this.userdefaults = {
            id: null,
            balance: 0,
            experience: 0,
            level: 1,
            roleplayActions: {},
            name: '',
        };
    }

    async initialize() {
        const defaultData = {
            users: [],
            settings: {},
        };

        const adapter = new JSONFile('db.json');
        this.db = new Low(adapter, defaultData);
        await this.db.read();
        if (this.db.data === null) {
            this.db.data = defaultData;
            await this.db.write();
        }
    }

    async getData() {
        if (!this.db) throw new Error('Database not initialized.');
        return this.db.data;
    }

    async write() {
        if (!this.db) throw new Error('Database not initialized.');
        await this.db.write();
    }

    async getUserData(userId) {
        if (!this.db) throw new Error('Database not initialized.');
        if (typeof userId !== 'string' || userId.trim() === '') throw new Error('Invalid user ID');
        
        return this.db.data.users.find(u => u.id === userId) || null;
    }

    async saveUserData(userId, userData) {
        if (!this.db) throw new Error('Database not initialized.');
        if (typeof userId !== 'string' || userId.trim() === '') throw new Error('Invalid user ID');

        let userIndex = this.db.data.users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            const newUser = {
                ...this.userdefaults,
                id: userId,
                ...userData
            };
            this.db.data.users.push(newUser);
        } else {
            const cleanedData = Object.fromEntries(
                Object.entries(userData).filter(([_, v]) => v !== undefined)
            )

            this.db.data.users[userIndex] = {
                ...this.db.data.users[userIndex],
                ...cleanedData
            };

            for (const [key, value] of Object.entries(this.userdefaults)) {
                if (this.db.data.users[userIndex][key] == null) {
                    this.db.data.users[userIndex][key] = value;
                }
            }
        }

        await this.write();
        return this.db.data.users.find(u => u.id === userId);
    }

    async updateUserBalance(userId, newBalance) {
        if (!this.db) throw new Error('Database not initialized.');
        if (typeof userId !== 'string' || userId.trim() === '') throw new Error('Invalid user ID');

        this.db.data ||= {};
        this.db.data.users ||= [];

        let user = this.db.data.users.find(u => u.id === userId);

        if (!user) {
            user = { ...this.userdefaults, id: userId };
            this.db.data.users.push(user);

            await this.write();
        } else {
            let updated = false;
            for (const [key, value] of Object.entries(this.userdefaults)) {
                if (user[key] == null) {
                    user[key] = value;
                    updated = true;
                }
            }
            if (updated) await this.write();
        }

        return user;
    }
    
    async ensureUser(userId) {
        if (!this.db) throw new Error('Database not initialized.');
        if (typeof userId !== 'string' || userId.trim() === '') throw new Error('Invalid user ID');

        this.db.data ||= {};
        this.db.data.users ||= [];

        let user = this.db.data.users.find(u => u.id === userId);

        if (!user) {
            user = { ...this.userdefaults, id: userId };
            this.db.data.users.push(user);
            await this.write();
        } else {
            let updated = false;
            for (const [key, value] of Object.entries(this.userdefaults)) {
                if (user[key] == null) {
                    user[key] = value;
                    updated = true;
                }
            }
            if (updated) await this.write();
        }
        return user;
    }

    async checkUserExists(userId) {
        if (!this.db) throw new Error('Database not initialized.');
        return this.db.data.users.some(u => u.id === userId);
    }

    async getUserExperience(userId) {
        const user = await this.ensureUser(userId);
        return user.experience || 0;
    }

    async getUserLevel(userId) {
        const user = await this.ensureUser(userId);
        return user.level || 1;
    }

    async updateUserExperience(userId, newExperience) {
        if (!this.db) throw new Error('Database not initialized.');
        if (typeof userId !== 'string' || userId.trim() === '') throw new Error('Invalid user ID');
        if (typeof newExperience !== 'number' || isNaN(newExperience)) throw new Error('Invalid experience value');

        const user = await this.ensureUser(userId);
        user.experience = newExperience;
        await this.write();
        return user;
    }

    async incrementUserBalance(userId, amount) {
        if (!this.db) throw new Error('Database not initialized.');
        if (typeof userId !== 'string' || userId.trim() === '') throw new Error('Invalid user ID');
        if (typeof amount !== 'number' || isNaN(amount)) throw new Error('Invalid amount value');

        const user = await this.ensureUser(userId);
        user.balance = Math.max(0, user.balance + amount);
        await this.write();
        return user;
    }

    async resetUserData(userId) {
        if (!this.db) throw new Error('Database not initialized.');
        if (typeof userId !== 'string' || userId.trim() === '') throw new Error('Invalid user ID');

        const userIndex = this.db.data.users.findIndex(u => u.id === userId);
        if (userIndex !== -1) throw new Error('User not found');
    }

    
}