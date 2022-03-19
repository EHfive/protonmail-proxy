export type NumberBool = 0 | 1

export interface PageParams {
  ID?: string
  Page?: number
  /** Maximum to 150 */
  PageSize?: number
  Limit?: number
  Sort?: string
  Desc?: NumberBool
  Begin?: number
  End?: number
  BeginID?: string
  EndID?: string
  Keyword?: string
}

export interface PageInfo {
  Total: number
  Limit: number
  Stale: NumberBool
  TasksRunning: any[]
}

export interface AttachmentInfo {
  [mimeType: string]: { attachment: number }
}

export interface SimplePersonInfo {
  Address: string
  Name: string
  Group?: string
}
