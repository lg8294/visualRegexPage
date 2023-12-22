import predefinedRegs from "./predefined";
import { parseParam, param, pick } from "relax-utils";

// 获取前缀列表
function getPrefixList() {
  let literal = "";
  // literal 加上 a-z A-Z
  [65, 97].forEach((start) => {
    let end = start + 26;
    while (--end >= start) {
      literal += String.fromCharCode(end);
    }
  });

  literal += `0123456789-_!~<>"'`;
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
  // 如果hashObj不存在
  if (!hashObj) {
    try {
      // 将location.hash中的#号替换为空，并将结果赋值给hashObj
      hashObj = parseParam(location.hash.replace(/^#/, ""));
    } catch (e) {
      // 如果出现异常，则打印异常信息
      console.log("parse param error:", e);
      hashObj = {};
    }
    // 如果hashObj.flags不存在，则将hashObj.flags赋值为空字符串
    hashObj.flags === undefined && (hashObj.flags = "");
    // 如果hashObj.match不存在，则将hashObj.match赋值为空字符串
    hashObj.match === undefined && (hashObj.match = "");
    // 如果hashObj.method不存在，则将hashObj.method赋值为空字符串
    hashObj.method === undefined && (hashObj.method = "");
    // 如果hashObj.replacement不存在，则将hashObj.replacement赋值为*
    hashObj.replacement === undefined && (hashObj.replacement = "*");
    // 如果hashObj.prefix不存在，则将hashObj.prefix赋值为空字符串
    hashObj.prefix === undefined && (hashObj.prefix = "");

    // 将hashObj.source赋值为decodeSource函数的返回值，参数为hashObj.source或者空字符串，hashObj.prefix.trim()
    hashObj.source = decodeSource(hashObj.source || "", hashObj.prefix.trim());
  }
  // 返回hashObj
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
  console.log("setHash", hashObj, str);

  // 设置hash
  history.replaceState(null, document.title, "#" + str);
}

export { getInitHash, setHash };
