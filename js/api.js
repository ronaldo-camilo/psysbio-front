// js/api.js
console.log("LOG: api.js carregado e iniciando execução.");

const FAKE_API_LATENCY = 50;

const api = {
    _getStore: function() {
        const data = localStorage.getItem('taskAppData');
        const defaultStore = {
            groups: [], folders: [], tasks: [],
            users: { 'demo': { username: 'demo', name: 'Demo User', password: 'password' } },
            currentUser: null, nextIds: { group: 1, folder: 1, task: 1 }
        };
        if (data) {
            const parsedData = JSON.parse(data);
            if (!parsedData.nextIds) parsedData.nextIds = defaultStore.nextIds;
            if (!parsedData.users) parsedData.users = defaultStore.users;
            if (!parsedData.groups) parsedData.groups = [];
            if (!parsedData.folders) parsedData.folders = [];
            if (!parsedData.tasks) parsedData.tasks = [];
            return parsedData;
        }
        return defaultStore;
    },
    _saveStore: function(data) { localStorage.setItem('taskAppData', JSON.stringify(data)); },
    _getNextId: function(itemType) { /* ... (como antes) ... */
        const store = this._getStore();
        const idPrefix = itemType.charAt(0);
        const nextNumericId = store.nextIds[itemType]++;
        this._saveStore(store);
        return `${idPrefix}${nextNumericId}`;
    },
    login: async function(username, password) { /* ... (como antes, com logs) ... */
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const store = this._getStore();
                const userKey = username.toLowerCase();
                let userEntry = store.users[userKey];
                if (userEntry && userEntry.password === password) {
                     store.currentUser = { username: userEntry.username, name: userEntry.name, isLoggedIn: true };
                } else if (!userEntry && username) {
                    store.users[userKey] = { username: username, name: username.charAt(0).toUpperCase() + username.slice(1), password: password };
                    store.currentUser = { username: username, name: username.charAt(0).toUpperCase() + username.slice(1), isLoggedIn: true };
                } else {
                     reject({ success: false, message: "Usuário ou senha inválidos." }); return;
                }
                this._saveStore(store); resolve({ success: true, user: store.currentUser });
            }, FAKE_API_LATENCY);
        });
    },
    logout: async function() { /* ... (como antes) ... */
        return new Promise((resolve) => {
            setTimeout(() => { /* ... limpa currentUser ... */ this._getStore(); const store = this._getStore(); store.currentUser = null; this._saveStore(store); resolve({ success: true }); }, FAKE_API_LATENCY);
        });
    },
    getCurrentUser: async function() { /* ... (como antes) ... */ 
        return new Promise((resolve) => { setTimeout(() => { resolve(this._getStore().currentUser); }, FAKE_API_LATENCY); });
    },
    getGroups: async function() { /* ... (como antes) ... */
        return new Promise((resolve) => { setTimeout(() => { resolve([...this._getStore().groups]); }, FAKE_API_LATENCY); });
     },
    createGroup: async function(groupName) { /* ... (como antes) ... */
        return new Promise(async (resolve, reject) => {
            const currentUser = await this.getCurrentUser(); if (!currentUser) { reject({ message: "Usuário não logado" }); return; }
            setTimeout(() => { const store = this._getStore(); if (store.groups.find(g => g.name.toLowerCase() === groupName.toLowerCase())) { reject({ message: "Nome do grupo já existe." }); return; }
                const newGroup = { id: this._getNextId('group'), name: groupName, owner: currentUser.username }; store.groups.push(newGroup); this._saveStore(store); resolve({...newGroup});
            }, FAKE_API_LATENCY);
        });
    },
    getFolders: async function(groupName) { /* ... (como antes) ... */
        return new Promise((resolve) => { setTimeout(() => { resolve(this._getStore().folders.filter(f => f.groupName === groupName)); }, FAKE_API_LATENCY); });
    },
    createFolder: async function(folderName, groupName) { /* ... (como antes) ... */
        return new Promise((resolve, reject) => {
            setTimeout(() => { const store = this._getStore(); if (store.folders.find(f => f.name.toLowerCase() === folderName.toLowerCase() && f.groupName === groupName)) { reject({ message: "Nome da pasta já existe neste grupo." }); return; }
                const newFolder = { id: this._getNextId('folder'), name: folderName, groupName: groupName }; store.folders.push(newFolder); this._saveStore(store); resolve({...newFolder});
            }, FAKE_API_LATENCY);
        });
    },
    getTasks: async function(filterParams = {}) { /* ... (como antes) ... */
        return new Promise((resolve) => {
            setTimeout(() => {
                const store = this._getStore(); let tasks = store.tasks;
                if (filterParams.taskType === 'user_personal' && filterParams.userUsername) { tasks = tasks.filter(t => t.taskType === 'user_personal' && t.userUsername === filterParams.userUsername); }
                else if (filterParams.taskType === 'user_folder' && filterParams.userUsername && filterParams.folderName && filterParams.groupName) { tasks = tasks.filter(t => t.taskType === 'user_folder' && t.userUsername === filterParams.userUsername && t.folderName === filterParams.folderName && t.groupName === filterParams.groupName); }
                else if (filterParams.taskType === 'folder_general' && filterParams.folderName && filterParams.groupName) { tasks = tasks.filter(t => t.taskType === 'folder_general' && t.folderName === filterParams.folderName && t.groupName === filterParams.groupName); }
                resolve([...tasks]);
            }, FAKE_API_LATENCY);
        });
    },
    createTask: async function(taskDetails) { /* ... (como antes, com logs) ... */
        return new Promise(async (resolve, reject) => {
             const currentUser = await this.getCurrentUser(); if (taskDetails.taskType !== 'folder_general' && (!currentUser || !currentUser.isLoggedIn)) { reject({ message: "Usuário não logado para este tipo de tarefa" }); return; }
            setTimeout(() => { const store = this._getStore(); const newTask = { id: this._getNextId('task'), title: taskDetails.title, description: taskDetails.description || `Detalhes para ${taskDetails.title}`, status: taskDetails.status || 'todo', taskType: taskDetails.taskType, userUsername: taskDetails.taskType === 'folder_general' ? null : (taskDetails.userUsername || (currentUser ? currentUser.username : null)), folderName: taskDetails.folderName || null, groupName: taskDetails.groupName || null, }; store.tasks.push(newTask); this._saveStore(store); resolve({...newTask}); }, FAKE_API_LATENCY);
        });
    },
    updateTaskStatus: async function(taskId, newStatus) { /* ... (como antes, com logs) ... */
        return new Promise((resolve, reject) => {
            setTimeout(() => { const store = this._getStore(); const task = store.tasks.find(t => t.id === taskId); if (task) { task.status = newStatus; this._saveStore(store); resolve({...task}); } else { reject({message: "Tarefa não encontrada para atualização de status."}); } }, FAKE_API_LATENCY);
        });
    },
    getTaskById: async function(taskId) { /* ... (como antes, com logs) ... */
        return new Promise((resolve, reject) => { setTimeout(() => { const store = this._getStore(); const task = store.tasks.find(t => t.id === taskId); if (task) { resolve({...task}); } else { reject({message: "Tarefa não encontrada."}); } }, FAKE_API_LATENCY); });
    },
    // Função para resetar os dados
    resetAllData: async function() {
        console.log("LOG API: resetAllData chamado.");
        return new Promise((resolve) => {
            setTimeout(() => {
                const defaultStore = {
                    groups: [], folders: [], tasks: [],
                    users: { 'demo': { username: 'demo', name: 'Demo User', password: 'password' } }, // Mantém o usuário demo
                    currentUser: null, // Desloga o usuário atual
                    nextIds: { group: 1, folder: 1, task: 1 }
                };
                this._saveStore(defaultStore); // Salva o estado padrão, limpando os dados
                console.log("LOG API: Todos os dados (exceto usuário demo) foram resetados. Usuário deslogado.");
                resolve({ success: true, message: "Dados resetados com sucesso." });
            }, FAKE_API_LATENCY);
        });
    }
};
console.log("LOG: api.js finalizado. Objeto 'api' deve estar definido.");