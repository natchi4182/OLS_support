document.addEventListener('DOMContentLoaded', async () => {
  // -----------------------------
  // 1) スライダーと数値の要素を同期
  // -----------------------------
  const synchronizeInputs = (numberInputId, sliderInputId) => {
    const numberInput = document.getElementById(numberInputId);
    const sliderInput = document.getElementById(sliderInputId);

    sliderInput.addEventListener('input', () => {
      numberInput.value = sliderInput.value;
      saveFormData(); // ローカルストレージに保存
    });

    numberInput.addEventListener('input', () => {
      sliderInput.value = numberInput.value;
      saveFormData(); // ローカルストレージに保存
    });
  };

  synchronizeInputs('ageNumber', 'ageInput');
  synchronizeInputs('heightNumber', 'heightInput');
  synchronizeInputs('weightNumber', 'weightInput');
  synchronizeInputs('lumbarBMDNumber', 'lumbarBMD');
  synchronizeInputs('lumbarYAMNumber', 'lumbarYAM');
  synchronizeInputs('femurBMDNumber', 'femurBMD');
  synchronizeInputs('femurYAMNumber', 'femurYAM');

  // -----------------------------
  // 2) JSONファイルから各種選択肢を動的読込
  // -----------------------------
  const populateSelect = async (jsonPath, selectId) => {
    try {
      const res = await fetch(jsonPath);
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      const select = document.getElementById(selectId);

      data.items.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        select.appendChild(option);
      });
    } catch (err) {
      console.error('Error loading', jsonPath, err);
    }
  };

  const populateCheckboxes = async (jsonPath, containerId, nameAttr) => {
    try {
      const res = await fetch(jsonPath);
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      const container = document.getElementById(containerId);

      data.items.forEach(item => {
        const label = document.createElement('label');
        label.classList.add('inline-label');
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.name = nameAttr;
        input.value = item;
        label.appendChild(input);
        const span = document.createElement('span');
        span.textContent = ` ${item}`;
        label.appendChild(span);
        container.appendChild(label);
      });
    } catch (err) {
      console.error('Error loading', jsonPath, err);
    }
  };

  await populateSelect('https://natchi4182.github.io/OLS_support/hospital_list.json', 'hospitalInput');
  await populateSelect('https://natchi4182.github.io/OLS_support/doctor_list.json', 'doctorInput');
  await populateCheckboxes('https://natchi4182.github.io/OLS_support/diseases_list.json', 'diseaseContainer', 'diseases');

  // -----------------------------
  // 3) 検体検査データ テーブルの生成
  // -----------------------------
  const labDataTable = document.getElementById('labDataTable');
  let labDataItems = [];

  try {
    const response = await fetch('https://natchi4182.github.io/OLS_support/labDataItems.json');
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    labDataItems = await response.json();
  } catch (err) {
    console.error('Error loading labDataItems.json:', err);
  }

  labDataItems.forEach(item => {
    const tr = document.createElement('tr');
    const tdName = document.createElement('td');
    tdName.textContent = item.name;
    tr.appendChild(tdName);

    const tdInput = document.createElement('td');
    const input = document.createElement('input');
    input.type = 'number';
    input.name = item.name;
    input.step = item.step;
    input.min = item.min || '';
    input.max = item.max || '';

    if (item.name === '尿中Ca/尿中Cre') input.readOnly = true; // 自動計算専用
    input.addEventListener('input', saveFormData); // 保存処理
    tdInput.appendChild(input);
    tr.appendChild(tdInput);

    const tdUnit = document.createElement('td');
    tdUnit.textContent = item.unit;
    tr.appendChild(tdUnit);

    const tdNormal = document.createElement('td');
    tdNormal.textContent = '性別により異なる'; // 初期値
    tr.appendChild(tdNormal);

    labDataTable.appendChild(tr);
  });

  // -----------------------------
  // 4) 検体データ「尿中Ca/尿中Cre」の自動計算
  // -----------------------------
  const calculateUrinaryCaRatio = () => {
    const caInput = document.querySelector('input[name="尿中Ca"]');
    const creInput = document.querySelector('input[name="尿中Cre"]');
    const ratioInput = document.querySelector('input[name="尿中Ca/尿中Cre"]');

    if (caInput && creInput && ratioInput) {
      const caValue = parseFloat(caInput.value) || 0;
      const creValue = parseFloat(creInput.value) || 0;
      ratioInput.value = creValue !== 0 ? (caValue / creValue).toFixed(2) : ''; // 小数点第2位まで
    }
  };

  const caInput = document.querySelector('input[name="尿中Ca"]');
  const creInput = document.querySelector('input[name="尿中Cre"]');

  if (caInput && creInput) {
    caInput.addEventListener('input', calculateUrinaryCaRatio);
    creInput.addEventListener('input', calculateUrinaryCaRatio);
  }

  // -----------------------------
  // 5) ローカルストレージ保存・復元処理
  // -----------------------------
  const saveFormData = () => {
    const form = document.getElementById('mainForm');
    const formData = new FormData(form);
    const data = {};

    formData.forEach((value, key) => {
      data[key] = value;
    });

    localStorage.setItem('formData', JSON.stringify(data));
  };

  const restoreFormData = () => {
    const savedData = JSON.parse(localStorage.getItem('formData'));
    if (savedData) {
      for (const [key, value] of Object.entries(savedData)) {
        const element = document.querySelector(`[name="${key}"]`);
        if (element) {
          if (element.type === 'checkbox' || element.type === 'radio') {
            element.checked = value === 'true';
          } else {
            element.value = value;
          }
        }
      }
    }
  };

  restoreFormData();

  // -----------------------------
  // 性別変更時に正常値を更新
  // -----------------------------
  const updateNormalValues = () => {
    const selectedSex = document.querySelector('input[name="sex"]:checked')?.value;
    if (!selectedSex) return;

    labDataItems.forEach(item => {
      const input = document.querySelector(`input[name="${item.name}"]`);
      const tdNormal = input?.closest('tr').querySelector('td:nth-child(4)');
      if (tdNormal) {
        tdNormal.textContent = item.normal[selectedSex] || '未定義';
      }
    });
  };

  document.querySelectorAll('input[name="sex"]').forEach(radio => {
    radio.addEventListener('change', updateNormalValues);
  });

  updateNormalValues();
});
