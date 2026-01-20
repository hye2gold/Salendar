export enum Category {
  ALL = '전체',
  BEAUTY = '뷰티',
  FASHION = '패션',
  FOOD = '음식',
  ACCOMMODATION = '숙박',
  CULTURE = '문화', 
  OTHER = '기타',
}

export enum EventType {
  DISCOUNT = '할인',
  EVENT = '행사',
  POPUP = '팝업',
  GIFT = '증정',
  REWARD = '리워드',
  TIMEDEAL = '타임딜',
  EXCLUSIVE = '전용 혜택',
}

export interface PromotionEvent {
  id: string;
  brand: string;
  title: string;
  description: string;
  startDate: string; // ISO Date string YYYY-MM-DD
  endDate: string;   // ISO Date string YYYY-MM-DD
  category: Category;
  type: EventType;
  imageUrl?: string;
}

export interface DayInfo {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasEvents: boolean;
}
