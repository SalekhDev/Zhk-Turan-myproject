// profile.js

const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/login';
}

async function loadUserProfile() {
    try {
        const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            const user = data.user;
            document.getElementById('userName').textContent = user.fullName || user.username;
            document.getElementById('userEmail').textContent = user.email;
            document.getElementById('userPhone').textContent = user.phone || '-';
        } else {
            logout();
        }
    } catch (err) {
        console.error(err);
    }
}

async function loadUserApplications() {
    const list = document.getElementById('applicationsList');
    if (!list) return;
    try {
        const res = await fetch('/api/applications?source=user', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            if (data.applications.length === 0) {
                list.innerHTML = `<p data-lang="profile-no-applications">${translations[currentLang]['profile-no-applications']}</p>`;
            } else {
                list.innerHTML = data.applications.map(app => `
                    <div style="border:1px solid #ddd; padding:15px; margin-bottom:10px; border-radius:8px;">
                        <p><strong>ID:</strong> ${app.id}</p>
                        <p><strong data-lang="type">Тип:</strong> ${app.type}</p>
                        <p><strong data-lang="status">Статус:</strong> <span class="status-${app.status}">${translations[currentLang]['status-' + app.status]}</span></p>
                        <p><strong data-lang="date">Дата:</strong> ${new Date(app.createdAt).toLocaleDateString()}</p>
                    </div>
                `).join('');
            }
        } else {
            list.innerHTML = `<p data-lang="profile-error">${translations[currentLang]['profile-error']}</p>`;
        }
    } catch (err) {
        list.innerHTML = `<p data-lang="profile-error">${translations[currentLang]['profile-error']}</p>`;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
}

document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
    loadUserApplications();
});

// Обновление переводов при смене языка
document.addEventListener('languageChanged', () => {
    loadUserApplications(); // перезагрузить список с новыми переводами статусов
});