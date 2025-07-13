class TodoList {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('karma-tasks')) || [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderTasks();
        this.updateStats();
    }

    bindEvents() {
        // Add task button
        document.getElementById('addTask').addEventListener('click', () => this.addTask());
        
        // Enter key in input
        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Clear completed button
        document.getElementById('clearCompleted').addEventListener('click', () => {
            this.clearCompleted();
        });
    }

    addTask() {
        const input = document.getElementById('taskInput');
        const text = input.value.trim();
        
        if (text === '') return;

        const task = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        
        input.value = '';
        input.focus();
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            if (task.completed) {
                this.showShinchanPeek();
            }
        }
    }

    editTask(id, newText) {
        const task = this.tasks.find(t => t.id === id);
        if (task && newText.trim() !== '') {
            task.text = newText.trim();
            this.saveTasks();
            this.renderTasks();
        }
    }

    deleteTask(id) {
        const taskElement = document.querySelector(`[data-task-id="${id}"]`);
        taskElement.classList.add('removing');
        
        setTimeout(() => {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
        }, 300);
    }

    clearCompleted() {
        this.tasks = this.tasks.filter(t => !t.completed);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.renderTasks();
    }

    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'active':
                return this.tasks.filter(t => !t.completed);
            case 'completed':
                return this.tasks.filter(t => t.completed);
            default:
                return this.tasks;
        }
    }

    renderTasks() {
        const taskList = document.getElementById('taskList');
        const emptyState = document.getElementById('emptyState');
        const filteredTasks = this.getFilteredTasks();

        if (filteredTasks.length === 0) {
            taskList.style.display = 'none';
            emptyState.style.display = 'block';
            
            // Update empty state message based on filter
            const emptyStateTitle = emptyState.querySelector('h3');
            const emptyStateText = emptyState.querySelector('p');
            
            if (this.currentFilter === 'all') {
                emptyStateTitle.textContent = 'No tasks yet!';
                emptyStateText.textContent = 'Add your first task to get started';
            } else if (this.currentFilter === 'active') {
                emptyStateTitle.textContent = 'No active tasks!';
                emptyStateText.textContent = 'All tasks are completed';
            } else {
                emptyStateTitle.textContent = 'No completed tasks!';
                emptyStateText.textContent = 'Complete some tasks to see them here';
            }
        } else {
            taskList.style.display = 'block';
            emptyState.style.display = 'none';
            
            taskList.innerHTML = filteredTasks.map(task => this.createTaskElement(task)).join('');
            
            // Bind events to new task elements
            this.bindTaskEvents();
        }
    }

    createTaskElement(task) {
        return `
            <li class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="todoList.toggleTask(${task.id})">
                    <i class="fas fa-check"></i>
                </div>
                <span class="task-text" onclick="todoList.startEdit(${task.id})">${this.escapeHtml(task.text)}</span>
                <div class="task-actions">
                    <button class="action-btn edit-btn" onclick="todoList.startEdit(${task.id})" title="Edit task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="todoList.deleteTask(${task.id})" title="Delete task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </li>
        `;
    }

    startEdit(id) {
        const taskElement = document.querySelector(`[data-task-id="${id}"]`);
        const taskTextElement = taskElement.querySelector('.task-text');
        const currentText = taskTextElement.textContent;
        
        // Create input element
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentText;
        input.className = 'edit-input';
        input.style.cssText = `
            flex: 1;
            padding: 5px 10px;
            border: 2px solid #667eea;
            border-radius: 5px;
            font-size: 1rem;
            outline: none;
        `;
        
        // Replace text with input
        taskTextElement.style.display = 'none';
        taskTextElement.parentNode.insertBefore(input, taskTextElement);
        input.focus();
        input.select();
        
        // Handle save on enter or blur
        const saveEdit = () => {
            const newText = input.value.trim();
            if (newText !== '') {
                this.editTask(id, newText);
            }
            input.remove();
            taskTextElement.style.display = 'inline';
        };
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') saveEdit();
        });
        
        input.addEventListener('blur', saveEdit);
    }

    bindTaskEvents() {
        // Events are handled inline for simplicity
        // In a production app, you might want to use event delegation
    }

    updateStats() {
        const activeTasks = this.tasks.filter(t => !t.completed).length;
        const totalTasks = this.tasks.length;
        
        const taskCountElement = document.getElementById('taskCount');
        if (totalTasks === 0) {
            taskCountElement.textContent = 'No tasks';
        } else if (activeTasks === 0) {
            taskCountElement.textContent = 'All tasks completed!';
        } else {
            taskCountElement.textContent = `${activeTasks} of ${totalTasks} tasks remaining`;
        }
    }

    saveTasks() {
        localStorage.setItem('karma-tasks', JSON.stringify(this.tasks));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showShinchanPeek() {
        const peek = document.getElementById('shinchan-peek');
        if (!peek) return;
        if (peek.classList.contains('show')) return; // already showing
        peek.classList.add('show');
        peek.style.display = 'block';
        setTimeout(() => {
            peek.classList.remove('show');
            peek.style.display = 'none';
        }, 2000);
    }
}

// Initialize the todo list when the page loads
let todoList;
document.addEventListener('DOMContentLoaded', () => {
    todoList = new TodoList();
});

// Add some sample tasks for demonstration
document.addEventListener('DOMContentLoaded', () => {
    // Only add sample tasks if no tasks exist
    if (todoList.tasks.length === 0) {
        const sampleTasks = [
            'Complete project presentation',
            'Buy groceries for dinner',
            'Call mom',
            'Exercise for 30 minutes',
            'Read a chapter of the book'
        ];
        
        sampleTasks.forEach((text, index) => {
            setTimeout(() => {
                const task = {
                    id: Date.now() + index,
                    text: text,
                    completed: false,
                    createdAt: new Date().toISOString()
                };
                todoList.tasks.push(task);
                todoList.saveTasks();
                todoList.renderTasks();
                todoList.updateStats();
            }, index * 200);
        });
    }
}); 