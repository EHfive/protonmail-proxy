import { PmApiData, PmFetchRequest } from '../types'
import { MessageInfo, MessageInfoExtra, QueryMessageParams } from './messages'
import {
  NumberBool,
  PageParams,
  PageInfo,
  AttachmentInfo,
  SimplePersonInfo,
} from './common'

interface ContextInfo {
  ContextSize: number
  ContextTime: number
  ContextNumMessages: number
  ContextNumUnread: number
  ContextNumAttachments: number
}

interface ConversationInfo {
  ID: string
  Order: number
  Subject: string
  Senders: SimplePersonInfo[]
  Recipients: SimplePersonInfo[]
  NumMessages: number
  NumUnread: number
  NumAttachments: number
  ExpirationTime: number
  Size: number
  Time: number
  AttachmentInfo: AttachmentInfo[]
  LabelIDs: string[]
  Labels: Array<ContextInfo & { ID: string }>
}

interface QueryConversationsData extends PmApiData, PageInfo {
  Conversations: Array<ConversationInfo & ContextInfo>
}

interface GetConversationData extends PmApiData {
  Conversation: ConversationInfo
  Messages: Array<MessageInfo | MessageInfoExtra>
}

export const queryConversations = (
  options?: QueryMessageParams
): PmFetchRequest<QueryConversationsData> => ({
  method: 'get',
  url: 'mail/v4/conversations',
  params: options as Record<string, string>,
})

export const getConversation = (
  conversationID: string,
  MessageID?: string
): PmFetchRequest<GetConversationData> => ({
  method: 'get',
  url: `api/mail/v4/conversations/${conversationID}`,
  params: MessageID ? { MessageID } : undefined,
})
