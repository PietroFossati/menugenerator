const MenuPlanner = {
    dishes: [],
    monthlyMenu: [],
    days: ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì'],
    mealTypes: {1: ['Pranzo'], 2: ['Cena'], 3: ['Pranzo', 'Cena']},
    categoryLabels: {primo:'Primo',secondo:'Secondo',contorno:'Contorno',piatto_unico:'Piatto Unico'},

    addDish() {
        const name = document.getElementById('dish-name').value.trim();
        const description = document.getElementById('dish-description').value.trim();
        const category = document.getElementById('dish-category').value;

        if (!name) return alert('Inserisci il nome del piatto!');

        this.dishes.push({ id: Date.now(), name, description, category });
        document.getElementById('dish-name').value = '';
        document.getElementById('dish-description').value = '';
        document.getElementById('dish-category').value = 'primo';

        this.renderDishes();
        this.updateDishesCount();
    },

    removeDish(id) {
        this.dishes = this.dishes.filter(d => d.id !== id);
        this.renderDishes();
        this.updateDishesCount();
    },

    renderDishes() {
        const container = document.getElementById('dishes-list');
        if (this.dishes.length === 0) {
            container.innerHTML = `<div class="no-dishes"><p>Inizia aggiungendo alcuni piatti!</p></div>`;
            return;
        }
container.innerHTML = this.dishes.map(dish => `
    <div class="dish-item">
        <div class="dish-header">
            <div class="dish-name">${dish.name}</div>
            <div class="dish-category">
                <span class="category-badge category-${dish.category}">${this.categoryLabels[dish.category]}</span>
            </div>
        </div>
        ${dish.description ? `<div class="dish-description">${dish.description}</div>` : ''}
        <div class="dish-actions">
            <button class="btn btn-danger" onclick="MenuPlanner.removeDish(${dish.id})">🗑️</button>
        </div>
    </div>
`).join('');
    },

    updateDishesCount() {
        document.getElementById('dishes-count').textContent = `(${this.dishes.length})`;
    },

    generateMonthlyMenu() {
        const mealsPerDay = parseInt(document.getElementById('meals-per-day').value);
        const meals = this.mealTypes[mealsPerDay];

        const db = {
            primo: this.dishes.filter(d => d.category === 'primo'),
            secondo: this.dishes.filter(d => d.category === 'secondo'),
            contorno: this.dishes.filter(d => d.category === 'contorno'),
            piatto_unico: this.dishes.filter(d => d.category === 'piatto_unico')
        };

        const mainsCount = db.primo.length + db.secondo.length + db.piatto_unico.length;
        if (mainsCount === 0 || db.contorno.length === 0) {
            return alert('Aggiungi almeno un principale e un contorno');
        }

        this.monthlyMenu = [];

        for (let w = 1; w <= 4; w++) {
            const weekly = {};
            const mainsPool = [...db.primo.map(d => ({ dish: d, type: 'primo' })),
                               ...db.secondo.map(d => ({ dish: d, type: 'secondo' })),
                               ...db.piatto_unico.map(d => ({ dish: d, type: 'piatto_unico' }))];
            const contorniPool = [...db.contorno];

            this.days.forEach(day => {
                weekly[day] = {};
                meals.forEach(meal => {
                    const main = this.getRandomDish(mainsPool, db, 'main');
                    const contorno = this.getRandomDish(contorniPool, db, 'contorno');
                    weekly[day][meal] = { main: main.dish, mainType: main.type, contorno };
                });
            });

            this.monthlyMenu.push(weekly);
        }

        this.renderMonthlyMenu();
    },

    getRandomDish(pool, db, type) {
        if (pool.length === 0) {
            if (type === 'main') {
                pool.push(...db.primo.map(d => ({ dish: d, type: 'primo' })),
                          ...db.secondo.map(d => ({ dish: d, type: 'secondo' })),
                          ...db.piatto_unico.map(d => ({ dish: d, type: 'piatto_unico' })));
            } else {
                pool.push(...db.contorno);
            }
        }
        const i = Math.floor(Math.random() * pool.length);
        return pool.splice(i, 1)[0];
    },

    renderMonthlyMenu() {
        const container = document.getElementById('menu-grid');
        const mealsPerDay = parseInt(document.getElementById('meals-per-day').value);
        const meals = this.mealTypes[mealsPerDay];

        if (this.monthlyMenu.length === 0) {
            container.innerHTML = `<div class="empty-menu"><p>Menu non ancora generato</p></div>`;
            return;
        }

        container.innerHTML = this.monthlyMenu.map((weekly, i) => `
            <div class="week-block">
                <h3 style="text-align:center;">Settimana ${i + 1}</h3>
                <div class="menu-grid">
                    ${this.days.map(day => `
                        <div class="day-column">
                            <div class="day-header">${day}</div>
                            ${meals.map(meal => {
                                const m = weekly[day][meal];
                                return `
                                    <div class="meal-slot">
                                        <div class="meal-label">${meal}</div>
                                        <div class="meal-course"><div class="course-name">${this.categoryLabels[m.mainType]}</div><div class="course-dish">${m.main?.name || 'Non disponibile'}</div></div>
                                        <div class="meal-course"><div class="course-name">Contorno</div><div class="course-dish">${m.contorno?.name || 'Non disponibile'}</div></div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    },

    exportToPDF() {
        if (this.monthlyMenu.length === 0) return alert('Genera prima un menu!');

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(20); doc.text('Menu Mensile', 20, 30);
        doc.setFontSize(12); doc.text(`Generato il: ${new Date().toLocaleDateString('it-IT')}`, 20, 45);

        let y = 60;
        this.monthlyMenu.forEach((weekly, i) => {
            doc.setFontSize(16); doc.text(`Settimana ${i + 1}`, 20, y); y += 10;
            this.days.forEach(day => {
                doc.setFontSize(14); doc.text(day, 20, y); y += 8;
                const mealsPerDay = parseInt(document.getElementById('meals-per-day').value);
                const meals = this.mealTypes[mealsPerDay];
                meals.forEach(meal => {
                    const m = weekly[day][meal];
                    doc.setFontSize(12);
                    doc.text(`${meal}:`, 25, y); y += 6;
                    doc.text(`  • ${this.categoryLabels[m.mainType]}: ${m.main?.name || 'ND'}`, 30, y); y += 6;
                    doc.text(`  • Contorno: ${m.contorno?.name || 'ND'}`, 30, y); y += 8;
                });
                y += 4; if (y > 260) { doc.addPage(); y = 30; }
            });
            y += 6;
        });

        doc.save('menu-mensile.pdf');
    }
};
