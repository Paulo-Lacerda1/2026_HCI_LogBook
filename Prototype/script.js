const state = {
  screen: 'home',
  tripsFilter: 'active',
  detailTab: 'votes',
  currentTripId: 1,
  suggestionIndexByTrip: {},
  createTripDuration: 4,
  trips: [
    {
      id: 1,
      name: 'Summer Holidays',
      destination: 'Netherlands',
      city: 'Amsterdam',
      start: '12 Apr',
      end: '16 Apr',
      durationDays: 4,
      budget: 400,
      status: 'planning',
      members: ['Maria', 'Pedro', 'Nuno'],
      votesCompleted: 3,
      votesTotal: 4,
      missingItem: 'Accommodation',
      approvedActivities: [
        { name: 'Van Gogh Museum', price: 20 },
        { name: 'Boat Tour', price: 15 }
      ],
      itinerary: [
        {
          day: 2,
          nowNextTitle: 'Now and next',
          items: [
            '15:00 – Van Gogh Museum',
            'Tickets already bought by João'
          ]
        }
      ],
      expenses: [
        {
          id: 11,
          title: 'Supermarket',
          amount: 60,
          paidBy: 'Maria',
          owedBy: 'Nuno',
          owedAmount: 19.5,
          pending: true,
          participants: 3
        }
      ],
      pendingActions: [
        {
          title: '3 more swipes needed',
          description: 'Finish destination voting for Summer Holidays.',
          cta: 'Go vote'
        }
      ],
      suggestions: [
        {
          city: 'Rotterdam',
          subtitle: 'Modern architecture',
          avgCost: 185,
          emoji: '🏙️'
        },
        {
          city: 'Utrecht',
          subtitle: 'Strong cultural life',
          avgCost: 230,
          emoji: '🚲'
        },
        {
          city: 'Amsterdam',
          subtitle: 'Cultural capital',
          avgCost: 425,
          emoji: '🌷'
        }
      ],
      voteResults: {
        destination: 'Amsterdam',
        accommodation: 'Airbnb Centro (€50/night)'
      }
    },
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
      members: ['Maria', 'Pedro', 'Nuno', 'João'],
      votesCompleted: 6,
      votesTotal: 6,
      missingItem: '',
      approvedActivities: [
        { name: 'Sagrada Família', price: 26 },
        { name: 'Beach afternoon', price: 0 }
      ],
      itinerary: [
        {
          day: 1,
          nowNextTitle: 'Trip completed',
          items: [
            'Final itinerary archived',
            'All bookings completed'
          ]
        }
      ],
      expenses: [
        {
          id: 21,
          title: 'Final settlement',
          amount: 0,
          paidBy: '—',
          owedBy: 'Nobody',
          owedAmount: 0,
          pending: false,
          participants: 4
        }
      ],
      pendingActions: [],
      suggestions: [],
      voteResults: {
        destination: 'Barcelona',
        accommodation: 'Shared apartment near city centre'
      }
    }
  ]
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function getCurrentTrip() {
  return state.trips.find((trip) => trip.id === state.currentTripId) || state.trips[0];
}

function formatCurrency(value) {
  return `€${Number(value).toFixed(2).replace('.00', '')}`;
}

function initials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function setScreen(screen) {
  state.screen = screen;
  $$('.screen').forEach((el) => el.classList.remove('active'));
  $(`#screen-${screen}`).classList.add('active');

  $$('.nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.nav === screen);
  });

  render();
}

function openModal(id) {
  $(`#${id}`).classList.add('active');
}

function closeModal(id) {
  $(`#${id}`).classList.remove('active');
}

function renderHome() {
  const allPending = state.trips.flatMap((trip) =>
    trip.pendingActions.map((action) => ({
      ...action,
      tripId: trip.id,
      tripName: trip.name
    }))
  );

  $('#pending-count-label').textContent = `${allPending.length} item${allPending.length === 1 ? '' : 's'}`;
  $('#trip-count-label').textContent = `${state.trips.length} trip${state.trips.length === 1 ? '' : 's'}`;

  const pendingContainer = $('#pending-actions-list');
  if (!allPending.length) {
    pendingContainer.innerHTML = `<div class="empty-state">No pending actions right now :)</div>`;
  } else {
    pendingContainer.innerHTML = allPending
      .map(
        (action) => `
          <div class="action-card">
            <strong>${action.tripName}</strong>
            <div class="muted">${action.description}</div>
            <div class="spacer-8"></div>
            <button class="small-link" onclick="openTripFromAction(${action.tripId})">${action.cta}</button>
          </div>
        `
      )
      .join('');
  }

  $('#home-trip-list').innerHTML = state.trips.map(renderTripCard).join('');
}

function renderTripCard(trip) {
  const memberCount = trip.members.length;

  const badgeText =
    trip.status === 'closed'
      ? 'Closed'
      : trip.votesCompleted < trip.votesTotal
        ? 'Planning'
        : 'Ongoing';

  const badgeClass =
    trip.status === 'closed'
      ? 'closed'
      : trip.votesCompleted < trip.votesTotal
        ? 'planning'
        : 'progress';

  const statusLine =
    trip.status === 'closed'
      ? 'Accounts settled and trip finished'
      : trip.missingItem
        ? `Missing ${trip.missingItem}`
        : 'Trip ready';

  return `
    <div class="trip-card" onclick="openTrip(${trip.id})">
      <div class="trip-card-header">
        <div>
          <h4 class="trip-title">${trip.name}</h4>
          <div class="trip-meta">${trip.start} to ${trip.end} • ${memberCount} member${memberCount === 1 ? '' : 's'}</div>
        </div>
        <span class="badge ${badgeClass}">${badgeText}</span>
      </div>
      <div class="trip-footer">
        <div class="muted">${statusLine}</div>
        <div class="muted">${trip.votesCompleted}/${trip.votesTotal} votes</div>
      </div>
    </div>
  `;
}

function renderTrips() {
  const isClosed = state.tripsFilter === 'closed';
  const filtered = state.trips.filter((trip) =>
    isClosed ? trip.status === 'closed' : trip.status !== 'closed'
  );

  $('#trips-list').innerHTML = filtered.length
    ? filtered.map(renderTripCard).join('')
    : `<div class="empty-state">No trips in this section yet.</div>`;

  $$('[data-trip-filter]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tripFilter === state.tripsFilter);
  });
}

function renderTripDetail() {
  const trip = getCurrentTrip();

  $('#trip-detail-title').textContent = trip.name;
  $('#trip-detail-subtitle').textContent = `${trip.start} to ${trip.end} • ${trip.members.length} members`;
  $('#vote-progress-label').textContent = `${trip.votesCompleted}/${trip.votesTotal} completed`;

  $('#winning-destination').innerHTML = `<strong>📍 ${trip.voteResults.destination}</strong>`;
  $('#winning-accommodation').innerHTML = `<strong>🏠 ${trip.voteResults.accommodation}</strong>`;
  $('#approved-activities').innerHTML = trip.approvedActivities
    .map(
      (activity) =>
        `<div class="timeline-item">${activity.name} <span class="muted">(${formatCurrency(activity.price)})</span></div>`
    )
    .join('');

  const itineraryDay = trip.itinerary[0];
  $('#itinerary-day-label').textContent = `Day ${itineraryDay.day}`;
  $('#itinerary-current').innerHTML = itineraryDay.items
    .map((item) => `<div class="timeline-item">${item}</div>`)
    .join('');

  const totalSpent = trip.expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const pendingExpenses = trip.expenses.filter((expense) => expense.pending);

  $('#group-total-spent').textContent = formatCurrency(totalSpent);
  $('#pending-balance-count').textContent = `${pendingExpenses.length} pending`;
  $('#expense-quick-status').textContent = pendingExpenses.length ? 'Balances still open' : 'Nothing owed';

  $('#member-list-inline').innerHTML = trip.members
    .map(
      (member) => `
        <div class="member-row">
          <div class="member-info">
            <div class="avatar">${initials(member)}</div>
            <div>
              <strong>${member}</strong>
              <div class="muted">Trip member</div>
            </div>
          </div>
          <button class="small-link" onclick="removeMember('${member.replace(/'/g, "\\'")}')">Remove</button>
        </div>
      `
    )
    .join('');

  $('#expense-list').innerHTML = trip.expenses
    .map(
      (expense) => `
        <div class="expense-item ${expense.pending ? 'pending' : 'settled'}">
          <div class="row-between">
            <div>
              <strong>${expense.title}</strong>
              <div class="expense-note">Paid by ${expense.paidBy}</div>
            </div>
            <div class="expense-amount">${formatCurrency(expense.amount)}</div>
          </div>
          <div class="spacer-8"></div>
          ${
            expense.pending
              ? `<div class="muted">${expense.owedBy} owes ${formatCurrency(expense.owedAmount)}</div>
                 <div class="spacer-8"></div>
                 <button class="secondary-btn" onclick="markExpensePaid(${trip.id}, ${expense.id})">Mark as paid</button>`
              : `<div class="muted">Settled ✅</div>`
          }
        </div>
      `
    )
    .join('');

  $$('[data-detail-tab]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.detailTab === state.detailTab);
  });

  $('#trip-tab-votes').classList.toggle('hidden', state.detailTab !== 'votes');
  $('#trip-tab-itinerary').classList.toggle('hidden', state.detailTab !== 'itinerary');
  $('#trip-tab-expenses').classList.toggle('hidden', state.detailTab !== 'expenses');
}

function renderSuggestions() {
  const trip = getCurrentTrip();
  $('#suggestions-title').textContent = `${trip.name} suggestions`;

  if (!state.suggestionIndexByTrip[trip.id]) {
    state.suggestionIndexByTrip[trip.id] = 0;
  }

  const index = state.suggestionIndexByTrip[trip.id];
  const suggestion = trip.suggestions[index];
  const container = $('#suggestion-deck');

  if (!suggestion) {
    container.innerHTML = `
      <div class="empty-state">
        <strong>All suggestions reviewed</strong>
        <div class="spacer-8"></div>
        <div>You already swiped through every destination suggestion.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="suggestion-card">
      <div class="suggestion-image">${suggestion.emoji}</div>
      <div class="suggestion-body">
        <div class="muted">Suggestion #${index + 1}</div>
        <h3>${suggestion.city}</h3>
        <div class="muted">${suggestion.subtitle}</div>
        <div class="spacer-16"></div>
        <div class="big-number">Average cost ${formatCurrency(suggestion.avgCost)}</div>
        <div class="swipe-actions">
          <button class="skip-btn" onclick="swipeSuggestion('skip')">✕ Skip</button>
          <button class="like-btn" onclick="swipeSuggestion('like')">♥ Like</button>
        </div>
      </div>
    </div>
  `;
}

function renderProfile() {
  const totalTrips = state.trips.length;
  const uniqueMembers = new Set(state.trips.flatMap((trip) => trip.members));
  const totalExpenses = state.trips.reduce((sum, trip) => sum + trip.expenses.length, 0);

  $('#profile-stat-trips').textContent = totalTrips;
  $('#profile-stat-members').textContent = uniqueMembers.size;
  $('#profile-stat-expenses').textContent = totalExpenses;
}

function renderExpensePayerOptions() {
  const trip = getCurrentTrip();
  const select = $('#expense-payer');

  select.innerHTML = trip.members
    .map((member) => `<option value="${member}">${member}</option>`)
    .join('');

  $('#expense-custom-count').value = trip.members.length;
}

function render() {
  renderHome();
  renderTrips();
  renderTripDetail();
  renderSuggestions();
  renderProfile();
  renderExpensePayerOptions();
  $('#duration-value').textContent = state.createTripDuration;
}

function openTrip(id) {
  state.currentTripId = id;
  state.detailTab = 'votes';
  setScreen('trip-detail');
}

function openTripFromAction(id) {
  openTrip(id);
}

function markExpensePaid(tripId, expenseId) {
  const trip = state.trips.find((item) => item.id === tripId);
  const expense = trip.expenses.find((item) => item.id === expenseId);

  if (expense) {
    expense.pending = false;
    expense.owedAmount = 0;
  }

  render();
}

function removeMember(memberName) {
  const trip = getCurrentTrip();
  trip.members = trip.members.filter((member) => member !== memberName);
  render();
}

function swipeSuggestion(type) {
  const trip = getCurrentTrip();
  const index = state.suggestionIndexByTrip[trip.id] || 0;
  const suggestion = trip.suggestions[index];

  if (!suggestion) {
    return;
  }

  if (type === 'like') {
    trip.voteResults.destination = suggestion.city;
    trip.votesCompleted = Math.min(trip.votesTotal, trip.votesCompleted + 1);
  }

  state.suggestionIndexByTrip[trip.id] = index + 1;
  renderSuggestions();
  renderTripDetail();
  renderHome();
  renderTrips();
}

function createTrip() {
  const name = $('#trip-name').value.trim();
  const destination = $('#trip-destination').value.trim();
  const budget = Number($('#trip-budget').value || 0);
  const membersRaw = $('#trip-members').value.trim();
  const members = membersRaw
    ? membersRaw.split(',').map((item) => item.trim()).filter(Boolean)
    : ['Maria'];

  if (!name || !destination) {
    alert('Please fill in at least the trip name and destination.');
    return;
  }

  const newTrip = {
    id: Date.now(),
    name,
    destination,
    city: destination,
    start: 'TBD',
    end: 'TBD',
    durationDays: state.createTripDuration,
    budget,
    status: 'planning',
    members,
    votesCompleted: 0,
    votesTotal: 3,
    missingItem: 'Destination, accommodation and activities',
    approvedActivities: [],
    itinerary: [
      {
        day: 1,
        nowNextTitle: 'Now and next',
        items: ['Trip created successfully', 'Start adding votes, members and expenses']
      }
    ],
    expenses: [],
    pendingActions: [
      {
        title: 'Start planning',
        description: `Complete the first votes for ${name}.`,
        cta: 'Open trip'
      }
    ],
    suggestions: [
      {
        city: destination,
        subtitle: 'Suggested destination',
        avgCost: budget || 200,
        emoji: '🧳'
      }
    ],
    voteResults: {
      destination,
      accommodation: 'Not chosen yet'
    }
  };

  state.trips.unshift(newTrip);
  state.currentTripId = newTrip.id;

  closeModal('modal-create-trip');
  $('#trip-name').value = '';
  $('#trip-destination').value = '';
  $('#trip-budget').value = '';
  $('#trip-members').value = '';
  state.createTripDuration = 4;

  setScreen('trip-detail');
}

function saveExpense() {
  const trip = getCurrentTrip();
  const description = $('#expense-description').value.trim();
  const total = Number($('#expense-total').value || 0);
  const payer = $('#expense-payer').value;
  const splitMode = $('#expense-split').value;
  const participants =
    splitMode === 'custom' ? Number($('#expense-custom-count').value || 1) : trip.members.length;

  if (!description || !total || !payer) {
    alert('Please fill in the expense fields.');
    return;
  }

  const others = trip.members.filter((member) => member !== payer);
  const owedBy = others[0] || payer;
  const owedAmount = participants > 0 ? total / participants : total;

  trip.expenses.unshift({
    id: Date.now(),
    title: description,
    amount: total,
    paidBy: payer,
    owedBy,
    owedAmount,
    pending: true,
    participants
  });

  $('#expense-description').value = '';
  $('#expense-total').value = '';
  closeModal('modal-add-expense');
  render();
}

function saveMember() {
  const trip = getCurrentTrip();
  const name = $('#member-name').value.trim();
  const includePrevious = $('#include-previous-expenses').value === 'yes';

  if (!name) {
    alert('Please enter a member name.');
    return;
  }

  if (!trip.members.includes(name)) {
    trip.members.push(name);
  }

  if (includePrevious) {
    trip.expenses.forEach((expense) => {
      expense.participants += 1;
      if (expense.pending) {
        expense.owedAmount = Number(expense.amount) / expense.participants;
      }
    });
  }

  $('#member-name').value = '';
  $('#include-previous-expenses').value = 'no';
  closeModal('modal-add-member');
  render();

  alert(
    includePrevious
      ? `${name} added and included in previous expenses.`
      : `${name} added successfully. Previous expenses were kept unchanged.`
  );
}

document.addEventListener('click', (event) => {
  const nav = event.target.closest('[data-nav]');
  if (nav) {
    setScreen(nav.dataset.nav);
  }

  const back = event.target.closest('[data-back]');
  if (back) {
    setScreen(back.dataset.back);
  }

  const closeBtn = event.target.closest('[data-close-modal]');
  if (closeBtn) {
    closeModal(closeBtn.dataset.closeModal);
  }

  const detailTab = event.target.closest('[data-detail-tab]');
  if (detailTab) {
    state.detailTab = detailTab.dataset.detailTab;
    renderTripDetail();
  }

  const tripFilter = event.target.closest('[data-trip-filter]');
  if (tripFilter) {
    state.tripsFilter = tripFilter.dataset.tripFilter;
    renderTrips();
  }
});

$('#go-profile').addEventListener('click', () => setScreen('profile'));
$('#open-create-trip').addEventListener('click', () => openModal('modal-create-trip'));
$('#trips-create-btn').addEventListener('click', () => openModal('modal-create-trip'));
$('#save-trip-btn').addEventListener('click', createTrip);
$('#create-trip-submit').addEventListener('click', createTrip);

$('#duration-minus').addEventListener('click', () => {
  state.createTripDuration = Math.max(1, state.createTripDuration - 1);
  render();
});

$('#duration-plus').addEventListener('click', () => {
  state.createTripDuration += 1;
  render();
});

$('#open-suggestions').addEventListener('click', () => setScreen('suggestions'));
$('#open-add-expense-inline').addEventListener('click', () => openModal('modal-add-expense'));
$('#save-expense-btn').addEventListener('click', saveExpense);
$('#open-add-member').addEventListener('click', () => openModal('modal-add-member'));
$('#save-member-btn').addEventListener('click', saveMember);

$('#expense-split').addEventListener('change', (e) => {
  $('#expense-custom-count-group').classList.toggle('hidden', e.target.value !== 'custom');
});

$('#trip-settings-btn').addEventListener('click', () => {
  alert('Trip settings screen can be the next step of the implementation.');
});

$('#export-pdf-btn').addEventListener('click', () => {
  alert('Export PDF action placeholder. You can later connect this to jsPDF or the browser print flow.');
});

render();
window.openTrip = openTrip;
window.openTripFromAction = openTripFromAction;
window.markExpensePaid = markExpensePaid;
window.removeMember = removeMember;
window.swipeSuggestion = swipeSuggestion;