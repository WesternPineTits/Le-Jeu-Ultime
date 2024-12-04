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

    // Elements de personnalisation
    const themeButton = document.getElementById('theme-button');
    const themePanel = document.getElementById('theme-panel');
    const themePresets = document.querySelectorAll('.theme-preset');
    const colorInputs = {
        backgroundColor: document.getElementById('backgroundColor'),
        textColor: document.getElementById('textColor'),
        buttonColor: document.getElementById('buttonColor'),
        goButtonColor: document.getElementById('goButtonColor')
    };

    // État initial
    let score = parseInt(localStorage.getItem('gameScore')) || 0;
    let rewards = JSON.parse(localStorage.getItem('gameRewards')) || [];
    let claimedRewards = new Set(JSON.parse(localStorage.getItem('gameClaimedRewards')) || []);
    let deleteMode = false;

    // Chargement du thème sauvegardé
    loadTheme();

    // Gestion du panneau de personnalisation
    themeButton.addEventListener('click', () => {
        themePanel.classList.toggle('active');
    });

    // Fermer le panneau si on clique en dehors
    document.addEventListener('click', (e) => {
        if (!themePanel.contains(e.target) && !themeButton.contains(e.target)) {
            themePanel.classList.remove('active');
        }
    });

    // Gestion des thèmes prédéfinis
    themePresets.forEach(button => {
        button.addEventListener('click', () => {
            const theme = button.dataset.theme;
            document.body.setAttribute('data-theme', theme);
            saveTheme({ preset: theme });
            updateColorInputs();
        });
    });

    // Gestion des couleurs personnalisées
    Object.entries(colorInputs).forEach(([key, input]) => {
        input.addEventListener('change', () => {
            updateCustomColors();
        });
    });

    function updateCustomColors() {
        const colors = {
            backgroundColor: colorInputs.backgroundColor.value,
            textColor: colorInputs.textColor.value,
            buttonColor: colorInputs.buttonColor.value,
            goButtonColor: colorInputs.goButtonColor.value
        };

        document.documentElement.style.setProperty('--background-color', colors.backgroundColor);
        document.documentElement.style.setProperty('--text-color', colors.textColor);
        document.documentElement.style.setProperty('--button-color', colors.buttonColor);
        document.documentElement.style.setProperty('--go-button-color', colors.goButtonColor);

        // Calculer les couleurs hover automatiquement
        const buttonHoverColor = adjustBrightness(colors.buttonColor, 20);
        document.documentElement.style.setProperty('--button-hover-color', buttonHoverColor);

        saveTheme({ custom: colors });
    }

    function adjustBrightness(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    function updateColorInputs() {
        const computedStyle = getComputedStyle(document.documentElement);
        colorInputs.backgroundColor.value = computedStyle.getPropertyValue('--background-color').trim();
        colorInputs.textColor.value = computedStyle.getPropertyValue('--text-color').trim();
        colorInputs.buttonColor.value = computedStyle.getPropertyValue('--button-color').trim();
        colorInputs.goButtonColor.value = computedStyle.getPropertyValue('--go-button-color').trim();
    }

    function saveTheme(theme) {
        localStorage.setItem('gameTheme', JSON.stringify(theme));
    }

    function loadTheme() {
        const savedTheme = JSON.parse(localStorage.getItem('gameTheme'));
        if (savedTheme) {
            if (savedTheme.preset) {
                document.body.setAttribute('data-theme', savedTheme.preset);
            } else if (savedTheme.custom) {
                document.documentElement.style.setProperty('--background-color', savedTheme.custom.backgroundColor);
                document.documentElement.style.setProperty('--text-color', savedTheme.custom.textColor);
                document.documentElement.style.setProperty('--button-color', savedTheme.custom.buttonColor);
                document.documentElement.style.setProperty('--go-button-color', savedTheme.custom.goButtonColor);
                document.documentElement.style.setProperty('--button-hover-color', 
                    adjustBrightness(savedTheme.custom.buttonColor, 20));
            }
            updateColorInputs();
        }
    }

    // Score initial
    scoreValue.textContent = score;

    // Fonctions de sauvegarde
    function saveScore() {
        localStorage.setItem('gameScore', score.toString());
    }

    function saveRewards() {
        localStorage.setItem('gameRewards', JSON.stringify(rewards));
    }

    function saveClaimedRewards() {
        localStorage.setItem('gameClaimedRewards', JSON.stringify([...claimedRewards]));
    }

    function saveCategories() {
        const categories = [];
        document.querySelectorAll('.category-btn:not(#add-category)').forEach(btn => {
            categories.push({
                name: btn.textContent,
                points: btn.dataset.points
            });
        });
        localStorage.setItem('gameCategories', JSON.stringify(categories));
    }

    // Chargement des catégories
    function loadCategories() {
        const savedCategories = JSON.parse(localStorage.getItem('gameCategories'));
        if (savedCategories) {
            document.querySelectorAll('.category-btn:not(#add-category)').forEach(btn => btn.remove());
            savedCategories.forEach(category => {
                const newButton = createCategoryButton(category.name, category.points);
                categoriesContainer.appendChild(newButton);
            });
        }
    }

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
        saveScore();
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
                saveRewards();
            }
        });

        const claimButton = rewardDiv.querySelector('.claim-reward');
        claimButton.addEventListener('click', () => {
            if (score >= reward.points && !claimedRewards.has(reward.id)) {
                claimedRewards.add(reward.id);
                claimButton.disabled = true;
                claimButton.textContent = 'Réclamé';
                saveClaimedRewards();
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
        saveRewards();
        updateRewardButtons();
    });

    // Chargement initial des données
    loadCategories();
    loadRewards();
});
