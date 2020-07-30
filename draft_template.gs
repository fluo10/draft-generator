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
   * 本文や件名の日付やユーザー名など動的な値をキーワードから置き換えるための関数
   * @param {string} str - デフォルトの本文
   * @return {string} - 対象のキーワードを動的な値に置き換えたもの
   */
  static replaceKeyword(str){
    const date = new Date();
    const KEYWORDS = {family_name : ContactsApp.getContact(Session.getActiveUser().getEmail()).getFamilyName(), // 苗字
                      yyyy        : date.getFullYear().toString(),                                              // 年
                      mm          : zeroPadding(date.getMonth() + 1, 2),                                        // 月 2桁
                      m           : (date.getMonth() + 1).toString(),                                           // 月
                      dd          : zeroPadding(date.getDate(), 2),                                             // 日 2桁
                      d           : date.getDate().toString(),                                                  // 日
                      ww          : zeroPadding(getNumberOfWeek(date), 2),                                      // 週番号 2桁
                      w           : getNumberOfWeek(date).toString(),                                           // 週番号
                      www         : getDayOfWeekKanji(date)                                                     // 曜日
                     };
    
    let result = str;
    for (const keyword of Object.keys(KEYWORDS)){
      const pattern = "\{\{" + keyword + "\}\}";
      const re = new RegExp(pattern,"g") ;
      result = result.replace(re, KEYWORDS[keyword]);
    }
    return result;
  }
  
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
        this.constructor.replaceKeyword(this.subject),
        this.constructor.replaceKeyword(this.body), 
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
   * 日付など、置き換え用の文字列がある場合はそこの違いは無視する。
   * @returns {?GmailDraft} - あった場合は削除する可能性があるので見つかった下書きを返す。ない場合はnull.
   */
  getExistDraft(){
    const logHeader = "[" + this.subject + "].getExistDraft";
    const drafts = GmailApp.getDrafts();
    if( drafts.length ==0){
      Logger.log(logHeader + "No Exist Draft.");
      return;
    };

    const escapedSubject = escapeRegExp(this.subject).replace(/\\\{\\\{.+\\\}\\\}/g, ".+?");
    const re = new RegExp(escapedSubject);
    for(const draft of drafts){
      const subject = draft.getMessage().getSubject();
      if (re.test(subject)){
        return draft;
      }    
    };
    return;
  };
};
