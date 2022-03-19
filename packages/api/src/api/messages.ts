import { PmApiData, PmFetchRequest } from '../types'
import {
  NumberBool,
  PageInfo,
  PageParams,
  SimplePersonInfo,
  AttachmentInfo,
} from './common'

export interface MessageInfo {
  ID: string
  Order: number
  ConversationID: string
  Subject: string
  Unread: NumberBool
  SenderAddress: string
  SenderName: string
  Sender: SimplePersonInfo
  Flags: number
  Type: number
  IsEncrypted: number
  IsReplied: NumberBool
  IsRepliedAll: NumberBool
  IsForwarded: NumberBool
  ToList: SimplePersonInfo
  CCList: SimplePersonInfo
  BCCList: SimplePersonInfo
  Time: number
  Size: number
  NumAttachments: number
  ExpirationTime: number
  AddressID: string
  ExternalID: string | null
  LabelIDs: string[]
  AttachmentInfo: AttachmentInfo[]
}

export interface MessageInfoExtra extends MessageInfo {
  Body: string
  MIMEType: string
  Header: string
  ParsedHeaders: {
    'Authentication-Results': string[]
    Received: string[]
    [key: string]: any
  }
  ReplyTo: SimplePersonInfo
  ReplyTos: SimplePersonInfo[]
}

export interface QueryMessageParams extends PageParams {
  Location?: string
  LabelID?: number
  To?: string
  From?: string
  Subject?: string
  Attachments?: string
  Starred?: NumberBool
  Unread?: NumberBool
  AddressID?: string
  AutoWildcard?: string
}

export interface QueryMessagesData extends PmApiData, PageInfo {
  Messages: MessageInfo[]
}

export interface GetMessageData extends PmApiData {
  Message: MessageInfoExtra
}

export const queryMessages = (
  options?: QueryMessageParams
): PmFetchRequest<QueryMessagesData> => ({
  method: 'get',
  url: 'mail/v4/messages',
  params: options as Record<string, string>,
})

export const getMessage = (
  messageID: string
): PmFetchRequest<GetMessageData> => ({
  method: 'get',
  url: `mail/v4/messages/${messageID}`,
})

export const sendMessageForm = (
  messageID: string,
  formData: any
): PmFetchRequest<PmApiData> => ({
  method: 'get',
  url: `mail/v4/messages/${messageID}`,
  isRaw: true,
  data: formData,
})
