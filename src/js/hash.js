import predefinedRegs from "./predefined";
import { parseParam, param, pick } from "relax-utils";

// ============================================================
// 字符集常量
// ============================================================

/** ASCII 字符集定义 */
const CHARSET = {
  // A-Z: ASCII 65-90 (26 个字母，从 Z 降到 A)
  UPPER_ALPHA: { start: 65, length: 26 },
  // a-z: ASCII 97-122 (26 个字母，从 z 降到 a)
  LOWER_ALPHA: { start: 97, length: 26 },
  // 特殊字符：数字 + 常用符号，用于前缀编码
  SPECIAL: "0123456789-_!~<>\"'",
};

/**
 * 获取前缀列表
 * 前缀用于压缩编码：查找一个不在正则表达式源码中的字符作为编码前缀
 * 生成顺序：Z-A, z-a, 0-9, -, _, !, ~, <, >, ", '
 */
function getPrefixList() {
  let literal = "";

  // 添加 A-Z 和 a-z（逆序：Z→A, z→a）
  [CHARSET.UPPER_ALPHA, CHARSET.LOWER_ALPHA].forEach(({ start, length }) => {
    for (let i = start + length - 1; i >= start; i--) {
      literal += String.fromCharCode(i);
    }
  });

  literal += CHARSET.SPECIAL;
  return literal.split("");
}

// 返回一个对象数组，数组中的每个对象包含val和key两个属性
function getReplaceList() {
  // 返回predefinedRegs对象的所有key值，并将其映射为一个对象数组
  return Object.keys(predefinedRegs).map((key) => {
    // 返回一个对象，该对象包含val和key两个属性
    return {
      // val属性值为predefinedRegs对象中key属性对应的source属性值
      val: predefinedRegs[key].source,
      // key属性值为predefinedRegs对象中key属性值
      key,
    };
  });
}
const prefixList = getPrefixList();
const replaceList = getReplaceList();

let replaceAll = function (str, subStr, replacement) {
  return str.split(subStr).join(replacement);
};
if (String.prototype.replaceAll) {
  replaceAll = function (str, sub, replace) {
    return str.replaceAll(sub, replace);
  };
}

// 函数用于编码源代码
function encodeSource(source) {
  // 查找prefixList中不包含source的元素
  const prefix = prefixList.find((k) => {
    return !source.includes(k);
  });
  // 如果没有找到，则返回source
  if (!prefix) return { source };

  // 初始化结果变量
  let result = source;
  // 遍历replaceList，替换result中的元素
  replaceList.forEach((item) => {
    result = replaceAll(result, item.val, prefix + item.key);
  });
  // 返回结果和prefix
  return {
    source: result,
    prefix: result === source ? undefined : prefix,
  };
}

// 函数decodeSource，用于解码源代码，参数source为源代码，prefix为前缀
function decodeSource(source, prefix) {
  // 如果没有前缀，则直接返回源代码
  if (!prefix) return source;
  // 定义一个变量result，用于存储解码后的源代码
  let result = source;
  // 遍历replaceList，对源代码进行替换
  replaceList.forEach((item) => {
    // 使用replaceAll函数对源代码进行替换，替换前缀为prefix + item.key，替换后为item.val
    result = replaceAll(result, prefix + item.key, item.val);
  });
  // 返回解码后的源代码
  return result;
}

let hashObj;

// 获取初始哈希值
function getInitHash() {
  if (!hashObj) {
    try {
      hashObj = parseParam(location.hash.replace(/^#/, ""));
    } catch (e) {
      hashObj = {};
    }

    // 使用 Object.assign 统一初始化默认值
    hashObj = Object.assign(
      {
        flags: "",
        match: "",
        method: "",
        replacement: "*",
        prefix: "",
      },
      hashObj
    );

    // 解码正则表达式源码
    hashObj.source = decodeSource(hashObj.source || "", hashObj.prefix.trim());
  }
  return hashObj;
}

// 设置hash值
function setHash(obj) {
  // 编码源
  const { source, prefix } = encodeSource(obj.source);
  // 设置hash对象
  let hashObj = {
    ...obj,
    source,
    prefix,
  };
  // 如果match为false，则method和replacement设置为undefined
  if (!hashObj.match) hashObj.method = hashObj.replacement = undefined;
  // 如果method不是replace，则replacement设置为undefined
  else if (hashObj.method !== "replace") hashObj.replacement = undefined;

  // 获取参数
  const str = param(pick(hashObj, (key) => hashObj[key]));

  // 设置hash
  history.replaceState(null, document.title, "#" + str);
}

export { getInitHash, setHash };
