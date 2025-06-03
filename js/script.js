// js/main.js
document.addEventListener('DOMContentLoaded', () => {
    // --- Task Detail Modal Elements & Functions (se o modal existir na página) ---
    const detailModal = document.getElementById('taskDetailModal');
    const detailModalCloseButton = detailModal ? detailModal.querySelector('.modal-close-button') : null;
    const detailModalCloseActionButton = detailModal ? detailModal.querySelector('#modalClose') : null;
    const detailModalEditButton = detailModal ? detailModal.querySelector('#modalEditTask') : null;
    const detailModalTaskDescription = detailModal ? detailModal.querySelector('#modalTaskDescription') : null;
    const detailModalTaskId = detailModal ? detailModal.querySelector('#modalTaskId') : null;
    const detailModalTaskStatus = detailModal ? detailModal.querySelector('#modalTaskStatus') : null;

    async function openDetailModal(taskElement) {
        if (!detailModal || !taskElement) { // Verifica se o modal de detalhes existe
            // console.log("Modal de detalhes não encontrado nesta página ou elemento de tarefa inválido.");
            return;
        }
        const taskIdValue = taskElement.id;
        try {
            const taskData = await api.getTaskById(taskIdValue);
            
            if (detailModalTaskDescription) {
                detailModalTaskDescription.textContent = taskData.description || `Não há descrição detalhada para '${taskData.title}'.`;
            }
            if (detailModalTaskId) detailModalTaskId.textContent = taskData.id;
            
            const columnElement = taskElement.closest('.kanban-column');
            if (detailModalTaskStatus) detailModalTaskStatus.textContent = columnElement ? columnElement.querySelector('h3').textContent.split(' ')[0] : taskData.status;
            
            detailModal.classList.add('active');
        } catch (error) {
            console.error("Erro ao buscar detalhes da tarefa para o modal:", error);
            // Fallback em caso de erro na API
            if (detailModalTaskDescription) detailModalTaskDescription.textContent = taskElement.dataset.description || `Descrição não disponível.`;
            if (detailModalTaskId) detailModalTaskId.textContent = taskIdValue;
            const columnElement = taskElement.closest('.kanban-column');
            if (detailModalTaskStatus) detailModalTaskStatus.textContent = columnElement ? columnElement.querySelector('h3').textContent.split(' ')[0] : 'Desconhecido';
            detailModal.classList.add('active');
        }
    }

    function closeDetailModal() {
        if (!detailModal) return;
        detailModal.classList.remove('active');
    }

    if (detailModal) { // Adiciona listeners apenas se o modal de detalhes existir na página
        if (detailModalCloseButton) detailModalCloseButton.addEventListener('click', closeDetailModal);
        if (detailModalCloseActionButton) detailModalCloseActionButton.addEventListener('click', closeDetailModal);
        if (detailModalEditButton) {
            detailModalEditButton.addEventListener('click', () => {
                if (detailModalTaskId) alert(`Funcionalidade "Editar Tarefa": ${detailModalTaskId.textContent} (Protótipo)`);
            });
        }
        detailModal.addEventListener('click', (event) => {
            if (event.target === detailModal) closeDetailModal();
        });
    }

    // --- Create Task Modal Elements & Functions ---
    const createTaskModalElement = document.getElementById('createTaskModal');
    const closeCreateTaskModalButton = document.getElementById('closeCreateTaskModal');
    const cancelCreateTaskModalButton = document.getElementById('cancelCreateTaskModal');
    const createTaskForm = document.getElementById('createTaskForm');
    const createTaskErrorElement = document.getElementById('createTaskError');
    const newTaskTitleInput = document.getElementById('newTaskTitle');
    const newTaskDescriptionInput = document.getElementById('newTaskDescription');

    const createTaskContext_taskType = document.getElementById('createTaskContext_taskType');
    const createTaskContext_groupName = document.getElementById('createTaskContext_groupName');
    const createTaskContext_folderName = document.getElementById('createTaskContext_folderName');
    const createTaskContext_status = document.getElementById('createTaskContext_status');
    const createTaskContext_targetListSelector = document.getElementById('createTaskContext_targetListSelector');

    function openCreateTaskModal(context) {
        if (!createTaskModalElement || !createTaskContext_status || !createTaskContext_taskType || 
            !newTaskTitleInput || !newTaskDescriptionInput || !createTaskContext_targetListSelector) {
            console.error("Elementos essenciais do modal de criação de tarefa não foram encontrados no DOM.");
            return;
        }
        
        createTaskContext_status.value = context.status || 'todo';
        createTaskContext_taskType.value = context.taskType || 'user_personal';
        createTaskContext_groupName.value = context.groupName || '';
        createTaskContext_folderName.value = context.folderName || '';
        createTaskContext_targetListSelector.value = context.targetListSelector || '';

        newTaskTitleInput.value = '';
        newTaskDescriptionInput.value = '';
        if(createTaskErrorElement) createTaskErrorElement.style.display = 'none';
        
        createTaskModalElement.classList.add('active');
        newTaskTitleInput.focus();
    }

    function closeCreateTaskModal() {
        if (!createTaskModalElement) return;
        createTaskModalElement.classList.remove('active');
        if(createTaskErrorElement) createTaskErrorElement.style.display = 'none';
    }

    if (createTaskModalElement) {
        if (closeCreateTaskModalButton) closeCreateTaskModalButton.addEventListener('click', closeCreateTaskModal);
        if (cancelCreateTaskModalButton) cancelCreateTaskModalButton.addEventListener('click', closeCreateTaskModal);
        
        createTaskModalElement.addEventListener('click', (event) => {
            if (event.target === createTaskModalElement) closeCreateTaskModal();
        });

        if (createTaskForm) {
            createTaskForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                if(createTaskErrorElement) createTaskErrorElement.style.display = 'none';

                const title = newTaskTitleInput.value.trim();
                const description = newTaskDescriptionInput.value.trim();

                if (!title) {
                    if(createTaskErrorElement) {
                        createTaskErrorElement.textContent = "O título é obrigatório.";
                        createTaskErrorElement.style.display = 'block';
                    }
                    return;
                }

                const taskDetails = {
                    title: title,
                    description: description,
                    status: createTaskContext_status.value,
                    taskType: createTaskContext_taskType.value,
                    userUsername: null, 
                    groupName: createTaskContext_groupName.value || null,
                    folderName: createTaskContext_folderName.value || null,
                };
                
                try {
                    const createdTask = await api.createTask(taskDetails); // api.createTask definirá userUsername se necessário
                    const targetListElement = document.querySelector(createTaskContext_targetListSelector.value);

                    if (targetListElement) {
                        const newTaskElement = document.createElement('li');
                        newTaskElement.classList.add('task-item');
                        newTaskElement.id = createdTask.id;
                        newTaskElement.textContent = createdTask.title;
                        newTaskElement.setAttribute('draggable', 'false');
                        newTaskElement.dataset.title = createdTask.title;
                        newTaskElement.dataset.description = createdTask.description;

                        targetListElement.appendChild(newTaskElement);
                        window.initializeKanbanEventListeners(targetListElement.closest('.kanban-column'));
                    } else {
                        console.warn("Seletor da lista alvo não encontrado ou inválido:", createTaskContext_targetListSelector.value);
                        alert("Tarefa criada, mas não pode ser adicionada à interface. Atualize a página.");
                    }
                    closeCreateTaskModal();
                } catch (error) {
                    console.error('Error creating task:', error);
                    if(createTaskErrorElement) {
                        createTaskErrorElement.textContent = `Falha ao criar tarefa: ${error.message || 'Erro desconhecido'}`;
                        createTaskErrorElement.style.display = 'block';
                    }
                }
            });
        }
    }

    // --- Lógica do Kanban: Arrastar e Soltar + Clique para Detalhes ---
    window.initializeKanbanEventListeners = function(containerScope = document) {
        const taskItems = containerScope.querySelectorAll('.task-item');
        const taskLists = containerScope.querySelectorAll('.task-list');
        // ... (resto da lógica do Kanban, mousedown, dragstart, drop, etc. como na versão anterior)
        // A lógica abaixo é uma repetição da anterior, certifique-se que ela é a versão mais completa e correta.
        let longPressTimer = null;
        let isLongPressActive = false;
        let currentDragItem = null;
        let mouseDownItem = null;
        let initialX, initialY;
        const LONG_PRESS_TIMEOUT = 350;
        const MAX_CLICK_MOVEMENT = 10;

        taskItems.forEach(item => {
            item.setAttribute('draggable', 'false');
            if (item.dataset.listenersAttached === 'true' && containerScope !== document) { /* Evita re-binds desnecessários */ }
            item.dataset.listenersAttached = 'true';

            item.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return;
                mouseDownItem = item;
                isLongPressActive = false;
                initialX = e.clientX;
                initialY = e.clientY;
                clearTimeout(longPressTimer);
                longPressTimer = setTimeout(() => {
                    if (mouseDownItem) {
                        isLongPressActive = true;
                        mouseDownItem.setAttribute('draggable', 'true');
                    }
                }, LONG_PRESS_TIMEOUT);
                document.addEventListener('mousemove', handleDragMouseMove);
                document.addEventListener('mouseup', handleDragMouseUp);
            });

            item.addEventListener('dragstart', (event) => {
                if (item.getAttribute('draggable') !== 'true') {
                    event.preventDefault(); return;
                }
                currentDragItem = item;
                event.dataTransfer.setData('text/plain', currentDragItem.id);
                event.dataTransfer.effectAllowed = 'move';
                setTimeout(() => { if(currentDragItem) currentDragItem.classList.add('dragging') }, 0);
            });

            item.addEventListener('dragend', () => {
                if (currentDragItem) {
                    currentDragItem.classList.remove('dragging');
                    currentDragItem.setAttribute('draggable', 'false');
                }
                isLongPressActive = false;
                currentDragItem = null;
                document.removeEventListener('mousemove', handleDragMouseMove);
                document.removeEventListener('mouseup', handleDragMouseUp);
            });
        });
        
        function handleDragMouseMove(e) {
            if (mouseDownItem && !isLongPressActive) {
                const deltaX = Math.abs(e.clientX - initialX);
                const deltaY = Math.abs(e.clientY - initialY);
                if (deltaX > MAX_CLICK_MOVEMENT || deltaY > MAX_CLICK_MOVEMENT) {
                    clearTimeout(longPressTimer);
                }
            }
        }

        function handleDragMouseUp(e) {
            if (e.button !== 0) return;
            clearTimeout(longPressTimer);
            if (mouseDownItem && !isLongPressActive) {
                const deltaX = Math.abs(e.clientX - initialX);
                const deltaY = Math.abs(e.clientY - initialY);
                if (deltaX < MAX_CLICK_MOVEMENT && deltaY < MAX_CLICK_MOVEMENT) {
                    if (detailModal) { // Apenas tenta abrir o modal de detalhes se ele existir na página
                        openDetailModal(mouseDownItem);
                    }
                }
            }
            if(mouseDownItem) mouseDownItem.setAttribute('draggable', 'false');
            mouseDownItem = null;
            isLongPressActive = false; 
            document.removeEventListener('mousemove', handleDragMouseMove);
            document.removeEventListener('mouseup', handleDragMouseUp);
        }

        taskLists.forEach(list => {
            if (list.dataset.dropListenersAttached === 'true' && containerScope !== document) { /* Evita re-binds */ }
            list.dataset.dropListenersAttached = 'true';

            list.addEventListener('dragover', (event) => {
                event.preventDefault();
                const targetColumn = list.closest('.kanban-column');
                if (currentDragItem && targetColumn && !targetColumn.contains(currentDragItem)) {
                     targetColumn.classList.add('drag-over');
                     event.dataTransfer.dropEffect = 'move';
                } else if (!currentDragItem && event.dataTransfer.types.includes('text/plain')) {
                    targetColumn.classList.add('drag-over');
                    event.dataTransfer.dropEffect = 'move';
                } else {
                    event.dataTransfer.dropEffect = 'none';
                }
            });
            list.addEventListener('dragleave', (event) => {
                const targetColumn = list.closest('.kanban-column');
                if (targetColumn && !targetColumn.contains(event.relatedTarget)) {
                    targetColumn.classList.remove('drag-over');
                }
            });
            list.addEventListener('drop', async (event) => {
                event.preventDefault();
                const taskId = event.dataTransfer.getData('text/plain');
                const droppedItem = document.getElementById(taskId);
                const targetColumn = list.closest('.kanban-column');

                if (droppedItem && targetColumn) {
                    let actualListTarget = list;
                    if (event.target.classList.contains('task-item')) {
                        actualListTarget = event.target.closest('.task-list');
                    } else if (!event.target.classList.contains('task-list')) {
                         actualListTarget = targetColumn.querySelector('.task-list');
                    }
                    
                    if (actualListTarget) {
                        const oldColumn = droppedItem.closest('.kanban-column');
                        actualListTarget.appendChild(droppedItem);

                        const newStatusSlug = targetColumn.dataset.statusSlug;
                        if (newStatusSlug) {
                            try {
                                const updatedTask = await api.updateTaskStatus(taskId, newStatusSlug);
                                console.log(`Task ${taskId} status updated to ${newStatusSlug}.`);
                                droppedItem.dataset.title = updatedTask.title;
                                droppedItem.dataset.description = updatedTask.description;
                            } catch (error) {
                                console.error("Failed to update task status on server:", error);
                                if (oldColumn && oldColumn.querySelector('.task-list')) {
                                     oldColumn.querySelector('.task-list').appendChild(droppedItem);
                                }
                                alert("Erro ao atualizar status da tarefa. Tente novamente.");
                            }
                        }
                    }
                }
                if (targetColumn) targetColumn.classList.remove('drag-over');
            });
        });
    }; // Fim de window.initializeKanbanEventListeners
    
    // --- Event Listeners para os botões "+ Criar nova tarefa" ---
    document.querySelectorAll('.add-task-button').forEach(button => {
        button.addEventListener('click', () => {
            const column = button.closest('.kanban-column');
            if (!column) {
                console.error("Botão Adicionar Tarefa não está em uma coluna Kanban:", button);
                return;
            }
            const status = column.dataset.statusSlug || 'todo';
            const taskList = column.querySelector('.task-list'); // Este é o <ul>
            
            let targetListSelector;
            if (taskList && taskList.id) {
                targetListSelector = `#${taskList.id}`;
            } else if (taskList) { // Fallback se taskList não tiver ID
                // Tenta construir um seletor mais específico para evitar ambiguidades
                // Esta lógica pode precisar de ajuste fino dependendo da estrutura exata e unicidade dos IDs
                const columnId = column.id ? `#${column.id}` : (column.dataset.statusSlug ? `[data-status-slug="${column.dataset.statusSlug}"]` : '');
                const section = column.closest('.kanban-section');
                const sectionId = section && section.id ? `#${section.id}` : '';
                targetListSelector = `${sectionId} .kanban-column${columnId} .task-list`;

                const matchedElements = document.querySelectorAll(targetListSelector);
                if (matchedElements.length === 0) {
                     console.error("Seletor da lista alvo não encontrou elementos:", targetListSelector, "Verifique os IDs e classes.");
                     alert("Erro: Não foi possível determinar onde adicionar a nova tarefa.");
                     return; // Não abre o modal se não sabe onde colocar a tarefa
                } else if (matchedElements.length > 1) {
                     console.warn("Alerta: Seletor da lista alvo não é único, usando o primeiro:", targetListSelector);
                     // Para evitar ambiguidade, seria melhor se a taskList tivesse um ID único.
                     // Usando o primeiro elemento encontrado se o seletor não for específico o suficiente.
                     if (matchedElements[0].id) {
                         targetListSelector = `#${matchedElements[0].id}`;
                     } else {
                         // Último recurso: se o primeiro elemento não tiver ID, o seletor original pode ser ambíguo.
                         // Isso pode levar a tarefa a ser adicionada ao lugar errado se houver múltiplas listas correspondentes.
                         console.error("A lista alvo não tem ID e o seletor construído é ambíguo. Adicione IDs únicos às suas .task-list.");
                     }
                }
            } else {
                console.error("Não foi possível encontrar a .task-list para a coluna:", column);
                alert("Erro ao configurar o local para adicionar a nova tarefa (task-list não encontrada).");
                return;
            }

            const context = {
                status: status,
                taskType: button.dataset.taskType || 'user_personal',
                groupName: button.dataset.groupName || null,
                folderName: button.dataset.folderName || null,
                targetListSelector: targetListSelector
            };
            openCreateTaskModal(context);
        });
    });

    // A inicialização do Kanban é feita pelas páginas específicas (mytasks.html, folder_tasks.html)
    // após carregarem suas tarefas, chamando window.initializeKanbanEventListeners().
});