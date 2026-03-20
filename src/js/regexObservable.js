import $ from "relax-dom";
import {fromEvent} from 'rxjs/internal/observable/fromEvent';
import {merge} from 'rxjs/internal/observable/merge';
import {combineLatest} from 'rxjs/internal/observable/combineLatest';
import {map} from 'rxjs/internal/operators/map';
import {startWith} from 'rxjs/internal/operators/startWith';
import {filter} from 'rxjs/internal/operators/filter';
import {tap} from 'rxjs/internal/operators/tap';
import {debounceTime} from 'rxjs/internal/operators/debounceTime';
import {distinctUntilChanged} from 'rxjs/internal/operators/distinctUntilChanged';
import {publishBehavior} from 'rxjs/internal/operators/publishBehavior';
import {refCount} from 'rxjs/internal/operators/refCount';
import predefinedRegs from "./predefined.js";
import {getInitHash} from './hash.js';
import {isPc} from "./constant.js";
import log from './log.js';
import cls from "../less/index.module.less";


// ==================== 常量定义 ====================
const MAX_REGEX_LENGTH = 1000;
const DEBOUNCE_DELAY = 300;


// ==================== DOM 元素缓存 ====================
var $sourceCtl = $('#regexSource');
var $sourceInput = $sourceCtl.find('input');
var $sourceTip = $sourceCtl.find('.formErrorTip');
var $flagsCtl = $('#regexFlag');
var $flagsInputs = $flagsCtl.find('input');


// ==================== UI 更新函数 ====================
/**
 * 显示正则表达式错误状态
 * @param {string} message - 错误信息
 */
function showRegexError(message) {
    $sourceCtl.addClass(cls.error);
    $sourceTip.html(message);
}

/**
 * 清除正则表达式错误状态
 */
function clearRegexError() {
    $sourceCtl.removeClass(cls.error);
    $sourceTip.html('');
}


// ==================== 正则表达式验证与创建 ====================
/**
 * 验证正则表达式源字符串是否合法
 * @param {string} source - 正则表达式源
 * @returns {{ valid: boolean, message?: string }} 验证结果
 */
function validateRegexSource(source) {
    if (source.length > MAX_REGEX_LENGTH) {
        return {
            valid: false,
            message: `正则表达式过长（${source.length}字符），请控制在${MAX_REGEX_LENGTH}字符以内`
        };
    }
    return { valid: true };
}

/**
 * 创建 RegExp 对象并附加元数据
 * @param {string} source - 正则表达式源
 * @param {string} flags - 正则表达式标志
 * @returns {{ reg: RegExp|null, error?: string }} 创建结果
 */
function createRegex(source, flags) {
    const validation = validateRegexSource(source);
    if (!validation.valid) {
        showRegexError(validation.message);
        return { reg: null };
    }

    try {
        var reg = new RegExp(source, flags);
        clearRegexError();
        // source为空字符时，reg.source不是空字符
        reg.expando = [source, flags];
        return { reg };
    } catch (err) {
        console.dir(err);
        showRegexError(err.message);
        return { reg: null };
    }
}


//source=xxx&flags=muig&match=inputTxt

let hashObj = getInitHash();
log('hashObj:', hashObj);

merge(
    fromEvent($sourceInput[0], 'focus').pipe(map(e => true)),
    fromEvent($sourceInput[0], 'blur').pipe(map(e => false))
).subscribe((isFocus) => {
    log('regexInput focus/blur callback');
    if ($sourceInput.val().trim() !== '' || isFocus) {
        $sourceCtl.addClass(cls.miniTitle);
    } else {
        $sourceCtl.removeClass(cls.miniTitle);
    }
})

$sourceCtl.on('click', e => {
    //dispatchEvent只是触发事件，没有光标。
    //focus()会使input获得光标
    // $regexInput[0].dispatchEvent(new Event('focus'));
    $sourceInput[0].focus();

});

var predefinedObservable = fromEvent($('#pageAside')[0], 'click').pipe(
    filter((e) => {
        log('#pageAside click target.tagName:', e.target.tagName);
        return e.target.tagName === 'SPAN' || e.target.tagName === 'LI';
    }),
    map((e) => {
        log('#pageAside click', e.target, e.currentTarget);
        var tar = e.target;
        if (tar.tagName !== 'SPAN') {
            tar = $(e.target).find('span')[0];
        }

        var key = tar.dataset.reg;
        var reg = predefinedRegs[key] || {};

        log('#pageAside click, key:', key, ',reg:', reg);

        return {
            source: reg.source || '',
            flags: reg.flags || ''
        }
    }),
    startWith(hashObj),
    tap(({source}) => {
        log('predefined source change:', source);
        $sourceInput.val(source || '');
        if (source.trim() !== '') {
            // 这里需注意，将addClass miniTitle和focus事件响应分开了。所以miniTitle的样式类不是严格和focus响应中的处理保持一致状态。

            //当前页面未获得焦点的时候，focus回调不会触发。
            $sourceCtl.addClass(cls.miniTitle);

            if (isPc) {
                $sourceInput.trigger('focus');
            } else {
                $sourceInput[0].scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }
    }),
    tap(({flags}) => {
        log('predefined flags change', flags);
        $flagsInputs.each(node => {
            node.checked = flags.includes(node.value)
        });
    })
);

var flagsObservable = fromEvent($flagsCtl[0], 'change', 'input').pipe(
    map((e) => {
        log('flag input change', e.target);
        return $flagsInputs.map(node => node.checked ? node.value : '').join('')
    })
);

var sourceObservable = fromEvent($sourceInput[0], 'input').pipe(
    map(e => e.target.value),
    tap(val => {
        log('source input', val);
    }),
    debounceTime(DEBOUNCE_DELAY)
)

/**
 * 正则表达式变化流
 * 发出RegExp对象，如果new RegExp出错，则发出null。
 * 过滤连续出错(连续发出null)的情况，即连续两次发出的值，一定有一个是有效的RegExp对象
 */
var regexChangedObservable = combineLatest([
    merge(
        predefinedObservable.pipe(map(({source}) => source)),
        sourceObservable
    ),
    merge(
        predefinedObservable.pipe(map(({flags}) => flags)),
        flagsObservable,
    )
]).pipe(
    distinctUntilChanged((pre, cur) => pre[0] === cur[0] && pre[1] === cur[1]),
    map(([source, flags]) => {
        log('new RegExp:', source, flags);
        const { reg } = createRegex(source, flags);
        return reg;
    }),
    distinctUntilChanged((pre, cur) => !pre && !cur), // 过滤两次都为null的情况
    publishBehavior(),
    refCount()
)

export {regexChangedObservable as regexChanged};