/**
 * 文件工具类
 * 提供文件操作相关的工具函数
 */

/**
 * 将对象或数据转换为JSON文件
 * @param data 要转换的数据
 * @param fileName 文件名
 * @param options 选项
 * @param options.pretty 是否美化JSON (默认: false)
 * @param options.encoding 编码类型 (默认: 'application/json')
 * @returns File对象
 */
export function createJsonFile<T>(
  data: T, 
  fileName: string,
  options: { pretty?: boolean; encoding?: string } = {}
): File {
  const { pretty = false, encoding = 'application/json' } = options;
  
  // 如果需要美化JSON，使用缩进
  const jsonString = pretty 
    ? JSON.stringify(data, null, 2) 
    : JSON.stringify(data);
  
  // 创建文件
  return new File([jsonString], fileName, { type: encoding });
}

/**
 * 将对象或数据转换为文本文件
 * @param text 文本内容
 * @param fileName 文件名
 * @param encoding 编码类型 (默认: 'text/plain')
 * @returns File对象
 */
export function createTextFile(
  text: string, 
  fileName: string,
  encoding: string = 'text/plain'
): File {
  return new File([text], fileName, { type: encoding });
}

/**
 * 触发浏览器下载文件
 * @param file 要下载的文件
 */
export function downloadFile(file: File): void {
  // 创建一个URL对象指向文件
  const url = URL.createObjectURL(file);
  
  // 创建一个隐藏的<a>标签
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  
  // 将<a>标签添加到文档中
  document.body.appendChild(link);
  
  // 模拟点击<a>标签来启动下载
  link.click();
  
  // 清理URL对象和<a>标签
  URL.revokeObjectURL(url);
  document.body.removeChild(link);
}

/**
 * 从日期生成标准文件名
 * @param date 日期字符串或Date对象
 * @param prefix 文件名前缀 (可选)
 * @param suffix 文件名后缀 (可选)
 * @param extension 文件扩展名 (默认: 'json')
 * @returns 格式化的文件名
 */
export function createDateFileName(
  date: string | Date,
  prefix?: string,
  suffix?: string,
  extension: string = 'json'
): string {
  // 确保日期格式为 YYYY-MM-DD
  const dateStr = typeof date === 'string' 
    ? date 
    : date.toISOString().split('T')[0];
  
  // 构建文件名
  let fileName = dateStr;
  
  if (prefix) {
    fileName = `${prefix}-${fileName}`;
  }
  
  if (suffix) {
    fileName = `${fileName}-${suffix}`;
  }
  
  return `${fileName}.${extension}`;
} 