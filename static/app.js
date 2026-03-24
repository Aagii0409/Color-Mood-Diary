const state = {
  moods: window.APP_DATA.moods,
  tags: window.APP_DATA.tags,
  entries: window.APP_DATA.entries || [],
  selectedDate: window.APP_DATA.today,
  selectedMoodKey: null,
  selectedTags: [],
  currentYear: Number(window.APP_DATA.today.slice(0, 4)),
  currentMonth: Number(window.APP_DATA.today.slice(5, 7)),
};

const moodMap = Object.fromEntries(state.moods.map(m => [m.key, m]));
const months = window.APP_DATA.months;
const realToday = window.APP_DATA.today;

function localIsoFromDate(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const els = {
  tabs: document.querySelectorAll('.tab'),
  panels: document.querySelectorAll('.tab-panel'),
  dateTitle: document.getElementById('selected-date-title'),
  helper: document.getElementById('selected-mood-helper'),
  moodButtons: document.querySelectorAll('.mood-btn'),
  note: document.getElementById('note'),
  previewCard: document.getElementById('mood-preview-card'),
  previewEmoji: document.getElementById('preview-emoji'),
  previewTitle: document.getElementById('preview-title'),
  previewHelper: document.getElementById('preview-helper'),
  intensity: document.getElementById('intensity'),
  intensityValue: document.getElementById('intensity-value'),
  tagButtons: document.querySelectorAll('.tag-btn'),
  saveBtn: document.getElementById('save-btn'),
  clearBtn: document.getElementById('clear-btn'),
  calendarTitle: document.getElementById('calendar-title'),
  calendarGrid: document.getElementById('calendar-grid'),
  prevMonth: document.getElementById('prev-month'),
  nextMonth: document.getElementById('next-month'),
  jumpToday: document.getElementById('jump-today'),
  statDominant: document.getElementById('stat-dominant'),
  statTotal: document.getElementById('stat-total'),
  statIntensity: document.getElementById('stat-intensity'),
  softInsight: document.getElementById('soft-insight'),
  recentEntries: document.getElementById('recent-entries'),
  detailDate: document.getElementById('detail-date'),
  detailContent: document.getElementById('detail-content'),
  reflectionText: document.getElementById('reflection-text'),
  reflectionBtn: document.getElementById('reflection-btn'),
  reflectionList: document.getElementById('reflection-list'),
  toast: document.getElementById('toast'),
  modal: document.getElementById('reflection-modal'),
  modalReflections: document.getElementById('modal-reflections'),
  closeModal: document.getElementById('close-modal'),
};

function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${y} оны ${m} сарын ${d}`;
}

function getEntry(dateStr) {
  return state.entries.find(e => e.entry_date === dateStr) || null;
}

function setSelectedMood(moodKey) {
  state.selectedMoodKey = moodKey;
  const mood = moodMap[moodKey];
  els.moodButtons.forEach(btn => {
    const selected = btn.dataset.moodKey === moodKey;
    btn.classList.toggle('is-selected', selected);
    btn.style.background = selected
      ? `linear-gradient(180deg, ${mood.color}, rgba(255,255,255,.96))`
      : 'linear-gradient(180deg, rgba(255,255,255,.75), rgba(255,247,242,.98))';
  });
  if (!mood) return;
  els.helper.textContent = mood.helper;
  els.previewEmoji.textContent = mood.emoji;
  els.previewTitle.textContent = mood.label;
  els.previewHelper.textContent = mood.helper;
  els.previewCard.style.background = `linear-gradient(180deg, ${mood.color}, rgba(255,255,255,.95))`;
}

function renderSelectedDate() {
  els.dateTitle.textContent = formatDate(state.selectedDate);
}

function renderTodayForm() {
  renderSelectedDate();
  const entry = getEntry(state.selectedDate);
  if (entry) {
    setSelectedMood(entry.mood_key);
    els.note.value = entry.note || '';
    els.intensity.value = entry.intensity || 3;
    els.intensityValue.textContent = String(entry.intensity || 3);
    state.selectedTags = [...(entry.tags || [])];
  } else {
    state.selectedMoodKey = null;
    els.note.value = '';
    els.intensity.value = 3;
    els.intensityValue.textContent = '3';
    state.selectedTags = [];
    els.helper.textContent = 'Зүгээр л нэгийг сонго, алба биш 🌈';
    els.previewEmoji.textContent = '🌼';
    els.previewTitle.textContent = 'Энд өнөөдрийн мэдрэмж харагдана';
    els.previewHelper.textContent = 'Нэг emoji сонгоод эхэлье';
    els.previewCard.style.background = 'linear-gradient(180deg, #fff3b9, #fffaf0)';
    els.moodButtons.forEach(btn => {
      btn.classList.remove('is-selected');
      btn.style.background = 'linear-gradient(180deg, rgba(255,255,255,.75), rgba(255,247,242,.98))';
    });
  }

  els.tagButtons.forEach(btn => {
    btn.classList.toggle('is-selected', state.selectedTags.includes(btn.dataset.tag));
  });
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('show', 'glow');
  setTimeout(() => els.toast.classList.remove('show'), 2200);
  setTimeout(() => els.toast.classList.remove('glow'), 600);
}

async function saveEntry() {
  if (!state.selectedMoodKey) {
    showToast('Эхлээд нэг emoji сонгоно уу 🌼');
    return;
  }
  const payload = {
    entry_date: state.selectedDate,
    mood_key: state.selectedMoodKey,
    note: els.note.value,
    intensity: Number(els.intensity.value),
    tags: state.selectedTags,
  };
  const response = await fetch('/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) {
    showToast(data.message || 'Хадгалах үед алдаа гарлаа.');
    return;
  }
  state.entries = data.entries;
  showToast(data.message || 'Хадгалагдлаа ✨');
  renderCalendar();
  renderInsights();
  renderDetail();
}

async function saveReflection() {
  const text = els.reflectionText.value.trim();
  if (!text) {
    showToast('Эргэн бодлоо бичнэ үү 💬');
    return;
  }
  const response = await fetch('/api/reflection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ entry_date: state.selectedDate, text }),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) {
    showToast(data.message || 'Эргэн бодол хадгалж чадсангүй.');
    return;
  }
  state.entries = data.entries;
  els.reflectionText.value = '';
  showToast(data.message || 'Эргэн бодол нэмэгдлээ 💬');
  renderCalendar();
  renderDetail();
}

function renderCalendar() {
  els.calendarTitle.textContent = `${months[state.currentMonth - 1]} ${state.currentYear}`;
  els.calendarGrid.innerHTML = '';
  const first = new Date(state.currentYear, state.currentMonth - 1, 1);
  const startDay = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(state.currentYear, state.currentMonth, 0).getDate();
  const prevMonthDays = new Date(state.currentYear, state.currentMonth - 1, 0).getDate();
  const totalCells = 42;

  for (let i = 0; i < totalCells; i += 1) {
    let dayNumber;
    let dateStr;
    let isCurrentMonth = true;

    if (i < startDay) {
      dayNumber = prevMonthDays - startDay + i + 1;
      const d = new Date(state.currentYear, state.currentMonth - 2, dayNumber);
      dateStr = localIsoFromDate(d);
      isCurrentMonth = false;
    } else if (i >= startDay + daysInMonth) {
      dayNumber = i - (startDay + daysInMonth) + 1;
      const d = new Date(state.currentYear, state.currentMonth, dayNumber);
      dateStr = localIsoFromDate(d);
      isCurrentMonth = false;
    } else {
      dayNumber = i - startDay + 1;
      const d = new Date(state.currentYear, state.currentMonth - 1, dayNumber);
      dateStr = localIsoFromDate(d);
    }

    const entry = getEntry(dateStr);
    const mood = entry ? moodMap[entry.mood_key] : null;
    const card = document.createElement('div');
    card.className = 'day-card';
    if (!isCurrentMonth) card.classList.add('is-empty');
    if (state.selectedDate === dateStr) card.classList.add('is-selected');
    if (realToday === dateStr) card.classList.add('is-today');

    if (mood) {
      card.style.background = `linear-gradient(180deg, ${mood.color}, rgba(255,255,255,.96))`;
    }

    card.innerHTML = `
      <div class="day-card__top">
        <div class="day-num">${dayNumber}</div>
        <div class="day-emoji">${mood ? mood.emoji : ''}</div>
      </div>
      <div class="day-note">${entry && entry.note ? escapeHtml(entry.note) : (entry ? 'Тэмдэглэлгүй' : '')}</div>
      ${realToday === dateStr ? '<div class="today-pill">Өнөөдөр</div>' : ''}
      ${entry && entry.reflections && entry.reflections.length ? '<button class="comment-chip" type="button">💬</button>' : ''}
    `;

    if (entry && entry.reflections && entry.reflections.length) {
      card.querySelector('.comment-chip').addEventListener('click', (ev) => {
        ev.stopPropagation();
        openReflectionModal(entry.reflections);
      });
    }

    if (isCurrentMonth) {
      card.addEventListener('click', () => {
        state.selectedDate = dateStr;
        renderTodayForm();
        renderCalendar();
        renderDetail();
      });
    }

    els.calendarGrid.appendChild(card);
  }
}

function openReflectionModal(reflections) {
  els.modalReflections.innerHTML = '';
  reflections.forEach(item => {
    const div = document.createElement('div');
    div.className = 'reflection-item';
    div.innerHTML = `<div class="reflection-date">${formatDate(item.date)}</div><div>${escapeHtml(item.text)}</div>`;
    els.modalReflections.appendChild(div);
  });
  els.modal.classList.remove('hidden');
}

function renderInsights() {
  const total = state.entries.length;
  els.statTotal.textContent = String(total);

  if (!total) {
    els.statDominant.textContent = '—';
    els.statIntensity.textContent = '0 / 5';
    els.softInsight.textContent = 'Энд чиний жижигхэн хэмнэл харагдана.';
    els.recentEntries.innerHTML = '<div class="sub">Одоогоор бичлэг алга.</div>';
    return;
  }

  const counts = {};
  let intensitySum = 0;
  state.entries.forEach(entry => {
    counts[entry.mood_key] = (counts[entry.mood_key] || 0) + 1;
    intensitySum += Number(entry.intensity || 0);
  });
  const dominantKey = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  const dominant = moodMap[dominantKey];
  els.statDominant.textContent = `${dominant.emoji} ${dominant.label}`;
  els.statIntensity.textContent = `${(intensitySum / total).toFixed(1)} / 5`;
  els.softInsight.textContent = `${dominant.label} мэдрэмж илүү олон давтагдсан байна. Өөртөө зөөлөн хандаарай 💛`;

  const recent = [...state.entries].sort((a, b) => b.entry_date.localeCompare(a.entry_date)).slice(0, 6);
  els.recentEntries.innerHTML = '';
  recent.forEach(entry => {
    const mood = moodMap[entry.mood_key];
    const item = document.createElement('div');
    item.className = 'recent-item';
    item.innerHTML = `
      <div class="recent-item__emoji">${mood.emoji}</div>
      <div>
        <div><strong>${formatDate(entry.entry_date)}</strong></div>
        <div class="sub">${mood.label}${entry.note ? ' • ' + escapeHtml(entry.note).slice(0, 48) : ''}</div>
      </div>
    `;
    els.recentEntries.appendChild(item);
  });
}

function renderDetail() {
  const entry = getEntry(state.selectedDate);
  els.detailDate.textContent = formatDate(state.selectedDate);

  if (!entry) {
    els.detailContent.className = 'detail-content empty';
    els.detailContent.textContent = 'Энэ өдөрт одоогоор тэмдэглэл алга.';
    els.reflectionList.innerHTML = '';
    return;
  }

  const mood = moodMap[entry.mood_key];
  els.detailContent.className = 'detail-content';
  els.detailContent.innerHTML = `
    <div class="detail-badge" style="background:${mood.color}">${mood.emoji} ${mood.label}</div>
    <div class="detail-note">${entry.note ? escapeHtml(entry.note) : 'Тэмдэглэл бичээгүй байна.'}</div>
    <div class="sub" style="margin-top:12px;">Хүч: ${entry.intensity || 3} / 5${entry.tags && entry.tags.length ? ' • Таг: ' + entry.tags.join(', ') : ''}</div>
  `;

  const reflections = entry.reflections || [];
  els.reflectionList.innerHTML = reflections.length ? '' : '<div class="sub">Одоогоор эргэн бодол алга.</div>';
  reflections.forEach(item => {
    const div = document.createElement('div');
    div.className = 'reflection-item';
    div.innerHTML = `<div class="reflection-date">${formatDate(item.date)}</div><div>${escapeHtml(item.text)}</div>`;
    els.reflectionList.appendChild(div);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function bindEvents() {
  els.tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      els.tabs.forEach(t => t.classList.remove('is-active'));
      els.panels.forEach(p => p.classList.remove('is-active'));
      tab.classList.add('is-active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('is-active');
    });
  });

  els.moodButtons.forEach(btn => {
    btn.addEventListener('click', () => setSelectedMood(btn.dataset.moodKey));
  });

  els.tagButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.dataset.tag;
      const exists = state.selectedTags.includes(tag);
      if (exists) state.selectedTags = state.selectedTags.filter(t => t !== tag);
      else if (state.selectedTags.length < 2) state.selectedTags.push(tag);
      else state.selectedTags = [state.selectedTags[1], tag];
      els.tagButtons.forEach(b => b.classList.toggle('is-selected', state.selectedTags.includes(b.dataset.tag)));
    });
  });

  els.intensity.addEventListener('input', () => {
    els.intensityValue.textContent = els.intensity.value;
  });

  els.saveBtn.addEventListener('click', saveEntry);
  els.reflectionBtn.addEventListener('click', saveReflection);
  els.clearBtn.addEventListener('click', () => {
    state.selectedMoodKey = null;
    state.selectedTags = [];
    els.note.value = '';
    els.intensity.value = 3;
    els.intensityValue.textContent = '3';
    renderTodayForm();
  });

  els.prevMonth.addEventListener('click', () => {
    state.currentMonth -= 1;
    if (state.currentMonth < 1) {
      state.currentMonth = 12;
      state.currentYear -= 1;
    }
    renderCalendar();
  });

  els.jumpToday.addEventListener('click', () => {
    state.selectedDate = realToday;
    state.currentYear = Number(realToday.slice(0, 4));
    state.currentMonth = Number(realToday.slice(5, 7));
    renderTodayForm();
    renderCalendar();
    renderDetail();
    showToast('Өнөөдөр рүү очлоо ✨');
  });

  els.nextMonth.addEventListener('click', () => {
    state.currentMonth += 1;
    if (state.currentMonth > 12) {
      state.currentMonth = 1;
      state.currentYear += 1;
    }
    renderCalendar();
  });

  els.closeModal.addEventListener('click', () => els.modal.classList.add('hidden'));
  els.modal.querySelector('.modal__backdrop').addEventListener('click', () => els.modal.classList.add('hidden'));
}

function init() {
  bindEvents();
  renderTodayForm();
  renderCalendar();
  renderInsights();
  renderDetail();
}

init();
