const STORAGE_KEYS = {
  accounts: 'swipetravel.accounts',
  session: 'swipetravel.session'
};

const state = {
  screen: 'auth',
  tripsFilter: 'active',
  detailTab: 'votes',
  currentTripId: 1,
  suggestionIndexByTrip: {},
  createTripDuration: 4,
  authMode: 'login',
  authenticated: false,
  currentUser: null,
  trips: readJSON('swipetravel.trips', [
    // Removed 'Summer Holidays' from here to start from scratch
    {
      id: 2,
      name: 'Barcelona Group',
      destination: 'Spain',
      city: 'Barcelona',
      start: '10 Jun',
      end: '25 Jun',
      durationDays: 15,
      budget: 650,
      status: 'closed',
      members: ['Maria', 'Pedro', 'Nuno', 'Joao'],
      votesCompleted: 6,
      votesTotal: 6,
      missingItem: '',
      approvedActivities: [
        { name: 'Sagrada Familia', price: 26 },
        { name: 'Beach afternoon', price: 0 }
      ],
      itinerary: [{ day: 1, nowNextTitle: 'Trip completed', items: ['Final itinerary archived'] }],
      expenses: [],
      pendingActions: [],
      suggestions: [],
      voteResults: { destination: 'Barcelona', accommodation: 'Shared apartment' }
    }
  ])
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function safeListen(selector, event, fn) {
  const el = $(selector);
  if (el) el.addEventListener(event, fn);
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getAccounts() {
  return readJSON(STORAGE_KEYS.accounts, []);
}

function saveAccounts(accounts) {
  writeJSON(STORAGE_KEYS.accounts, accounts);
}

function saveSession() {
  if (!state.authenticated || !state.currentUser) {
    localStorage.removeItem(STORAGE_KEYS.session);
    return;
  }
  writeJSON(STORAGE_KEYS.session, { email: state.currentUser.email });
}

function seedDemoAccount() {
  const accounts = getAccounts();
  if (accounts.length) return;
  saveAccounts([{ name: 'Demo User', email: 'demo@swipetravel.app', password: '123456' }]);
}

function loadSession() {
  const session = readJSON(STORAGE_KEYS.session, null);
  const accounts = getAccounts();
  const matchedAccount = session
    ? accounts.find((account) => account.email.toLowerCase() === session.email.toLowerCase())
    : null;

  if (matchedAccount) {
    state.authenticated = true;
    state.currentUser = matchedAccount;
    state.screen = 'home';
    return;
  }
  state.authenticated = false;
  state.currentUser = null;
  state.screen = 'auth';
}

function getCurrentTrip() {
  return state.trips.find((trip) => trip.id === state.currentTripId) || state.trips[0];
}

function formatCurrency(value) {
  return `EUR${Number(value).toFixed(2).replace('.00', '')}`;
}

function initials(name) {
  return name.split(' ').map((part) => part[0] || '').join('').slice(0, 2).toUpperCase();
}

function showAuthFeedback(message, type = 'error') {
  const feedback = $('#auth-feedback');
  if (!feedback) return;
  feedback.textContent = message;
  feedback.className = `auth-feedback ${type}`;
}

function clearAuthFeedback() {
  const feedback = $('#auth-feedback');
  if (!feedback) return;
  feedback.textContent = '';
  feedback.className = 'auth-feedback hidden';
}

function clearAuthForms() {
  ['#login-email', '#login-password', '#register-name', '#register-email', '#register-password', '#register-confirm-password'].forEach((selector) => {
    const input = $(selector);
    if (input) input.value = '';
  });
}

function setAuthMode(mode) {
  state.authMode = mode;
  clearAuthFeedback();
  renderAuth();
}

function completeLogin(account) {
  state.authenticated = true;
  state.currentUser = account;
  saveSession();
  clearAuthFeedback();
  setScreen('home');
}

function login() {
  const emailInput = $('#login-email');
  const passInput = $('#login-password');
  if (!emailInput || !passInput) return;
  const email = emailInput.value.trim().toLowerCase();
  const password = passInput.value;
  if (!email || !password) {
    showAuthFeedback('Fill in the email and password.');
    return;
  }
  const account = getAccounts().find((item) => item.email.toLowerCase() === email && item.password === password);
  if (!account) {
    showAuthFeedback('Account not found. You can create a new account in the registration tab.');
    return;
  }
  completeLogin(account);
}

function register() {
  const name = $('#register-name')?.value.trim();
  const email = $('#register-email')?.value.trim().toLowerCase();
  const password = $('#register-password')?.value;
  const confirmPassword = $('#register-confirm-password')?.value;
  const accounts = getAccounts();
  if (!name || !email || !password || !confirmPassword) {
    showAuthFeedback('Fill in all fields to create the account.');
    return;
  }
  if (!email.includes('@')) {
    showAuthFeedback('Enter a valid email.');
    return;
  }
  if (password.length < 6) {
    showAuthFeedback('The password must be at least 6 characters long.');
    return;
  }
  if (password !== confirmPassword) {
    showAuthFeedback('Passwords do not match.');
    return;
  }
  if (accounts.some((account) => account.email.toLowerCase() === email)) {
    showAuthFeedback('An account with this email already exists.');
    return;
  }
  const newAccount = { name, email, password };
  accounts.push(newAccount);
  saveAccounts(accounts);
  if($('#login-email')) $('#login-email').value = email;
  if($('#login-password')) $('#login-password').value = password;
  setAuthMode('login');
  showAuthFeedback('Account created successfully. Now just sign in.', 'success');
}

function logout() {
  state.authenticated = false;
  state.currentUser = null;
  state.authMode = 'login';
  saveSession();
  clearAuthForms();
  setScreen('auth');
}

function setScreen(screen) {
  const targetScreen = state.authenticated || screen === 'auth' ? screen : 'auth';
  state.screen = targetScreen;
  $$('.screen').forEach((el) => el.classList.remove('active'));
  const nextScreen = $(`#screen-${targetScreen}`);
  if (nextScreen) nextScreen.classList.add('active');
  $$('.nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.nav === targetScreen);
  });
  render();
}

function openModal(id) {
  const modal = $(`#${id}`);
  if (modal) modal.classList.add('active');
}

function closeModal(id) {
  const modal = $(`#${id}`);
  if (modal) modal.classList.remove('active');
}

function renderAuth() {
  $$('[data-auth-mode]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.authMode === state.authMode);
  });
  if($('#auth-login-form')) $('#auth-login-form').classList.toggle('hidden', state.authMode !== 'login');
  if($('#auth-register-form')) $('#auth-register-form').classList.toggle('hidden', state.authMode !== 'register');
}

function renderHome() {
  const currentUserName = state.currentUser?.name || 'User';
  const homeGreeting = $('#screen-home .brand h1');
  if (homeGreeting) homeGreeting.textContent = `Hello, ${currentUserName} 👋`;

  const allPending = state.trips.flatMap((trip) =>
    trip.pendingActions.map((action) => ({ ...action, tripId: trip.id, tripName: trip.name }))
  );

  const countLabel = $('#pending-count-label');
  if(countLabel) countLabel.textContent = `${allPending.length} item${allPending.length === 1 ? '' : 's'}`;
  const tripCountLabel = $('#trip-count-label');
  if(tripCountLabel) tripCountLabel.textContent = `${state.trips.length} trip${state.trips.length === 1 ? '' : 's'}`;

  const pendingContainer = $('#pending-actions-list');
  if (pendingContainer) {
    if (!allPending.length) {
      pendingContainer.innerHTML = '<div class="empty-state">No pending actions right now :)</div>';
    } else {
      pendingContainer.innerHTML = allPending.map((action) => `
        <div class="action-card">
          <strong>${action.tripName}</strong>
          <div class="muted">${action.description}</div>
          <div class="spacer-8"></div>
          <button class="small-link" onclick="openTripFromAction(${action.tripId})">${action.cta}</button>
        </div>
      `).join('');
    }
  }
  const homeTripList = $('#home-trip-list');
  if(homeTripList) homeTripList.innerHTML = state.trips.map(renderTripCard).join('');
  
}

function renderTripCard(trip) {
  const memberCount = trip.members.length;
  const badgeText = trip.status === 'closed' ? 'Closed' : trip.votesCompleted < trip.votesTotal ? 'Planning' : 'Ongoing';
  const badgeClass = trip.status === 'closed' ? 'closed' : trip.votesCompleted < trip.votesTotal ? 'planning' : 'progress';
  const statusLine = trip.status === 'closed' ? 'Accounts settled' : trip.missingItem ? `Missing ${trip.missingItem}` : 'Trip ready';

  return `
    <div class="trip-card" onclick="openTrip(${trip.id})">
      <div class="trip-card-content">
        <div class="trip-info-side">
          <h4 class="trip-title">
            ${trip.name} <span class="status-arrow">→</span> <span class="status-text ${badgeClass}">${badgeText}</span>
          </h4>
          <div class="trip-meta">${trip.start} to ${trip.end} • ${memberCount} members</div>
          <div class="muted" style="margin-top: 8px; font-size: 0.85rem;">${statusLine}</div>
        </div>

        <div class="trip-actions-side">
          <button class="delete-btn-elegant" onclick="deleteTrip(event, ${trip.id})">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
          <span class="votes-badge">${trip.votesCompleted}/${trip.votesTotal} votes</span>
        </div>
      </div>
    </div>
  `;
}

function renderTrips() {
  const isClosed = state.tripsFilter === 'closed';
  const filtered = state.trips.filter((trip) => isClosed ? trip.status === 'closed' : trip.status !== 'closed');
  const tripsList = $('#trips-list');
  if(tripsList) {
    tripsList.innerHTML = filtered.length ? filtered.map(renderTripCard).join('') : '<div class="empty-state">No trips in this section yet.</div>';
  }
  $$('[data-trip-filter]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tripFilter === state.tripsFilter);
  });
}

function renderTripDetail() {
  const trip = getCurrentTrip();
  if (!trip) return;
  if($('#trip-detail-title')) $('#trip-detail-title').textContent = trip.name;
  if($('#trip-detail-subtitle')) $('#trip-detail-subtitle').textContent = `${trip.start} to ${trip.end} • ${trip.members.length} members`;
  if($('#vote-progress-label')) $('#vote-progress-label').textContent = `${trip.votesCompleted}/${trip.votesTotal} completed`;
  if($('#winning-destination')) $('#winning-destination').innerHTML = `<strong>📍 ${trip.voteResults.destination}</strong>`;
  if($('#winning-accommodation')) $('#winning-accommodation').innerHTML = `<strong>🏠 ${trip.voteResults.accommodation}</strong>`;
  
  const activitiesContainer = $('#approved-activities');
  if(activitiesContainer) {
    activitiesContainer.innerHTML = trip.approvedActivities.length
      ? trip.approvedActivities.map((activity) => `<div class="timeline-item">${activity.name} <span class="muted">(${formatCurrency(activity.price)})</span></div>`).join('')
      : '<div class="empty-state">No approved activities yet.</div>';
  }

  const itineraryDay = trip.itinerary[0] || { day: 1, items: ['Trip created successfully', 'Start adding votes, members and expenses'] };
  if($('#itinerary-day-label')) $('#itinerary-day-label').textContent = `Day ${itineraryDay.day}`;
  if($('#itinerary-current')) $('#itinerary-current').innerHTML = itineraryDay.items.map((item) => `<div class="timeline-item">${item}</div>`).join('');

  const totalSpent = trip.expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const pendingExpenses = trip.expenses.filter((expense) => expense.pending);
  if($('#group-total-spent')) $('#group-total-spent').textContent = formatCurrency(totalSpent);
  if($('#pending-balance-count')) $('#pending-balance-count').textContent = `${pendingExpenses.length} pending`;
  if($('#expense-quick-status')) $('#expense-quick-status').textContent = pendingExpenses.length ? 'Balances still open' : 'Nothing owed';

  if($('#member-list-inline')) {
    $('#member-list-inline').innerHTML = trip.members.map((member) => `
      <div class="member-row">
        <div class="member-info">
          <div class="avatar">${initials(member)}</div>
          <div><strong>${member}</strong><div class="muted">Trip member</div></div>
        </div>
        <button class="small-link" onclick="removeMember('${member.replace(/'/g, "\\'")}')">Remove</button>
      </div>
    `).join('');
  }

  const expList = $('#expense-list');
if (expList) {
  expList.innerHTML = trip.expenses.length ? trip.expenses.map((expense) => `
    <div class="expense-item ${expense.pending ? 'pending' : 'settled'}">
      <div class="row-between">
        <div>
          <strong>${expense.title}</strong>
          <div class="expense-note">Split between ${expense.participants} people</div>
        </div>
        <div class="expense-amount">€${Number(expense.amount).toFixed(2)}</div>
      </div>
      <div class="spacer-8"></div>
      <div class="muted">Each person owes <strong>€${Number(expense.owedPerPerson).toFixed(2)}</strong></div>
      <div class="spacer-8"></div>
      ${expense.pending
        ? `<button class="secondary-btn" onclick="markExpensePaid(${trip.id}, ${expense.id})">Mark as settled ✅</button>`
        : '<div class="muted">Settled ✅</div>'
      }
    </div>
  `).join('') : '<div class="empty-state">No expenses yet.</div>';
}

  

  $$('[data-detail-tab]').forEach((btn) => btn.classList.toggle('active', btn.dataset.detailTab === state.detailTab));
  if($('#trip-tab-votes')) $('#trip-tab-votes').classList.toggle('hidden', state.detailTab !== 'votes');
  if($('#trip-tab-itinerary')) $('#trip-tab-itinerary').classList.toggle('hidden', state.detailTab !== 'itinerary');
  if($('#trip-tab-expenses')) $('#trip-tab-expenses').classList.toggle('hidden', state.detailTab !== 'expenses');
}

function renderSuggestions() {
  const trip = getCurrentTrip();
  if (!trip) return;
  
  if($('#suggestions-title')) $('#suggestions-title').textContent = `${trip.name} suggestions`;
  
  // Read from the trip object
  if (trip.currentSuggestionIndex === undefined) trip.currentSuggestionIndex = 0;
  const index = trip.currentSuggestionIndex;
  
  const suggestion = trip.suggestions[index];
  const container = $('#suggestion-deck');
  if (!container) return;

  if (!suggestion) {
    container.innerHTML = `
      <div class="empty-state">
        <strong>📍 All suggestions reviewed</strong>
        <div class="spacer-8"></div>
        <div>The destination <b>${trip.voteResults.destination}</b> was selected.</div>
        <div class="spacer-16"></div>
        <button class="primary-btn" onclick="setScreen('trip-detail')">Back to Trip</button>
      </div>`;
    return;
  }

  container.innerHTML = `
  <div class="suggestion-card" id="active-suggestion-card">
    <div class="suggestion-image">
      ${
        suggestion.image
          ? `<img src="${suggestion.image}" alt="${suggestion.city}">`
          : suggestion.emoji || '📍'
      }
    </div>

    <div class="suggestion-body">
      <div class="muted">Suggestion #${index + 1}</div>
      <h3>${suggestion.city}</h3>
      <div class="muted">${suggestion.subtitle}</div>
      <div class="muted">Suggested by ${suggestion.suggestedBy || 'SwipeTravel'}</div>

      <div class="spacer-16"></div>
      <div class="big-number">Average cost ${formatCurrency(suggestion.avgCost)}</div>

      <div class="swipe-actions">
        <button class="skip-btn" onclick="swipeSuggestion('skip')">✕ Skip</button>
        <button class="like-btn" onclick="swipeSuggestion('like')">♥ Like</button>
      </div>
    </div>
  </div>
`;

  // Swipe logic
  const card = $('#active-suggestion-card');
  let startX = 0;
  let currentX = 0;
  let isDragging = false;

  const onStart = (e) => {
    isDragging = true;
    startX = e.pageX || e.touches[0].pageX;
    card.style.transition = 'none';
  };

  const onMove = (e) => {
    if (!isDragging) return;
    currentX = e.pageX || (e.touches ? e.touches[0].pageX : 0);
    const diff = currentX - startX;
    card.style.transform = `translateX(${diff}px) rotate(${diff / 15}deg)`;
    
    // Optional visual color feedback
    if (diff > 50) card.style.background = '#ecfdf3'; // Like
    else if (diff < -50) card.style.background = '#fff0f0'; // Skip
    else card.style.background = 'white';
  };

  const onEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    const diff = currentX - startX;
    const threshold = 100;

    if (diff > threshold) {
      card.style.transition = 'transform 0.3s ease';
      card.style.transform = 'translateX(1000px) rotate(30deg)';
      setTimeout(() => swipeSuggestion('like'), 200);
    } else if (diff < -threshold) {
      card.style.transition = 'transform 0.3s ease';
      card.style.transform = 'translateX(-1000px) rotate(-30deg)';
      setTimeout(() => swipeSuggestion('skip'), 200);
    } else {
      card.style.transition = 'transform 0.3s ease, background 0.3s ease';
      card.style.transform = 'translateX(0) rotate(0)';
      card.style.background = 'white';
    }
  };

  card.addEventListener('mousedown', onStart);
  card.addEventListener('touchstart', onStart);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchmove', onMove);
  window.addEventListener('mouseup', onEnd);
  window.addEventListener('touchend', onEnd);
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

function renderProfile() {
  const totalTrips = state.trips.length;
  const uniqueMembers = new Set(state.trips.flatMap((trip) => trip.members));
  const totalExpenses = state.trips.reduce((sum, trip) => sum + trip.expenses.length, 0);
  const profileName = state.currentUser?.name || 'Utilizador';
  const profileEmail = state.currentUser?.email || 'Trip organiser';

  if($('#profile-user-name')) $('#profile-user-name').textContent = profileName;
  if($('#profile-user-role')) $('#profile-user-role').textContent = profileEmail;
  if($('#profile-avatar')) $('#profile-avatar').textContent = initials(profileName || 'U');
  if($('#profile-stat-trips')) $('#profile-stat-trips').textContent = totalTrips;
  if($('#profile-stat-members')) $('#profile-stat-members').textContent = uniqueMembers.size;
  if($('#profile-stat-expenses')) $('#profile-stat-expenses').textContent = totalExpenses;
}

function renderExpensePayerOptions() {
  const trip = getCurrentTrip();
  if (!trip) return;
  const select = $('#expense-payer');
  if(select) select.innerHTML = trip.members.map((member) => `<option value="${member}">${member}</option>`).join('');
  if($('#expense-custom-count')) $('#expense-custom-count').value = trip.members.length;
}

function renderChrome() {
  if($('.app-shell')) $('.app-shell').classList.toggle('auth-mode', !state.authenticated);
  if($('.bottom-nav')) $('.bottom-nav').classList.toggle('hidden-nav', !state.authenticated);
}

function render() {
  renderChrome();
  renderAuth();
  renderHome();
  renderTrips();
  renderTripDetail();
  renderSuggestions();
  renderProfile();
  renderExpensePayerOptions();
  if($('#duration-value')) $('#duration-value').textContent = state.createTripDuration;
}

function openTrip(id) {
  state.currentTripId = id;
  state.detailTab = 'votes';
  setScreen('trip-detail');
}

function openTripFromAction(id) { openTrip(id); }

function markExpensePaid(tripId, expenseId) {
  const trip = state.trips.find((item) => item.id === tripId);
  const expense = trip?.expenses.find((item) => item.id === expenseId);
  if (expense) { expense.pending = false; expense.owedAmount = 0; }
  saveTripsToStorage();
  render();
}

function removeMember(memberName) {
  const trip = getCurrentTrip();
  if (!trip) return;
  trip.members = trip.members.filter((member) => member !== memberName);
  saveTripsToStorage();
  render();
}

function swipeSuggestion(type) {
  const trip = getCurrentTrip();
  if (!trip) return;
  
  if (trip.currentSuggestionIndex === undefined) trip.currentSuggestionIndex = 0;
  const index = trip.currentSuggestionIndex;
  
  const suggestion = trip.suggestions[index];
  if (!suggestion) return;

  if (type === 'like') {
    // 1. Register the destination but do NOT jump straight to the end of the index
    trip.voteResults.destination = suggestion.city;
    
    // 2. Update votes to the total (simulating that your vote closed the count)
    trip.votesCompleted = trip.votesTotal; 
    
    // 3. Clear pending actions and the missing item
    trip.pendingActions = trip.pendingActions.filter(a => !a.description.includes('voto'));
    trip.missingItem = trip.missingItem === 'Destination' ? '' : trip.missingItem;
    
    // NOTE: Removed the line that forced the index to the end.
    // This way, swipe continues to the next card.
  }

  // Advance only one card at a time, whether Like or Skip
  trip.currentSuggestionIndex = index + 1;
  
  saveTripsToStorage(); 
  render(); 
}
function createTrip() {
  const nameInput = $('#trip-name');
  const destinationInput = $('#trip-destination');
  const budgetInput = $('#trip-budget');
  const membersInput = $('#trip-members');

  const name = nameInput?.value.trim();
  const destination = destinationInput?.value.trim();
  const budget = Number(budgetInput?.value || 0);
  const membersRaw = membersInput?.value.trim();
  
  // 1. Corrected member logic:
  let members = [];
  if (membersRaw) {
    // If you entered names, add "Tu" to the list to ensure you are one of the members
    members = ['Tu', ...membersRaw.split(',').map((item) => item.trim()).filter(Boolean)];
  } else {
    // If left empty, use the default group
    members = ['Tu', 'Tomas', 'Sofia', 'Nuno'];
  }

  if (!name || !destination) { 
    alert('Por favor, preenche o nome e destino.'); 
    return; 
  }

  // 2. Vote calculation:
  // If members are ['Tu', 'Maria'], vTotal is 2.
  // vCompleted will be 2 - 1 = 1. Result: 1/2 votes.
  const vTotal = members.length; 
  const vCompleted = Math.max(0, vTotal - 1); 

  const newTrip = {
    id: Date.now(),
    name: name,
    destination: destination,
    city: 'TBD', 
    start: '12 Ago',
    end: '16 Ago',
    durationDays: state.createTripDuration,
    budget: budget,
    status: 'planning',
    members: members,
    votesCompleted: vCompleted, 
    votesTotal: vTotal,         
    currentSuggestionIndex: 0,
    missingItem: 'Destination',
    approvedActivities: [],
    itinerary: [{ 
      day: 1, 
      nowNextTitle: 'Planning', 
      items: ['Trip created. Waiting for your final vote.'] 
    }],
    expenses: [],
    pendingActions: [{ 
      title: 'Voting in progress', 
      description: `Your vote is needed to decide the destination of ${name}.`, 
      cta: 'Go vote now' 
    }],
    suggestions: [
      { city: 'Amesterdao', subtitle: 'Capital da Holanda', avgCost: 425, emoji: '🌷' },
      { city: 'Roterdão', subtitle: 'Arquitetura Moderna', avgCost: 185, emoji: '🏗️' },
      { city: 'Utrecht', subtitle: 'Canais e Bicicletas', avgCost: 230, emoji: '🚲' }
    ],
    voteResults: { destination: 'TBD', accommodation: 'TBD' }
  };

  state.trips.unshift(newTrip);
  saveTripsToStorage();
  state.currentTripId = newTrip.id;
  
  closeModal('modal-create-trip');
  if(nameInput) nameInput.value = '';
  if(destinationInput) destinationInput.value = '';
  if(budgetInput) budgetInput.value = '';
  if(membersInput) membersInput.value = '';
  
  render();
  setScreen('home');
}
function saveExpense() {
  const trip = getCurrentTrip();
  if (!trip) return;
  
  const description = $('#expense-description')?.value.trim();
  const total = Number($('#expense-total')?.value || 0);
  const splitType = $('#expense-split')?.value;

  if (!description || !total) {
    alert('Please fill in description and amount.');
    return;
  }

  const participantsCount = splitType === 'custom'
    ? Number($('#expense-custom-count')?.value || trip.members.length)
    : trip.members.length;

  const owedPerPerson = total / participantsCount;

  trip.expenses.unshift({
    id: Date.now(),
    title: description,
    amount: total,
    paidBy: 'Group',
    owedPerPerson: owedPerPerson,
    participants: participantsCount,
    pending: true
  });

  if ($('#expense-description')) $('#expense-description').value = '';
  if ($('#expense-total')) $('#expense-total').value = '';
  if ($('#expense-split')) $('#expense-split').value = 'all';

  closeModal('modal-add-expense');
  saveTripsToStorage();
  render();
}

async function saveSuggestion() {
  const trip = getCurrentTrip();
  if (!trip) return;

  const city = $('#suggestion-city').value.trim();
  const subtitle = $('#suggestion-subtitle').value.trim();
  const avgCost = Number($('#suggestion-cost').value || 0);
  const file = $('#suggestion-image').files[0];

  if (!city || !subtitle || !avgCost || !file) {
    alert('Fill all fields and select an image.');
    return;
  }

  const imageBase64 = await toBase64(file);

  trip.suggestions.push({
    city,
    subtitle,
    avgCost,
    image: imageBase64,
    suggestedBy: 'Utilizador',
    votes: 0
  });

  // Reset
  $('#suggestion-city').value = '';
  $('#suggestion-subtitle').value = '';
  $('#suggestion-cost').value = '';
  $('#suggestion-image').value = '';

  closeModal('modal-add-suggestion');

  state.suggestionIndexByTrip[trip.id] = trip.suggestions.length - 1;

  renderSuggestions();
}

function deleteTrip(event, id) {
  // Prevents the browser from opening trip details when clicking the trash icon
  event.stopPropagation();

  if (confirm('Are you sure you want to delete this trip?')) {
    state.trips = state.trips.filter(trip => trip.id !== id);
    
    saveTripsToStorage(); // Update local storage to persist changes
    render();             // Update the interface
  }
}

function saveMember() {
  const trip = getCurrentTrip();
  if (!trip) return;
  const name = $('#member-name')?.value.trim();
  const includePrevious = $('#include-previous-expenses')?.value === 'yes';
  if (!name) { alert('Please enter a member name.'); return; }
  if (!trip.members.includes(name)) trip.members.push(name);
  if (includePrevious) {
    trip.expenses.forEach((expense) => { expense.participants += 1; if (expense.pending) expense.owedAmount = Number(expense.amount) / expense.participants; });
  }
  if($('#member-name')) $('#member-name').value = '';
  if($('#include-previous-expenses')) $('#include-previous-expenses').value = 'no';
  closeModal('modal-add-member');
  render();
  alert(includePrevious ? `${name} added and included in previous expenses.` : `${name} added successfully.`);
}


function saveTripsToStorage() {
  writeJSON('swipetravel.trips', state.trips);
}

document.addEventListener('click', (event) => {
  const nav = event.target.closest('[data-nav]');
  if (nav) setScreen(nav.dataset.nav);
  const back = event.target.closest('[data-back]');
  if (back) setScreen(back.dataset.back);
  const closeBtn = event.target.closest('[data-close-modal]');
  if (closeBtn) closeModal(closeBtn.dataset.closeModal);
  const detailTab = event.target.closest('[data-detail-tab]');
  if (detailTab) { state.detailTab = detailTab.dataset.detailTab; renderTripDetail(); }
  const tripFilter = event.target.closest('[data-trip-filter]');
  if (tripFilter) { state.tripsFilter = tripFilter.dataset.tripFilter; renderTrips(); }
  const authModeBtn = event.target.closest('[data-auth-mode]');
  if (authModeBtn) setAuthMode(authModeBtn.dataset.authMode);
});

safeListen('#go-profile', 'click', () => setScreen('profile'));
safeListen('#open-create-trip', 'click', () => openModal('modal-create-trip'));
safeListen('#save-trip-btn', 'click', createTrip);
safeListen('#create-trip-submit', 'click', createTrip);
safeListen('#duration-minus', 'click', () => { state.createTripDuration = Math.max(1, state.createTripDuration - 1); render(); });
safeListen('#duration-plus', 'click', () => { state.createTripDuration += 1; render(); });
safeListen('#open-suggestions', 'click', () => setScreen('suggestions'));
safeListen('#open-add-expense-inline', 'click', () => openModal('modal-add-expense'));
safeListen('#save-expense-btn', 'click', saveExpense);
safeListen('#open-add-member', 'click', () => openModal('modal-add-member'));
safeListen('#save-member-btn', 'click', saveMember);
safeListen('#expense-split', 'change', (event) => {
  const customGroup = $('#expense-custom-count-group');
  if(customGroup) customGroup.classList.toggle('hidden', event.target.value !== 'custom');
});
safeListen('#login-submit', 'click', login);
safeListen('#register-submit', 'click', register);
safeListen('#logout-btn', 'click', logout);
safeListen('#open-add-suggestion', 'click', () => openModal('modal-add-suggestion'));
safeListen('#save-suggestion-btn', 'click', saveSuggestion);

seedDemoAccount();
loadSession();
render();
setScreen(state.screen);

window.openTrip = openTrip;
window.openTripFromAction = openTripFromAction;
window.markExpensePaid = markExpensePaid;
window.removeMember = removeMember;
window.swipeSuggestion = swipeSuggestion;
window.deleteTrip = deleteTrip;
