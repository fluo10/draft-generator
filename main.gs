/** 
 * ひな形シートを読み込んで下書きを生成する関数
 * @ param {boolean} force - すでに同名のメールが下書きにある場合にどうするか、true なら上書き、falseならスキップ
 */
function generateDrafts(force = false){
  let drafts = sheet2Drafts();
  for (const draft of drafts) {
      draft.createDraft(force);
  }
}

/** ひな形シートを読み込んで下書きを生成する関数 強制上書き版 */
function regenerateDrafts(){
  generateDrafts(true);
}

/** 
 * ひな形シートを読み込んで'DraftTemlplate'クラスを生成する関数
 * @returns {DraftTemplates[]} - 'DraftTemplate'の配列
 */
function sheet2Drafts(){
  const sht = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TEMPLATE_SHEET_NAME);
  let drv = sht.getDataRange().getDisplayValues(); //DataRangeValues
  
  if (drv[1][0].toLowerCase() == FIELD_NAMES.cc){
    // 通常のテーブルとは逆に、1列目が見出しで、以降1列1レコードとして処理する場合に、先に通常のテーブルの並びに直す。
    // 列単位だと行単位と比べ、シート上で見やすいというメリットがある（かもしれない）ため、両方のフォーマットに対応。
    drv = transpose2dArray(drv);
  }else if (drv[0][1].toLowerCase() != FIELD_NAMES.cc){
    Logger.log("ヘッダーが確認できませんでした")
    return;
  };
  
  let records;
  recordEnd = drv.length;
  let drafts = [];
  for(let i=1 ;i < recordEnd ; i++){
    Logger.log(i);
    drafts.push(new DraftTemplate(
        drv[i][FIELD_NUMS.to],
        drv[i][FIELD_NUMS.cc],
        drv[i][FIELD_NUMS.subject],
        drv[i][FIELD_NUMS.body]
    ));
  };
  return drafts;
}


  

/** onOpen時にメニューに項目を追加するための関数。 */
function addMenu (){
   const menu=[
    {name: "下書きの生成", functionName: "generateDrafts"},
    {name: "下書きの生成（上書き）", functionName: "regenerateDrafts"}
  ];
  SpreadsheetApp.getActiveSpreadsheet().addMenu("マクロ",menu);
}
/** 
 * スプレッドシートを開いた際に実行する関数。
 * メニューへの項目の追加と、実行するためのダイアログを出す。
 */
function onOpen(){
  addMenu()
  const prompt =  Browser.msgBox("下書きを作成します", Browser.Buttons.OK_CANCEL);
  if (prompt == "ok") { 
    regenerateDrafts();
  } 
}
