function calculateFRAX(data) {
    let age = parseInt(data.age);
    let height = parseFloat(data.height);
    let weight = parseFloat(data.weight);
    let femoralNeckBmd = data.femur_bmd ? parseFloat(data.femur_bmd) : null;

    // BMI 計算
    let bmi = weight / ((height / 100) ** 2);

    // 骨折歴の判定
    let previousFracture = !(data.fracture_history === "" || data.fracture_history === "骨折歴なし");

    // 関節リウマチの判定
    let rheumatoidArthritis = data.diseases.includes("関節リウマチ");

    // ステロイド使用の判定
    let steroidUse = data.bone_metabolism_meds.includes("糖質コルチコイド（ステロイド）5mg以上3か月以上");

    // 二次性骨粗鬆症の判定
    let secondaryOsteoporosisConditions = [
        "1型糖尿病", "成人での骨形成不全症", "甲状腺機能亢進症（長期的に未治療）",
        "性腺機能低下症（卵巣がんの全摘術後，放射線治療後も含む）", "早期閉経（45歳未満）",
        "慢性的な栄養失調", "吸収不良（クローン病，潰瘍性大腸炎，セリアック病，脂肪便，盲係蹄症候群など）",
        "慢性肝疾患（慢性肝炎，肝硬変など）"
    ];
    let secondaryOsteoporosis = data.diseases.some(disease => secondaryOsteoporosisConditions.includes(disease));

    // 喫煙歴の判定
    let smokingCategories = ["軽い喫煙者（1日1〜9本）", "中等度の喫煙者（1日10〜19本）", "ヘビースモーカー（1日20本以上）"];
    let currentSmoker = smokingCategories.includes(data.smoking);

    // 飲酒歴の判定
    let alcoholCategories = ["1日3〜6単位", "1日7〜9単位", "1日10単位以上"];
    let alcoholIntake = alcoholCategories.includes(data.alcohol);

    // FRAX 計算
    let majorFractureRisk = (age * 0.1) + (bmi * -0.2) + (previousFracture ? 10 : 0) +
                            (steroidUse ? 4 : 0) + (rheumatoidArthritis ? 3 : 0) +
                            (secondaryOsteoporosis ? 2 : 0);

    let hipFractureRisk = (age * 0.2) + (bmi * -0.3) + (previousFracture ? 5 : 0) +
                          (steroidUse ? 3 : 0) + (rheumatoidArthritis ? 2 : 0) +
                          (secondaryOsteoporosis ? 2 : 0);

    if (femoralNeckBmd !== null) {
        majorFractureRisk += (femoralNeckBmd * -5);
        hipFractureRisk += (femoralNeckBmd * -7);
    }

    return {
        majorFractureRisk: Math.max(0, majorFractureRisk.toFixed(2)),
        hipFractureRisk: Math.max(0, hipFractureRisk.toFixed(2))
    };
}
