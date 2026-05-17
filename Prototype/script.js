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
        { name: 'La Sagrada Familia', price: 26 },
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
  const destVencedor = (trip.voteResults.destination && trip.voteResults.destination !== 'TBD') ? trip.voteResults.destination : null;
  const alojVencedor = (trip.voteResults.accommodation && trip.voteResults.accommodation !== 'TBD') ? trip.voteResults.accommodation : null;
  if($('#winning-destination')) {
    if (destVencedor) {
      // Mostrar cada destino numa linha separada
      const destinos = destVencedor.split(' & ');
      $('#winning-destination').innerHTML = destinos.map(d => `<div><strong>📍 ${d}</strong></div>`).join('');
    } else {
      $('#winning-destination').innerHTML = `<span class="muted">Waiting for votes...</span>`;
    }
  }
  if($('#winning-accommodation')) $('#winning-accommodation').innerHTML = alojVencedor ? `<strong>🏠 ${alojVencedor}</strong>` : `<span class="muted">Waiting for votes...</span>`;

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
  if($('#trip-tab-members')) $('#trip-tab-members').classList.toggle('hidden', state.detailTab !== 'members'); // ADICIONAR ESTA LINHA
  if($('#trip-tab-expenses')) $('#trip-tab-expenses').classList.toggle('hidden', state.detailTab !== 'expenses');
}

function renderSuggestions() {
  const trip = getCurrentTrip();
  if (!trip) return;

  if($('#suggestions-title')) $('#suggestions-title').textContent = `${trip.name} suggestions`;

  if (trip.currentSuggestionIndex === undefined) trip.currentSuggestionIndex = 0;
  if (!trip.likedSuggestions) trip.likedSuggestions = [];

  const index = trip.currentSuggestionIndex;
  const container = $('#suggestion-deck');
  if (!container) return;

  // Votos já confirmados — mostrar ecrã final
  if (trip.votesConfirmed) {
    const liked = trip.likedSuggestions || [];
    const plural = liked.length > 1;
    const names = liked.map(c => `<strong>${c}</strong>`).join(' e ');
    container.innerHTML = `
      <div class="empty-state" style="padding: 28px 18px; text-align: center;">
        <div style="font-size: 2.5rem; margin-bottom: 14px;">📍</div>
        <strong style="font-size: 1.1rem;">All suggestions reviewed</strong>
        <div class="spacer-8"></div>
        <div>The destination${plural ? 's' : ''} <b>${names}</b> ${plural ? 'were' : 'was'} selected.</div>
        <div class="spacer-16"></div>
        <button class="primary-btn" onclick="setScreen('trip-detail')">Back to Trip</button>
      </div>`;
    return;
  }

  if (index >= trip.suggestions.length) {
    renderVoteConfirmation(trip, container);
    return;
  }

  const suggestion = trip.suggestions[index];

  container.innerHTML = `
  <div class="suggestion-card" id="active-suggestion-card" style="position: relative;">
    <div class="swipe-stamp stamp-like" id="stamp-like">LIKE</div>
    <div class="swipe-stamp stamp-skip" id="stamp-skip">SKIP</div>
    
    <div class="suggestion-image">
      <img src="${suggestion.image}" alt="${suggestion.city}">
      <div class="rating-badge">⭐ ${suggestion.rating || '—'}</div>
    </div>

    <div class="suggestion-body">
      <div class="tag-row">
        ${(suggestion.tags || []).map(tag => `<span class="tag-chip">${tag}</span>`).join('')}
      </div>
      <h3>${suggestion.city}</h3>
      <p class="muted">${suggestion.subtitle}</p>

      <div class="spacer-16"></div>
      <div class="price-row">
        <span class="muted">Average cost</span>
        <div class="big-number">${formatCurrency(suggestion.avgCost)}</div>
      </div>
      
      <div class="swipe-hint">
        &larr; Swipe Left to Skip | Swipe Right to Like &rarr;
      </div>
    </div>
  </div>
`;

  attachSwipeListeners();
}

function renderVoteConfirmation(trip, container) {
  const liked = trip.likedSuggestions || [];

  let bodyHtml;
  if (liked.length === 0) {
    bodyHtml = `
      <div class="vote-confirm-none">
        <div style="font-size: 2.5rem; margin-bottom: 12px;">🤔</div>
        <p style="font-weight: 700; font-size: 1.05rem; margin: 0 0 6px;">No destinations selected.</p>
        <p class="muted" style="margin: 0;">Swipe right on at least one destination to continue.</p>
      </div>
    `;
  } else {
    const names = liked.map(c => `<strong>${c}</strong>`).join(', ');
    const plural = liked.length > 1;
    bodyHtml = `
      <div class="vote-confirm-header">
        <div style="font-size: 2.5rem; margin-bottom: 12px;">🗳️</div>
        <p class="vote-confirm-title">
          The destination${plural ? 's' : ''} you selected ${plural ? 'were' : 'was'}<br>${names}
        </p>
        <p class="vote-confirm-question">
          Are you sure these are your choices?
        </p>
      </div>
      <div class="vote-confirm-actions">
        <button class="primary-btn" onclick="confirmVotes(true)" style="margin-bottom: 10px;">✅ Confirm</button>
        <button class="secondary-btn" onclick="confirmVotes(false)">🔄 No, vote again</button>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="vote-confirm-card">
      ${bodyHtml}
      ${liked.length === 0 ? `
        <div class="spacer-16"></div>
        <button class="secondary-btn" onclick="resetVotes()">🔄 Vote again</button>
      ` : ''}
    </div>
  `;
}

function attachSwipeListeners() {
  const card = $('#active-suggestion-card');
  if (!card) return;

  let startX = 0;
  let currentX = 0;
  let isDragging = false;

  const stampLike = $('#stamp-like');
  const stampSkip = $('#stamp-skip');

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

    if (diff > 50) {
      card.style.background = '#ecfdf3';
      if (stampLike) stampLike.style.opacity = Math.min(1, (diff - 50) / 80);
      if (stampSkip) stampSkip.style.opacity = 0;
    } else if (diff < -50) {
      card.style.background = '#fff0f0';
      if (stampSkip) stampSkip.style.opacity = Math.min(1, (-diff - 50) / 80);
      if (stampLike) stampLike.style.opacity = 0;
    } else {
      card.style.background = 'white';
      if (stampLike) stampLike.style.opacity = 0;
      if (stampSkip) stampSkip.style.opacity = 0;
    }
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
      if (stampLike) stampLike.style.opacity = 0;
      if (stampSkip) stampSkip.style.opacity = 0;
    }
  };

  card.addEventListener('mousedown', onStart);
  card.addEventListener('touchstart', onStart);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchmove', onMove);
  window.addEventListener('mouseup', onEnd);
  window.addEventListener('touchend', onEnd);
}

function swipeSuggestion(type) {
  const trip = getCurrentTrip();
  if (!trip) return;

  if (trip.currentSuggestionIndex === undefined) trip.currentSuggestionIndex = 0;
  if (!trip.likedSuggestions) trip.likedSuggestions = [];

  const index = trip.currentSuggestionIndex;
  const suggestion = trip.suggestions[index];
  if (!suggestion) return;

  // Guardar aprovados
  if (type === 'like') {
    if (!trip.likedSuggestions.includes(suggestion.city)) {
      trip.likedSuggestions.push(suggestion.city);
    }
  }

  trip.currentSuggestionIndex = index + 1;

  saveTripsToStorage();
  renderSuggestions();
}

function confirmVotes(confirmed) {
  const trip = getCurrentTrip();
  if (!trip) return;

  if (confirmed) {
    const liked = trip.likedSuggestions || [];
    const allWinners = liked.length > 0 ? liked : [trip.voteResults.destination];
    const winnersLabel = allWinners.join(' & ');

    trip.voteResults.destination = winnersLabel;
    trip.votesCompleted = trip.votesTotal;
    trip.voteResults.accommodation = 'Airbnb em De Pijp (Quarto para 4)';
    trip.approvedActivities = [
      { name: '🚤 Passeio de Barco pelos Canais', price: 15 },
      { name: '🚲 Aluguer de Bicicleta (Dia Inteiro)', price: 12 },
      { name: '🎨 Museu Van Gogh', price: 22 }
    ];
    // Itinerário com todos os destinos aprovados listados
    const itineraryItems = allWinners.map(c => `✅ Destination: ${c}`);
    itineraryItems.push('Next steps: Finalize accommodation, invite members and add expenses.');
    trip.itinerary = [{
      day: 1,
      nowNextTitle: 'Votes confirmed',
      items: itineraryItems
    }];
    trip.pendingActions = [];
    trip.missingItem = '';
    trip.votesConfirmed = true;

    saveTripsToStorage();
    render();
  } else {
    resetVotes();
  }
}

function resetVotes() {
  const trip = getCurrentTrip();
  if (!trip) return;
  trip.currentSuggestionIndex = 0;
  trip.likedSuggestions = [];
  trip.votesConfirmed = false;
  saveTripsToStorage();
  renderSuggestions();
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
  
  const membersContainer = $('#expense-custom-members');
  if (membersContainer) {
    membersContainer.innerHTML = trip.members.map(member => `
      <label class="checkbox-item">
        <input type="checkbox" value="${member}" checked>
        ${member}
      </label>
    `).join('');
  }
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

function createTrip() {
  const nameInput = $('#trip-name');
  const destinationInput = $('#trip-destination');
  const budgetInput = $('#trip-budget');

  const name = nameInput?.value.trim();
  const destination = destinationInput?.value.trim();
  const budget = Number(budgetInput?.value || 0);
  
  // NOVA LÓGICA: Recolhe o valor de todas as checkboxes que estão selecionadas
  const checkedBoxes = $$('#trip-contact-list input[type="checkbox"]:checked');
  const members = ['You', ...checkedBoxes.map(cb => cb.value)];

  if (!name || !destination) { 
    alert('Please fill in the name and destination.'); 
    return; 
  }

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
    likedSuggestions: [],
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
      { 
        city: 'Amsterdam', 
        subtitle: 'Iconic canals and lively atmosphere', 
        avgCost: 425, 
        emoji: '🌷',
        image: 'amsterdao.jpg',
        rating: 4.8,
        tags: ['Culture', 'Nightlife']
      },
      { 
        city: 'Rotterdam', 
        subtitle: 'Futuristic architecture and historic port', 
        avgCost: 185, 
        emoji: '🏗️',
        image: 'roterdao.jpg',
        rating: 4.5,
        tags: ['Design', 'Modern']
      },
      { 
        city: 'Utrecht', 
        subtitle: 'Charming canals and a university vibe', 
        avgCost: 230, 
        emoji: '🚲',
        image: 'utrecht.jpg',
        rating: 4.6,
        tags: ['History', 'Relax']
      }
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

  $$('#trip-contact-list input[type="checkbox"]').forEach(cb => {
    if (['Tomás', 'Sofia', 'Nuno'].includes(cb.value)) {
      cb.checked = true;
    } else {
      cb.checked = false;
    }
  });
  
  render();
  setScreen('home');
}

function saveExpense() {
  const trip = getCurrentTrip();
  if (!trip) return;
  
  const description = $('#expense-description')?.value.trim();
  const total = Number($('#expense-total')?.value || 0);
  const splitType = $('#expense-split')?.value;
  const payer = $('#expense-payer')?.value || 'Eu';

  if (!description || !total) {
    alert('Please fill in description and amount.');
    return;
  }

  let participantsCount = trip.members.length;

  if (splitType === 'custom') {
    const checkedBoxes = $$('#expense-custom-members input[type="checkbox"]:checked');
    participantsCount = checkedBoxes.length;

    if (participantsCount === 0) {
      alert('Selecione pelo menos um participante para dividir a despesa.');
      return;
    }
  }

  const owedPerPerson = total / participantsCount;

  trip.expenses.unshift({
    id: Date.now(),
    title: description,
    amount: total,
    paidBy: payer,
    owedPerPerson: owedPerPerson,
    participants: participantsCount,
    pending: true
  });

  if ($('#expense-description')) $('#expense-description').value = '';
  if ($('#expense-total')) $('#expense-total').value = '';
  if ($('#expense-split')) $('#expense-split').value = 'all';

  closeModal('modal-add-expense');
  saveTripsToStorage();
  alert(`Despesa de ${total}€ no ${description} registada e dividida por ${participantsCount}!`);
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

  $('#suggestion-city').value = '';
  $('#suggestion-subtitle').value = '';
  $('#suggestion-cost').value = '';
  $('#suggestion-image').value = '';

  closeModal('modal-add-suggestion');

  state.suggestionIndexByTrip[trip.id] = trip.suggestions.length - 1;

  renderSuggestions();
}

function deleteTrip(event, id) {
  event.stopPropagation();

  if (confirm('Are you sure you want to delete this trip?')) {
    state.trips = state.trips.filter(trip => trip.id !== id);
    saveTripsToStorage();
    render();
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

function closeCurrentTrip() {
  const trip = getCurrentTrip();
  if (!trip) return;

  if (trip.status === 'closed') {
    alert('This trip is already closed.');
    return;
  }

  if (confirm(`Do you want to finish and close "${trip.name}"?`)) {
    trip.status = 'closed';

    trip.itinerary = [{ 
      day: 'Final', 
      nowNextTitle: 'Trip completed', 
      items: ['✅ Trip archived successfully.', 'Check your final balances in the Expenses tab.'] 
    }];
    
    trip.pendingActions = [];
    
    saveTripsToStorage();
    
    state.tripsFilter = 'closed'; 
    render();
    setScreen('trips');
  }
}

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
safeListen('#trip-finish-btn', 'click', closeCurrentTrip);

(function migrateTripData() {
  const MIGRATION_VERSION = 2;
  let changed = false;
  state.trips.forEach(function(trip) {
    if (!Array.isArray(trip.likedSuggestions)) {
      trip.likedSuggestions = [];
      changed = true;
    }
    if ((trip.migrationVersion || 0) < MIGRATION_VERSION) {
      trip.votesConfirmed = false;
      trip.currentSuggestionIndex = 0;
      trip.likedSuggestions = [];
      trip.migrationVersion = MIGRATION_VERSION;
      if (trip.status !== 'closed') {
        trip.voteResults = { destination: 'TBD', accommodation: 'TBD' };
        trip.itinerary = [{ day: 1, items: ['Trip created. Waiting for your final vote.'] }];
        trip.votesCompleted = Math.max(0, (trip.votesTotal || trip.members.length) - 1);
      }
      changed = true;
    }
  });
  if (changed) writeJSON('swipetravel.trips', state.trips);
})();

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
window.confirmVotes = confirmVotes;
window.resetVotes = resetVotes;
window.setScreen = setScreen;
(function injectVoteConfirmStyles() {
  if (document.getElementById('vote-confirm-styles')) return;
  const style = document.createElement('style');
  style.id = 'vote-confirm-styles';
  style.textContent = `
    .vote-confirm-card {
      background: var(--surface, #fff);
      border-radius: 20px;
      border: 1px solid rgba(219, 228, 240, 0.8);
      box-shadow: 0 10px 30px rgba(20, 34, 66, 0.08);
      padding: 28px 20px 24px;
      text-align: center;
    }
    .vote-confirm-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #172033;
      margin: 0 0 14px;
      line-height: 1.5;
    }
    .vote-confirm-question {
      font-size: 0.95rem;
      color: #667085;
      margin: 0 0 24px;
      font-weight: 600;
    }
    .vote-confirm-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .vote-confirm-none {
      padding: 8px 0 20px;
    }
  `;
  document.head.appendChild(style);
})();
