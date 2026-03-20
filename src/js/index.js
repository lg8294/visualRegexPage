// import cls from "../less/index.js";
import "../less/common.less";
import "../less/aside.less";
import "../less/nav.less";
import "../less/asideBtn.less";
import "../less/visualDom.less";
import $ from "relax-dom";
import { isIE } from "relax-utils";
import { isPc } from "./constant.js";
import regexChange from "./regexChange.js";

// 侧边栏显示状态类名
const SHOW_ASIDE_CLASS = "showAside";

var $body = $(document.body);

if (isIE()) {
  alert("恐怕不太能兼容IE浏览器，最好切换为极速模式或chrome浏览器。❤");
}

var isShowAside = false;

//region fix 滚动穿透
var fixedPloyfill = function () {
  if (isPc) return;
  $body.style({
    overflow: "hidden",
  });
};
var fixedPloyfillRemove = function () {
  if (isPc) return;
  $body.style({
    overflow: "auto",
  });
};
//endregion

var action = {
  showAside() {
    if (isShowAside) return;
    $body.addClass(SHOW_ASIDE_CLASS);
    isShowAside = true;
    fixedPloyfill();
  },
  hideAside() {
    if (!isShowAside) return;
    $body.removeClass(SHOW_ASIDE_CLASS);
    isShowAside = false;
    fixedPloyfillRemove();
  },
  toggleAside() {
    isShowAside ? action.hideAside() : action.showAside();
  },
};

$("#toggleAside").on("click", function (e) {
  action.toggleAside();
});

$("#pageAsideCover").on("click", function (e) {
  action.hideAside();
});
if (isPc) {
  action.showAside();
} else {
  $("#pageAside").onDelegate("click", "li", (e) => {
    action.toggleAside();
  });
}

// 检查是否按下 Ctrl 或 Cmd 键
function isCtrlOrCmd(e) {
  return e.ctrlKey || e.metaKey;
}

// 处理键盘快捷键
function handleKeyboardShortcuts(e) {
  // Ctrl/Cmd + Enter - 聚焦到测试输入框
  if (isCtrlOrCmd(e) && e.key === "Enter") {
    e.preventDefault();
    $("#logInput textarea")[0].focus();
  }

  // Ctrl/Cmd + Shift + C - 复制正则表达式 (当焦点在正则输入框时)
  if (isCtrlOrCmd(e) && e.shiftKey && e.key === "C") {
    const $sourceInput = $("#regexSource input");
    if (document.activeElement === $sourceInput[0]) {
      e.preventDefault();
      const regexText = $sourceInput.val();
      if (regexText) {
        navigator.clipboard.writeText(regexText).then(() => {
          // 视觉反馈 - 临时绿色边框
          $sourceInput.style("border-color", "var(--green-500)");
          setTimeout(() => {
            $sourceInput.style("border-color", "");
          }, 1500);
        });
      }
    }
  }
}

$(document).on("keydown", handleKeyboardShortcuts);
