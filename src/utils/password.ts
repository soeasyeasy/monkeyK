// 加密后的密码（Base64 编码 + 简单混淆）
// 实际密码: "123321"
// 加密方式: 反转字符串 + Base64 编码
// "123321" -> 反转 "123321" -> Base64 "MTIzMzIx"
const ENCRYPTED_PASSWORD = 'MTIzMzIx'

/**
 * 验证用户输入的密码是否正确
 * @param input 用户输入的密码
 * @returns 是否匹配
 */
export function verifyPassword(input: string): boolean {
  if (!input || input.trim() === '') return false
  
  // 解密过程：Base64 解码 + 反转
  try {
    const decoded = atob(ENCRYPTED_PASSWORD)
    const reversed = decoded.split('').reverse().join('')
    const actualPassword = reversed
    
    return input === actualPassword
  } catch (error) {
    console.error('密码验证失败:', error)
    return false
  }
}

/**
 * 生成加密密码（开发时使用）
 * @param password 原始密码
 * @returns 加密后的字符串
 */
export function encryptPassword(password: string): string {
  const reversed = password.split('').reverse().join('')
  return btoa(reversed)
}
