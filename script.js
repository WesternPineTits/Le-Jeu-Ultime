document.addEventListener('DOMContentLoaded', () => {
    // Elements principaux
    const startScreen = document.getElementById('start-screen');
    const categoriesScreen = document.getElementById('categories-screen');
    const rewardsScreen = document.getElementById('rewards-screen');
    const startButton = document.getElementById('start-button');
    const addCategoryButton = document.getElementById('add-category');
    const deleteCategoryButton = document.getElementById('delete-category');
    const rewardsButton = document.getElementById('rewards-button');
    const backToCategoriesButton = document.getElementById('back-to-categories');
    const addRewardButton = document.getElementById('add-reward');
    const scoreValue = document.getElementById('score-value');
    const rewardsContainer = document.querySelector('.rewards-container');
    const categoriesContainer = document.querySelector('.categories');
    const themeButton = document.getElementById('theme-button');
    const themePanel = document.getElementById('theme-panel');

    // État initial
    let score = parseInt(localStorage.getItem('gameScore')) || 0;
    let rewards = JSON.parse(localStorage.getItem('gameRewards')) || [];
    let claimedRewards = new Set(JSON.parse(localStorage.getItem('gameClaimedRewards')) || []);
    let deleteMode = false;

    // Initialisation du score
    scoreValue.textContent = score;

    // Navigation
    startButton.addEventListener('click', () => {
        startScreen.classList.remove('active');
        categoriesScreen.classList.add('active');
    });

    rewardsButton.addEventListener('click', () => {
        categoriesScreen.classList.remove('active');
        rewardsScreen.classList.add('active');
        updateRewardButtons();
    });

    backToCategoriesButton.addEventListener('click', () => {
        rewardsScreen.classList.remove('active');
        categoriesScreen.classList.add('active');
    });

    // Gestion du score
    function updateScore(points) {
        score += points;
        scoreValue.textContent = score;
        localStorage.setItem('gameScore', score.toString());
        updateRewardButtons();
    }

    // Gestion des catégories
    function createCategoryButton(name, points) {
        const newButton = document.createElement('button');
        newButton.className = 'category-btn';
        newButton.textContent = name;
        newButton.dataset.points = points || "1";
        addCategoryEventListener(newButton);
        return newButton;
    }

    function addCategoryEventListener(button) {
        button.addEventListener('click', () => {
            if (deleteMode) {
                if (confirm(`Voulez-vous vraiment supprimer la catégorie "${button.textContent}" ?`)) {
                    button.remove();
                    saveCategories();
                }
            } else {
                updateScore(parseInt(button.dataset.points) || 1);
            }
        });
    }

    // Ajout des écouteurs d'événements aux catégories existantes
    document.querySelectorAll('.category-btn').forEach(button => {
        if (!button.id || button.id !== 'add-category') {
            addCategoryEventListener(button);
        }
    });

    // Ajout de catégorie
    addCategoryButton.addEventListener('click', () => {
        if (deleteMode) {
            exitDeleteMode();
        }
        const categoryName = prompt('Entrez le nom de la nouvelle catégorie:');
        if (categoryName && categoryName.trim() !== '') {
            const newButton = createCategoryButton(categoryName);
            categoriesContainer.appendChild(newButton);
            saveCategories();
        }
    });

    // Mode suppression
    function exitDeleteMode() {
        deleteMode = false;
        deleteCategoryButton.textContent = '- Supprimer une catégorie';
        deleteCategoryButton.classList.remove('selected');
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
    }

    deleteCategoryButton.addEventListener('click', () => {
        deleteMode = !deleteMode;
        if (deleteMode) {
            deleteCategoryButton.textContent = 'Annuler la suppression';
            deleteCategoryButton.classList.add('selected');
            document.querySelectorAll('.category-btn').forEach(btn => {
                btn.classList.add('selected');
            });
        } else {
            exitDeleteMode();
        }
    });

    // Sauvegarde des catégories
    function saveCategories() {
        const categories = [];
        document.querySelectorAll('.category-btn').forEach(btn => {
            if (!btn.id || btn.id !== 'add-category') {
                categories.push({
                    name: btn.textContent,
                    points: btn.dataset.points
                });
            }
        });
        localStorage.setItem('gameCategories', JSON.stringify(categories));
    }

    // Chargement des catégories
    function loadCategories() {
        const savedCategories = JSON.parse(localStorage.getItem('gameCategories'));
        if (savedCategories) {
            document.querySelectorAll('.category-btn').forEach(btn => {
                if (!btn.id || btn.id !== 'add-category') {
                    btn.remove();
                }
            });
            
            savedCategories.forEach(category => {
                const newButton = createCategoryButton(category.name, category.points);
                categoriesContainer.appendChild(newButton);
            });
        }
    }

    // Gestion des récompenses
    function createRewardElement(reward) {
        const rewardDiv = document.createElement('div');
        rewardDiv.className = 'reward-item';
        rewardDiv.dataset.rewardId = reward.id;
        rewardDiv.dataset.requiredPoints = reward.points;

        rewardDiv.innerHTML = `
            <button class="delete-reward">×</button>
            <h3>${reward.name}</h3>
            <p>${reward.points} points requis</p>
            <button class="claim-reward" ${claimedRewards.has(reward.id) ? 'disabled' : ''}>
                ${claimedRewards.has(reward.id) ? 'Réclamé' : 'Réclamer'}
            </button>
        `;

        const deleteButton = rewardDiv.querySelector('.delete-reward');
        deleteButton.addEventListener('click', () => {
            if (confirm('Voulez-vous vraiment supprimer cette récompense ?')) {
                rewards = rewards.filter(r => r.id !== reward.id);
                rewardDiv.remove();
                localStorage.setItem('gameRewards', JSON.stringify(rewards));
            }
        });

        const claimButton = rewardDiv.querySelector('.claim-reward');
        claimButton.addEventListener('click', () => {
            if (score >= reward.points && !claimedRewards.has(reward.id)) {
                claimedRewards.add(reward.id);
                claimButton.disabled = true;
                claimButton.textContent = 'Réclamé';
                localStorage.setItem('gameClaimedRewards', JSON.stringify([...claimedRewards]));
                alert(`Félicitations ! Vous avez débloqué : ${reward.name} !`);
            }
        });

        return rewardDiv;
    }

    function updateRewardButtons() {
        rewards.forEach(reward => {
            const rewardElement = document.querySelector(`[data-reward-id="${reward.id}"]`);
            if (rewardElement) {
                const claimButton = rewardElement.querySelector('.claim-reward');
                if (!claimedRewards.has(reward.id)) {
                    claimButton.disabled = score < reward.points;
                }
            }
        });
    }

    // Chargement des récompenses
    function loadRewards() {
        rewardsContainer.innerHTML = '';
        rewards.forEach(reward => {
            rewardsContainer.appendChild(createRewardElement(reward));
        });
        updateRewardButtons();
    }

    // Ajout de récompense
    addRewardButton.addEventListener('click', () => {
        const name = prompt('Nom de la récompense :');
        if (!name || name.trim() === '') return;

        const points = parseInt(prompt('Nombre de points requis :'));
        if (isNaN(points) || points <= 0) {
            alert('Veuillez entrer un nombre de points valide (supérieur à 0)');
            return;
        }

        const reward = {
            id: Date.now().toString(),
            name: name,
            points: points
        };

        rewards.push(reward);
        rewardsContainer.appendChild(createRewardElement(reward));
        localStorage.setItem('gameRewards', JSON.stringify(rewards));
        updateRewardButtons();
    });

    // Chargement initial des données
    loadCategories();
    loadRewards();
});
