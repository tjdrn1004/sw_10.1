/**
 * 바이브 카페 메뉴 데이터 및 타입 정의
 */

// 음료 메뉴 인터페이스
export interface Drink {
  id: string;
  name: string;
  price: number;
  emoji: string;
}

// 음료 목록 정의 (사용자 요구사항 반영)
export const DRINK_MENU: Drink[] = [
  { id: 'americano', name: '아메리카노', price: 3500, emoji: '☕' },
  { id: 'latte', name: '카페라떼', price: 4000, emoji: '🥛' },
  { id: 'mocha', name: '카페모카', price: 4500, emoji: '🍫' },
  { id: 'vanilla-latte', name: '바닐라라떼', price: 4500, emoji: '✨' },
  { id: 'green-tea-latte', name: '녹차라떼', price: 4500, emoji: '🍵' },
];

// 사이즈 옵션 인터페이스
export interface SizeOption {
  id: 'S' | 'M' | 'L';
  label: string;
  extraPrice: number;
}

// 사이즈 옵션 정의 (M이 기본 선택)
export const SIZE_OPTIONS: SizeOption[] = [
  { id: 'S', label: 'S', extraPrice: 0 },
  { id: 'M', label: 'M', extraPrice: 500 },
  { id: 'L', label: 'L', extraPrice: 1000 },
];

// 추가 옵션 인터페이스
export interface AddOption {
  id: string;
  label: string;
  extraPrice: number;
}

// 추가 옵션 목록 정의
export const ADD_OPTIONS: AddOption[] = [
  { id: 'shot', label: '샷 추가', extraPrice: 500 },
  { id: 'cream', label: '크림 추가', extraPrice: 500 },
  { id: 'syrup', label: '시럽 추가', extraPrice: 300 },
  { id: 'decaf', label: '디카페인', extraPrice: 0 },
];

// 접수된 주문 인터페이스 (게시판 연동용)
export interface CafeOrder {
  id: string; // 주문 고유 번호
  orderNumber: number; // 주문 대기 번호
  customerName: string; // 고객 이름
  phoneNumber: string; // 전화번호
  drinkId: string; // 음료 ID
  drinkName: string; // 음료 이름
  size: 'S' | 'M' | 'L'; // 사이즈
  options: string[]; // 선택된 추가 옵션 라벨 배열
  quantity: number; // 수량 (1~10)
  requestNotes: string; // 요청사항
  totalPrice: number; // 총 주문 금액
  createdAt: string; // 주문 생성 시간
  status: '접수완료' | '제조중' | '준비완료'; // 게시판 상태
}
