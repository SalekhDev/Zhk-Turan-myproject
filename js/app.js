// app.js – логика главной страницы (версия для GitHub Pages)

// Глобальная переменная для всех квартир (чтобы фильтры работали)
let allApartments = [];

// Функция бронирования (прокрутка к форме)
window.bookApartment = function(apartmentId) {
    const msgField = document.querySelector('textarea[name="message"]');
    if (msgField) {
        msgField.value = `Хочу забронировать квартиру #${apartmentId}`;
    }
    const contactSection = document.getElementById('contact');
    if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
    }
};

// Загрузка квартир из локального JSON
async function loadApartments() {
    const loadingEl = document.getElementById('loading');
    const gridEl = document.getElementById('apartmentsGrid');
    const noApartmentsEl = document.getElementById('noApartments');

    try {
        loadingEl.style.display = 'block';
        const response = await fetch('/data/apartments.json'); // путь к файлу
        const data = await response.json();

        if (data.apartments && data.apartments.length > 0) {
            allApartments = data.apartments; // сохраняем все
            const available = allApartments.filter(apt => apt.status === 'available');
            renderApartments(available);
            noApartmentsEl.style.display = 'none';
        } else {
            noApartmentsEl.style.display = 'block';
            gridEl.innerHTML = '';
        }
    } catch (error) {
        console.error('Ошибка загрузки квартир:', error);
        gridEl.innerHTML = '<p class="error">Не удалось загрузить квартиры</p>';
    } finally {
        loadingEl.style.display = 'none';
    }
}

// Отрисовка карточек квартир
function renderApartments(apartments) {
    const grid = document.getElementById('apartmentsGrid');
    if (!grid) return;

    if (apartments.length === 0) {
        document.getElementById('noApartments').style.display = 'block';
        grid.innerHTML = '';
        return;
    }

    const statusText = (status) => {
        switch(status) {
            case 'available': return 'Доступна';
            case 'reserved': return 'Забронирована';
            case 'sold': return 'Продана';
            default: return status;
        }
    };

    grid.innerHTML = apartments.map(apt => `
        <div class="apartment-card" data-apartment-id="${apt.id}">
            <div class="apartment-badge">Корпус ${apt.building}</div>
            <h3 class="apartment-title">${apt.rooms}-комнатная квартира</h3>
            <div class="apartment-details">
                <span>${apt.area} м²</span>
                <span>Этаж ${apt.floor}</span>
            </div>
            <div class="apartment-price">${apt.price.toLocaleString()} ₽</div>
            <div class="apartment-status status-${apt.status}">${statusText(apt.status)}</div>
            ${apt.description ? `<p class="apartment-description">${apt.description}</p>` : ''}
            <button class="btn-book" onclick="bookApartment(${apt.id})">Забронировать</button>
        </div>
    `).join('');

    document.getElementById('noApartments').style.display = 'none';
}

// Класс фильтров (работает с глобальным массивом allApartments)
class ApartmentFilter {
    constructor() {
        this.filters = {
            rooms: '',
            maxPrice: 20000000,
            building: ''
        };
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

    applyFilters() {
        // Фильтруем только доступные квартиры (можно убрать, если нужно показывать все)
        const available = allApartments.filter(apt => apt.status === 'available');
        const filtered = this.filterApartments(available);
        renderApartments(filtered);
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

// Отправка формы заявки (можно оставить как есть, но на GitHub Pages она не будет работать)
// Если хочешь, чтобы она просто показывала сообщение без отправки, замени код:
document.getElementById('applicationForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msgDiv = document.getElementById('formMessage');
    msgDiv.innerHTML = '<p style="color:green">Форма отправки отключена в демо-версии.</p>';
    setTimeout(() => msgDiv.innerHTML = '', 3000);
});

let filter;
document.addEventListener('DOMContentLoaded', () => {
    loadApartments();
    filter = new ApartmentFilter();
});
