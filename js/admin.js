// admin.js – логика админ-панели

// Проверяем, что пользователь – администратор или менеджер
// Функция checkAdminAccess определена в auth.js, который должен быть подключён ранее
checkAdminAccess();

document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    loadApplications();
    loadApartments();
    setupTabs();
    setupAddApartmentForm();
    setupReloadButton();
});

// Переключение вкладок
function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const tabName = this.getAttribute('data-tab');
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        });
    });
}

// Загрузка статистики
async function loadStats() {
    const token = localStorage.getItem('token');
    try {
        const [aptRes, appRes] = await Promise.all([
            fetch('/api/apartments/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch('/api/applications/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);
        const aptData = await aptRes.json();
        const appData = await appRes.json();

        if (aptData.success) {
            document.getElementById('totalApartments').textContent = aptData.stats.total || 0;
            document.getElementById('availableApartments').textContent = aptData.stats.available || 0;
        }
        if (appData.success) {
            document.getElementById('totalApplications').textContent = appData.stats.total || 0;
            document.getElementById('newApplications').textContent = appData.stats.new || 0;
        }
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

// Загрузка заявок
async function loadApplications() {
    const token = localStorage.getItem('token');
    const loadingEl = document.getElementById('applicationsLoading');
    const tableEl = document.getElementById('applicationsTable');
    const tbody = document.getElementById('applicationsBody');

    try {
        loadingEl.style.display = 'block';
        tableEl.style.display = 'none';

        const response = await fetch('/api/applications', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
            tbody.innerHTML = '';
            if (data.applications.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Нет заявок</td></tr>';
            } else {
                data.applications.forEach(app => {
                    const statusClass = app.status === 'new' ? 'status-new' :
                                        app.status === 'processed' ? 'status-processed' : 'status-completed';
                    const statusText = app.status === 'new' ? 'Новая' :
                                      app.status === 'processed' ? 'В обработке' : 'Завершена';
                    const row = `
                        <tr>
                            <td>${app.id}</td>
                            <td>${app.name}</td>
                            <td>${app.phone}</td>
                            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                            <td>${new Date(app.createdAt).toLocaleDateString()}</td>
                            <td>
                                <button class="action-btn btn-view" onclick="viewApplication(${app.id})">👁️</button>
                                <button class="action-btn btn-edit" onclick="editApplication(${app.id})">✏️</button>
                                <button class="action-btn btn-delete" onclick="deleteApplication(${app.id})">🗑️</button>
                            </td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
                });
            }
            loadingEl.style.display = 'none';
            tableEl.style.display = 'table';
        } else {
            loadingEl.innerHTML = '<p style="color:red;">Ошибка загрузки</p>';
        }
    } catch (error) {
        loadingEl.innerHTML = '<p style="color:red;">Ошибка сети</p>';
    }
}

// Загрузка квартир
async function loadApartments() {
    const token = localStorage.getItem('token');
    const loadingEl = document.getElementById('apartmentsLoading');
    const tableEl = document.getElementById('apartmentsTable');
    const tbody = document.getElementById('apartmentsBody');

    try {
        loadingEl.style.display = 'block';
        tableEl.style.display = 'none';

        const response = await fetch('/api/apartments', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
            tbody.innerHTML = '';
            if (data.apartments.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Нет квартир</td></tr>';
            } else {
                data.apartments.forEach(apt => {
                    const statusClass = apt.status === 'available' ? 'status-available' :
                                       apt.status === 'reserved' ? 'status-reserved' : 'status-sold';
                    const statusText = apt.status === 'available' ? 'Доступна' :
                                       apt.status === 'reserved' ? 'Забронирована' : 'Продана';
                    const row = `
                        <tr>
                            <td>${apt.id}</td>
                            <td>${apt.rooms}</td>
                            <td>${apt.area} м²</td>
                            <td>${apt.floor}</td>
                            <td>${apt.price.toLocaleString()} ₽</td>
                            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                            <td>${apt.description || '-'}</td>
                            <td>
                                <button class="action-btn btn-edit" onclick="editApartment(${apt.id})">✏️</button>
                                <button class="action-btn btn-delete" onclick="deleteApartment(${apt.id})">🗑️</button>
                            </td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
                });
            }
            loadingEl.style.display = 'none';
            tableEl.style.display = 'table';
        } else {
            loadingEl.innerHTML = '<p style="color:red;">Ошибка загрузки</p>';
        }
    } catch (error) {
        loadingEl.innerHTML = '<p style="color:red;">Ошибка сети</p>';
    }
}

// Обработка формы добавления квартиры
function setupAddApartmentForm() {
    const form = document.getElementById('addApartmentForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const token = localStorage.getItem('token');
        const formData = {
            rooms: parseInt(document.getElementById('rooms').value),
            area: parseFloat(document.getElementById('area').value),
            floor: parseInt(document.getElementById('floor').value),
            price: parseInt(document.getElementById('price').value),
            status: document.getElementById('status').value,
            building: document.getElementById('building').value,
            description: document.getElementById('description').value
        };

        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Сохранение...';

        try {
            const response = await fetch('/api/apartments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const data = await response.json();

            if (data.success) {
                document.getElementById('formMessage').innerHTML = '<p style="color:green;">Квартира успешно добавлена!</p>';
                form.reset();
                // Переключаемся на вкладку со списком квартир и обновляем
                document.querySelector('.tab-btn[data-tab="apartments"]').click();
                loadApartments();
                loadStats();
            } else {
                document.getElementById('formMessage').innerHTML = `<p style="color:red;">${data.error || 'Ошибка'}</p>`;
            }
        } catch (error) {
            document.getElementById('formMessage').innerHTML = '<p style="color:red;">Ошибка сети</p>';
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    });
}

// Кнопка обновления данных на вкладке настроек
function setupReloadButton() {
    const reloadBtn = document.getElementById('reloadDataBtn');
    if (reloadBtn) {
        reloadBtn.addEventListener('click', () => {
            loadStats();
            loadApplications();
            loadApartments();
        });
    }
}

// Функции для действий с заявками
window.viewApplication = async function(id) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`/api/applications/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
            const app = data.application;
            alert(`Заявка #${app.id}\nИмя: ${app.name}\nТелефон: ${app.phone}\nEmail: ${app.email || '-'}\nСтатус: ${app.status}\nДата: ${new Date(app.createdAt).toLocaleString()}`);
        }
    } catch (error) {
        alert('Ошибка загрузки');
    }
};

window.editApplication = async function(id) {
    const newStatus = prompt('Введите новый статус (new/processed/completed):');
    if (!newStatus) return;

    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`/api/applications/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });
        const data = await response.json();
        if (data.success) {
            alert('Статус обновлён');
            loadApplications();
            loadStats();
        } else {
            alert(data.error || 'Ошибка');
        }
    } catch (error) {
        alert('Ошибка сети');
    }
};

window.deleteApplication = async function(id) {
    if (!confirm('Удалить заявку?')) return;

    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`/api/applications/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
            alert('Заявка удалена');
            loadApplications();
            loadStats();
        } else {
            alert(data.error || 'Ошибка');
        }
    } catch (error) {
        alert('Ошибка сети');
    }
};

window.editApartment = async function(id) {
    const newPrice = prompt('Введите новую цену (руб):');
    if (!newPrice || isNaN(newPrice)) return;

    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`/api/apartments/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ price: parseInt(newPrice) })
        });
        const data = await response.json();
        if (data.success) {
            alert('Цена обновлена');
            loadApartments();
        } else {
            alert(data.error || 'Ошибка');
        }
    } catch (error) {
        alert('Ошибка сети');
    }
};

window.deleteApartment = async function(id) {
    if (!confirm('Удалить квартиру?')) return;

    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`/api/apartments/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
            alert('Квартира удалена');
            loadApartments();
            loadStats();
        } else {
            alert(data.error || 'Ошибка');
        }
    } catch (error) {
        alert('Ошибка сети');
    }
};

// Функция выхода не нужна, так как она уже определена в auth.js