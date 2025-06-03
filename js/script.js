// js/main.js
document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos do Modal ---
    const modal = document.getElementById('taskDetailModal');
    const modalCloseButton = modal ? modal.querySelector('.modal-close-button') : null;
    const modalCloseActionButton = modal ? modal.querySelector('#modalClose') : null;
    const modalEditButton = modal ? modal.querySelector('#modalEditTask') : null;
    const modalTaskTitle = modal ? modal.querySelector('#modalTaskTitle') : null;
    const modalTaskDescription = modal ? modal.querySelector('#modalTaskDescription') : null;
    const modalTaskId = modal ? modal.querySelector('#modalTaskId') : null;
    const modalTaskStatus = modal ? modal.querySelector('#modalTaskStatus') : null;

    // --- Funções do Modal ---
    async function openModal(taskElement) {
        if (!modal || !taskElement) return;
        
        const taskIdValue = taskElement.id;
        try {
            // Fetch full task details if needed, or use data attributes
            const taskData = await api.getTaskById(taskIdValue); // Assuming taskElement.id is the actual task ID
            
            modalTaskTitle.textContent = taskData.title || "Detalhes da Tarefa";
            modalTaskDescription.textContent = taskData.description || `Descrição completa da tarefa "${taskData.title}" iria aqui.`;
            modalTaskId.textContent = taskData.id;
            
            const columnElement = taskElement.closest('.kanban-column');
            modalTaskStatus.textContent = columnElement ? columnElement.querySelector('h3').textContent.split(' ')[0] : taskData.status; // Use status from taskData as fallback
            
            modal.classList.add('active');
        } catch (error) {
            console.error("Error fetching task details for modal:", error);
            // Fallback to simpler display if API call fails
            modalTaskTitle.textContent = taskElement.dataset.title || taskElement.textContent.trim().split('\n')[0] || "Detalhes da Tarefa";
            modalTaskDescription.textContent = taskElement.dataset.description || `Descrição completa da tarefa.`;
            modalTaskId.textContent = taskIdValue;
            const columnElement = taskElement.closest('.kanban-column');
            modalTaskStatus.textContent = columnElement ? columnElement.querySelector('h3').textContent.split(' ')[0] : 'Desconhecido';
            modal.classList.add('active');
        }
    }

    function closeModal() {
        if (!modal) return;
        modal.classList.remove('active');
    }

    if (modal && modalCloseButton && modalCloseActionButton && modalEditButton) {
        modalCloseButton.addEventListener('click', closeModal);
        modalCloseActionButton.addEventListener('click', closeModal);
        modalEditButton.addEventListener('click', () => {
            alert(`Funcionalidade "Editar Tarefa": ${modalTaskId.textContent} (Protótipo)`);
        });
        modal.addEventListener('click', (event) => {
            if (event.target === modal) closeModal();
        });
    }

    // --- Lógica de Arrastar e Soltar + Long Press + Click ---
    // This function needs to be callable if tasks are added dynamically
    window.initializeKanbanEventListeners = function(containerSelector = document) {
        const taskItems = containerSelector.querySelectorAll('.task-item');
        const taskLists = containerSelector.querySelectorAll('.task-list');
        let longPressTimer = null;
        let isLongPressActive = false;
        let currentDragItem = null;
        let mouseDownItem = null;
        let initialX, initialY;
        const LONG_PRESS_TIMEOUT = 350;
        const MAX_CLICK_MOVEMENT = 10;

        taskItems.forEach(item => {
            item.setAttribute('draggable', 'false');
            if (item.dataset.listenersAttached === 'true') return;
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
                document.addEventListener('mousemove', handleDocumentMouseMove);
                document.addEventListener('mouseup', handleDocumentMouseUp);
            });

            item.addEventListener('dragstart', (event) => {
                if (item.getAttribute('draggable') !== 'true') {
                    event.preventDefault(); return;
                }
                currentDragItem = item;
                event.dataTransfer.setData('text/plain', currentDragItem.id);
                event.dataTransfer.effectAllowed = 'move';
                setTimeout(() => currentDragItem.classList.add('dragging'), 0);
            });

            item.addEventListener('dragend', () => {
                if (currentDragItem) {
                    currentDragItem.classList.remove('dragging');
                    currentDragItem.setAttribute('draggable', 'false');
                }
                isLongPressActive = false;
                currentDragItem = null;
            });
        });
        
        function handleDocumentMouseMove(e) {
            if (mouseDownItem && !isLongPressActive) {
                const deltaX = Math.abs(e.clientX - initialX);
                const deltaY = Math.abs(e.clientY - initialY);
                if (deltaX > MAX_CLICK_MOVEMENT || deltaY > MAX_CLICK_MOVEMENT) {
                    clearTimeout(longPressTimer);
                }
            }
        }

        function handleDocumentMouseUp(e) {
            if (e.button !== 0) return;
            clearTimeout(longPressTimer);
            if (mouseDownItem && !isLongPressActive) {
                const deltaX = Math.abs(e.clientX - initialX);
                const deltaY = Math.abs(e.clientY - initialY);
                if (deltaX < MAX_CLICK_MOVEMENT && deltaY < MAX_CLICK_MOVEMENT) {
                    if (modal) openModal(mouseDownItem);
                }
            }
            if(mouseDownItem) mouseDownItem.setAttribute('draggable', 'false');
            mouseDownItem = null;
            isLongPressActive = false; 
            document.removeEventListener('mousemove', handleDocumentMouseMove);
            document.removeEventListener('mouseup', handleDocumentMouseUp);
        }

        taskLists.forEach(list => {
            if (list.dataset.dropListenersAttached === 'true') return;
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

                        const newStatusSlug = targetColumn.dataset.statusSlug; // e.g., 'todo', 'inprogress', 'done'
                        if (newStatusSlug) {
                            try {
                                await api.updateTaskStatus(taskId, newStatusSlug);
                                console.log(`Task ${taskId} status updated to ${newStatusSlug} on server.`);
                                // Update data-attributes if needed for the modal
                                const taskData = await api.getTaskById(taskId);
                                droppedItem.dataset.title = taskData.title;
                                droppedItem.dataset.description = taskData.description;

                            } catch (error) {
                                console.error("Failed to update task status on server:", error);
                                // Revert UI change
                                oldColumn.querySelector('.task-list').appendChild(droppedItem);
                                alert("Error updating task status. Please try again.");
                            }
                        }
                    }
                }
                if (targetColumn) targetColumn.classList.remove('drag-over');
            });
        });
    }
    
    // Initialize for existing tasks on page load (if any are static, otherwise call after dynamic load)
    initializeKanbanEventListeners();

    // --- Handling "+ Criar nova tarefa" ---
    document.querySelectorAll('.add-task-button').forEach(button => {
        button.addEventListener('click', async () => {
            const title = prompt("Título da nova tarefa:");
            if (!title || title.trim() === "") return;

            const column = button.closest('.kanban-column');
            const taskList = column.querySelector('.task-list');
            const status = column.dataset.statusSlug || 'todo';
            
            // Determine taskType and context (groupName, folderName)
            // This part needs to be adapted based on which page it is.
            // Using data attributes on the button itself is a good way.
            const taskType = button.dataset.taskType || 'user_personal';
            const groupName = button.dataset.groupName || null; // Comes from folder_tasks.html context
            const folderName = button.dataset.folderName || null; // Comes from folder_tasks.html context
            const currentUser = await api.getCurrentUser();

            const taskDetails = {
                title: title,
                status: status,
                taskType: taskType,
                userUsername: (taskType === 'user_personal' || taskType === 'user_folder') ? (currentUser ? currentUser.username : 'unknown_user') : null,
                groupName: groupName,
                folderName: folderName,
                description: `Descrição padrão para ${title}`
            };

            try {
                const createdTask = await api.createTask(taskDetails);
                const newTaskElement = document.createElement('li');
                newTaskElement.classList.add('task-item');
                newTaskElement.id = createdTask.id;
                newTaskElement.textContent = createdTask.title;
                newTaskElement.setAttribute('draggable', 'false');
                // Set data attributes for the modal
                newTaskElement.dataset.title = createdTask.title;
                newTaskElement.dataset.description = createdTask.description;

                taskList.appendChild(newTaskElement);
                initializeKanbanEventListeners(column); // Re-initialize for the new item within its column's scope
            } catch (error) {
                console.error('Error creating task:', error);
                alert(`Falha ao criar tarefa: ${error.message || 'Erro desconhecido'}`);
            }
        });
    });
});