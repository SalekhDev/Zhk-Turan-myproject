// app.js – логика главной страницы (обновлённая)

window.bookApartment = function(apartmentId) {
    document.querySelector('textarea[name="message"]').value = `Хочу забронировать квартиру #${apartmentId}`;
    window.scrollTo({ top: document.querySelector('#applicationForm').offsetTop, behavior: 'smooth' });
};

async function loadApartments() {
    try {
        const response = await fetch('/api/apartments/available');
        const data = await response.json();
        if (data.success) {
            renderApartments(data.apartments);
        }
        document.getElementById('loading').style.display = 'none';
    } catch (error) {
        document.getElementById('apartmentsGrid').innerHTML = '<p class="error">Ошибка загрузки</p>';
        document.getElementById('loading').style.display = 'none';
    }
}

function renderApartments(apartments) {
    const grid = document.getElementById('apartmentsGrid');
    if (!grid) return;
    
    if (apartments.length === 0) {
        grid.innerHTML = '<p class="no-apartments">Планировки временно недоступны</p>';
        return;
    }
    
    grid.innerHTML = apartments.map(apt => {
        // Дополнительные характеристики (можно добавить в БД позже)
        const hasBalcony = apt.hasBalcony ? 'Есть' : 'Нет';
        const bathroomType = apt.bathroomType || 'совмещённый';
        return `
        <div class="apartment-card">
            <div class="apartment-badge">Корпус ${apt.building}</div>
            <div class="apartment-info">
                <h3 class="apartment-title">${apt.rooms}-комнатная</h3>
                <div class="apartment-details">
                    <div class="apartment-detail-item">
                        <i class="fas fa-vector-square"></i>
                        <span>${apt.area} м²</span>
                    </div>
                    <div class="apartment-detail-item">
                        <i class="fas fa-building"></i>
                        <span>Этаж ${apt.floor}</span>
                    </div>
                    <div class="apartment-detail-item">
                        <i class="fas fa-door-open"></i>
                        <span>Санузел: ${bathroomType}</span>
                    </div>
                    <div class="apartment-detail-item">
                        <i class="fas fa-balcony"></i>
                        <span>Балкон: ${hasBalcony}</span>
                    </div>
                </div>
                <div class="apartment-price">${apt.price.toLocaleString()} ₽</div>
                <div class="apartment-status status-${apt.status}">${apt.status === 'available' ? 'Доступна' : (apt.status === 'reserved' ? 'Забронирована' : 'Продана')}</div>
                <button class="btn-book" onclick="bookApartment(${apt.id})">Забронировать</button>
            </div>
        </div>
    `}).join('');
}

class ApartmentFilter {
    constructor() {
        this.filters = { rooms: '', maxPrice: 20000000, building: '' };
        this.setupEventListeners();
    }
    setupEventListeners() {
        document.getElementById('filterRooms')?.addEventListener('change', (e) => {
            this.filters.rooms = e.target.value;
            this.applyFilters();
        });
        const priceRange = document.getElementById('priceRange');
        const priceValue = document.getElementById('priceValue');
        if (priceRange && priceValue) {
            priceRange.addEventListener('input', (e) => {
                this.filters.maxPrice = parseInt(e.target.value);
                priceValue.textContent = `${this.filters.maxPrice.toLocaleString()} ₽`;
                this.applyFilters();
            });
        }
        document.getElementById('filterBuilding')?.addEventListener('change', (e) => {
            this.filters.building = e.target.value;
            this.applyFilters();
        });
        document.getElementById('applyFilters')?.addEventListener('click', () => this.applyFilters());
        document.getElementById('resetFilters')?.addEventListener('click', () => this.resetFilters());
    }
    async applyFilters() {
        const all = await this.fetchAllApartments();
        const filtered = this.filterApartments(all);
        renderApartments(filtered);
    }
    async fetchAllApartments() {
        const res = await fetch('/api/apartments/available');
        const data = await res.json();
        return data.apartments || [];
    }
    filterApartments(apartments) {
        return apartments.filter(apt => {
            if (this.filters.rooms) {
                if (this.filters.rooms === '4' && apt.rooms < 4) return false;
                if (this.filters.rooms !== '4' && apt.rooms !== parseInt(this.filters.rooms)) return false;
            }
            if (this.filters.maxPrice && apt.price > this.filters.maxPrice) return false;
            if (this.filters.building && apt.building !== this.filters.building) return false;
            return true;
        });
    }
    resetFilters() {
        this.filters = { rooms: '', maxPrice: 20000000, building: '' };
        document.getElementById('filterRooms').value = '';
        document.getElementById('priceRange').value = 20000000;
        document.getElementById('priceValue').textContent = '20 000 000 ₽';
        document.getElementById('filterBuilding').value = '';
        this.applyFilters();
    }
}

document.getElementById('applicationForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    
    // Очистка номера телефона от лишних символов
    let rawPhone = form.phone.value.trim();
    // Удаляем пробелы, дефисы, скобки
    let cleanedPhone = rawPhone.replace(/[\s\-\(\)]/g, '');
    // Если номер не начинается с '+', добавляем его (предполагаем, что пользователь ввёл код страны)
    if (!cleanedPhone.startsWith('+')) {
        cleanedPhone = '+' + cleanedPhone;
    }
    
    const formData = {
        name: form.name.value.trim(),
        phone: cleanedPhone,
        email: form.email.value.trim(),
        message: form.message.value.trim()
    };
    
    const btn = form.querySelector('button');
    const msgDiv = document.getElementById('formMessage');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + (translations[currentLang]['form-submit'] || 'Отправка...');
    
    try {
        const res = await fetch('/api/applications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (data.success) {
            msgDiv.innerHTML = `<p style="color:green">${translations[currentLang]['form-success'] || data.message}</p>`;
            form.reset();
        } else {
            msgDiv.innerHTML = `<p style="color:red">${data.error || translations[currentLang]['form-error']}</p>`;
        }
    } catch (error) {
        msgDiv.innerHTML = `<p style="color:red">${translations[currentLang]['form-error'] || 'Ошибка сети'}</p>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = translations[currentLang]['form-submit'] || 'Отправить';
    }
});

let filter;
document.addEventListener('DOMContentLoaded', () => {
    loadApartments();
    filter = new ApartmentFilter();
});
// Preloader – скрываем после полной загрузки страницы
window.addEventListener('load', function() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        // Небольшая задержка для плавности
        setTimeout(() => {
            preloader.classList.add('hidden');
        }, 500);
    }
});