export type ItemStatus = 'cooling' | 'ready' | 'decided'
export type ItemDecision = 'bought' | 'passed'
export type ChatRole = 'user' | 'assistant'

export interface Item {
  id: string
  user_id: string
  name: string
  price: number
  url: string | null
  reason: string | null
  status: ItemStatus
  decision: ItemDecision | null
  decided_at: string | null
  cooling_ends_at: string
  fact_summary: string[] | null
  deleted_at: string | null
  created_at: string
}

export interface ChatMessage {
  id: string
  item_id: string
  user_id: string
  role: ChatRole
  content: string
  turn_number: number
  created_at: string
}
