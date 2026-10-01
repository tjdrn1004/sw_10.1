/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  DRINK_MENU,
  SIZE_OPTIONS,
  ADD_OPTIONS,
  CafeOrder,
} from './cafeData.ts';
import {
  Coffee,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ClipboardList,
  Sparkles,
  Phone,
  User,
  MessageSquare,
  Plus,
  Minus,
  Clock,
  Trash2,
} from 'lucide-react';

export default function App() {
  // ==========================================
  // [1] 상태(State) 관리
  // ==========================================

  // 활성 탭: 'order' (주문서 작성) | 'board' (주문 게시판)
  const [activeTab, setActiveTab] = useState<'order' | 'board'>('order');

  // 주문서 입력 상태
  const [customerName, setCustomerName] = useState<string>(''); // 1. 이름 (필수)
  const [phoneNumber, setPhoneNumber] = useState<string>(''); // 2. 전화번호 (tel)
  const [selectedDrinkId, setSelectedDrinkId] = useState<string>(''); // 3. 음료 선택 (드롭다운)
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L'>('M'); // 4. 사이즈 (기본값 M)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]); // 5. 추가 옵션 목록 (체크박스)
  const [quantity, setQuantity] = useState<number>(1); // 6. 수량 (기본값 1, 최소 1, 최대 10)
  const [requestNotes, setRequestNotes] = useState<string>(''); // 7. 요청사항 (textarea)

  // 검증 및 알림 상태
  const [validationError, setValidationError] = useState<string | null>(null);

  // 주문 확인 메시지 상태
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);

  // 주문 게시판 목록 (로컬스토리지 연동 및 초기 샘플 데이터)
  const [orderList, setOrderList] = useState<CafeOrder[]>(() => {
    try {
      const saved = localStorage.getItem('vibe_cafe_orders');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // 로컬스토리지 접근 실패 시 기본 배열 사용
    }
    // 기본 샘플 주문 데이터 (카페 게시판 활기 부여)
    return [
      {
        id: 'sample-order-1',
        orderNumber: 101,
        customerName: '김민준',
        phoneNumber: '010-1234-5678',
        drinkId: 'latte',
        drinkName: '카페라떼',
        size: 'M',
        options: ['샷 추가'],
        quantity: 1,
        requestNotes: '따뜻하게 부탁드립니다.',
        totalPrice: 5000,
        createdAt: '10분 전',
        status: '준비완료',
      },
      {
        id: 'sample-order-2',
        orderNumber: 102,
        customerName: '이지은',
        phoneNumber: '010-9876-5432',
        drinkId: 'americano',
        drinkName: '아메리카노',
        size: 'L',
        options: ['디카페인'],
        quantity: 2,
        requestNotes: '얼음 적게 넣어주세요~',
        totalPrice: 9000,
        createdAt: '3분 전',
        status: '제조중',
      },
    ];
  });

  // 주문 목록 변경 시 로컬스토리지 동기화
  useEffect(() => {
    try {
      localStorage.setItem('vibe_cafe_orders', JSON.stringify(orderList));
    } catch {
      // 로컬스토리지 저장 실패 처리
    }
  }, [orderList]);

  // ==========================================
  // [2] 실시간 예상 금액 계산 (useMemo)
  // ==========================================
  // 음료, 사이즈, 추가옵션, 수량이 바뀔 때마다 실시간으로 계산
  const calculatedPrice = useMemo(() => {
    // 선택된 음료 정보 찾기
    const drink = DRINK_MENU.find((item) => item.id === selectedDrinkId);
    if (!drink) {
      return 0; // 음료가 선택되지 않은 경우 0원
    }

    // 1) 음료 기본 가격
    const basePrice = drink.price;

    // 2) 사이즈 추가 금액 (S: 0원, M: +500원, L: +1,000원)
    const sizeOption = SIZE_OPTIONS.find((s) => s.id === selectedSize);
    const sizePrice = sizeOption ? sizeOption.extraPrice : 0;

    // 3) 선택된 추가 옵션 금액 합산
    const optionsPrice = selectedOptions.reduce((acc, optId) => {
      const option = ADD_OPTIONS.find((o) => o.id === optId);
      return acc + (option ? option.extraPrice : 0);
    }, 0);

    // 4) 1잔당 단가
    const unitPrice = basePrice + sizePrice + optionsPrice;

    // 5) 수량 곱셈하여 총 예상 금액 산출
    return unitPrice * quantity;
  }, [selectedDrinkId, selectedSize, selectedOptions, quantity]);

  // 게시판 주문 총 누적 금액 계산
  const totalBoardSales = useMemo(() => {
    return orderList.reduce((acc, order) => acc + order.totalPrice, 0);
  }, [orderList]);

  // ==========================================
  // [3] 핸들러 함수
  // ==========================================

  // 추가 옵션 체크박스 변경 핸들러
  const handleOptionToggle = (optionId: string) => {
    setSelectedOptions((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId]
    );
  };

  // 수량 증가/감소 핸들러 (최소 1, 최대 10)
  const handleQuantityChange = (newVal: number) => {
    if (newVal >= 1 && newVal <= 10) {
      setQuantity(newVal);
    }
  };

  // '주문하기' 버튼 클릭 핸들러
  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. 유효성 검사: 이름 입력 여부 확인
    if (!customerName.trim()) {
      setValidationError('이름을 입력해주세요');
      setConfirmationMessage(null);
      // 이름 입력칸으로 포커스
      const nameInput = document.getElementById('customer-name');
      nameInput?.focus();
      return;
    }

    // 2. 유효성 검사: 음료 선택 여부 확인
    if (!selectedDrinkId) {
      setValidationError('음료를 선택해주세요');
      setConfirmationMessage(null);
      // 음료 선택 드롭다운으로 포커스
      const drinkSelect = document.getElementById('drink-select');
      drinkSelect?.focus();
      return;
    }

    // 에러 초기화
    setValidationError(null);

    // 선택된 음료 객체 가져오기
    const drink = DRINK_MENU.find((d) => d.id === selectedDrinkId);
    const drinkName = drink ? drink.name : '';

    // 선택된 추가 옵션 라벨 배열 생성
    const optionLabels = selectedOptions
      .map((optId) => {
        const opt = ADD_OPTIONS.find((o) => o.id === optId);
        return opt ? opt.label : '';
      })
      .filter(Boolean);

    // 옵션 텍스트 형식화: 옵션이 있으면 " (샷 추가, 크림 추가)" 형태, 없으면 빈 문자열
    const optionText = optionLabels.length > 0 ? ` (${optionLabels.join(', ')})` : '';

    // 요구사항 주문 확인 메시지 템플릿:
    // "홍길동님, 카페라떼 M사이즈 (샷 추가) 1잔, 총 5,000원 주문이 접수되었습니다!"
    const formattedMessage = `${customerName.trim()}님, ${drinkName} ${selectedSize}사이즈${optionText} ${quantity}잔, 총 ${calculatedPrice.toLocaleString()}원 주문이 접수되었습니다!`;

    // 새 주문 객체 생성 및 주문 게시판에 등록
    const newOrder: CafeOrder = {
      id: `order-${Date.now()}`,
      orderNumber: 100 + (orderList.length + 1),
      customerName: customerName.trim(),
      phoneNumber: phoneNumber.trim() || '미입력',
      drinkId: selectedDrinkId,
      drinkName: drinkName,
      size: selectedSize,
      options: optionLabels,
      quantity: quantity,
      requestNotes: requestNotes.trim(),
      totalPrice: calculatedPrice,
      createdAt: '방금 전',
      status: '접수완료',
    };

    setConfirmationMessage(formattedMessage);
    setOrderList((prev) => [newOrder, ...prev]);

    // 주문 성공 후 스크롤을 확인 메시지 위치로 부드럽게 이동
    setTimeout(() => {
      const confirmElem = document.getElementById('order-confirmation-box');
      confirmElem?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  // '다시 작성' 버튼 클릭 핸들러 (모든 입력과 금액 초기화)
  const handleResetForm = () => {
    setCustomerName('');
    setPhoneNumber('');
    setSelectedDrinkId('');
    setSelectedSize('M'); // 기본값 M 복귀
    setSelectedOptions([]); // 옵션 체크 해제
    setQuantity(1); // 기본 수량 1 복귀
    setRequestNotes('');
    setValidationError(null);
    setConfirmationMessage(null);
  };

  // 주문 상태 변경 (게시판 관리용)
  const handleStatusChange = (orderId: string, newStatus: CafeOrder['status']) => {
    setOrderList((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  };

  // 주문 삭제 핸들러
  const handleDeleteOrder = (orderId: string) => {
    setOrderList((prev) => prev.filter((order) => order.id !== orderId));
  };

  return (
    <div className="min-h-screen bg-[#faf6f0] text-[#3e2723] py-8 px-4 flex flex-col items-center">
      {/* ==========================================
          [상단 헤더 영역]
          - 카페 로고: ☕ 이모지 크게
          - 카페 이름: "바이브 카페"
          - 부제: "당신의 하루에 바이브를 더하다"
          ========================================== */}
      <header className="w-full max-w-[520px] text-center mb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-md border-2 border-[#d7ccc8] mb-3 transform hover:scale-105 transition-transform duration-200">
          <span className="text-4xl" role="img" aria-label="카페 로고">
            ☕
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-[#6b4226] tracking-tight mb-1">
          바이브 카페
        </h1>
        <p className="text-sm font-medium text-[#8d6e63]">
          당신의 하루에 바이브를 더하다
        </p>

        {/* 탭 네비게이션: [주문하기] / [주문 게시판] */}
        <div className="mt-5 flex items-center justify-center p-1 bg-[#ede6dc] rounded-xl max-w-sm mx-auto shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('order')}
            className={`flex-1 py-2 px-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'order'
                ? 'bg-[#6b4226] text-white shadow-sm'
                : 'text-[#6b4226] hover:bg-[#dfd7cc]'
            }`}
          >
            <Coffee className="w-4 h-4" />
            주문서 작성
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('board')}
            className={`flex-1 py-2 px-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'board'
                ? 'bg-[#6b4226] text-white shadow-sm'
                : 'text-[#6b4226] hover:bg-[#dfd7cc]'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            주문 게시판
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === 'board'
                  ? 'bg-amber-200 text-[#6b4226]'
                  : 'bg-[#6b4226] text-white'
              }`}
            >
              {orderList.length}
            </span>
          </button>
        </div>
      </header>

      {/* ==========================================
          [메인 컨테이너 (최대 너비 520px, 가운데 정렬)]
          ========================================== */}
      <main className="w-full max-w-[520px]">
        {activeTab === 'order' ? (
          <div className="bg-white rounded-2xl shadow-lg border border-[#e6ded8] p-6 sm:p-7 transition-all">
            {/* 유효성 검사 에러 배너 (이름 미입력 / 음료 미선택 시) */}
            {validationError && (
              <div
                role="alert"
                className="mb-5 p-3.5 bg-rose-50 border-l-4 border-rose-500 rounded-r-lg flex items-center gap-2.5 text-rose-800 text-sm font-semibold animate-pulse"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
                <span>{validationError}</span>
              </div>
            )}

            <form onSubmit={handleOrderSubmit} className="space-y-5">
              {/* 1. 이름 (필수, text) */}
              <div>
                <label
                  htmlFor="customer-name"
                  className="block text-sm font-bold text-[#4a2e1b] mb-1.5 flex items-center gap-1"
                >
                  <User className="w-4 h-4 text-[#6b4226]" />
                  <span>이름</span>
                  <span className="text-red-500 text-xs font-normal" title="필수 입력">*필수</span>
                </label>
                <input
                  id="customer-name"
                  name="customerName"
                  type="text"
                  required
                  placeholder="주문하시는 분 성함을 입력해주세요"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (validationError === '이름을 입력해주세요') {
                      setValidationError(null);
                    }
                  }}
                  className="cafe-input"
                />
              </div>

              {/* 2. 전화번호 (tel) */}
              <div>
                <label
                  htmlFor="customer-phone"
                  className="block text-sm font-bold text-[#4a2e1b] mb-1.5 flex items-center gap-1"
                >
                  <Phone className="w-4 h-4 text-[#6b4226]" />
                  <span>전화번호</span>
                  <span className="text-xs font-normal text-gray-500">(선택)</span>
                </label>
                <input
                  id="customer-phone"
                  name="customerPhone"
                  type="tel"
                  placeholder="010-0000-0000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="cafe-input"
                />
              </div>

              {/* 3. 음료 선택 (드롭다운) */}
              <div>
                <label
                  htmlFor="drink-select"
                  className="block text-sm font-bold text-[#4a2e1b] mb-1.5 flex items-center gap-1"
                >
                  <Coffee className="w-4 h-4 text-[#6b4226]" />
                  <span>음료 선택</span>
                  <span className="text-red-500 text-xs font-normal" title="필수 선택">*필수</span>
                </label>
                <div className="relative">
                  <select
                    id="drink-select"
                    name="drinkSelect"
                    value={selectedDrinkId}
                    onChange={(e) => {
                      setSelectedDrinkId(e.target.value);
                      if (validationError === '음료를 선택해주세요') {
                        setValidationError(null);
                      }
                    }}
                    className="cafe-input appearance-none pr-10 cursor-pointer"
                  >
                    <option value="">-- 음료를 선택해주세요 --</option>
                    {DRINK_MENU.map((drink) => (
                      <option key={drink.id} value={drink.id}>
                        {drink.emoji} {drink.name} ({drink.price.toLocaleString()}원)
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#6b4226]">
                    ▼
                  </div>
                </div>
              </div>

              {/* 4. 사이즈 (라디오 버튼, 가로 배치) */}
              <div>
                <label className="block text-sm font-bold text-[#4a2e1b] mb-2">
                  사이즈 선택
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  {SIZE_OPTIONS.map((sizeOpt) => {
                    const inputId = `size-option-${sizeOpt.id}`;
                    const isSelected = selectedSize === sizeOpt.id;
                    return (
                      <label
                        key={sizeOpt.id}
                        htmlFor={inputId}
                        className={`flex-1 min-w-[90px] flex items-center justify-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#faf4ef] border-[#6b4226] text-[#6b4226] font-bold shadow-sm'
                            : 'bg-white border-[#d7ccc8] text-[#5d4037] hover:bg-[#faf8f5]'
                        }`}
                      >
                        <input
                          type="radio"
                          id={inputId}
                          name="beverageSize"
                          value={sizeOpt.id}
                          checked={isSelected}
                          onChange={() => setSelectedSize(sizeOpt.id)}
                          className="accent-[#6b4226] w-4 h-4 cursor-pointer"
                        />
                        <span className="text-sm">
                          {sizeOpt.label}{' '}
                          <span className="text-xs opacity-75">
                            (+{sizeOpt.extraPrice.toLocaleString()}원)
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 5. 추가 옵션 (체크박스, 가로 배치) */}
              <div>
                <label className="block text-sm font-bold text-[#4a2e1b] mb-2">
                  추가 옵션
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {ADD_OPTIONS.map((option) => {
                    const inputId = `add-option-${option.id}`;
                    const isChecked = selectedOptions.includes(option.id);
                    return (
                      <label
                        key={option.id}
                        htmlFor={inputId}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-[#faf4ef] border-[#6b4226] text-[#6b4226] font-bold shadow-sm'
                            : 'bg-white border-[#d7ccc8] text-[#5d4037] hover:bg-[#faf8f5]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          id={inputId}
                          name={`option_${option.id}`}
                          checked={isChecked}
                          onChange={() => handleOptionToggle(option.id)}
                          className="accent-[#6b4226] w-4 h-4 rounded cursor-pointer"
                        />
                        <span className="text-sm">
                          {option.label}{' '}
                          <span className="text-xs opacity-75">
                            (+{option.extraPrice.toLocaleString()}원)
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 6. 수량 (number 타입, 최소 1, 최대 10, 기본값 1) */}
              <div>
                <label
                  htmlFor="order-quantity"
                  className="block text-sm font-bold text-[#4a2e1b] mb-1.5"
                >
                  수량 (최소 1개 ~ 최대 10개)
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    aria-label="수량 감소"
                    className="w-10 h-10 rounded-lg border border-[#d7ccc8] bg-white flex items-center justify-center hover:bg-[#f5ece4] active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    <Minus className="w-4 h-4 text-[#6b4226]" />
                  </button>
                  <input
                    id="order-quantity"
                    name="orderQuantity"
                    type="number"
                    min={1}
                    max={10}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        handleQuantityChange(val);
                      }
                    }}
                    className="cafe-input text-center font-bold text-lg w-24"
                  />
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= 10}
                    aria-label="수량 증가"
                    className="w-10 h-10 rounded-lg border border-[#d7ccc8] bg-white flex items-center justify-center hover:bg-[#f5ece4] active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-[#6b4226]" />
                  </button>
                  <span className="text-xs text-[#8d6e63]">잔</span>
                </div>
              </div>

              {/* 7. 요청사항 (textarea) */}
              <div>
                <label
                  htmlFor="request-notes"
                  className="block text-sm font-bold text-[#4a2e1b] mb-1.5 flex items-center gap-1"
                >
                  <MessageSquare className="w-4 h-4 text-[#6b4226]" />
                  <span>요청사항</span>
                </label>
                <textarea
                  id="request-notes"
                  name="requestNotes"
                  rows={3}
                  placeholder="예: 얼음 많이 넣어주세요, 덜 달게 해주세요 등"
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  className="cafe-input resize-none"
                />
              </div>

              {/* ==========================================
                  [실시간 예상 금액 표시 영역]
                  - 큰 글씨(24px), 갈색(#6b4226), 굵게, 가운데 정렬
                  - 주문하기 버튼 바로 위에 배치
                  - 예: "예상 금액: 5,000원"
                  ========================================== */}
              <div className="pt-3 pb-1 border-t border-dashed border-[#d7ccc8]">
                <div className="text-[24px] font-bold text-[#6b4226] text-center tracking-wide py-2.5 bg-[#faf4ef] rounded-xl border border-[#ebd8cb]">
                  예상 금액: {calculatedPrice.toLocaleString()}원
                </div>
                {!selectedDrinkId && (
                  <p className="text-xs text-center text-[#8d6e63] mt-1.5">
                    * 음료를 선택하시면 상세 예상 금액이 실시간으로 계산됩니다.
                  </p>
                )}
              </div>

              {/* ==========================================
                  [버튼 영역]
                  - 8. 주문하기 버튼: 갈색 배경(#6b4226), 흰색 글씨, hover시 밝게
                  - 9. 다시 작성 버튼: 모든 입력과 금액 초기화
                  ========================================== */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#6b4226] text-white py-3.5 px-6 rounded-xl font-bold text-base hover:bg-[#805030] active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  주문하기
                </button>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="sm:w-36 bg-[#ece5de] text-[#5d4037] py-3.5 px-4 rounded-xl font-semibold text-sm hover:bg-[#dfd5cc] active:scale-[0.98] transition-all border border-[#d7ccc8] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  다시 작성
                </button>
              </div>
            </form>

            {/* ==========================================
                [주문 확인 메시지 영역]
                - 연두색 배경, 초록 글씨, 둥근 모서리
                - 예) "홍길동님, 카페라떼 M사이즈 (샷 추가) 1잔, 총 5,000원 주문이 접수되었습니다!"
                ========================================== */}
            {confirmationMessage && (
              <div
                id="order-confirmation-box"
                className="mt-6 p-4 rounded-xl bg-[#e8f5e9] border border-[#c8e6c9] text-[#1b5e20] shadow-sm animate-fade-in"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-[#2e7d32] mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-bold text-base text-[#1b5e20] mb-1">
                      주문 접수 완료
                    </h3>
                    <p className="text-sm font-medium leading-relaxed">
                      {confirmationMessage}
                    </p>
                    <div className="mt-3 pt-2 border-t border-[#c8e6c9]/60 flex items-center justify-between text-xs text-[#2e7d32]">
                      <span>주문 게시판에서 대기 현황을 확인하세요</span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('board')}
                        className="underline font-bold hover:text-black transition-colors cursor-pointer"
                      >
                        게시판 보기 →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ==========================================
              [주문 게시판 (Board) 뷰]
              ========================================== */
          <div className="bg-white rounded-2xl shadow-lg border border-[#e6ded8] p-6 transition-all">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#ebd8cb]">
              <div>
                <h2 className="text-lg font-bold text-[#6b4226] flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  실시간 주문 접수 현황
                </h2>
                <p className="text-xs text-[#8d6e63] mt-0.5">
                  총 <span className="font-bold text-[#6b4226]">{orderList.length}건</span> (누적 매출:{' '}
                  <span className="font-bold text-[#6b4226]">{totalBoardSales.toLocaleString()}원</span>)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('order')}
                className="text-xs bg-[#6b4226] text-white px-3 py-1.5 rounded-lg font-bold hover:bg-[#805030] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                새 주문 작성
              </button>
            </div>

            {orderList.length === 0 ? (
              <div className="py-12 text-center text-[#8d6e63]">
                <Coffee className="w-12 h-12 mx-auto text-[#d7ccc8] mb-2" />
                <p className="text-sm font-medium">아직 접수된 주문이 없습니다.</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('order')}
                  className="mt-3 text-xs bg-[#6b4226] text-white px-3 py-1.5 rounded-lg font-bold hover:bg-[#805030] cursor-pointer"
                >
                  첫 주문 작성하기
                </button>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
                {orderList.map((order) => {
                  const statusColors = {
                    접수완료: 'bg-blue-100 text-blue-800 border-blue-200',
                    제조중: 'bg-amber-100 text-amber-800 border-amber-200',
                    준비완료: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                  };

                  return (
                    <div
                      key={order.id}
                      className="p-4 rounded-xl border border-[#ebd8cb] bg-[#faf8f5] hover:bg-[#f5eee6] transition-colors relative"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2 py-0.5 bg-[#6b4226] text-white rounded-md">
                            No.{order.orderNumber}
                          </span>
                          <span className="font-bold text-sm text-[#4a2e1b]">
                            {order.customerName} 고객님
                          </span>
                          <span className="text-xs text-gray-400">({order.phoneNumber})</span>
                        </div>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${statusColors[order.status]}`}
                        >
                          {order.status}
                        </span>
                      </div>

                      <div className="text-sm text-[#3e2723] font-medium mb-1.5">
                        <span className="font-bold text-[#6b4226]">{order.drinkName}</span> (
                        {order.size}사이즈
                        {order.options.length > 0 ? `, ${order.options.join(', ')}` : ''}){' '}
                        <span className="font-bold">{order.quantity}잔</span>
                      </div>

                      {order.requestNotes && (
                        <div className="text-xs bg-white/70 p-2 rounded-lg border border-[#ebd8cb]/60 text-[#6d4c41] mb-2 flex items-start gap-1">
                          <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#8d6e63]" />
                          <span>요청: {order.requestNotes}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-[#ebd8cb]/50 text-xs text-[#8d6e63]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {order.createdAt}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-sm text-[#6b4226]">
                            {order.totalPrice.toLocaleString()}원
                          </span>

                          {/* 상태 변경 셀렉트 */}
                          <select
                            value={order.status}
                            onChange={(e) =>
                              handleStatusChange(
                                order.id,
                                e.target.value as CafeOrder['status']
                              )
                            }
                            aria-label="주문 상태 변경"
                            className="text-xs bg-white border border-[#d7ccc8] rounded px-1.5 py-0.5 text-[#4a2e1b] cursor-pointer"
                          >
                            <option value="접수완료">접수완료</option>
                            <option value="제조중">제조중</option>
                            <option value="준비완료">준비완료</option>
                          </select>

                          {/* 삭제 버튼 */}
                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(order.id)}
                            title="주문 삭제"
                            aria-label="주문 삭제"
                            className="text-gray-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            [카페 안내 푸터]
            ========================================== */}
        <footer className="mt-8 text-center text-xs text-[#8d6e63] space-y-1">
          <p>바이브 카페 (Vibe Cafe) | 매일 08:00 - 22:00 주문 가능</p>
          <p>© 2026 Vibe Cafe. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}
