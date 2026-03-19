// API Configuration
const API_URL = "http://localhost:5000/api"; // Replace with your backend URL

// State
let currentUser = null;
let authToken = localStorage.getItem('authToken');

// DOM Elements
const mainApp = document.getElementById('mainApp');
const authButtons = document.getElementById('authButtons');
const userInfo = document.getElementById('userInfo');
const userEmail = document.getElementById('userEmail');
const notesList = document.getElementById('notesList');
const totalNotesEl = document.getElementById('totalNotes');
const totalCharsEl = document.getElementById('totalChars');
const lastUpdatedEl = document.getElementById('lastUpdated');
const noteTitle = document.getElementById('noteTitle');
const noteContent = document.getElementById('noteContent');
const noteError = document.getElementById('noteError');

// Check if user is logged in on page load
document.addEventListener('DOMContentLoaded', () => {
    if (authToken) {
        verifyToken();
    }
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('saveNoteBtn').addEventListener('click', saveNote);
    document.getElementById('clearNoteBtn').addEventListener('click', clearForm);
    document.getElementById('downloadAllBtn').addEventListener('click', downloadAllNotes);
    document.getElementById('deleteAllBtn').addEventListener('click', deleteAllNotes);
    
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        login();
    });
    
    document.getElementById('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        register();
    });
}

// Authentication Functions
async function verifyToken() {
    try {
        const response = await fetch(`${API_URL}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            showMainApp();
            loadNotes();
        } else {
            logout();
        }
    } catch (error) {
        console.error('Token verification failed:', error);
        logout();
    }
}

async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            closeLoginModal();
            showMainApp();
            loadNotes();
        } else {
            errorDiv.textContent = data.message || 'Login failed';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'Network error. Please try again.';
        errorDiv.style.display = 'block';
    }
}

async function register() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const errorDiv = document.getElementById('registerError');
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            closeRegisterModal();
            showLoginModal();
            showNotification('Registration successful! Please login.', 'success');
        } else {
            errorDiv.textContent = data.message || 'Registration failed';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'Network error. Please try again.';
        errorDiv.style.display = 'block';
    }
}

function logout() {
    localStorage.removeItem('authToken');
    authToken = null;
    currentUser = null;
    mainApp.style.display = 'none';
    authButtons.style.display = 'block';
    userInfo.style.display = 'none';
}

function showMainApp() {
    mainApp.style.display = 'block';
    authButtons.style.display = 'none';
    userInfo.style.display = 'block';
    userEmail.textContent = currentUser.email;
}

// Modal Functions
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('loginForm').reset();
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

function showRegisterModal() {
    document.getElementById('registerModal').style.display = 'block';
    document.getElementById('registerError').style.display = 'none';
    document.getElementById('registerForm').reset();
}

function closeRegisterModal() {
    document.getElementById('registerModal').style.display = 'none';
}

// Notes Functions
async function loadNotes() {
    if (!authToken) return;
    
    try {
        const response = await fetch(`${API_URL}/notes`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const notes = await response.json();
            displayNotes(notes);
            updateStats(notes);
        } else if (response.status === 401) {
            logout();
        }
    } catch (error) {
        console.error('Failed to load notes:', error);
        showNotification('Failed to load notes', 'error');
    }
}

function displayNotes(notes) {
    if (notes.length === 0) {
        notesList.innerHTML = `<div class="no-notes" id="noNotesMessage">
            <i class="fas fa-clipboard" style="font-size: 3rem; margin-bottom: 15px; color: #ccc; display: block;"></i>
            No notes yet. Create your first note!
        </div>`;
        return;
    }
    
    // Sort notes by date (newest first)
    notes.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    
    let html = '';
    notes.forEach(note => {
        // Format date properly with timezone
        const date = new Date(note.updated_at);
        const formattedDate = formatDate(date);
        
        // Limit content preview to 200 characters
        const previewContent = note.content.length > 200 ? 
            note.content.substring(0, 200) + '...' : note.content;
        
        html += `
            <div class="note-item" data-id="${note.id}">
                <div class="note-header">
                    <h4 class="note-title">${note.title || 'Untitled Note'}</h4>
                    <span class="note-date">${formattedDate}</span>
                </div>
                <div class="note-content" id="content-${note.id}">
                    ${previewContent.replace(/\n/g, '<br>')}
                </div>
                ${note.content.length > 200 ? 
                    `<button class="expand-btn" onclick="toggleExpand('${note.id}')">
                        <i class="fas fa-chevron-down"></i> Show More
                    </button>` : ''
                }
                <div class="note-actions">
                    <button class="note-btn view-btn" onclick="viewNote('${note.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="note-btn edit-btn" onclick="editNote('${note.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="note-btn delete-btn" onclick="deleteNote('${note.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    });
    
    notesList.innerHTML = html;
}

// Helper function to format dates consistently
function formatDate(dateString) {
    const date = new Date(dateString);
    
    // Get local timezone offset
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZoneName: 'short'
    };
    
    return date.toLocaleString(undefined, options);
}

async function saveNote() {
    if (!authToken) return;
    
    // If we're in edit mode, call update instead
    if (window.currentEditingNoteId) {
        await updateNote(window.currentEditingNoteId);
        return;
    }
    
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();
    
    // Validation
    if (!title && !content) {
        document.getElementById('noteError').textContent = 'Please enter a title or content for your note.';
        document.getElementById('noteError').style.display = 'block';
        return;
    }
    
    document.getElementById('noteError').style.display = 'none';
    
    const noteData = {
        title: title || 'Untitled Note',
        content: content
    };
    
    try {
        const response = await fetch(`${API_URL}/notes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(noteData)
        });
        
        if (response.ok) {
            clearForm();
            await loadNotes();
            showNotification('Note saved successfully!');
        } else if (response.status === 401) {
            logout();
        } else {
            const data = await response.json();
            document.getElementById('noteError').textContent = data.message || 'Failed to save note';
            document.getElementById('noteError').style.display = 'block';
        }
    } catch (error) {
        console.error('Save error:', error);
        document.getElementById('noteError').textContent = 'Network error. Please try again.';
        document.getElementById('noteError').style.display = 'block';
    }
}

function editNote(id) {
    if (!authToken) return;
    
    fetch(`${API_URL}/notes/${id}`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch note');
        }
        return response.json();
    })
    .then(note => {
        // Fill the form with note data
        document.getElementById('noteTitle').value = note.title || '';
        document.getElementById('noteContent').value = note.content || '';
        
        // Store the note ID for updating
        window.currentEditingNoteId = id;
        
        // Change the save button to update mode
        const saveBtn = document.getElementById('saveNoteBtn');
        saveBtn.innerHTML = '<i class="fas fa-sync"></i> Update Note';
        
        // Remove old click handlers and add new one
        saveBtn.replaceWith(saveBtn.cloneNode(true));
        const newSaveBtn = document.getElementById('saveNoteBtn');
        newSaveBtn.onclick = function() { updateNote(id); };
        
        // Scroll to form
        document.querySelector('.notes-input-section').scrollIntoView({ behavior: 'smooth' });
        
        // Highlight the form to indicate edit mode
        document.querySelector('.notes-input-section').style.border = '2px solid #FF9800';
    })
    .catch(error => {
        console.error('Error loading note for edit:', error);
        showNotification('Failed to load note', 'error');
    });
}

async function updateNote(id) {
    if (!authToken) return;
    
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();
    
    if (!title && !content) {
        document.getElementById('noteError').textContent = 'Please enter a title or content for your note.';
        document.getElementById('noteError').style.display = 'block';
        return;
    }
    
    document.getElementById('noteError').style.display = 'none';
    
    const noteData = {
        title: title || 'Untitled Note',
        content: content
    };
    
    try {
        const response = await fetch(`${API_URL}/notes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(noteData)
        });
        
        if (response.ok) {
            // Clear the edit mode
            resetSaveButton();
            
            // Clear the form
            clearForm();
            
            // Reload notes
            await loadNotes();
            
            showNotification('Note updated successfully!');
            
            // Remove highlight
            document.querySelector('.notes-input-section').style.border = 'none';
        } else if (response.status === 401) {
            logout();
        } else {
            const data = await response.json();
            document.getElementById('noteError').textContent = data.message || 'Failed to update note';
            document.getElementById('noteError').style.display = 'block';
        }
    } catch (error) {
        console.error('Update error:', error);
        document.getElementById('noteError').textContent = 'Network error. Please try again.';
        document.getElementById('noteError').style.display = 'block';
    }
}

function resetSaveButton() {
    const saveBtn = document.getElementById('saveNoteBtn');
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Note';
    saveBtn.onclick = saveNote;
    window.currentEditingNoteId = null;
}

async function deleteNote(id) {
    if (!authToken) return;
    
    if (confirm('Are you sure you want to delete this note?')) {
        try {
            const response = await fetch(`${API_URL}/notes/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (response.ok) {
                loadNotes();
                showNotification('Note deleted successfully!');
            } else if (response.status === 401) {
                logout();
            }
        } catch (error) {
            console.error('Failed to delete note:', error);
            showNotification('Failed to delete note', 'error');
        }
    }
}

async function deleteAllNotes() {
    if (!authToken) return;
    
    if (confirm('Are you sure you want to delete ALL notes? This action cannot be undone.')) {
        try {
            const response = await fetch(`${API_URL}/notes`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (response.ok) {
                loadNotes();
                showNotification('All notes deleted successfully!');
            } else if (response.status === 401) {
                logout();
            }
        } catch (error) {
            console.error('Failed to delete notes:', error);
            showNotification('Failed to delete notes', 'error');
        }
    }
}

function viewNote(id) {
    if (!authToken) return;
    
    fetch(`${API_URL}/notes/${id}`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch note');
        }
        return response.json();
    })
    .then(note => {
        const createdDate = formatDateForDisplay(note.created_at);
        const updatedDate = formatDateForDisplay(note.updated_at);
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.7);
            z-index: 1000;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        `;
        
        modal.innerHTML = `
            <div style="background-color: white; padding: 30px; border-radius: 15px; max-width: 800px; width: 100%; max-height: 80vh; overflow-y: auto; position: relative;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="color: #333; margin: 0;">${note.title || 'Untitled Note'}</h3>
                    <button onclick="this.closest('.modal').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #777;">×</button>
                </div>
                <div style="color: #666; margin-bottom: 10px; font-size: 0.9rem;">
                    <strong>Created:</strong> ${createdDate}
                </div>
                <div style="color: #666; margin-bottom: 15px; font-size: 0.9rem;">
                    <strong>Last Updated:</strong> ${updatedDate}
                </div>
                <div style="color: #444; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; border-top: 1px solid #eee; padding-top: 15px;">
                    ${note.content}
                </div>
                <div style="margin-top: 25px; display: flex; gap: 15px;">
                    <button class="action-btn edit-btn" onclick="editNote('${note.id}'); this.closest('.modal').remove()" style="flex: 1; padding: 10px;">
                        <i class="fas fa-edit"></i> Edit Note
                    </button>
                    <button class="action-btn download-btn" onclick="downloadNote('${note.id}')" style="flex: 1; padding: 10px;">
                        <i class="fas fa-download"></i> Download
                    </button>
                </div>
            </div>
        `;
        
        modal.className = 'modal';
        document.body.appendChild(modal);
    })
    .catch(error => {
        console.error('Error viewing note:', error);
        showNotification('Failed to load note', 'error');
    });
}

// Helper function for display formatting
function formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

async function downloadAllNotes() {
    if (!authToken) return;
    
    try {
        const response = await fetch(`${API_URL}/notes`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const notes = await response.json();
            
            if (notes.length === 0) {
                showNotification('No notes to download.', 'info');
                return;
            }
            
            // Sort notes by date (oldest first for better readability)
            notes.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            
            let content = `# Notes Export\n\n`;
            content += `Exported on: ${formatDateForExport(new Date())}\n`;
            content += `Total notes: ${notes.length}\n\n`;
            
            notes.forEach((note, index) => {
                const createdDate = formatDateForExport(note.created_at);
                const updatedDate = formatDateForExport(note.updated_at);
                
                content += `## Note ${index + 1}: ${note.title}\n`;
                content += `Created: ${createdDate}\n`;
                content += `Last Updated: ${updatedDate}\n`;
                content += `Content:\n${note.content}\n\n`;
                content += `---\n\n`;
            });
            
            downloadFile(content, `notes-export-${formatDateForFilename(new Date())}.txt`);
            showNotification('All notes exported successfully!');
        }
    } catch (error) {
        console.error('Failed to download notes:', error);
        showNotification('Failed to download notes', 'error');
    }
}

// Helper function for export formatting
function formatDateForExport(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZoneName: 'short'
    });
}

// Helper function for filename
function formatDateForFilename(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const minute = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}-${hour}${minute}`;
}

function downloadNote(id) {
    if (!authToken) return;
    
    fetch(`${API_URL}/notes/${id}`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(note => {
        const createdDate = formatDateForExport(note.created_at);
        const updatedDate = formatDateForExport(note.updated_at);
        
        let content = `# ${note.title}\n\n`;
        content += `Created: ${createdDate}\n`;
        content += `Last Updated: ${updatedDate}\n\n`;
        content += `${note.content}\n\n`;
        content += `---\n`;
        content += `Exported from Notes App on ${formatDateForExport(new Date())}`;
        
        const filename = `note-${note.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${formatDateForFilename(note.created_at)}.txt`;
        downloadFile(content, filename);
    });
}

function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function toggleExpand(id) {
    const contentDiv = document.getElementById(`content-${id}`);
    const expandBtn = document.querySelector(`button[onclick*="'${id}'"]`);
    
    if (!contentDiv || !expandBtn) return;
    
    if (contentDiv.classList.contains('expanded')) {
        contentDiv.classList.remove('expanded');
        expandBtn.innerHTML = '<i class="fas fa-chevron-down"></i> Show More';
    } else {
        contentDiv.classList.add('expanded');
        expandBtn.innerHTML = '<i class="fas fa-chevron-up"></i> Show Less';
    }
}

function updateStats(notes) {
    totalNotesEl.textContent = notes.length;
    
    const totalChars = notes.reduce((sum, note) => sum + note.content.length, 0);
    totalCharsEl.textContent = totalChars.toLocaleString();
    
    if (notes.length > 0) {
        const lastNote = notes.reduce((latest, note) => {
            return new Date(note.updated_at) > new Date(latest.updated_at) ? note : latest;
        });
        
        const lastDate = new Date(lastNote.updated_at);
        lastUpdatedEl.textContent = lastDate.toLocaleDateString([], {month: 'short', day: 'numeric'});
    } else {
        lastUpdatedEl.textContent = '-';
    }
}

function clearForm() {
    document.getElementById('noteTitle').value = '';
    document.getElementById('noteContent').value = '';
    document.getElementById('noteError').style.display = 'none';
    
    // Reset save button
    resetSaveButton();
    
    // Remove highlight
    document.querySelector('.notes-input-section').style.border = 'none';
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: ${type === 'success' ? '#4CAF50' : type === 'info' ? '#2196F3' : '#f44336'};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'info' ? 'info-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Close modals when clicking outside
window.onclick = function(event) {
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    
    if (event.target === loginModal) {
        closeLoginModal();
    }
    if (event.target === registerModal) {
        closeRegisterModal();
    }
}