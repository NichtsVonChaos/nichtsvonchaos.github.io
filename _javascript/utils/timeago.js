/*
 * Calculate the Timeago
 */

$(function () {

  const timeagoElem = $(".timeago");

  let toRefresh = timeagoElem.length;

  let intervalId = void 0;

  function timeago(iso, preposition) {
    let now = new Date();
    let past = new Date(iso);
    let prep = (typeof preposition !== "undefined" ? `${preposition} ` : "");

    if (past.getFullYear() !== now.getFullYear()) {
      toRefresh -= 1;
      return prep + past.toLocaleString("zh-CN", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    }

    if (past.getMonth() !== now.getMonth()) {
      toRefresh -= 1;
      return prep + past.toLocaleString("zh-CN", {
        month: "short",
        day: "numeric"
      });
    }

    let seconds = Math.floor((now - past) / 1000);

    let day = Math.floor(seconds / 86400);
    if (day >= 1) {
      toRefresh -= 1;
      return day + " 天前";
    }

    let hour = Math.floor(seconds / 3600);
    if (hour >= 1) {
      return hour + " 小时前";
    }

    let minute = Math.floor(seconds / 60);
    if (minute >= 1) {
      return minute + " 分钟前";
    }

    return "刚刚";
  }

  /*  
      * 若文档中已有命名dateFormat，可用dFormat()调用
      * 年(Y) 可用1-4个占位符
      * 月(m)、日(d)、小时(H)、分(M)、秒(S) 可用1-2个占位符
      * 星期(W) 可用1-3个占位符
      * 季度(q为阿拉伯数字，Q为中文数字)可用1或4个占位符
      *
      * let date = new Date()
      * dateFormat("YYYY-mm-dd HH:MM:SS", date)           2020-02-09 14:04:23
      * dateFormat("YYYY-mm-dd HH:MM:SS Q", date)         2020-02-09 14:09:03 一
      * dateFormat("YYYY-mm-dd HH:MM:SS WWW", date)       2020-02-09 14:45:12 星期日
      * dateFormat("YYYY-mm-dd HH:MM:SS QQQQ", date)      2020-02-09 14:09:36 第一季度
      * dateFormat("YYYY-mm-dd HH:MM:SS WWW QQQQ", date)  2020-02-09 14:46:12 星期日 第一季度
  */
  function dateFormat(format, date) {
    let we = date.getDay();                                 // 星期
    let qut = Math.floor((date.getMonth() + 3) / 3).toString(); // 季度
    const opt = {
      "Y+": date.getFullYear().toString(),                 // 年
      "m+": (date.getMonth() + 1).toString(),                // 月(月份从0开始，要+1)
      "d+": date.getDate().toString(),                     // 日
      "H+": date.getHours().toString(),                    // 时
      "M+": date.getMinutes().toString(),                  // 分
      "S+": date.getSeconds().toString(),                  // 秒
      "q+": qut, // 季度
    };
    const week = {      // 中文数字 (星期)
      "0": "日",
      "1": "一",
      "2": "二",
      "3": "三",
      "4": "四",
      "5": "五",
      "6": "六"
    };
    const quarter = {   // 中文数字（季度） 
      "1": "一",
      "2": "二",
      "3": "三",
      "4": "四",
    };
    if (/(W+)/.test(format)) {
      format = format.replace(RegExp.$1, (RegExp.$1.length > 1 ? (RegExp.$1.length > 2 ? '星期' + week[we] : '周' + week[we]) : week[we]))
    };
    if (/(Q+)/.test(format)) {
      // 输入一个Q，只输出一个中文数字，输入4个Q，则拼接上字符串 
      format = format.replace(RegExp.$1, (RegExp.$1.length == 4 ? '第' + quarter[qut] + '季度' : quarter[qut]));
    };
    for (let k in opt) {
      let r = new RegExp("(" + k + ")").exec(format);
      if (r) {
        // 若输入的长度不为1，则前面补零
        format = format.replace(r[1], (RegExp.$1.length == 1 ? opt[k] : opt[k].padStart(RegExp.$1.length, '0')))
      }
    };
    return format;
  };

  function updateTimeago() {
    $(".timeago").each(function () {
      if ($(this).children("i").length > 0) {
        let node = $(this).children("i");
        let date = node.text(); /* ISO Date: "YYYY-MM-DDTHH:MM:SSZ" */
        $(this).text(timeago(date, $(this).attr("prep")));
        $(this).append(node);
      }

      let full = $(this).attr("data-original-title");
      let date = new Date(full);
      $(this).attr("data-original-title", dateFormat("YYYY年m月d日 WWW HH:MM:SS", date));
    });

    if (toRefresh === 0 && typeof intervalId !== "undefined") {
      clearInterval(intervalId); /* stop interval */
    }
    return toRefresh;
  }

  if (toRefresh === 0) {
    return;
  }

  if (updateTimeago() > 0) { /* run immediately */
    intervalId = setInterval(updateTimeago, 60000); /* run every minute */
  }

});
