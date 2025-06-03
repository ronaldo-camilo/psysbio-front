// js/api.js
const FAKE_API_LATENCY = 50; // ms for simulating network delay

const api = {
    _getStore: function() {
        const data = localStorage.getItem('taskAppData');
        const defaultStore = {
            groups: [],
            folders: [],
            tasks: [],
            users: { 'demo': { username: 'demo', name: 'Demo User', password: 'password' } }, // Simple user store
            currentUser: null,
            nextIds: { group: 1, folder: 1, task: 1 }
        };
        if (data) {
            const parsedData = JSON.parse(data);
            // Ensure nextIds exists
            if (!parsedData.nextIds) parsedData.nextIds = defaultStore.nextIds;
            if (!parsedData.users) parsedData.users = defaultStore.users;
            return parsedData;
        }
        return defaultStore;
    },
    _saveStore: function(data) {
        localStorage.setItem('taskAppData', JSON.stringify(data));
    },
    _getNextId: function(itemType) { // itemType is 'group', 'folder', or 'task'
        const store = this._getStore();
        const idPrefix = itemType.charAt(0);
        const nextNumericId = store.nextIds[itemType]++;
        this._saveStore(store);
        return `${idPrefix}${nextNumericId}`;
    },

    login: async function(username, password) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const store = this._getStore();
                // For demo, any user "logs in" or check against store.users
                const userEntry = store.users[username.toLowerCase()];
                if (userEntry && userEntry.password === password) { // Basic check
                     store.currentUser = { username: userEntry.username, name: userEntry.name, isLoggedIn: true };
                } else if (!userEntry && username) { // Auto-register new user for demo
                    store.users[username.toLowerCase()] = { username: username, name: username.charAt(0).toUpperCase() + username.slice(1), password: password };
                    store.currentUser = { username: username, name: username.charAt(0).toUpperCase() + username.slice(1), isLoggedIn: true };
                } else {
                     reject({ success: false, message: "Usuário ou senha inválidos." });
                     return;
                }
                this._saveStore(store);
                resolve({ success: true, user: store.currentUser });
            }, FAKE_API_LATENCY);
        });
    },
    logout: async function() {
         return new Promise((resolve) => {
            setTimeout(() => {
                const store = this._getStore();
                store.currentUser = null;
                this._saveStore(store);
                resolve({ success: true });
            }, FAKE_API_LATENCY);
        });
    },
    getCurrentUser: async function() {
        return new Promise((resolve) => {
            setTimeout(() => {
                const store = this._getStore();
                resolve(store.currentUser);
            }, FAKE_API_LATENCY);
        });
    },
    // Groups
    getGroups: async function() {
        return new Promise((resolve) => {
            setTimeout(() => {
                const store = this._getStore();
                resolve([...store.groups]);
            }, FAKE_API_LATENCY);
        });
    },
    createGroup: async function(groupName) {
        return new Promise(async (resolve, reject) => {
            const currentUser = await this.getCurrentUser();
            if (!currentUser) {
                reject({ message: "User not logged in" });
                return;
            }
            setTimeout(() => {
                const store = this._getStore();
                if (store.groups.find(g => g.name.toLowerCase() === groupName.toLowerCase())) {
                    reject({ message: "Group name already exists." });
                    return;
                }
                const newGroup = { id: this._getNextId('group'), name: groupName, owner: currentUser.username };
                store.groups.push(newGroup);
                this._saveStore(store);
                resolve({...newGroup});
            }, FAKE_API_LATENCY);
        });
    },
    // Folders
    getFolders: async function(groupName) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const store = this._getStore();
                resolve(store.folders.filter(f => f.groupName === groupName));
            }, FAKE_API_LATENCY);
        });
    },
    createFolder: async function(folderName, groupName) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const store = this._getStore();
                if (store.folders.find(f => f.name.toLowerCase() === folderName.toLowerCase() && f.groupName === groupName)) {
                     reject({ message: "Folder name already exists in this group." });
                    return;
                }
                const newFolder = { id: this._getNextId('folder'), name: folderName, groupName: groupName };
                store.folders.push(newFolder);
                this._saveStore(store);
                resolve({...newFolder});
            }, FAKE_API_LATENCY);
        });
    },
    // Tasks
    getTasks: async function(filterParams = {}) {
        // filterParams: { userUsername, folderName, groupName, taskType ('user_personal', 'user_folder', 'folder_general') }
        return new Promise((resolve) => {
            setTimeout(() => {
                const store = this._getStore();
                let tasks = store.tasks;
                if (filterParams.taskType === 'user_personal' && filterParams.userUsername) {
                    tasks = tasks.filter(t => t.taskType === 'user_personal' && t.userUsername === filterParams.userUsername);
                } else if (filterParams.taskType === 'user_folder' && filterParams.userUsername && filterParams.folderName && filterParams.groupName) {
                    tasks = tasks.filter(t => t.taskType === 'user_folder' && t.userUsername === filterParams.userUsername && t.folderName === filterParams.folderName && t.groupName === filterParams.groupName);
                } else if (filterParams.taskType === 'folder_general' && filterParams.folderName && filterParams.groupName) {
                    tasks = tasks.filter(t => t.taskType === 'folder_general' && t.folderName === filterParams.folderName && t.groupName === filterParams.groupName);
                }
                resolve([...tasks]);
            }, FAKE_API_LATENCY);
        });
    },
    createTask: async function(taskDetails) {
        // taskDetails: { title, description?, status?, taskType, userUsername?, folderName?, groupName? }
        return new Promise(async (resolve, reject) => {
             const currentUser = await this.getCurrentUser();
             if (taskDetails.taskType !== 'folder_general' && !currentUser) {
                 reject({ message: "User not logged in for personal/user_folder task" });
                 return;
             }
            setTimeout(() => {
                const store = this._getStore();
                const newTask = {
                    id: this._getNextId('task'),
                    title: taskDetails.title,
                    description: taskDetails.description || `Detalhes para ${taskDetails.title}`,
                    status: taskDetails.status || 'todo',
                    taskType: taskDetails.taskType,
                    userUsername: taskDetails.taskType === 'folder_general' ? null : (taskDetails.userUsername || currentUser.username),
                    folderName: taskDetails.folderName || null,
                    groupName: taskDetails.groupName || null,
                };
                store.tasks.push(newTask);
                this._saveStore(store);
                resolve({...newTask});
            }, FAKE_API_LATENCY);
        });
    },
    updateTaskStatus: async function(taskId, newStatus) {
         return new Promise((resolve, reject) => {
            setTimeout(() => {
                const store = this._getStore();
                const task = store.tasks.find(t => t.id === taskId);
                if (task) {
                    task.status = newStatus;
                    this._saveStore(store);
                    resolve({...task});
                } else {
                    reject({message: "Task not found"});
                }
            }, FAKE_API_LATENCY);
        });
    },
    getTaskById: async function(taskId) { // Added for modal if needed
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const store = this._getStore();
                const task = store.tasks.find(t => t.id === taskId);
                if (task) {
                    resolve({...task});
                } else {
                    reject({message: "Task not found"});
                }
            }, FAKE_API_LATENCY);
        });
    }
};