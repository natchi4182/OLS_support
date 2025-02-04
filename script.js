document.addEventListener('DOMContentLoaded', async () => {
  // -----------------------------
  // 1) スライダーと数値の要素を同期
  // -----------------------------
  const synchronizeInputs = (numberInputId, sliderInputId) => {
    const numberInput = document.getElementById(numberInputId);
    const sliderInput = document.getElementById(sliderInputId);

    sliderInput.addEventListener('input', () => {
      numberInput.value = sliderInput.value;
      validateLabInput(numberInput);
      updateNormalValues(); // 正常値を更新
    });
    numberInput.addEventListener('input', () => {
      sliderInput.value = numberInput.value;
      validateLabInput(numberInput);
      updateNormalValues(); // 正常値を更新
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
  //  hospital-doctor-retalation
  // -----------------------------
  const hospitalInput = document.getElementById('hospitalInput');
  const doctorInput = document.getElementById('doctorInput');

  // Google Apps Script APIのURL
  const apiUrl = "https://script.google.com/macros/s/AKfycbzuFcfS79l-vv6JoRleA-03ANAXhKe6yIHHrm1FaBcDYU22IZ2fWFTTSBXfxTnlx_bxNA/exec"; // デプロイしたURLを貼り付け

  // データを取得
  const fetchData = async () => {
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("データ取得エラー:", error);
      return { hospitals: {}, doctors: {} };
    }
  };

  const data = await fetchData();

  // 病院と医師の選択肢を動的に作成
  const populateOptions = (selectElement, options, selectValue = "") => {
    selectElement.innerHTML = '<option value="">--- 選 択 ---</option>';
    options.forEach(option => {
      const opt = document.createElement('option');
      opt.value = option;
      opt.textContent = option;
      if (option === selectValue) {
        opt.selected = true;
      }
      selectElement.appendChild(opt);
    });
  };

  // 初期状態: 全ての病院と医師を表示
  populateOptions(hospitalInput, Object.keys(data.hospitals));
  populateOptions(doctorInput, Object.keys(data.doctors));

  // 病院選択時の処理
  hospitalInput.addEventListener('change', () => {
    const selectedHospital = hospitalInput.value;
    const selectedDoctor = doctorInput.value;

    if (selectedHospital) {
      const relatedDoctors = data.hospitals[selectedHospital] || [];
      populateOptions(doctorInput, relatedDoctors, relatedDoctors.includes(selectedDoctor) ? selectedDoctor : "");
    } else {
      populateOptions(doctorInput, Object.keys(data.doctors), selectedDoctor);
    }
  });

  // 医師選択時の処理
  doctorInput.addEventListener('change', () => {
    const selectedDoctor = doctorInput.value;
    const selectedHospital = hospitalInput.value;

    if (selectedDoctor) {
      const relatedHospitals = data.doctors[selectedDoctor] || [];
      populateOptions(hospitalInput, relatedHospitals, relatedHospitals.includes(selectedHospital) ? selectedHospital : "");
    } else {
      populateOptions(hospitalInput, Object.keys(data.hospitals), selectedHospital);
    }
  });

  // -----------------------------
  // 2) JSONファイルから各種選択肢を動的読込
  // -----------------------------
//  await populateSelect('https://natchi4182.github.io/OLS_support/hospital_list.json' , 'hospitalInput');
//  await populateSelect('https://natchi4182.github.io/OLS_support/doctor_list.json' , 'doctorInput');
  await populateCheckboxes('https://natchi4182.github.io/OLS_support/diseases_list.json' , 'diseaseContainer', 'diseases');
  await populateSelect('https://natchi4182.github.io/OLS_support/smoking_list.json' , 'smokingInput');
  await populateSelect('https://natchi4182.github.io/OLS_support/alcohol_list.json' , 'alcoholInput');

  // 特定jsonだけ®を上付きに変換
  await populateCheckboxes('https://natchi4182.github.io/OLS_support/osteoporosis_meds.json' , 'osteoporosisMedsContainer', 'osteoporosis_meds');
  await populateCheckboxes('https://natchi4182.github.io/OLS_support/hrt_meds.json' , 'hrtMedsContainer', 'hrt_meds');
  await populateCheckboxes('https://natchi4182.github.io/OLS_support/anticancer_meds.json' , 'anticancerMedsContainer', 'anticancer_meds');

  // 変換しないチェックボックス
  await populateCheckboxes('https://natchi4182.github.io/OLS_support/bone_metabolism_meds.json' , 'boneMetabolismMedsContainer', 'bone_metabolism_meds');
  await populateCheckboxes('https://natchi4182.github.io/OLS_support/fracture_history.json' , 'fractureHistoryContainer', 'fracture_history');
  await populateCheckboxes('https://natchi4182.github.io/OLS_support/others.json' , 'othersContainer', 'others');

  // -----------------------------
  // 3) 検体検査データ テーブルの生成
  // -----------------------------
  // 外部JSONからlabDataItemsを取得
  let labDataItems = [];
  try {
    const response = await fetch('https://natchi4182.github.io/OLS_support/labDataItems.json');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    labDataItems = await response.json();
  } catch (error) {
    console.error('labDataItems.jsonの読み込みに失敗しました:', error);
    alert('検体検査データの読み込みに失敗しました。コンソールを確認してください。');
  }

  // labDataMap: 検査項目→単位の対応
  const labDataMap = {};
  labDataItems.forEach(item => {
    labDataMap[item.name] = item.unit;
  });
  // 一般項目にも単位付与
  labDataMap["height"] = "cm";
  labDataMap["weight"] = "kg";
  labDataMap["lumbar_bmd"] = "g/cm²";
  labDataMap["lumbar_yam"] = "%";
  labDataMap["femur_bmd"] = "g/cm²";
  labDataMap["femur_yam"] = "%";

  const labDataTable = document.getElementById('labDataTable');
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
    input.min = item.min || ""; // Optional: Add min if available
    input.max = item.max || ""; // Optional: Add max if available
    tdInput.appendChild(input);
    tr.appendChild(tdInput);

    const tdUnit = document.createElement('td');
    tdUnit.textContent = item.unit;
    tr.appendChild(tdUnit);

    const tdNormal = document.createElement('td');
    tdNormal.textContent = "性別により異なる"; // 初期表示
    tr.appendChild(tdNormal);

    labDataTable.appendChild(tr);
  });

  // -----------------------------
  // legendによる開閉
  // -----------------------------
  const legends = document.querySelectorAll('legend'); // すべてのlegendを取得

  legends.forEach(legend => {
    const fieldset = legend.parentElement; // 対応する<fieldset>を取得
    const content = fieldset.querySelector('.content'); // フィールドセット内の.contentを取得

    // legendをクリックしたときの処理
    legend.addEventListener('click', (event) => {
      event.stopPropagation(); // フィールドセットのクリックイベントを無効化

      if (fieldset.classList.contains('shrunk')) {
        // 開く
        content.classList.remove('hidden'); // 内容を表示
        fieldset.classList.remove('shrunk'); // フィールドセットの高さを戻す
        fieldset.style.height = 'auto'; // 高さを自動調整
      } else {
        // 縮小する
        content.classList.add('hidden'); // 内容を非表示
        fieldset.classList.add('shrunk'); // フィールドセットを縮小
        fieldset.style.height = '1.5em'; // legend分の高さに設定
      }
    });
  });

  // -----------------------------
  // fieldsetクリックによる開閉
  // -----------------------------
  const fieldsets = document.querySelectorAll('fieldset.shrunkable'); // 縮小可能なフィールドセットを取得

  fieldsets.forEach(fieldset => {
    const content = fieldset.querySelector('.content'); // 各フィールドセット内の.contentを取得

    // フィールドセット全体をクリック可能にする
    fieldset.addEventListener('click', () => {
      if (fieldset.classList.contains('shrunk')) {
        // 開く (閉じているときのみ動作)
        content.classList.remove('hidden');
        fieldset.classList.remove('shrunk');
        fieldset.style.height = 'auto';
      }
      // 開いているときは何もしない
    });
  });

  // -----------------------------
  // 4) ボタン別のイベント定義
  // -----------------------------
  // (A) 「確認」ボタン
  document.getElementById('checkBtn').addEventListener('click', (e) => {
    e.preventDefault();

    const form = document.getElementById('mainForm');
    const resultArea = document.getElementById('resultArea');
    const formData = new FormData(form);

    // 必須項目のチェック
    const requiredFields = form.querySelectorAll('[required]');
    let allValid = true;
    const radioGroups = new Set();

    requiredFields.forEach(field => {
      if (field.type === 'radio') {
        radioGroups.add(field.name);
      } else {
        if (!field.value.trim()) {
          allValid = false;
          field.style.border = '2px solid red';
        } else {
          field.style.border = '';
        }
      }
    });

    // ラジオボタンのグループごとのチェック
    radioGroups.forEach(name => {
      const radios = form.querySelectorAll(`input[name="${name}"]`);
      const isChecked = Array.from(radios).some(radio => radio.checked);
      if (!isChecked) {
        allValid = false;
        radios.forEach(radio => radio.parentElement.style.border = '2px solid red');
      } else {
        radios.forEach(radio => radio.parentElement.style.border = '');
      }
    });

    if (!allValid) {
      alert('必須項目をすべて入力してください。');
      return;
    }

    let output = '【入力データ一覧】\n';

    for (const [key, value] of formData.entries()) {
      if (value === '') continue;

      // 出力しない項目をスキップ
      if (["hospital", "doctor", "patient_id"].includes(key)) continue;
      
      let labelKey = keyToLabelMap[key] || key;
      let cleanValue = value.replace(/<sup>®<\/sup>/g, "");  // ®マーク削除
      const unit = labDataMap[key];

      if (unit) {
        output += `${labelKey}: ${cleanValue} ${unit}\n`;
      } else {
        output += `${labelKey}: ${cleanValue}\n`;
      }
    }
    resultArea.value = output;
  });

  // (B) 「送信」ボタン (GASへPOST)
  document.getElementById('submitBtn').addEventListener('click', async (e) => {
    e.preventDefault();

    const form = document.getElementById('mainForm');
    const formData = new FormData(form);

    try {
      // WebアプリのURL (doPostを定義しているGAS)
      const scriptUrl = 'https://script.google.com/macros/s/AKfycbxtLrBrObAdOQLs8WvufxKY2cNAeIEUkOSsrtx_264okknmYqCJMlPrvXRihR4Atqp3/exec';

      const response = await fetch(scriptUrl, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`サーバーエラー: ${response.statusText}`);
      }

      const json = await response.json(); 
      alert('送信完了:\n' + json.message);
      localStorage.removeItem('formData'); // 送信完了後にデータをクリア
    } catch (err) {
      console.error('送信失敗', err);
      alert('送信失敗: ' + err.message);
    }
  });

  // (C) 「コピー&GPT」ボタン
  document.getElementById('copyBtn').addEventListener('click', async (e) => {
    e.preventDefault();

    const resultArea = document.getElementById('resultArea');
    const textToCopy = resultArea.value;

    if (!textToCopy) {
      alert('結果表示エリアが空です。');
      return;
    }

    try {
      // クリップボードにコピー
      await navigator.clipboard.writeText(textToCopy);
      alert('クリップボードにコピーしました。');

      // URLを別ウィンドウで表示
      const gptUrl = 'https://chatgpt.com/g/g-6751327a384c8191a75c343ec21a5fcc-gu-cu-song-zheng-nozhen-duan-tozhi-liao-wokaitosurugpt';
      window.open(gptUrl, '_blank');

    } catch (err) {
      console.error('コピー失敗', err);
      alert('コピーできませんでした: ' + err);
    }
  });

  // (D) 「結果報告書」ボタン
  document.getElementById('reportBtn').addEventListener('click', () => {
    const form = document.getElementById('mainForm');
    const formData = new FormData(form);

    // URLパラメータの作成
    const params = new URLSearchParams();

    for (const [key, value] of formData.entries()) {
      if (value.trim() !== "") {
        params.append(key, value);
      }
    }

    // `report.html` を開き、パラメータを付与してデータを渡す
    window.open(`report.html?${params.toString()}`, "_blank");
  });

  // (E) 「クリア」ボタン
  document.getElementById('clearBtn').addEventListener('click', () => {
    if (confirm('入力データをクリアしてよろしいですか？')) {
      const form = document.getElementById('mainForm');
      form.reset(); // フォームをリセット

      // 検体検査データ テーブルの背景色をリセット
      const labDataTable = document.getElementById('labDataTable');
      const rows = labDataTable.querySelectorAll('tr');
      rows.forEach(row => {
        row.style.backgroundColor = '';
        // 正常値を「性別により異なる」にリセット
        const tdNormal = row.querySelector('td:nth-child(4)');
        if (tdNormal) {
          tdNormal.textContent = "性別により異なる";
        }
      });

      // ローカルストレージをクリア
      localStorage.removeItem('formData');

      // 結果表示エリアをクリア
      document.getElementById('resultArea').value = '';

      // 年齢バリデーションをリセット
      validateAge();
    }
  });

  // -----------------------------
  // 5) populateSelect
  // -----------------------------
  async function populateSelect(jsonPath, selectId) {
    try {
      const res = await fetch(jsonPath);
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      const data = await res.json();
      const select = document.getElementById(selectId);

      data.items.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        select.appendChild(option);
      });
    } catch(err) {
      console.error('Error loading', jsonPath, err);
      alert(`選択肢の読み込みに失敗しました: ${selectId}`);
    }
  }

  // -----------------------------
  // 6) populateCheckboxes
  // -----------------------------
  async function populateCheckboxes(jsonPath, containerId, nameAttr) {
    try {
      const res = await fetch(jsonPath);
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      const data = await res.json();
      const container = document.getElementById(containerId);

      // 変換対象ファイル
      const convertTargets = [
        'https://natchi4182.github.io/OLS_support/anticancer_meds.json',
        'https://natchi4182.github.io/OLS_support/hrt_meds.json',
        'https://natchi4182.github.io/OLS_support/osteoporosis_meds.json'
      ];
      const doConvert = convertTargets.includes(jsonPath);

      data.items.forEach(item => {
        if (item === "separator") {
          // 横線を挿入
          const separator = document.createElement('hr');
          container.appendChild(separator);
        } else {
          // 特定ファイルだけ ® を上付きに変換
          let displayItem = item;
          if (doConvert) {
          displayItem = item.replace(/®/g, '<sup>®</sup>');
          }

          const labelElem = document.createElement('label');
          labelElem.classList.add('inline-label');

          const input = document.createElement('input');
          input.type = 'checkbox';
          input.name = nameAttr;
          input.value = item;
          labelElem.appendChild(input);

          const span = document.createElement('span');
          span.innerHTML = ' ' + displayItem;
          labelElem.appendChild(span);

          container.appendChild(labelElem);
        }
      });
    } catch(err) {
      console.error('Error loading', jsonPath, err);
      alert(`チェックボックスの読み込みに失敗しました: ${nameAttr}`);
    }
  }

  // -----------------------------
  // 7) 検体検査データ テーブルの色変更と正常値の表示
  // -----------------------------
  function getSelectedSex() {
    const sexRadios = document.querySelectorAll('input[name="sex"]');
    for (let radio of sexRadios) {
      if (radio.checked) {
        return radio.value;
      }
    }
    return null;
  }

  function getNormalValue(item) {
    const selectedSex = getSelectedSex();
    if (!selectedSex) {
      return "性別により異なる"; // 性別が選択されていない場合
    }

    const normalRangeStr = item.normal ? item.normal[selectedSex] : null;
    if (!normalRangeStr) {
      return "未定義"; // 正常値が定義されていない場合
    }

    return normalRangeStr;
  }

  function validateLabInput(numberInput) {
    const tr = numberInput.closest('tr');
    const name = numberInput.name;
    const value = parseFloat(numberInput.value);
    const item = labDataItems.find(item => item.name === name);

    if (item) {
      const selectedSex = getSelectedSex();
      if (!selectedSex) {
        tr.style.backgroundColor = '';
        return;
      }

      const normalRangeStr = getNormalValue(item);
      if (normalRangeStr === "性別により異なる" || normalRangeStr === "未定義") {
        tr.style.backgroundColor = '';
        return;
      }

      const normalParts = normalRangeStr.split('〜').map(v => v.trim());

      let min = parseFloat(normalParts[0]);
      let max = parseFloat(normalParts[1]);

      if (isNaN(max)) {
        max = Infinity;
      }

      if (isNaN(value)) {
        tr.style.backgroundColor = '';
      } else if (value < min) {
        tr.style.backgroundColor = '#bbdefb'; // 青系
      } else if (value > max) {
        tr.style.backgroundColor = '#ffebee'; // 赤系
      } else {
        tr.style.backgroundColor = '#e8f5e9'; // 緑系
      }
    }
  }

  function updateNormalValues() {
    labDataItems.forEach(item => {
      const input = document.querySelector(`input[name="${item.name}"]`);
      if (input) {
        const tr = input.closest('tr');
        const tdNormal = tr.querySelector('td:nth-child(4)');
        tdNormal.textContent = getNormalValue(item);
        validateLabInput(input);
      }
    });
  }

  labDataTable.addEventListener('input', (e) => {
    if (e.target && e.target.tagName.toLowerCase() === 'input') {
      const input = e.target;
      validateLabInput(input);
    }
  });

  // 性別変更時に検査結果を再検証
  const sexRadios = document.querySelectorAll('input[name="sex"]');
  sexRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      updateNormalValues();
    });
  });

  // -----------------------------
  // 8) リアルタイムバリデーションとエラーメッセージの追加
  // -----------------------------
  const ageNumber = document.getElementById('ageNumber');
  const ageInputRange = document.getElementById('ageInput');
  const ageError = document.getElementById('ageError');

  const validateAge = () => {
    const value = parseInt(ageNumber.value, 10);
    if (isNaN(value) || value < 0 || value > 120) {
      ageNumber.style.border = '2px solid red';
      ageInputRange.style.border = '2px solid red';
      ageError.classList.remove('visually-hidden');
    } else {
      ageNumber.style.border = '';
      ageInputRange.style.border = '';
      ageError.classList.add('visually-hidden');
    }
  };

  ageNumber.addEventListener('input', validateAge);
  ageInputRange.addEventListener('input', validateAge);

  // -----------------------------
  // 9) データの保存と復元
  // -----------------------------
  // フォームのデータを保存
  const formElement = document.getElementById('mainForm');
  formElement.addEventListener('input', () => {
    const formData = new FormData(formElement);
    const data = {};
    formData.forEach((value, key) => {
      // チェックボックスは複数選択可能なので配列で保存
      if (data[key]) {
        if (Array.isArray(data[key])) {
          data[key].push(value);
        } else {
          data[key] = [data[key], value];
        }
      } else {
        data[key] = value;
      }
    });
    localStorage.setItem('formData', JSON.stringify(data));
  });

  // ページ読み込み時にデータを復元
  const savedData = JSON.parse(localStorage.getItem('formData'));
  if (savedData) {
    for (const key in savedData) {
      if (savedData.hasOwnProperty(key)) {
        const element = formElement.elements.namedItem(key);
        if (element) {
          if (element.type === 'radio' || element.type === 'checkbox') {
            const values = Array.isArray(savedData[key]) ? savedData[key] : [savedData[key]];
            Array.from(formElement.elements.namedItem(key)).forEach(radio => {
              radio.checked = values.includes(radio.value);
            });
          } else {
            element.value = savedData[key];
          }
        }
      }
    }

    // 性別変更時に再検証と正常値の更新
    const selectedSex = getSelectedSex();
    if (selectedSex) {
      updateNormalValues();

      // 年齢バリデーションの再実行
      validateAge();
    }
  }

  // 「尿中Ca/尿中Cre」を自動計算
  const ratioInput = document.querySelector('input[name="尿中Ca/尿中Cre"]');
  if (ratioInput) {
    ratioInput.readOnly = true;
  }

  const calculateUrinaryCaRatio = () => {
    // 「尿中Ca」と「尿中Cre」の入力フィールドを取得
    const caInput = document.querySelector('input[name="尿中Ca"]');
    const creInput = document.querySelector('input[name="尿中Cre"]');
    const ratioInput = document.querySelector('input[name="尿中Ca/尿中Cre"]');

    if (caInput && creInput && ratioInput) {
      const caValue = parseFloat(caInput.value) || 0;
      const creValue = parseFloat(creInput.value) || 0;

      if (creValue !== 0) {
        // 比率を計算して小数点第2位まで表示
        const ratio = (caValue / creValue).toFixed(2);
        ratioInput.value = ratio;
      } else {
        // 「尿中Cre」がゼロの場合は空欄
        ratioInput.value = '';
      }
    }
  };

  // イベントリスナーを追加
  const caInput = document.querySelector('input[name="尿中Ca"]');
  const creInput = document.querySelector('input[name="尿中Cre"]');

  if (caInput && creInput) {
    caInput.addEventListener('input', calculateUrinaryCaRatio);
    creInput.addEventListener('input', calculateUrinaryCaRatio);
  }
  
    // 要素を取得
    const modal = document.getElementById("modal");
    const modalOverlay = document.getElementById("modal-overlay");
    const closeBtn = document.getElementById("close-btn");
    const modalTitle = document.getElementById("modal-title");
    const modalContent = document.getElementById("modal-content");

    // ボタンをクリックした時の処理
    document.querySelectorAll(".show-modal-btn").forEach(button => {
      button.addEventListener("click", () => {
        const file = button.dataset.file; // ボタンのdata-file属性からファイル名を取得

        // JSONファイルを読み込む
        fetch(file)
          .then(response => {
            if (!response.ok) {
              throw new Error(`${file} を取得できませんでした。`);
            }
            return response.json();
          })
          .then(data => {
            // JSONデータを整形して表示
            modalTitle.textContent = data.title || "タイトル";
            const sections = data.sections || [];
            modalContent.innerHTML = sections
              .map(
                section => `
                  <h3>${section.heading}</h3>
                  <p>${section.content.replace(/\n/g, "<br>")}</p>
                `
              )
              .join("");
            modal.style.display = "block";
            modalOverlay.style.display = "block";
          })
          .catch(error => {
            console.error(error);
            modalTitle.textContent = "エラー";
            modalContent.innerHTML = "<p>コンテンツを読み込むことができませんでした。</p>";
            modal.style.display = "block";
            modalOverlay.style.display = "block";
          });
      });
    });

    // モーダルを閉じるボタン
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
      modalOverlay.style.display = "none";
    });

    // オーバーレイをクリックしても閉じる
    modalOverlay.addEventListener("click", () => {
      modal.style.display = "none";
      modalOverlay.style.display = "none";
    });

  // FRAX
    function updateFRAX() {
        if (typeof calculateFRAX !== "function") {
            console.error("🚨 エラー: calculateFRAX 関数が見つかりません！");
            return;
        }

        let age = document.getElementById("ageNumber") ? document.getElementById("ageNumber").value : null;
        let height = document.getElementById("heightNumber") ? document.getElementById("heightNumber").value : null;
        let weight = document.getElementById("weightNumber") ? document.getElementById("weightNumber").value : null;
        let femur_bmd = document.getElementById("femurBMDNumber") ? parseFloat(document.getElementById("femurBMDNumber").value) || 0 : 0;
        let smoking = document.getElementById("smokingInput") ? document.getElementById("smokingInput").value : null;
        let alcohol = document.getElementById("alcoholInput") ? document.getElementById("alcoholInput").value : null;

        let sexInput = document.querySelector("input[name='sex']:checked");
        let sex = sexInput ? sexInput.value : null;

        // 🔹 基礎疾患の取得（修正）
        let diseases = Array.from(document.querySelectorAll("#diseasesContainer input[name='diseases']:checked"))
                            .map(el => el.value);
        diseases = diseases.length > 0 ? diseases : ["なし"];

        // 🔹 骨折歴の取得（修正）
        let fracture_history = Array.from(document.querySelectorAll("#fractureHistoryContainer input[name='fracture_history']:checked"))
                                    .map(el => el.value);
        fracture_history = fracture_history.length > 0 ? fracture_history : ["骨折歴なし"];

        let bone_metabolism_meds = Array.from(document.querySelectorAll("#boneMetabolismMedsContainer input[name='bone_metabolism_meds']:checked"))
                                        .map(el => el.value);
        bone_metabolism_meds = bone_metabolism_meds.length > 0 ? bone_metabolism_meds : ["なし"];

        let parentHipFracture = Array.from(document.querySelectorAll("#othersContainer input[name='others']:checked"))
                                     .some(el => el.value === "両親の大腿骨近位部骨折の既往");

        let formData = {
            age: age,
            height: height,
            weight: weight,
            sex: sex,
            diseases: diseases,
            bone_metabolism_meds: bone_metabolism_meds,
            femur_bmd: femur_bmd,
            fracture_history: fracture_history,
            smoking: smoking,
            alcohol: alcohol,
            parentHipFracture: parentHipFracture
        };

        console.log("📌 取得データ:", formData);

        let result = calculateFRAX(formData);

        if (!result || !result.majorFractureRisk || !result.hipFractureRisk) {
            console.error("🚨 エラー: FRAX 計算結果が無効です！", result);
            return;
        }

        document.getElementById("majorFractureRisk").innerText = `主要骨折リスク: ${result.majorFractureRisk}%`;
        document.getElementById("hipFractureRisk").innerText = `股関節骨折リスク: ${result.hipFractureRisk}%`;
    }

    // 🔄 スライダーと数値入力の同期 & FRAX 更新
    function syncSliderWithNumber(numberId, sliderId) {
        let numberInput = document.getElementById(numberId);
        let sliderInput = document.getElementById(sliderId);

        if (numberInput && sliderInput) {
            numberInput.addEventListener("input", () => {
                sliderInput.value = numberInput.value;
                updateFRAX();
            });
            sliderInput.addEventListener("input", () => {
                numberInput.value = sliderInput.value;
                updateFRAX();
            });
        }
    }

    // 🔄 すべてのスライダーと数値入力を同期
    syncSliderWithNumber("ageNumber", "ageInput");
    syncSliderWithNumber("heightNumber", "heightInput");
    syncSliderWithNumber("weightNumber", "weightInput");
    syncSliderWithNumber("femurBMDNumber", "femurBMD");

    // 🔄 性別の選択変更時に FRAX を更新
    document.querySelectorAll("input[name='sex']").forEach(radio => {
        radio.addEventListener("change", updateFRAX);
    });

    // 🔄 チェックボックス（基礎疾患・骨折歴・骨代謝薬・両親の骨折歴）変更時に FRAX を更新
    function addChangeListenerToCheckboxGroup(selector) {
        let checkboxes = document.querySelectorAll(selector);
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener("change", () => {
                console.log(`🔄 ${selector} が変更されました:`, checkbox.value);
                updateFRAX();
            });
        });
    }

    addChangeListenerToCheckboxGroup("#fractureHistoryContainer input[name='fracture_history']");
    addChangeListenerToCheckboxGroup("#diseasesContainer input[name='diseases']");
    addChangeListenerToCheckboxGroup("#boneMetabolismMedsContainer input[name='bone_metabolism_meds']");
    addChangeListenerToCheckboxGroup("#othersContainer input[name='others']");

    // 🔄 喫煙とアルコールの `select` に `change` イベントを追加
    function addChangeListenerToSelect(selectId) {
        let selectElement = document.getElementById(selectId);
        if (selectElement) {
            selectElement.addEventListener("change", () => {
                console.log(`🔄 ${selectId} が変更されました:`, selectElement.value);
                updateFRAX();
            });
        }
    }

    addChangeListenerToSelect("smokingInput");
    addChangeListenerToSelect("alcoholInput");

    updateFRAX(); // 初回実行

}); // DOMContentLoaded end
