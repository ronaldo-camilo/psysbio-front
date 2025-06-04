// js/main.js
document.addEventListener('DOMContentLoaded', () => {
    console.log("LOG: main.js DOMContentLoaded - v5.3 (Implementação de Modais).");

    // --- Botão de Reset ---
    const resetDataButton = document.getElementById('resetDataButton');
    if (resetDataButton) {
        resetDataButton.addEventListener('click', async () => {
            console.log("LOG: Botão Resetar Dados clicado.");
            if (confirm("TEM CERTEZA que deseja apagar TODOS os grupos, pastas e tarefas? Esta ação não pode ser desfeita.")) {
                if (confirm("CONFIRMAÇÃO FINAL: Apagar todos os dados?")) {
                    try {
                        if (typeof api !== 'undefined' && typeof api.resetAllData === 'function') {
                            await api.resetAllData();
                            alert("Dados resetados! A página será redirecionada para o login.");
                            window.location.href = 'login.html';
                        } else {
                            console.error("ERRO: api.resetAllData não está disponível.");
                            alert("Erro ao tentar resetar os dados: função da API não encontrada.");
                        }
                    } catch (error) {
                        console.error("ERRO ao resetar dados via API:", error);
                        alert("Ocorreu um erro ao resetar os dados.");
                    }
                } else {
                    console.log("LOG: Reset cancelado na segunda confirmação.");
                }
            } else {
                console.log("LOG: Reset cancelado na primeira confirmação.");
            }
        });
    }

    // --- Seletores e Funções dos Modais ---

    // Modal de Detalhes da Tarefa
    const detailModalElement = document.getElementById('taskDetailModal');
    const modalTaskDescription = document.getElementById('modalTaskDescription');
    const modalTaskId = document.getElementById('modalTaskId');
    const modalTaskStatus = document.getElementById('modalTaskStatus');
    const modalEditTaskButton = document.getElementById('modalEditTask');
    const modalCloseDetailButton = detailModalElement ? detailModalElement.querySelector('.modal-close-button') : null;
    const modalCloseDetailActionButton = document.getElementById('modalClose');

    // Modal de Criação de Tarefa
    const createTaskModalElement = document.getElementById('createTaskModal');
    const createTaskForm = document.getElementById('createTaskForm');
    const newTaskTitleInput = document.getElementById('newTaskTitle');
    const newTaskDescriptionInput = document.getElementById('newTaskDescription');
    const createTaskErrorElement = document.getElementById('createTaskError');
    const closeCreateTaskModalButton = document.getElementById('closeCreateTaskModal');
    const cancelCreateTaskModalButton = document.getElementById('cancelCreateTaskModal');
    // Campos de contexto do formulário de criação
    const createTaskContext_taskType = document.getElementById('createTaskContext_taskType');
    const createTaskContext_groupName = document.getElementById('createTaskContext_groupName');
    const createTaskContext_folderName = document.getElementById('createTaskContext_folderName');
    const createTaskContext_status = document.getElementById('createTaskContext_status');
    const createTaskContext_targetListSelector = document.getElementById('createTaskContext_targetListSelector');


    function openDetailModal(taskElement) {
        if (detailModalElement && taskElement && modalTaskDescription && modalTaskId && modalTaskStatus) {
            modalTaskDescription.textContent = taskElement.dataset.description || 'Sem descrição.';
            modalTaskId.textContent = taskElement.id;
            modalTaskStatus.textContent = taskElement.dataset.status || 
                                          (taskElement.closest('.kanban-column') ? taskElement.closest('.kanban-column').dataset.statusSlug : 'Desconhecido');
            
            // Armazenar ID da tarefa no botão de edição para referência futura
            if (modalEditTaskButton) {
                modalEditTaskButton.dataset.taskId = taskElement.id;
            }
            detailModalElement.classList.add('active');
        } else {
            console.error("Erro ao abrir modal de detalhes: Elementos do modal ou da tarefa não encontrados.", {detailModalElement, taskElement, modalTaskDescription, modalTaskId, modalTaskStatus});
        }
    }

    function closeDetailModal() {
        if (detailModalElement) {
            detailModalElement.classList.remove('active');
        }
    }

    if (modalCloseDetailButton) {
        modalCloseDetailButton.addEventListener('click', closeDetailModal);
    }
    if (modalCloseDetailActionButton) {
        modalCloseDetailActionButton.addEventListener('click', closeDetailModal);
    }
    if (modalEditTaskButton) {
        modalEditTaskButton.addEventListener('click', () => {
            const taskId = modalEditTaskButton.dataset.taskId;
            alert(`Funcionalidade de editar tarefa (ID: ${taskId}) ainda não implementada.`);
            // Aqui você pode adicionar a lógica para abrir um modal de edição ou transformar os campos em editáveis.
            // Por ora, apenas fecha o modal.
            closeDetailModal();
        });
    }

    function openCreateTaskModal(context) {
        if (createTaskModalElement && context && createTaskForm && createTaskContext_taskType && createTaskContext_targetListSelector) {
            createTaskForm.reset(); // Limpa campos do formulário
            if(createTaskErrorElement) createTaskErrorElement.style.display = 'none';

            // Preenche os campos de contexto ocultos
            createTaskContext_taskType.value = context.taskType;
            createTaskContext_groupName.value = context.groupName || '';
            createTaskContext_folderName.value = context.folderName || '';
            createTaskContext_status.value = context.status;
            createTaskContext_targetListSelector.value = context.targetListSelector;
            
            createTaskModalElement.classList.add('active');
            if(newTaskTitleInput) newTaskTitleInput.focus(); // Foca no campo de título
        } else {
            console.error("Erro ao abrir modal de criação: Elementos do modal ou contexto ausentes.", {createTaskModalElement, context});
        }
    }

    function closeCreateTaskModal() {
        if (createTaskModalElement) {
            createTaskModalElement.classList.remove('active');
            if(createTaskForm) createTaskForm.reset();
            if(createTaskErrorElement) createTaskErrorElement.style.display = 'none';
        }
    }

    if (closeCreateTaskModalButton) {
        closeCreateTaskModalButton.addEventListener('click', closeCreateTaskModal);
    }
    if (cancelCreateTaskModalButton) {
        cancelCreateTaskModalButton.addEventListener('click', closeCreateTaskModal);
    }

    if (createTaskForm) {
        createTaskForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!newTaskTitleInput || !newTaskDescriptionInput || !createTaskErrorElement ||
                !createTaskContext_taskType || !createTaskContext_groupName || !createTaskContext_folderName ||
                !createTaskContext_status || !createTaskContext_targetListSelector) {
                console.error("Formulário de criação de tarefa com elementos faltando.");
                if(createTaskErrorElement) {
                    createTaskErrorElement.textContent = "Erro interno no formulário.";
                    createTaskErrorElement.style.display = 'block';
                }
                return;
            }

            const title = newTaskTitleInput.value.trim();
            const description = newTaskDescriptionInput.value.trim();
            
            if (!title) {
                createTaskErrorElement.textContent = "O título da tarefa não pode ser vazio.";
                createTaskErrorElement.style.display = 'block';
                newTaskTitleInput.focus();
                return;
            }
            createTaskErrorElement.style.display = 'none';

            const taskDetails = {
                title,
                description,
                taskType: createTaskContext_taskType.value,
                groupName: createTaskContext_groupName.value || null,
                folderName: createTaskContext_folderName.value || null,
                status: createTaskContext_status.value
            };

            try {
                const createdTask = await api.createTask(taskDetails);
                const targetListElement = document.querySelector(createTaskContext_targetListSelector.value);

                if (targetListElement) {
                    const newTaskElement = document.createElement('li');
                    newTaskElement.classList.add('task-item');
                    newTaskElement.id = createdTask.id;
                    newTaskElement.textContent = createdTask.title;
                    newTaskElement.dataset.title = createdTask.title;
                    newTaskElement.dataset.description = createdTask.description || '';
                    newTaskElement.dataset.status = createdTask.status;

                    targetListElement.appendChild(newTaskElement);
                    setupTaskItemForDraggingListeners(newTaskElement); // Adiciona listeners de DND e clique
                } else {
                    console.error("Lista alvo não encontrada para adicionar nova tarefa:", createTaskContext_targetListSelector.value);
                }
                closeCreateTaskModal();
            } catch (error) {
                console.error("Falha ao criar tarefa via API:", error);
                createTaskErrorElement.textContent = error.message || "Erro desconhecido ao criar tarefa.";
                createTaskErrorElement.style.display = 'block';
            }
        });
    }

    // --- Lógica Refatorada do Kanban: Arrastar e Soltar ---
    let DND_CurrentDraggingItem = null;
    let DND_MouseDownTargetItem = null;
    let DND_InitialX = 0, DND_InitialY = 0;
    let DND_HasDraggedSignificantly = false;
    const DND_MAX_CLICK_MOVEMENT = 10; 

    function DND_GlobalMouseMoveHandler(event) {
        if (!DND_MouseDownTargetItem) return;
        if (!DND_HasDraggedSignificantly) {
            const deltaX = Math.abs(event.clientX - DND_InitialX);
            const deltaY = Math.abs(event.clientY - DND_InitialY);
            if (deltaX > DND_MAX_CLICK_MOVEMENT || deltaY > DND_MAX_CLICK_MOVEMENT) {
                DND_HasDraggedSignificantly = true;
            }
        }
    }

    function DND_GlobalMouseUpHandler(event) {
        if (event.button !== 0) return; 
        const itemAtMouseDown = DND_MouseDownTargetItem;

        if (itemAtMouseDown && !DND_HasDraggedSignificantly) {
            // É um clique, não um drag
            if (detailModalElement && typeof openDetailModal === 'function') {
                openDetailModal(itemAtMouseDown); 
            }
        }

        if (itemAtMouseDown) {
            itemAtMouseDown.setAttribute('draggable', 'false'); 
        }
        
        DND_MouseDownTargetItem = null;
        DND_HasDraggedSignificantly = false;
        document.removeEventListener('mousemove', DND_GlobalMouseMoveHandler);
        document.removeEventListener('mouseup', DND_GlobalMouseUpHandler);
    }


    function setupTaskItemForDraggingListeners(item) {
        item.setAttribute('draggable', 'false'); 

        item.removeEventListener('mousedown', handleItemMouseDown); 
        item.addEventListener('mousedown', handleItemMouseDown);

        item.removeEventListener('dragstart', handleItemDragStart); 
        item.addEventListener('dragstart', handleItemDragStart);

        item.removeEventListener('dragend', handleItemDragEnd); 
        item.addEventListener('dragend', handleItemDragEnd);
        
        // O clique para abrir o modal de detalhes já é tratado por DND_GlobalMouseUpHandler
        // se não for um drag. Não é necessário um listener de 'click' adicional aqui para isso.
    }
    
    function handleItemMouseDown(event) {
        if (event.button !== 0) return; 
        const item = event.currentTarget;

        if (DND_MouseDownTargetItem && DND_MouseDownTargetItem !== item) {
            DND_MouseDownTargetItem.setAttribute('draggable', 'false');
        }
        DND_MouseDownTargetItem = item;
        DND_HasDraggedSignificantly = false;
        DND_InitialX = event.clientX;
        DND_InitialY = event.clientY;

        item.setAttribute('draggable', 'true'); 

        document.addEventListener('mousemove', DND_GlobalMouseMoveHandler);
        document.addEventListener('mouseup', DND_GlobalMouseUpHandler);
    }

    function handleItemDragStart(event) {
        const item = event.currentTarget;
        DND_CurrentDraggingItem = item; 
        DND_HasDraggedSignificantly = true; 

        event.dataTransfer.setData('text/plain', item.id);
        event.dataTransfer.effectAllowed = 'move';

        setTimeout(() => {
            if (DND_CurrentDraggingItem === item) { 
                item.classList.add('dragging');
            }
        }, 0);
    }

    function handleItemDragEnd(event) {
        const item = event.currentTarget;
        item.classList.remove('dragging');
        item.setAttribute('draggable', 'false'); 
        if (DND_CurrentDraggingItem === item) {
            DND_CurrentDraggingItem = null;
        }
    }

    function handleTaskListDragOver(event) {
        event.preventDefault(); 
        const list = event.currentTarget; 
        const targetColumn = list.closest('.kanban-column');
        if (!targetColumn) return;

        if (DND_CurrentDraggingItem && !targetColumn.contains(DND_CurrentDraggingItem)) {
            targetColumn.classList.add('drag-over');
        }
        event.dataTransfer.dropEffect = 'move';
    }

    function handleTaskListDragLeave(event) {
        const list = event.currentTarget;
        const targetColumn = list.closest('.kanban-column');
        if (targetColumn && (!event.relatedTarget || !targetColumn.contains(event.relatedTarget))) {
            targetColumn.classList.remove('drag-over');
        }
    }

    async function handleTaskListDrop(event) {
        event.preventDefault();
        const targetTaskList = event.currentTarget; 
        const targetColumn = targetTaskList.closest('.kanban-column');

        if (targetColumn) targetColumn.classList.remove('drag-over'); 

        const taskId = event.dataTransfer.getData('text/plain');
        const droppedItemById = document.getElementById(taskId); // Melhor pegar pelo ID
        const itemToDrop = droppedItemById || DND_CurrentDraggingItem;


        if (!itemToDrop) {
            console.error("ERRO DND: item a ser solto não identificado no drop.");
            DND_CurrentDraggingItem = null; // Limpa se estava errado
            return;
        }
        
        if (targetTaskList && targetColumn) {
            const originalParentList = itemToDrop.parentElement;
            const originalStatus = itemToDrop.dataset.status;

            const mouseY = event.clientY;
            let nextSibling = null;
            for (const child of targetTaskList.children) {
                if (child === itemToDrop) continue; 
                const childRect = child.getBoundingClientRect();
                if (mouseY < childRect.top + (childRect.height / 2)) {
                    nextSibling = child;
                    break;
                }
            }

            if (nextSibling) {
                targetTaskList.insertBefore(itemToDrop, nextSibling);
            } else {
                targetTaskList.appendChild(itemToDrop);
            }

            const newStatus = targetColumn.dataset.statusSlug;
            if (newStatus && originalStatus !== newStatus) { 
                try {
                    const updatedTask = await api.updateTaskStatus(itemToDrop.id, newStatus);
                    itemToDrop.dataset.title = updatedTask.title; 
                    itemToDrop.dataset.description = updatedTask.description || ''; 
                    itemToDrop.dataset.status = newStatus; 
                } catch (error) {
                    console.error("ERRO DND: Falha ao chamar api.updateTaskStatus:", error);
                    // Reverte a mudança no DOM
                    if (originalParentList) { 
                        // Encontra o item de referência para inserir antes, se houver
                        let originalNextSibling = null;
                        for (const child of originalParentList.children) {
                            // Essa lógica de reversão de ordem pode ser complexa, simplificando para append
                            // Se a ordem original exata for crucial, precisaria armazenar o nextSibling original
                        }
                        originalParentList.appendChild(itemToDrop); 
                        itemToDrop.dataset.status = originalStatus; // Reverte o status no dataset
                    }
                    alert("Erro ao mover a tarefa. A alteração não foi salva.");
                }
            } else {
                // console.log("Item movido dentro da mesma coluna de status ou status inválido.");
            }
        } else {
            console.warn("LOG DND: Drop falhou - lista de destino ou coluna de destino inválidas.");
        }
        DND_CurrentDraggingItem = null; // Limpa o item arrastado
    }

    window.initializeKanbanEventListeners = function(containerScope = document) {
        console.log("LOG GLOBAL: initializeKanbanEventListeners INICIADO para escopo:", containerScope === document ? "DOCUMENTO" : containerScope.id || containerScope.tagName);

        const taskItemsInScope = containerScope.querySelectorAll('.task-item');
        taskItemsInScope.forEach(item => {
            setupTaskItemForDraggingListeners(item);
        });

        const taskListsInScope = containerScope.querySelectorAll('.task-list');
        taskListsInScope.forEach(list => {
            list.removeEventListener('dragover', handleTaskListDragOver); 
            list.addEventListener('dragover', handleTaskListDragOver);
            list.removeEventListener('dragleave', handleTaskListDragLeave); 
            list.addEventListener('dragleave', handleTaskListDragLeave);
            list.removeEventListener('drop', handleTaskListDrop); 
            list.addEventListener('drop', handleTaskListDrop);
        });
        console.log("LOG GLOBAL: initializeKanbanEventListeners FINALIZADO para escopo.");
    };

    const addTaskButtons = document.querySelectorAll('.add-task-button');
    addTaskButtons.forEach(button => {
        button.addEventListener('click', () => {
            const column = button.closest('.kanban-column');
            if (!column) {
                console.error("ERRO: Coluna Kanban não encontrada para o botão.", button);
                alert("Erro interno: não foi possível determinar a coluna da tarefa.");
                return;
            }

            const status = column.dataset.statusSlug || 'todo'; 
            const taskList = column.querySelector('.task-list');
            let targetListSelector;

            if (taskList && taskList.id) {
                targetListSelector = `#${taskList.id}`;
            } else {
                console.error("ERRO: .task-list não encontrada ou não tem ID na coluna:", column);
                alert("Erro interno ao identificar a lista para a nova tarefa.");
                return;
            }

            const taskType = button.dataset.taskType || 'user_personal'; 
            const groupName = button.dataset.groupName || null; 
            const folderName = button.dataset.folderName || null; 

            const context = { status, taskType, groupName, folderName, targetListSelector };

            if (typeof openCreateTaskModal === 'function') {
                openCreateTaskModal(context);
            } else {
                // Este caso não deveria acontecer agora que openCreateTaskModal está implementada acima.
                console.error("ERRO: A função openCreateTaskModal não está definida (isso é inesperado).");
                alert("Funcionalidade de criar tarefa indisponível: erro de configuração.");
            }
        });
    });
});