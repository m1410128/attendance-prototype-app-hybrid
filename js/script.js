const employeeNames = [
  '社員A', '社員B', '社員C', '社員D', '社員E',
  '社員F', '社員G', '社員H', '社員I', '社員J'
];

const sampleSchedule = {
  '2026-06': {
    '社員A': {
      '1': { time: '9:00-18:00', location: '本社', remarks: '通常勤務' },
      '2': { time: '10:00-18:00', location: '在宅', remarks: 'テストデータ' }
    },
    '社員C': {
      '3': { time: '8:30-17:30', location: '支社', remarks: '出社' }
    }
  },
  '2026-07': {
    '社員B': {
      '5': { time: '9:15-18:15', location: '本社', remarks: '会議あり' }
    }
  }
};

const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth() + 1; // 月は0から始まるため+1

// 祝日設定 テスト用 アナログだけど…
const holidaySet = new Set([
  '2026-01-01', // 元日
  '2026-01-12', // 成人の日
  '2026-02-11', // 建国記念の日
  '2026-02-23', // 天皇誕生日
  '2026-03-20', // 春分の日
  '2026-04-29', // 昭和の日
  '2026-05-03', // 憲法記念日
  '2026-05-04', // みどりの日
  '2026-05-05', // こどもの日
  '2026-05-06', // 振替休日
  '2026-07-20', // 海の日
  '2026-08-11', // 山の日
  '2026-09-21', // 秋分の日
  '2026-09-22', // 振替休日
  '2026-10-12', // スポーツの日
  '2026-11-03', // 文化の日
  '2026-11-23', // 勤労感謝の日
]);

const monthList = Array.from({ length: 12 }, (_, index) => {
  const monthNumber = index + 1;
  return {
    key: `${currentYear}-${String(monthNumber).padStart(2, '0')}`,
    label: `${currentYear}年${monthNumber}月`
  };
});

let activeMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

let scheduleData = {};

const currentMonthLabel = document.getElementById('currentMonthLabel');
const openMonthModalButton = document.getElementById('openMonthModalButton');
const monthModalOverlay = document.getElementById('monthModalOverlay');
const monthModalCloseButton = document.getElementById('monthModalCloseButton');
const monthListContainer = document.getElementById('monthListContainer');
const scheduleTable = document.getElementById('scheduleTable');
const modalOverlay = document.getElementById('detailModalOverlay');
const modalCloseButton = document.getElementById('modalCloseButton');
const modalContent = document.getElementById('modalContent');


// ハンバーガーメニュー
const menuButton = document.getElementById('menuButton');
const menuPanel = document.getElementById('menuPanel');
const menuOverlay = document.getElementById('menuOverlay');

if (menuButton && menuPanel && menuOverlay) {
  menuButton.addEventListener('click', () => {
    menuPanel.classList.toggle('hidden');
    menuOverlay.classList.toggle('hidden');
  });
  menuOverlay.addEventListener('click', () => {
    menuPanel.classList.add('hidden');
    menuOverlay.classList.add('hidden');
  });
}

function loadScheduleData() {
  const stored = localStorage.getItem('workSchedule');
  scheduleData = stored ? JSON.parse(stored) : {};
}

function getDaysInMonth(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month, 0).getDate();
}

function getWeekday(year, month, day) {
  return ['日', '月', '火', '水', '木', '金', '土'][new Date(year, month - 1, day).getDay()];
}

function getEntry(employee, day) {
  // localStorage のデータを優先的に使用
  if (
    scheduleData[activeMonthKey] &&
    scheduleData[activeMonthKey][employee] &&
    scheduleData[activeMonthKey][employee][day]
  ) {
    return scheduleData[activeMonthKey][employee][day];
  }
  // フォールバック：sampleSchedule を使用
  return (sampleSchedule[activeMonthKey] && sampleSchedule[activeMonthKey][employee] && sampleSchedule[activeMonthKey][employee][day]) || null;
}

function formatTimeRange(entry) {
  if (!entry) return '未入力';
  if (entry.startTime || entry.endTime) {
    return `${entry.startTime || '--:--'}-${entry.endTime || '--:--'}`;
  }
  return entry.time || '未入力';
}

function formatDateRange(entry, fallbackDay) {
  if (entry?.startDate || entry?.endDate) {
    return `${entry.startDate || '未入力'} ～ ${entry.endDate || '未入力'}`;
  }
  return `${activeMonthKey.replace('-', '年')}月${fallbackDay}日`;
}

function renderCurrentMonthLabel() {
  const month = monthList.find((item) => item.key === activeMonthKey);
  currentMonthLabel.textContent = month ? month.label : '';
}

function renderMonthSelector() {
  monthListContainer.innerHTML = '';

  monthList.forEach((month) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = month.label;
    button.className = activeMonthKey === month.key ? 'active' : '';
    button.addEventListener('click', () => {
      activeMonthKey = month.key;
      renderMonthSelector();
      renderCurrentMonthLabel();
      renderScheduleTable();
      closeMonthModal();
    });
    monthListContainer.appendChild(button);
  });
}

function openMonthModal() {
  renderMonthSelector();
  monthModalOverlay.classList.remove('hidden');
}

function closeMonthModal() {
  monthModalOverlay.classList.add('hidden');
}


function getStatusClass(entry) {
  if (entry.status === 'planned') return ' status-planned';
  if (entry.status === 'confirmed') return ' status-confirmed';
  return '';
}

function createCell(employee, day, weekday, isHoliday) {
  const cell = document.createElement('td');
  const entry = getEntry(employee, day);

  if (entry) {
    cell.innerHTML = `<div class="cell-time">${formatTimeRange(entry)}</div><div class="cell-location">${entry.location || '-'}</div>`;
    cell.classList.add('cell-filled');

    const statusClass = getStatusClass(entry).trim();
    if (statusClass) {
      cell.classList.add(statusClass);
    }
  } else {
    cell.innerHTML = `<div class="cell-empty">-</div>`;
    cell.classList.add('cell-empty');
  }
  if (isHoliday) {
    cell.classList.add('weekday-holiday');
  } else if (weekday === '土') {
    cell.classList.add('weekday-sat');
  } else if (weekday === '日') {
    cell.classList.add('weekday-sun');
  }

  cell.addEventListener('click', () => {
    openDetailModal(employee, day, entry);
  });

  return cell;
}


function renderScheduleTable() {
  const daysInMonth = getDaysInMonth(activeMonthKey);
  const [year, month] = activeMonthKey.split('-').map(Number);
  const thead = scheduleTable.querySelector('thead');
  const tbody = scheduleTable.querySelector('tbody');
  thead.innerHTML = '';
  tbody.innerHTML = '';

  // ===== ヘッダー行の作成 =====
  const headerRow = document.createElement('tr');
  const firstHeader = document.createElement('th');
  firstHeader.textContent = '日付';
  headerRow.appendChild(firstHeader);

  employeeNames.forEach((employee) => {
    const th = document.createElement('th');
    th.textContent = employee;
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);

  // ===== 本体 =====
  for (let day = 1; day <= daysInMonth; day += 1) {
    const holidayKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isHoliday = holidaySet.has(holidayKey);
    const weekday = getWeekday(year, month, day);
    const row = document.createElement('tr');
    const dayCell = document.createElement('th');
    dayCell.innerHTML = `${day}<span class="weekday">${weekday}</span>`;
    if (isHoliday) {
      dayCell.classList.add('weekday-holiday');
    } else if (weekday === '土') {
      dayCell.classList.add('weekday-sat');
    } else if (weekday === '日') {
      dayCell.classList.add('weekday-sun');
    }
    row.appendChild(dayCell);

    employeeNames.forEach((employee) => {
      row.appendChild(
        createCell(employee, String(day), weekday, isHoliday)
      );
    });

    tbody.appendChild(row);
  }
}

function openDetailModal(employee, day, entry) {
  modalContent.innerHTML = '';
  const labelMap = [
    { label: '社員名', value: employee },
    { label: '期間', value: formatDateRange(entry, day) },
    { label: '開始時刻', value: entry?.startTime || entry?.time?.split('-')[0] || '未入力' },
    { label: '終了時刻', value: entry?.endTime || entry?.time?.split('-')[1] || '未入力' },
    { label: '勤務地', value: entry?.location || '未入力' },
    { label: '備考', value: entry?.remarks || '未入力' }
  ];

  labelMap.forEach((item) => {
    const field = document.createElement('div');
    field.innerHTML = `<p class="field-label">${item.label}</p><p class="field-value">${item.value}</p>`;
    modalContent.appendChild(field);
  });

  modalOverlay.classList.remove('hidden');
}

function closeDetailModal() {
  modalOverlay.classList.add('hidden');
}

openMonthModalButton.addEventListener('click', openMonthModal);
monthModalCloseButton.addEventListener('click', closeMonthModal);
monthModalOverlay.addEventListener('click', (event) => {
  if (event.target === monthModalOverlay) {
    closeMonthModal();
  }
});
modalCloseButton.addEventListener('click', closeDetailModal);
modalOverlay.addEventListener('click', (event) => {
  if (event.target === modalOverlay) {
    closeDetailModal();
  }
});

loadScheduleData();
renderCurrentMonthLabel();
renderScheduleTable();
