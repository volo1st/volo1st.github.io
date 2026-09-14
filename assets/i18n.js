(function initializeI18n(root, factory) {
  'use strict';

  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SiteI18n = api;
}(typeof globalThis === 'undefined' ? this : globalThis, (root) => {
  'use strict';

  const DEFAULT_LANGUAGE = 'en-AU';
  const CHINESE_LANGUAGE = 'zh-Hans';
  const STORAGE_KEY = 'siteLanguage';
  const catalogs = {
    'en-AU': {
      'common.language': 'Language',
      'common.allTools': '← All tools',
      'common.trial': 'Trial',
      'home.title': 'Useful Browser Tools',
      'home.description': 'Small browser tools for payment-file conversion and text sorting.',
      'home.subtitle': 'Simple tools that run in your browser',
      'home.toolsLabel': 'Available tools',
      'home.converterTitle': 'CSV to ABA Converter',
      'home.converterDescription': "Convert the music school's teacher payment CSV file to an ABA file for CBA.",
      'home.openCurrent': 'Open current version',
      'home.tryV2': 'Try version 2',
      'home.sorterTitle': 'Chinese-English String Sorter',
      'home.sorterDescription': 'Sort Chinese and English text into a numbered list.',
      'home.openSorter': 'Open sorter',
      'home.footer': 'These tools run in your browser.',
      'v2.title': 'CSV to ABA Converter v2 Trial',
      'v2.description': "Convert the music school's teacher payment CSV file to the CBA ABA format.",
      'v2.heading': 'CSV to ABA Converter',
      'v2.version': 'Version 2 trial',
      'v2.trialHeading': 'Use this version for a trial',
      'v2.trialBefore': 'Compare the payment count, total, and ABA output with',
      'v2.version1': 'version 1',
      'v2.trialAfter': 'before you upload the file to CBA.',
      'v2.introHeading': 'Create an ABA payment file',
      'v2.intro': 'Upload a CSV file or paste its content. The converter checks all payment rows before it creates the ABA file.',
      'v2.privacyStrong': 'Your data stays in this browser.',
      'v2.privacy': 'This tool does not send CSV or payment data to a server.',
      'v2.showFormat': 'Show the required CSV format',
      'v2.exampleCaption': 'Example payment row with invented data',
      'v2.exampleName': 'Example Teacher',
      'v2.exampleReference': 'teacher fee',
      'v2.addData': 'Add payment data',
      'v2.addDataHelp': 'Choose a CSV file or paste the CSV content.',
      'v2.chooseFile': 'Choose a CSV file',
      'v2.fileHelp': 'The selected file fills the CSV text field.',
      'v2.or': 'or',
      'v2.pasteCsv': 'Paste CSV content',
      'v2.csvHelp': 'Include one header row and one or more payment rows.',
      'v2.csvPlaceholder': 'BSB,Account,Name,Amount,Reference',
      'v2.convert': 'Check and convert',
      'v2.review': 'Review the result',
      'v2.reviewHelp': 'Compare these values with the source payment report.',
      'v2.paymentCount': 'Payment count',
      'v2.totalAmount': 'Total amount',
      'v2.generatedAba': 'Generated ABA data',
      'v2.abaHelp': 'This field is read-only. Each ABA record has 120 characters.',
      'v2.downloadHeading': 'Download the checked file',
      'v2.download': 'Download ABA file',
      'v2.footerBefore': 'Keep',
      'v2.footerAfter': 'available during the version 2 trial.',
      'status.noFile': 'No file selected.',
      'status.reading': 'Reading "{filename}".',
      'status.loaded': 'Loaded "{filename}".',
      'status.complete': 'Conversion is complete. Review the summary before download.',
      'status.downloaded': 'Downloaded "{filename}".',
      'error.fileRead': 'File read error: {detail}',
      'error.noFileReason': 'The browser did not give a reason.',
      'error.singleIntro': 'Conversion stopped. Fix this error:',
      'error.multipleIntro': 'Conversion stopped. Fix these {count} errors:',
      'error.conversion': 'Conversion error: {detail}',
      'error.csvRow': 'CSV row',
      'error.csvLine': 'CSV line {row}',
      'field.BSB': 'BSB', 'field.Account': 'Account', 'field.Name': 'Name',
      'field.Amount': 'Amount', 'field.Reference': 'Reference',
      'error.record_length': 'Assertion failed: {record} length is {actual}, expected {expected}',
      'error.amount_format': '{rowName} field Amount must be a positive amount with no more than two decimal places.',
      'error.amount_zero': '{rowName} field Amount must be greater than zero.',
      'error.amount_limit': '{rowName} field Amount exceeds the ABA limit of $99,999,999.99.',
      'error.field_required': '{rowName} field {fieldName} is required.',
      'error.field_line_break': '{rowName} field {fieldName} contains a line break.',
      'error.field_control_character': '{rowName} field {fieldName} contains a control character.',
      'error.bsb_format': '{rowName} field BSB must have the format NNN-NNN.',
      'error.account_length': '{rowName} field Account must not exceed 9 characters.',
      'error.account_characters': '{rowName} field Account can contain only digits, spaces, and hyphens.',
      'error.account_non_zero': '{rowName} field Account must contain a non-zero digit.',
      'error.name_length': '{rowName} field Name must not exceed 32 characters.',
      'error.reference_length': '{rowName} field Reference must not exceed 18 characters.',
      'error.payment_errors': 'Payment data contains {count} errors.',
      'error.record_count_limit': 'ABA detail record count exceeds {limit}.',
      'error.total_limit': 'ABA payment total exceeds the limit of $99,999,999.99.',
      'error.csv_text_after_quote': 'CSV line {line} contains text after a closing quotation mark.',
      'error.csv_quote_in_unquoted_field': 'CSV line {line} contains a quotation mark in an unquoted field.',
      'error.csv_open_quote': 'CSV line {line} has an open quotation mark.',
      'error.csv_empty': 'CSV input is empty.',
      'error.csv_empty_header': 'CSV header {column} is empty.',
      'error.csv_duplicate_headers': 'CSV contains duplicate headers: {headers}.',
      'error.csv_missing_columns': 'Missing required CSV columns: {columns}.',
      'error.csv_unexpected_columns': 'CSV contains unexpected columns: {columns}.',
      'error.csv_field_count': 'CSV line {line} has {actual} fields; expected {expected}.',
      'error.csv_no_payment_rows': 'CSV does not contain a payment row.',
      'error.total_overflow_at_row': 'CSV line {row} makes the ABA payment total exceed $99,999,999.99.',
      'error.amount_display_invalid': 'Amount display value must be a non-negative integer.',
    },
    'zh-Hans': {
      'common.language': '语言', 'common.allTools': '← 所有工具', 'common.trial': '试用',
      'home.title': '实用浏览器工具', 'home.description': '用于转换付款文件和排序文本的浏览器工具。',
      'home.subtitle': '在浏览器中运行的简单工具', 'home.toolsLabel': '可用工具',
      'home.converterTitle': 'CSV 转 ABA 工具', 'home.converterDescription': '将音乐学校的教师付款 CSV 文件转换为 CBA 所需的 ABA 文件。',
      'home.openCurrent': '打开当前版本', 'home.tryV2': '试用版本 2',
      'home.sorterTitle': '中英文字符串排序工具', 'home.sorterDescription': '将中英文文本排序为编号列表。',
      'home.openSorter': '打开排序工具', 'home.footer': '这些工具在您的浏览器中运行。',
      'v2.title': 'CSV 转 ABA 工具版本 2 试用', 'v2.description': '将音乐学校的教师付款 CSV 文件转换为 CBA ABA 格式。',
      'v2.heading': 'CSV 转 ABA 工具', 'v2.version': '版本 2 试用', 'v2.trialHeading': '请试用此版本',
      'v2.trialBefore': '将付款笔数、总额和 ABA 输出与', 'v2.version1': '版本 1', 'v2.trialAfter': '进行比较，然后再将文件上传到 CBA。',
      'v2.introHeading': '创建 ABA 付款文件', 'v2.intro': '上传 CSV 文件或粘贴其内容。转换工具会检查所有付款行，然后创建 ABA 文件。',
      'v2.privacyStrong': '您的数据仅保留在此浏览器中。', 'v2.privacy': '此工具不会将 CSV 或付款数据发送到服务器。',
      'v2.showFormat': '显示所需的 CSV 格式', 'v2.exampleCaption': '使用虚构数据的付款行示例',
      'v2.exampleName': '示例教师', 'v2.exampleReference': '教师费用',
      'v2.addData': '添加付款数据', 'v2.addDataHelp': '选择 CSV 文件或粘贴 CSV 内容。', 'v2.chooseFile': '选择 CSV 文件',
      'v2.fileHelp': '所选文件将填入 CSV 文本框。', 'v2.or': '或', 'v2.pasteCsv': '粘贴 CSV 内容',
      'v2.csvHelp': '包含一个标题行和至少一个付款行。', 'v2.convert': '检查并转换',
      'v2.csvPlaceholder': 'BSB,Account,Name,Amount,Reference',
      'v2.review': '检查结果', 'v2.reviewHelp': '将这些数值与原始付款报告进行比较。', 'v2.paymentCount': '付款笔数', 'v2.totalAmount': '总金额',
      'v2.generatedAba': '已生成的 ABA 数据', 'v2.abaHelp': '此文本框为只读。每条 ABA 记录有 120 个字符。',
      'v2.downloadHeading': '下载已检查的文件', 'v2.download': '下载 ABA 文件', 'v2.footerBefore': '在版本 2 试用期间保留', 'v2.footerAfter': '。',
      'status.noFile': '未选择文件。', 'status.reading': '正在读取“{filename}”。', 'status.loaded': '已加载“{filename}”。',
      'status.complete': '转换完成。下载前请检查摘要。', 'status.downloaded': '已下载“{filename}”。',
      'error.fileRead': '文件读取错误：{detail}', 'error.noFileReason': '浏览器未提供原因。',
      'error.singleIntro': '转换已停止。请修正此错误：', 'error.multipleIntro': '转换已停止。请修正这 {count} 个错误：',
      'error.conversion': '转换错误：{detail}', 'error.csvRow': 'CSV 行', 'error.csvLine': 'CSV 第 {row} 行',
      'field.BSB': 'BSB', 'field.Account': '账户', 'field.Name': '姓名', 'field.Amount': '金额', 'field.Reference': '附言',
      'error.record_length': '内部检查失败：{record} 长度为 {actual}，应为 {expected}。',
      'error.amount_format': '{rowName}的“金额”必须为正数，且最多有两位小数。', 'error.amount_zero': '{rowName}的“金额”必须大于零。',
      'error.amount_limit': '{rowName}的“金额”超过 ABA 上限 $99,999,999.99。', 'error.field_required': '{rowName}的“{fieldName}”为必填项。',
      'error.field_line_break': '{rowName}的“{fieldName}”包含换行符。', 'error.field_control_character': '{rowName}的“{fieldName}”包含控制字符。',
      'error.bsb_format': '{rowName}的 BSB 必须使用 NNN-NNN 格式。', 'error.account_length': '{rowName}的“账户”超过 9 个字符。',
      'error.account_characters': '{rowName}的“账户”只能包含数字、空格和连字符。', 'error.account_non_zero': '{rowName}的“账户”必须包含非零数字。',
      'error.name_length': '{rowName}的“姓名”超过 32 个字符。', 'error.reference_length': '{rowName}的“附言”超过 18 个字符。',
      'error.payment_errors': '付款数据包含 {count} 个错误。', 'error.record_count_limit': 'ABA 付款笔数超过上限 {limit}。',
      'error.total_limit': 'ABA 付款总额超过上限 $99,999,999.99。', 'error.csv_text_after_quote': 'CSV 第 {line} 行在结束引号后包含文本。',
      'error.csv_quote_in_unquoted_field': 'CSV 第 {line} 行的未加引号字段包含引号。', 'error.csv_open_quote': 'CSV 输入以未闭合的引号结束。',
      'error.csv_empty': 'CSV 输入为空。', 'error.csv_empty_header': 'CSV 第 {column} 个标题为空。',
      'error.csv_duplicate_headers': 'CSV 包含重复标题：{headers}。', 'error.csv_missing_columns': 'CSV 缺少必需列：{columns}。',
      'error.csv_unexpected_columns': 'CSV 包含未预期的列：{columns}。', 'error.csv_field_count': 'CSV 第 {line} 行有 {actual} 个字段；应有 {expected} 个。',
      'error.csv_no_payment_rows': 'CSV 不包含付款行。', 'error.total_overflow_at_row': 'CSV 第 {row} 行使 ABA 付款总额超过 $99,999,999.99。',
      'error.amount_display_invalid': '显示金额时必须提供非负整数分值。',
    },
  };
  let language = DEFAULT_LANGUAGE;

  function normalizeLanguage(value) {
    return typeof value === 'string' && value.toLowerCase().startsWith('zh')
      ? CHINESE_LANGUAGE : DEFAULT_LANGUAGE;
  }

  function translate(key, parameters = {}, selectedLanguage = language) {
    const catalog = catalogs[normalizeLanguage(selectedLanguage)];
    const template = catalog[key] || catalogs[DEFAULT_LANGUAGE][key] || key;
    return template.replace(/\{(\w+)\}/g, (match, name) => (
      Object.prototype.hasOwnProperty.call(parameters, name) ? String(parameters[name]) : match
    ));
  }

  function translateError(error, selectedLanguage = language) {
    if (!error || !error.code) return error && error.message ? error.message : String(error);
    const parameters = { ...(error.parameters || {}) };
    if (parameters.row !== undefined) parameters.rowName = translate('error.csvLine', parameters, selectedLanguage);
    else parameters.rowName = translate('error.csvRow', {}, selectedLanguage);
    if (parameters.field) parameters.fieldName = translate(`field.${parameters.field}`, {}, selectedLanguage);
    return translate(`error.${error.code}`, parameters, selectedLanguage);
  }

  function applyDocument(document) {
    document.documentElement.lang = language;
    for (const element of document.querySelectorAll('[data-i18n]')) {
      element.textContent = translate(element.dataset.i18n);
    }
    for (const element of document.querySelectorAll('[data-i18n-content]')) {
      element.setAttribute('content', translate(element.dataset.i18nContent));
    }
    for (const element of document.querySelectorAll('[data-i18n-placeholder]')) {
      element.setAttribute('placeholder', translate(element.dataset.i18nPlaceholder));
    }
    for (const element of document.querySelectorAll('[data-i18n-aria-label]')) {
      element.setAttribute('aria-label', translate(element.dataset.i18nAriaLabel));
    }
    for (const button of document.querySelectorAll('[data-language]')) {
      button.setAttribute('aria-pressed', String(button.dataset.language === language));
    }
    const titleKey = document.documentElement.dataset.i18nTitle;
    if (titleKey) document.title = translate(titleKey);
  }

  function setLanguage(value, options = {}) {
    language = normalizeLanguage(value);
    if (options.document) applyDocument(options.document);
    if (options.storage) {
      try { options.storage.setItem(STORAGE_KEY, language); } catch (error) { /* Storage is optional. */ }
    }
    return language;
  }

  function initialize(document, window) {
    let savedLanguage;
    try { savedLanguage = window.localStorage.getItem(STORAGE_KEY); } catch (error) { /* Storage is optional. */ }
    const preferredLanguage = savedLanguage || (window.navigator.languages || [window.navigator.language])[0];
    setLanguage(preferredLanguage, { document });
    for (const button of document.querySelectorAll('[data-language]')) {
      button.addEventListener('click', () => {
        setLanguage(button.dataset.language, { document, storage: window.localStorage });
        window.dispatchEvent(new window.CustomEvent('site-language-change', { detail: { language } }));
      });
    }
  }

  if (root && root.document && root.addEventListener) {
    root.document.addEventListener('DOMContentLoaded', () => initialize(root.document, root));
  }

  return { catalogs, getLanguage: () => language, initialize, normalizeLanguage, setLanguage, translate, translateError };
}));
