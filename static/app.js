// ==========================================================================
// GLOBAL STATE & VARIABLES
// ==========================================================================
let token = localStorage.getItem('glowtask_token') || null;
let currentUser = null;
let allTasks = [];
let currentFilter = 'all'; // 'all' | 'pending' | 'completed'

// API Endpoints
const API = {
    register: '/auth/register',
    login: '/auth/login',
    profile: '/auth/me',
    tasks: '/tasks'
};

// Elements
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const tabLoginBtn = document.getElementById('tab-login-btn');
const tabRegisterBtn = document.getElementById('tab-register-btn');
const userDisplayName = document.getElementById('user-display-name');
const tasksGrid = document.getElementById('tasks-grid');
const tasksLoader = document.getElementById('tasks-loader');
const tasksEmpty = document.getElementById('tasks-empty');
const tasksCountBadge = document.getElementById('tasks-count-badge');

// Stats Elements
const statTotal = document.getElementById('stat-total');
const statPending = document.getElementById('stat-pending');
const statCompleted = document.getElementById('stat-completed');

// Modal Elements
const editModal = document.getElementById('edit-modal');
const editTaskId = document.getElementById('edit-task-id');
const editTaskTitle = document.getElementById('edit-task-title');
const editTaskDesc = document.getElementById('edit-task-desc');
const editTaskCompleted = document.getElementById('edit-task-completed');


// ==========================================================================
// INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    if (token) {
        const success = await fetchUserProfile();
        if (success) {
            showDashboard();
            await loadTasks();
        } else {
            handleLogoutSilently();
            showAuth();
        }
    } else {
        showAuth();
    }
}


// ==========================================================================
// TOAST NOTIFICATIONS
// ==========================================================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? '✓' : '✕';
    
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(toast);
    
    // Auto-remove toast after 4 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}


// ==========================================================================
// AUTHENTICATION TAB SWITCHING & VIEWS
// ==========================================================================
function switchAuthTab(tab) {
    if (tab === 'login') {
        tabLoginBtn.classList.add('active');
        tabRegisterBtn.classList.remove('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    } else {
        tabRegisterBtn.classList.add('active');
        tabLoginBtn.classList.remove('active');
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
    }
}

function showAuth() {
    authSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
}

function showDashboard() {
    authSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    if (currentUser) {
        userDisplayName.textContent = currentUser.username;
    }
}


// ==========================================================================
// API AUTH CALLS
// ==========================================================================
async function fetchUserProfile() {
    try {
        const response = await fetch(API.profile, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            currentUser = await response.json();
            return true;
        }
        return false;
    } catch (err) {
        console.error('Error fetching user profile:', err);
        return false;
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    const submitBtn = document.getElementById('login-submit');
    
    submitBtn.disabled = true;
    
    try {
        // OAuth2 Password flow expects URL encoded format
        const params = new URLSearchParams();
        params.append('username', usernameInput.value.trim());
        params.append('password', passwordInput.value);
        
        const response = await fetch(API.login, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });
        
        const data = await response.json();
        
        if (response.ok) {
            token = data.access_token;
            localStorage.setItem('glowtask_token', token);
            
            await fetchUserProfile();
            showDashboard();
            await loadTasks();
            showToast('Welcome back! Login successful.', 'success');
            
            // Clear inputs
            usernameInput.value = '';
            passwordInput.value = '';
        } else {
            showToast(data.detail || 'Incorrect credentials. Please try again.', 'error');
        }
    } catch (err) {
        showToast('Connection failed. Please check your backend connection.', 'error');
        console.error(err);
    } finally {
        submitBtn.disabled = false;
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const usernameInput = document.getElementById('reg-username');
    const emailInput = document.getElementById('reg-email');
    const passwordInput = document.getElementById('reg-password');
    const submitBtn = document.getElementById('register-submit');
    
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(API.register, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: usernameInput.value.trim(),
                email: emailInput.value.trim(),
                password: passwordInput.value
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Account created successfully! Please sign in.', 'success');
            switchAuthTab('login');
            // Pre-fill username for convenience
            document.getElementById('login-username').value = usernameInput.value.trim();
            
            // Clear inputs
            usernameInput.value = '';
            emailInput.value = '';
            passwordInput.value = '';
        } else {
            showToast(data.detail || 'Registration failed. Check inputs.', 'error');
        }
    } catch (err) {
        showToast('Connection failed. Please check your backend connection.', 'error');
        console.error(err);
    } finally {
        submitBtn.disabled = false;
    }
}

function handleLogout() {
    token = null;
    currentUser = null;
    allTasks = [];
    localStorage.removeItem('glowtask_token');
    showAuth();
    showToast('Signed out successfully.', 'success');
}

function handleLogoutSilently() {
    token = null;
    currentUser = null;
    allTasks = [];
    localStorage.removeItem('glowtask_token');
}


// ==========================================================================
// TASK OPERATIONS (CRUD)
// ==========================================================================
async function loadTasks() {
    tasksLoader.classList.remove('hidden');
    tasksGrid.innerHTML = '';
    tasksEmpty.classList.add('hidden');
    
    try {
        const response = await fetch(API.tasks, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            allTasks = await response.json();
            updateStatistics();
            renderTasks();
        } else {
            if (response.status === 401) {
                handleLogoutSilently();
                showAuth();
            } else {
                showToast('Failed to fetch tasks.', 'error');
            }
        }
    } catch (err) {
        showToast('Network error loading tasks.', 'error');
        console.error(err);
    } finally {
        tasksLoader.classList.add('hidden');
    }
}

function updateStatistics() {
    const total = allTasks.length;
    const completed = allTasks.filter(t => t.completed).length;
    const pending = total - completed;
    
    statTotal.textContent = total;
    statPending.textContent = pending;
    statCompleted.textContent = completed;
}

function setFilter(filter) {
    currentFilter = filter;
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.getAttribute('data-filter') === filter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    renderTasks();
}

function renderTasks() {
    tasksGrid.innerHTML = '';
    
    // Filter tasks client-side
    let filteredTasks = [...allTasks];
    if (currentFilter === 'pending') {
        filteredTasks = allTasks.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = allTasks.filter(t => t.completed);
    }
    
    tasksCountBadge.textContent = `${filteredTasks.length} item${filteredTasks.length === 1 ? '' : 's'}`;
    
    if (filteredTasks.length === 0) {
        tasksEmpty.classList.remove('hidden');
        return;
    }
    
    tasksEmpty.classList.add('hidden');
    
    // Sort tasks: pending first, then by ID descending
    filteredTasks.sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        return b.id - a.id;
    });
    
    filteredTasks.forEach(task => {
        const card = document.createElement('div');
        card.className = `task-card fade-in ${task.completed ? 'completed' : ''}`;
        card.id = `task-card-${task.id}`;
        
        const descriptionHTML = task.description 
            ? `<p class="task-card-desc">${escapeHTML(task.description)}</p>` 
            : '';
            
        card.innerHTML = `
            <div class="task-body">
                <label class="checkbox-container">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTaskComplete(${task.id}, ${task.completed})">
                    <span class="checkmark">
                        <svg class="checkmark-icon" viewBox="0 0 12 10">
                            <polyline points="1.5 6 4.5 9 10.5 1"></polyline>
                        </svg>
                    </span>
                </label>
                <div class="task-info">
                    <h4 class="task-card-title">${escapeHTML(task.title)}</h4>
                    ${descriptionHTML}
                </div>
            </div>
            <div class="task-actions">
                <button class="action-btn edit" onclick="openEditModal(${task.id})" title="Edit Note">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </button>
                <button class="action-btn delete" onclick="handleDeleteTask(${task.id})" title="Delete Note">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </div>
        `;
        
        tasksGrid.appendChild(card);
    });
}

// Escape HTML helper to prevent XSS
function escapeHTML(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


// ==========================================================================
// ACTIONS IMPLEMENTATION
// ==========================================================================
async function handleCreateTask(e) {
    e.preventDefault();
    const titleInput = document.getElementById('task-title');
    const descInput = document.getElementById('task-desc');
    
    const title = titleInput.value.trim();
    const description = descInput.value.trim();
    
    if (!title) return;
    
    try {
        const response = await fetch(API.tasks, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title,
                description: description || null,
                completed: false
            })
        });
        
        if (response.ok) {
            showToast('Task added successfully!', 'success');
            titleInput.value = '';
            descInput.value = '';
            await loadTasks();
        } else {
            showToast('Failed to add task.', 'error');
        }
    } catch (err) {
        showToast('Network error creating task.', 'error');
        console.error(err);
    }
}

async function toggleTaskComplete(taskId, currentStatus) {
    try {
        const response = await fetch(`/tasks/${taskId}/complete?completed=${!currentStatus}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const updatedTask = await response.json();
            
            // Find task in local state and update
            const index = allTasks.findIndex(t => t.id === taskId);
            if (index !== -1) {
                allTasks[index] = updatedTask;
            }
            
            // Visual transition triggers immediately
            const card = document.getElementById(`task-card-${taskId}`);
            if (card) {
                if (updatedTask.completed) {
                    card.classList.add('completed');
                    showToast('Task completed! Great job.', 'success');
                } else {
                    card.classList.remove('completed');
                    showToast('Task marked active.', 'success');
                }
            }
            
            updateStatistics();
            // Re-render after a short delay if in filtered view
            if (currentFilter !== 'all') {
                setTimeout(() => renderTasks(), 450);
            } else {
                renderTasks();
            }
        } else {
            showToast('Failed to update task status.', 'error');
            // Re-render to revert state visually
            renderTasks();
        }
    } catch (err) {
        showToast('Network error updating task.', 'error');
        renderTasks();
        console.error(err);
    }
}

async function handleDeleteTask(taskId) {
    const card = document.getElementById(`task-card-${taskId}`);
    if (card) {
        card.classList.add('fade-out');
    }
    
    // Wait for the exit animation
    setTimeout(async () => {
        try {
            const response = await fetch(`/tasks/${taskId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                showToast('Task deleted successfully.', 'success');
                allTasks = allTasks.filter(t => t.id !== taskId);
                updateStatistics();
                renderTasks();
            } else {
                showToast('Failed to delete task.', 'error');
                // Re-render to remove fade-out styling on failure
                renderTasks();
            }
        } catch (err) {
            showToast('Network error deleting task.', 'error');
            renderTasks();
            console.error(err);
        }
    }, 300);
}


// ==========================================================================
// MODAL MANAGEMENT
// ==========================================================================
function openEditModal(taskId) {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;
    
    editTaskId.value = task.id;
    editTaskTitle.value = task.title;
    editTaskDesc.value = task.description || '';
    editTaskCompleted.checked = task.completed;
    
    editModal.classList.remove('hidden');
}

function closeEditModal(e) {
    editModal.classList.add('hidden');
}

async function handleSaveTaskEdit(e) {
    e.preventDefault();
    const taskId = parseInt(editTaskId.value);
    const title = editTaskTitle.value.trim();
    const description = editTaskDesc.value.trim();
    const completed = editTaskCompleted.checked;
    
    if (!title) return;
    
    try {
        const response = await fetch(`/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title,
                description: description || null,
                completed
            })
        });
        
        if (response.ok) {
            showToast('Changes saved successfully.', 'success');
            closeEditModal();
            await loadTasks();
        } else {
            showToast('Failed to save changes.', 'error');
        }
    } catch (err) {
        showToast('Network error saving changes.', 'error');
        console.error(err);
    }
}
