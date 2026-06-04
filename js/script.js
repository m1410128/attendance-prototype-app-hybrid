const monthList = Array.from({ length: 12 }, (_, index) => {
  const monthNumber = index + 1;
  return {
    key: `2026-${monthNumber.toString().padStart(2, '0')}`,
    label: `2026年${monthNumber}月`
  };
});

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

let activeMonthKey = monthList[0].key;
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

function createCell(employee, day, weekday) {
  const cell = document.createElement('td');
  const entry = getEntry(employee, day);

  if (entry) {
    cell.innerHTML = `<div class="cell-time">${formatTimeRange(entry)}</div><div class="cell-location">${entry.location || '-'}</div>`;
    cell.classList.add('cell-filled');
  } else {
    cell.innerHTML = `<div class="cell-empty">-</div>`;
    cell.classList.add('cell-empty');
  }

  if (weekday === '土') {
    cell.classList.add('weekday-sat');
  }
  if (weekday === '日') {
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

  const headerRow = document.createElement('tr');
  const firstHeader = document.createElement('th');
  firstHeader.textContent = '社員名';
  headerRow.appendChild(firstHeader);

  for (let day = 1; day <= daysInMonth; day += 1) {
    const weekday = getWeekday(year, month, day);
    const th = document.createElement('th');
    th.innerHTML = `${day}<span class="weekday">${weekday}</span>`;
    if (weekday === '土') th.classList.add('weekday-sat');
    if (weekday === '日') th.classList.add('weekday-sun');
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);

  employeeNames.forEach((employee) => {
    const row = document.createElement('tr');
    const nameCell = document.createElement('th');
    nameCell.textContent = employee;
    row.appendChild(nameCell);

    for (let day = 1; day <= daysInMonth; day += 1) {
      row.appendChild(createCell(employee, String(day), getWeekday(year, month, day)));
    }
    tbody.appendChild(row);
  });
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
