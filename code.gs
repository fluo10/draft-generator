// 列名や列番号をまとめた列挙型。
// 本来であれば列名から列番を取得するほうがスマートだとはおもうが、（面倒だったのと）列の内容的に並び替えの必要もないと判断し、列番もハードコーティングした。
const FIELD_NAMES = {to : 'to', cc : 'cc', subject : 'subject', body : 'body'};
const FIELD_NUMS = { to: 0, cc : 1, subject : 2, body : 3};

// ひな形のシート名、これもハードコーティング
const TEMPLATE_SHEET_NAME = "template";

/**
 * @class
 * @classdesc 下書きテンプレートを管理するためのクラス
 */
class DraftTemplate{
  /** @lends DraftTemplate.prototype */
  /**
   * @constracts
   * @param {string} to - 宛先(csv形式のメールアドレス）
   * @param {string} cc - cc(csv形式のメールアドレス）
   * @param {string} subject - 件名
   * @param {string} body - 本文（プレーンテキスト）
   * @param {string} to - 宛先
   */
  constructor(to, cc, subject, body){
    this.to = this.constructor.removeActiveUserEmail(to);
    this.cc = this.constructor.removeActiveUserEmail(cc);
    this.subject = subject;
    this.body =  body;
    Logger.log("New draft:" + this.subject);
    //return this;
  };
  /**
   * 宛先のアドレスから実行ユーザーのアドレスを削除するための関数
   * 当初は（コピーせず）Spreadsheetごと共有できるようにするつもりだったため、アドレスも共有化していても自分には送らないように作成した。
   * @param {string} emails - csv形式のメールアドレス
   * @return {string} csv形式のメールアドレス 引数から実行ユーザーのアドレスを取り除いたもの 
   */
  static removeActiveUserEmail(emails){
    const activeUserEmail = Session.getActiveUser().getEmail();
    //Logger.log(activeUserEmail);
    const escapedEmail = activeUserEmail.replace(/\./g, "\\.");
    //Logger.log(escapedEmail);
    let pattern = "^\s*(?:" + escapedEmail + "|.+<" + escapedEmail + ">)$";
    let re = new RegExp(pattern);
    const splitedEmails = emails.replace(/[\r\n]/g, "").split(",");
    let resultEmails = [];
    for (const email of splitedEmails){
      if(email.match(re)){
        Logger.log("Removing " + activeUserEmail);
      }else{
        resultEmails.push(email);
      };
    };
    return resultEmails.join(",");
  };
  /**
   * 下書きを生成するためのメソッド
   * @param {boolean} force - すでに同名のメールが下書きにある場合にどうするか、true なら上書き、falseならスキップ
   */
  createDraft(force = false){
    const logHeader = "[" + this.subject + "].createDraft";
    Logger.log(logHeader + " Start");
    const existDraft = this.getExistDraft();
    if (existDraft && !force){
      Logger.log(logHeader + " Skip ");
    }else{
      if (existDraft && force) {
        existDraft.deleteDraft();
        Logger.log(logHeader + " Overwrite");
      } else { 
        Logger.log(logHeader + " Create");
      }
      GmailApp.createDraft(
        this.to,
        this.subject,
        this.body, 
        {
          cc: this.cc
          // htmlBody: draft.body
        }
      );
      Logger.log(logHeader + " Done.");
    };
  };
  
  /**
   * 同じ件名の下書きがすでにあるかどうかを確認するための関数
   * @returns {?GmailDraft} - あった場合は削除する可能性があるので見つかった下書きを返す。ない場合はnull.
   */
  getExistDraft(){
    const logHeader = "[" + this.subject + "].getExistDraft";
    const drafts = GmailApp.getDrafts();
    if( drafts.length ==0){
      Logger.log(logHeader + " Error: ExistDraft is nothing");
      return;
    };
    for(const draft of drafts){
      const subject = draft.getMessage().getSubject();
      if (subject == this.subject){
        return draft;
      }    
    };
    return;
  };
};


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

/**
 * 2次配列の行列を入れ替える関数
 * @param {string[][]} array - 文字列の2次配列。
 * @returns {string[][]} - 文字列の2次配列　引数の行列を入れ替えたもの
 */
function transpose2dArray(array){
  return array[0].map((col, i) => array.map(row => row[i]));
};

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
    generateDrafts();
  } 
}

function testRemoveActiveUserEmail(){
  const src = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TEMPLATE_SHEET_NAME);
  Logger.log(DraftTemplate.removeActiveUserEmail(src));
}
