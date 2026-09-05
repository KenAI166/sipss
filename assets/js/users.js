// Users JavaScript

const userModal = document.getElementById('userModal');
const userForm = document.getElementById('userForm');
const modalTitle = document.getElementById('modalTitle');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    userForm.addEventListener('submit', saveUser);
});

function openModal(userId = null) {
    userModal.classList.remove('hidden');
    userModal.classList.add('flex');
    
    if (userId) {
        modalTitle.textContent = 'Edit User';
        loadUser(userId);
    } else {
        modalTitle.textContent = 'Add User';
        userForm.reset();
        document.getElementById('userId').value = '';
        document.getElementById('isActive').checked = true;
        document.getElementById('hourlyRate').value = '0';
        document.getElementById('password').required = true;
    }
}

function closeModal() {
    userModal.classList.add('hidden');
    userModal.classList.remove('flex');
    userForm.reset();
}

async function loadUser(userId) {
    try {
        const response = await fetch(`../../api/auth.php?action=get_user&id=${userId}`);
        const result = await response.json();
        
        if (result.success) {
            const user = result.user;
            
            document.getElementById('userId').value = user.id;
            document.getElementById('fullName').value = user.full_name;
            document.getElementById('username').value = user.username;
            document.getElementById('email').value = user.email;
            document.getElementById('phone').value = user.phone || '';
            document.getElementById('role').value = user.role;
            document.getElementById('hourlyRate').value = user.hourly_rate;
            document.getElementById('isActive').checked = user.is_active;
            document.getElementById('password').required = false;
            document.getElementById('password').value = '';
        } else {
            alert('Error loading user: ' + result.message);
        }
    } catch (error) {
        alert('Error loading user: ' + error.message);
    }
}

async function saveUser(e) {
    e.preventDefault();
    
    const userId = document.getElementById('userId').value;
    const data = {
        full_name: document.getElementById('fullName').value,
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        role: document.getElementById('role').value,
        hourly_rate: document.getElementById('hourlyRate').value,
        is_active: document.getElementById('isActive').checked ? 1 : 0
    };
    
    const password = document.getElementById('password').value;
    if (password) {
        data.password = password;
    }
    
    if (userId) {
        data.user_id = userId;
    }
    
    const action = userId ? 'update_profile' : 'register';
    
    try {
        const response = await fetch(`../../api/auth.php?action=${action}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(userId ? 'User updated successfully!' : 'User created successfully!');
            closeModal();
            location.reload();
        } else {
            alert('Error saving user: ' + result.message);
        }
    } catch (error) {
        alert('Error saving user: ' + error.message);
    }
}

function editUser(userId) {
    openModal(userId);
}

async function toggleStatus(userId) {
    if (!confirm('Are you sure you want to toggle this user\'s status?')) {
        return;
    }
    
    try {
        const response = await fetch('../../api/auth.php?action=toggle_user_status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_id: userId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('User status updated successfully!');
            location.reload();
        } else {
            alert('Error updating status: ' + result.message);
        }
    } catch (error) {
        alert('Error updating status: ' + error.message);
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch('../../api/auth.php?action=delete_user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_id: userId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('User deleted successfully!');
            location.reload();
        } else {
            alert('Error deleting user: ' + result.message);
        }
    } catch (error) {
        alert('Error deleting user: ' + error.message);
    }
}
