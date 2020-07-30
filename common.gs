/**
 * 2次配列の行列を入れ替える関数
 * @param {string[][]} array - 文字列の2次配列。
 * @returns {string[][]} - 文字列の2次配列　引数の行列を入れ替えたもの
 */
function transpose2dArray(array){
  return array[0].map((col, i) => array.map(row => row[i]));
};
/**
 * 桁を0で埋めるための関数
 * @param {string[][]} array - 文字列の2次配列。
 * @returns {string[][]} - 文字列の2次配列　引数の行列を入れ替えたもの
 */
function zeroPadding(num, len){
	return ( Array(len).join('0') + num ).slice( -len );
}
/**
 * 曜日を取得する関数
 * @param {Date} date - 取得したい日のdate
 * @returns {string} - 曜日
 */
function getDayOfWeekKanji(date) {
   const weeks = [ "日", "月", "火", "水", "木", "金", "土" ];
   return weeks[date.getDay()];
}
/**
 * 週番号を取得する関数
 * 2020/07/30時点では未使用
 * @param {Date} date - 取得したい日のdate
 * @returns {string} - 曜日
 */
function getNumberOfWeek(date) {
    const milisecondsPerDay = 86400000;
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / milisecondsPerDay ;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}
/**
 * 正規表現で検索するための文字列をエスケープする
 * @param {string} str - エスケープしたい文字列
 * @returns {string} - エスケープ後の文字列
 */
function escapeRegExp(str) {
  return str.replace(/[.*+?^=!:${}()|[\]\/\\]/g, '\\$&'); // $&はマッチした部分文字列全体を意味します
}
