import $ from "relax-dom";
import { fromEvent } from "rxjs/internal/observable/fromEvent";
import { combineLatest } from "rxjs/internal/observable/combineLatest";
import { map } from "rxjs/internal/operators/map";
import { startWith } from "rxjs/internal/operators/startWith";
import { tap } from "rxjs/internal/operators/tap";
import { pairwise } from "rxjs/internal/operators/pairwise";
import { debounceTime } from "rxjs/internal/operators/debounceTime";
import { distinctUntilChanged } from "rxjs/internal/operators/distinctUntilChanged";
import { first } from "rxjs/internal/operators/first";

import { getInitHash, setHash } from "./hash.js";
import { regexChanged } from "./regexObservable.js";

import cls from "../less/index.module.less";

import hljs from "highlight.js/lib/core";
import "highlight.js/styles/default.css";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("json", json);

import visualRegex from "visual-regex";
import matcher from "./matcher.js";
import { htmlEncode } from "relax-utils";
import log from "./log.js";

function visual(reg) {
  const v = visualRegex(reg);

  const canvas = v.visualCanvas();

  const dom = v.visualDom();
  dom.className = "vr_root";

  return [canvas, dom];
}

/**
 * 渲染正则表达式可视化
 * @param {RegExp|null} reg - 当前正则表达式
 * @param {RegExp|null} preReg - 上一个正则表达式
 */
function renderVisualization(reg, preReg) {
  let canvas, dom;

  // 分支1: 正常reg，直接渲染
  if (reg && reg.expando[0]) {
    log("refresh canvas, reg exist", reg, reg.flags);
    [canvas, dom] = visual(reg);
    $figure.removeClass(cls.error).html("");
    $figure.append(dom).append(canvas);
    return;
  }

  // 分支2: source为空字符串，渲染提示
  if (reg && !reg.expando[0]) {
    [canvas] = visual(/请输入正则表达式/);
    $figure.addClass(cls.error).html("").append(canvas);
    return;
  }

  // 分支3: 保持上一个有效正则的显示
  if (preReg && preReg.expando[0]) {
    [canvas, dom] = visual(preReg);
    $figure.addClass(cls.error).html("");
    $figure.append(dom).append(canvas);
    return;
  }

  // 分支4: 错误情况
  $figure.addClass(cls.error).html("Render Error!");
}

/**
 * 处理匹配结果，返回用于显示的字符串
 * @param {RegExp|null} reg - 正则表达式
 * @param {string} str - 测试字符串
 * @param {string} method - 匹配方法
 * @param {string} replacement - 替换字符串
 * @returns {string} 处理后的结果字符串
 */
function processMatch(reg, str, method, replacement) {
  if (!reg) {
    return "Null";
  }

  const [source, flags] = reg.expando;

  // 更新hash
  hashObj.flags = flags;
  hashObj.source = source;
  hashObj.match = str;
  hashObj.method = method;
  hashObj.replacement = replacement;
  setHash(hashObj);

  const encodeSource = htmlEncode(source.replace(/[\\"]/g, "\\$&")); // html encode + backslash escape
  $logRegExpression.html(`new RegExp("${encodeSource}", "${flags}")`);

  log(`regex log, source:${source}, flags:${flags}, reg:${reg}, str:${str}`);

  if (source === "") {
    return "Null";
  }

  let match = matcher[method].call(reg, str, replacement);
  reg.lastIndex = 0;

  if (match !== null) {
    return JSON.stringify(match, null, 2);
  }

  return "Null";
}

var $figure = $("#figure");

//regex log:
var $logRoot = $("#logRoot");
var $logInputCtl = $("#logInput");
var $logInputHolder = $logInputCtl.find("span");
var $logInputTextarea = $logInputCtl.find("textarea");
var $logInputSelect = $("#logSelect");
var $logInputReplacement = $("#logReplacementInput");

var $logRegExpression = $("#logRegExpression");
var $copyRegexBtn = $("#copyRegexBtn");

var $logOutput = $("#logOutput");

const hashObj = getInitHash();
if (hashObj.match) {
  $logInputTextarea.val(hashObj.match);
}
if (hashObj.method) {
  $logInputSelect.val(hashObj.method);
} else {
  hashObj.method = $logInputSelect.val();
}

var matchValueObservable = fromEvent($logInputTextarea[0], "input").pipe(
  map((e) => e.target.value),
  startWith(hashObj.match),
  tap((str) => {
    $logInputHolder.text(str);
    $logInputHolder.append("<br/>");
  }),
  debounceTime(300),
  distinctUntilChanged()
);

var methodValueObservable = fromEvent($logInputSelect[0], "change").pipe(
  map((e) => e.target.value),
  startWith(hashObj.method),
  tap((method) => {
    log("cur method", method, "cur hasObj:", JSON.stringify(hashObj));
    // hashObj.method = method;
    // history.replaceState(null, document.title, '#' + utils.param(hashObj));

    const isReplace = method === "replace";
    const showReplacementCls = cls.isReplaceMethod;
    if (isReplace) {
      $logRoot.addClass(showReplacementCls);
      $logInputReplacement.trigger("focus");
    } else $logRoot.removeClass(showReplacementCls);
  })
);

var replacementObservable = fromEvent($logInputReplacement[0], "input").pipe(
  map((e) => e.target.value),
  startWith(hashObj.replacement),
  debounceTime(300),
  distinctUntilChanged()
);
replacementObservable.pipe(first()).subscribe((replacement) => {
  $logInputReplacement.val(replacement); // 设置hashObj的初始值 *
});

combineLatest([
  regexChanged.pipe(
    pairwise(),
    tap(([preReg, reg]) => {
      log("refresh canvas", reg, "pre:", preReg);
      renderVisualization(reg, preReg);
    }),
    map(([pre, cur]) => cur)
  ),
  matchValueObservable,
  methodValueObservable,
  replacementObservable,
]).subscribe(([reg, str, method, replacement]) => {
  log(
    `final subscribe, reg: ${reg}, expando: ${
      reg && reg.expando
    }, method: ${method}, replacement: ${replacement}`
  );

  const result = processMatch(reg, str, method, replacement);

  $logOutput.html(result);
  hljs.highlightElement($logOutput[0]);
});

// 复制正则表达式功能
$copyRegexBtn.on("click", function () {
  const regexText = $logRegExpression.text();
  if (!regexText) return;

  navigator.clipboard.writeText(regexText).then(() => {
    $copyRegexBtn.text("✓");
    setTimeout(() => {
      $copyRegexBtn.text("📋");
    }, 1500);
  }).catch((err) => {
    log("复制失败:", err);
  });
});

// 语法帮助区点击复制功能
// 使用原生事件绑定避免 relax-dom 的 delegated event 问题
document.addEventListener("click", function(e) {
  const li = e.target.closest(".syntax li");
  if (!li) return;

  const keyEl = li.querySelector(".key");
  if (!keyEl) return;

  const keyText = keyEl.textContent;
  if (!keyText) return;

  navigator.clipboard.writeText(keyText).then(function() {
    li.classList.add("copied");
    setTimeout(function() {
      li.classList.remove("copied");
    }, 1000);
  }).catch(function(err) {
    log("复制语法失败:", err);
  });
});

export default {}