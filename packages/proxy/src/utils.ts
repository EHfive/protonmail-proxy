export function yargsCoerceSingle(value: any) {
  if (Array.isArray(value)) {
    return value.length > 0 ? value[value.length - 1] : undefined
  }
  return value
}
