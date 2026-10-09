import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  BedDouble,
  Calendar,
  Clock,
  Percent,
  Briefcase,
  Copy,
  CheckCircle2,
  PieChart,
  ChevronRight,
  Sparkles,
  Users,
  Wallet,
  Save,
  Trash2,
  FolderOpen,
  Bookmark
} from 'lucide-react';

export default function MotelRoiCalculator() {
  // 1. 기본 정보
  const [regionName, setRegionName] = useState('서울 강남구');
  const [roomCount, setRoomCount] = useState(30);

  // 2. 월 숙박 매출 입력
  const [weekdayCount, setWeekdayCount] = useState(22); // 월 평균 평일
  const [weekdayPrice, setWeekdayPrice] = useState(60000); // 평일 숙박 객단가
  const [weekendCount, setWeekendCount] = useState(8);   // 월 평균 주말
  const [weekendPrice, setWeekendPrice] = useState(90000); // 주말 숙박 객단가

  // 3. 대실 매출 입력
  const [useRent, setUseRent] = useState(true);
  const [dailyRentCount, setDailyRentCount] = useState(1.5); // 대실 수 / 하루
  const [rentPrice, setRentPrice] = useState(30000);        // 대실 객단가

  // 4. 총 사업비 입력 (엘리베이터 비용 추가)
  const [purchasePrice, setPurchasePrice] = useState(3500000000); // 매입가
  const [renovationPerRoom, setRenovationPerRoom] = useState(15000000); // 객실당 공사비
  const [elevatorCost, setElevatorCost] = useState(50000000); // 엘리베이터 비용
  const [otherInitialCost, setOtherInitialCost] = useState(100000000); // 기타 제반 비용

  // 5. 운영 방식 및 기타 경비 (% or 고정금액)
  const [isConsigned, setIsConsigned] = useState(true); // 위탁운영 여부
  const [expenseType, setExpenseType] = useState('percent'); // 'fixed' or 'percent'
  const [customOtherExpenseFixed, setCustomOtherExpenseFixed] = useState(4500000); // 고정 기타 경비
  const [expensePercentRate, setExpensePercentRate] = useState(12); // 매출의 % 비율

  // 6. 금융 비용
  const [loanRatio, setLoanRatio] = useState(100); // 총 사업비 중 대출 비율 (%)
  const [interestRate, setInterestRate] = useState(6.0); // 연 이자율 (%)

  // 저장 기능 상태
  const [savedConfigs, setSavedConfigs] = useState([]);
  const [saveTitleInput, setSaveTitleInput] = useState('');

  // UI 상태
  const [copied, setCopied] = useState(false);
  const [displayUnit, setDisplayUnit] = useState('KRW');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('motel_roi_saved_configs_white_v1');
      if (stored) {
        setSavedConfigs(JSON.parse(stored));
      }
    } catch (e) {
      console.error('저장 목록 로드 실패:', e);
    }
  }, []);

  const formatNumberWithCommas = (value) => {
    if (value === null || value === undefined || value === '') return '';
    const num = String(value).replace(/,/g, '');
    if (isNaN(num)) return '';
    return Number(num).toLocaleString('ko-KR');
  };

  const parseFormattedNumber = (formattedStr) => {
    if (!formattedStr) return 0;
    const cleanStr = String(formattedStr).replace(/,/g, '');
    const parsed = Number(cleanStr);
    return isNaN(parsed) ? 0 : parsed;
  };

  const calculations = useMemo(() => {
    const rooms = Math.max(0, Number(roomCount) || 0);

    // 총 사업비
    const totalRenovationCost = rooms * (Number(renovationPerRoom) || 0);
    const totalElevatorCost = Number(elevatorCost) || 0;
    const totalProjectCost = 
      (Number(purchasePrice) || 0) + 
      totalRenovationCost + 
      totalElevatorCost + 
      (Number(otherInitialCost) || 0);

    // 금융 비용
    const loanAmount = totalProjectCost * ((Number(loanRatio) || 0) / 100);
    const annualInterestRate = (Number(interestRate) || 0) / 100;
    const monthlyInterest = (loanAmount * annualInterestRate) / 12;

    // 인건비 및 위탁 수수료
    let consignmentFee = 0;
    let laborCost = 0;

    if (isConsigned) {
      consignmentFee = rooms * 165000;
      laborCost = 15700000;
    } else {
      consignmentFee = 0;
      laborCost = 7000000;
    }

    // 100% 가동률 기준 월 매출
    const totalMonthDays = (Number(weekdayCount) || 0) + (Number(weekendCount) || 0);

    const baseMonthlyStayRevenue = 
      ((Number(weekdayCount) || 0) * (Number(weekdayPrice) || 0) + 
       (Number(weekendCount) || 0) * (Number(weekendPrice) || 0)) * rooms;

    const baseMonthlyRentRevenue = useRent
      ? totalMonthDays * (Number(dailyRentCount) || 0) * (Number(rentPrice) || 0) * rooms
      : 0;

    const baseMonthlyTotalRevenue = baseMonthlyStayRevenue + baseMonthlyRentRevenue;

    // 가동률 시나리오 (100%, 90%, 85%)
    const scenarios = [100, 90, 85].map((occupancyRate) => {
      const rateMultiplier = occupancyRate / 100;
      
      const stayRevenue = baseMonthlyStayRevenue * rateMultiplier;
      const rentRevenue = baseMonthlyRentRevenue * rateMultiplier;
      const totalRevenue = stayRevenue + rentRevenue;

      let calculatedOtherExpense = 0;
      if (expenseType === 'percent') {
        calculatedOtherExpense = totalRevenue * ((Number(expensePercentRate) || 0) / 100);
      } else {
        calculatedOtherExpense = Number(customOtherExpenseFixed) || 0;
      }

      const totalOperatingExpense = consignmentFee + laborCost + calculatedOtherExpense;
      const totalMonthlyExpense = totalOperatingExpense + monthlyInterest;

      const monthlyNetProfit = totalRevenue - totalMonthlyExpense;
      const annualNetProfit = monthlyNetProfit * 12;
      const roi = totalProjectCost > 0 ? (annualNetProfit / totalProjectCost) * 100 : 0;

      return {
        rate: occupancyRate,
        stayRevenue,
        rentRevenue,
        totalRevenue,
        calculatedOtherExpense,
        operatingExpense: totalOperatingExpense,
        monthlyInterest,
        totalMonthlyExpense,
        monthlyNetProfit,
        annualNetProfit,
        roi
      };
    });

    return {
      totalRenovationCost,
      totalElevatorCost,
      totalProjectCost,
      loanAmount,
      monthlyInterest,
      consignmentFee,
      laborCost,
      baseMonthlyTotalRevenue,
      scenarios
    };
  }, [
    roomCount,
    weekdayCount,
    weekdayPrice,
    weekendCount,
    weekendPrice,
    useRent,
    dailyRentCount,
    rentPrice,
    purchasePrice,
    renovationPerRoom,
    elevatorCost,
    otherInitialCost,
    isConsigned,
    expenseType,
    customOtherExpenseFixed,
    expensePercentRate,
    loanRatio,
    interestRate
  ]);

  const formatMoney = (amount) => {
    if (isNaN(amount)) return '0원';
    const absVal = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';

    if (displayUnit === '10k') {
      const inTenThousand = Math.round(absVal / 10000);
      return `${sign}${inTenThousand.toLocaleString('ko-KR')} 만원`;
    }

    if (absVal >= 100000000) {
      const uk = Math.floor(absVal / 100000000);
      const remainder = Math.round((absVal % 100000000) / 10000);
      if (remainder === 0) return `${sign}${uk.toLocaleString('ko-KR')}억원`;
      return `${sign}${uk.toLocaleString('ko-KR')}억 ${remainder.toLocaleString('ko-KR')}만원`;
    } else if (absVal >= 10000) {
      const man = Math.round(absVal / 10000);
      return `${sign}${man.toLocaleString('ko-KR')}만원`;
    }

    return `${sign}${Math.round(absVal).toLocaleString('ko-KR')}원`;
  };

  const handleSaveCurrentConfig = () => {
    const title = saveTitleInput.trim() || `${regionName} (${roomCount}실)`;
    const newConfig = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('ko-KR'),
      title,
      data: {
        regionName,
        roomCount,
        weekdayCount,
        weekdayPrice,
        weekendCount,
        weekendPrice,
        useRent,
        dailyRentCount,
        rentPrice,
        purchasePrice,
        renovationPerRoom,
        elevatorCost,
        otherInitialCost,
        isConsigned,
        expenseType,
        customOtherExpenseFixed,
        expensePercentRate,
        loanRatio,
        interestRate
      },
      summary: {
        totalProjectCost: calculations.totalProjectCost,
        roi100: calculations.scenarios[0].roi,
        monthlyNet100: calculations.scenarios[0].monthlyNetProfit
      }
    };

    const updated = [newConfig, ...savedConfigs];
    setSavedConfigs(updated);
    setSaveTitleInput('');
    try {
      localStorage.setItem('motel_roi_saved_configs_white_v1', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoadConfig = (config) => {
    const d = config.data;
    setRegionName(d.regionName ?? '서울');
    setRoomCount(d.roomCount ?? 30);
    setWeekdayCount(d.weekdayCount ?? 22);
    setWeekdayPrice(d.weekdayPrice ?? 60000);
    setWeekendCount(d.weekendCount ?? 8);
    setWeekendPrice(d.weekendPrice ?? 90000);
    setUseRent(d.useRent ?? true);
    setDailyRentCount(d.dailyRentCount ?? 1.5);
    setRentPrice(d.rentPrice ?? 30000);
    setPurchasePrice(d.purchasePrice ?? 3500000000);
    setRenovationPerRoom(d.renovationPerRoom ?? 15000000);
    setElevatorCost(d.elevatorCost ?? 50000000);
    setOtherInitialCost(d.otherInitialCost ?? 100000000);
    setIsConsigned(d.isConsigned ?? true);
    setExpenseType(d.expenseType ?? 'percent');
    setCustomOtherExpenseFixed(d.customOtherExpenseFixed ?? 4500000);
    setExpensePercentRate(d.expensePercentRate ?? 12);
    setLoanRatio(d.loanRatio ?? 100);
    setInterestRate(d.interestRate ?? 6.0);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteConfig = (id, e) => {
    e.stopPropagation();
    const updated = savedConfigs.filter((c) => c.id !== id);
    setSavedConfigs(updated);
    try {
      localStorage.setItem('motel_roi_saved_configs_white_v1', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyReport = () => {
    const reportText = `
[모텔/숙박시설 수익률 분석 리포트 - ${regionName}]
■ 기본 정보
- 지역: ${regionName} (${roomCount}실)
- 총 사업비: ${formatMoney(calculations.totalProjectCost)} (매입가: ${formatMoney(purchasePrice)}, 공사비: ${formatMoney(calculations.totalRenovationCost)}, 엘리베이터: ${formatMoney(elevatorCost)})

■ 금융 및 운영 경비
- 운영 타입: ${isConsigned ? '위탁 운영' : '직접 운영'}
- 기타 경비 방식: ${expenseType === 'percent' ? `매출의 ${expensePercentRate}%` : '고정금액'}
- 금융 대출 이자: 연 ${interestRate}% (대출 기준금: ${formatMoney(calculations.loanAmount)}, 월 이자: ${formatMoney(calculations.monthlyInterest)})

■ 가동률별 월 순수익 분석
- 100% 가동 시: 월 매출 ${formatMoney(calculations.scenarios[0].totalRevenue)} | 월 순수익 ${formatMoney(calculations.scenarios[0].monthlyNetProfit)} (연 ROI: ${calculations.scenarios[0].roi.toFixed(2)}%)
- 90% 가동 시 : 월 매출 ${formatMoney(calculations.scenarios[1].totalRevenue)} | 월 순수익 ${formatMoney(calculations.scenarios[1].monthlyNetProfit)} (연 ROI: ${calculations.scenarios[1].roi.toFixed(2)}%)
- 85% 가동 시 : 월 매출 ${formatMoney(calculations.scenarios[2].totalRevenue)} | 월 순수익 ${formatMoney(calculations.scenarios[2].monthlyNetProfit)} (연 ROI: ${calculations.scenarios[2].roi.toFixed(2)}%)
    `.trim();

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans pb-16 selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-200">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                스마트 모텔/숙박시설 수익률 계산기
              </h1>
              <p className="text-xs text-slate-500">가동률별 순수익 및 투자 수익률(ROI) 정밀 분석</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
              <button
                onClick={() => setDisplayUnit('KRW')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  displayUnit === 'KRW'
                    ? 'bg-white text-indigo-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                원/억 단위
              </button>
              <button
                onClick={() => setDisplayUnit('10k')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  displayUnit === '10k'
                    ? 'bg-white text-indigo-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                만원 단위
              </button>
            </div>

            <button
              onClick={handleCopyReport}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 rounded-xl border border-slate-200 transition-all active:scale-95 shadow-sm"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
              <span>{copied ? '복사 완료' : '리포트 복사'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: INPUT FORM SECTION (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. 기본 정보 */}
            <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-sm font-bold text-indigo-700 mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" /> 1. 기본 정보
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-600 font-medium mb-1.5">지역명 / 사업장명</label>
                  <input
                    type="text"
                    value={regionName}
                    onChange={(e) => setRegionName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    placeholder="예: 서울 강남구"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 font-medium mb-1.5">객실 수 (실)</label>
                  <input
                    type="number"
                    value={roomCount}
                    onChange={(e) => setRoomCount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </section>

            {/* 2. 월 숙박 매출 입력 */}
            <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-sm font-bold text-indigo-700 mb-4 flex items-center gap-2">
                <BedDouble className="w-4 h-4 text-indigo-600" /> 2. 월 숙박 매출 조건
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" /> 평일 조건
                  </span>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">월 평일 일수 (일)</label>
                    <input
                      type="number"
                      value={weekdayCount}
                      onChange={(e) => setWeekdayCount(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">평일 숙박 객단가 (원)</label>
                    <input
                      type="text"
                      value={formatNumberWithCommas(weekdayPrice)}
                      onChange={(e) => setWeekdayPrice(parseFormattedNumber(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" /> 주말/휴일 조건
                  </span>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">월 주말 일수 (일)</label>
                    <input
                      type="number"
                      value={weekendCount}
                      onChange={(e) => setWeekendCount(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">주말 숙박 객단가 (원)</label>
                    <input
                      type="text"
                      value={formatNumberWithCommas(weekendPrice)}
                      onChange={(e) => setWeekendPrice(parseFormattedNumber(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* 3. 대실 매출 조건 */}
            <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold text-indigo-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" /> 3. 대실 매출 조건
                </h2>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useRent}
                    onChange={(e) => setUseRent(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  <span className="ml-2.5 text-xs font-semibold text-slate-700">
                    {useRent ? '대실 운영' : '대실 미운영'}
                  </span>
                </label>
              </div>

              {useRent && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs text-slate-600 font-medium mb-1.5">
                      대실 수 / 하루 (회)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={dailyRentCount}
                      onChange={(e) => setDailyRentCount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 font-medium mb-1.5">대실 객단가 (원)</label>
                    <input
                      type="text"
                      value={formatNumberWithCommas(rentPrice)}
                      onChange={(e) => setRentPrice(parseFormattedNumber(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              )}
            </section>

            {/* 4. 총 사업비 입력 */}
            <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-sm font-bold text-indigo-700 mb-4 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-indigo-600" /> 4. 총 사업비 (투자금)
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs text-slate-600 font-medium">매입가 (원)</label>
                    <span className="text-xs font-bold text-indigo-600">{formatMoney(purchasePrice)}</span>
                  </div>
                  <input
                    type="text"
                    value={formatNumberWithCommas(purchasePrice)}
                    onChange={(e) => setPurchasePrice(parseFormattedNumber(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-600 font-medium mb-1.5">
                      객실당 공사비 (원)
                    </label>
                    <input
                      type="text"
                      value={formatNumberWithCommas(renovationPerRoom)}
                      onChange={(e) => setRenovationPerRoom(parseFormattedNumber(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      총 공사비: {formatMoney(calculations.totalRenovationCost)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 font-medium mb-1.5">
                      엘리베이터 비용 (원)
                    </label>
                    <input
                      type="text"
                      value={formatNumberWithCommas(elevatorCost)}
                      onChange={(e) => setElevatorCost(parseFormattedNumber(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                      placeholder="0"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      엘리베이터: {formatMoney(calculations.totalElevatorCost)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-600 font-medium mb-1.5">
                    기타 제반 비용 (취등록세 및 초기비용)
                  </label>
                  <input
                    type="text"
                    value={formatNumberWithCommas(otherInitialCost)}
                    onChange={(e) => setOtherInitialCost(parseFormattedNumber(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex justify-between items-center">
                  <span className="text-xs font-semibold text-indigo-900">합계 총 사업비</span>
                  <span className="text-base font-extrabold text-indigo-700">
                    {formatMoney(calculations.totalProjectCost)}
                  </span>
                </div>
              </div>
            </section>

            {/* 5. 운영 방식 및 기타 제반 경비 */}
            <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-sm font-bold text-indigo-700 mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-600" /> 5. 운영 방식 및 기타 제반 경비
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-600 font-medium mb-2">운영 타입 선택</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setIsConsigned(true)}
                      className={`py-3 px-4 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
                        isConsigned
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Users className="w-4 h-4" /> 위탁 운영
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConsigned(false)}
                      className={`py-3 px-4 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
                        !isConsigned
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Briefcase className="w-4 h-4" /> 직접 운영
                    </button>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-700">
                    <span>위탁운영 수수료 ({isConsigned ? `객실당 16.5만원` : '0원'})</span>
                    <span className="font-semibold text-slate-900">{formatMoney(calculations.consignmentFee)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>기본 인건비</span>
                    <span className="font-semibold text-slate-900">{formatMoney(calculations.laborCost)}</span>
                  </div>
                </div>

                {/* 기타 경비 방식 선택 (% vs 고정금액) */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-800">기타 경비 계산 방식</label>
                    <div className="flex bg-slate-200 p-1 rounded-lg text-[11px]">
                      <button
                        type="button"
                        onClick={() => setExpenseType('percent')}
                        className={`px-2.5 py-1 rounded transition-all ${
                          expenseType === 'percent'
                            ? 'bg-white text-indigo-700 font-bold shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        매출 대비 %
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpenseType('fixed')}
                        className={`px-2.5 py-1 rounded transition-all ${
                          expenseType === 'fixed'
                            ? 'bg-white text-indigo-700 font-bold shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        고정 금액
                      </button>
                    </div>
                  </div>

                  {expenseType === 'percent' ? (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs text-slate-600">매출액의 경비 비율 (%)</label>
                        <span className="text-xs text-indigo-700 font-bold">{expensePercentRate}%</span>
                      </div>
                      <input
                        type="number"
                        step="0.5"
                        value={expensePercentRate}
                        onChange={(e) => setExpensePercentRate(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500"
                        placeholder="예: 12"
                      />
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        결제수수료, 수도광열비, 세탁비, 비품, 통신료 등 포괄경비를 매출의 {expensePercentRate}%로 차감합니다.
                      </span>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">월 기타 고정 경비 (원)</label>
                      <input
                        type="text"
                        value={formatNumberWithCommas(customOtherExpenseFixed)}
                        onChange={(e) => setCustomOtherExpenseFixed(parseFormattedNumber(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 6. 금융 비용 */}
            <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-sm font-bold text-indigo-700 mb-4 flex items-center gap-2">
                <Percent className="w-4 h-4 text-indigo-600" /> 6. 금융 비용 (대출 이자)
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-600 font-medium mb-1.5">
                    사업비 대출 비율 (%)
                  </label>
                  <input
                    type="number"
                    value={loanRatio}
                    onChange={(e) => setLoanRatio(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    대출금액: {formatMoney(calculations.loanAmount)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs text-slate-600 font-medium mb-1.5">
                    연 이자율 (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-amber-600 font-bold focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    월 대출 이자: {formatMoney(calculations.monthlyInterest)}
                  </span>
                </div>
              </div>
            </section>

          </div>

          {/* RIGHT: RESULTS & SCENARIO ANALYSIS (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-gradient-to-br from-indigo-50 via-white to-slate-50 p-6 rounded-2xl border border-indigo-200 shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" /> 사업비 및 이자 요약
                </span>
                <span className="text-xs bg-indigo-100 text-indigo-800 border border-indigo-200 px-2.5 py-0.5 rounded-full font-bold">
                  {regionName} ({roomCount}실)
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-baseline border-b border-slate-200 pb-2">
                  <span className="text-xs text-slate-600">총 사업비</span>
                  <span className="text-base font-bold text-slate-900">{formatMoney(calculations.totalProjectCost)}</span>
                </div>
                <div className="flex justify-between items-baseline border-b border-slate-200 pb-2">
                  <span className="text-xs text-slate-600">대출금액 ({loanRatio}%)</span>
                  <span className="text-sm font-bold text-indigo-700">{formatMoney(calculations.loanAmount)}</span>
                </div>
                <div className="flex justify-between items-baseline border-b border-slate-200 pb-2">
                  <span className="text-xs text-slate-600">월 대출 금융이자 (연 {interestRate}%)</span>
                  <span className="text-sm font-bold text-amber-600">{formatMoney(calculations.monthlyInterest)}</span>
                </div>
              </div>
            </div>

            {/* 가동률 시나리오 (100%, 90%, 85%) */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-indigo-600" /> 객실 가동률별 순수익 비교
              </h3>

              {calculations.scenarios.map((sc) => {
                const isPositive = sc.monthlyNetProfit >= 0;

                let badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-300";
                if (sc.rate === 90) badgeStyle = "bg-indigo-50 text-indigo-700 border-indigo-300";
                if (sc.rate === 85) badgeStyle = "bg-amber-50 text-amber-700 border-amber-300";

                return (
                  <div
                    key={sc.rate}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${badgeStyle}`}>
                          가동률 {sc.rate}%
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          월 매출 {formatMoney(sc.totalRevenue)}
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-indigo-700">
                        연 ROI {sc.roi.toFixed(2)}%
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 my-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex justify-between">
                        <span>운영 경비:</span>
                        <span className="text-slate-800 font-medium">{formatMoney(sc.operatingExpense)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>금융 이자 비용:</span>
                        <span className="text-amber-700 font-medium">{formatMoney(sc.monthlyInterest)}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t border-slate-200 pt-1 text-slate-800">
                        <span>월 총 지출:</span>
                        <span className="text-rose-600">{formatMoney(sc.totalMonthlyExpense)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-[11px] text-slate-500 block mb-0.5">월 순수익</span>
                        <span
                          className={`text-base font-extrabold ${
                            isPositive ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {formatMoney(sc.monthlyNetProfit)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-slate-500 block mb-0.5">연 순수익</span>
                        <span
                          className={`text-sm font-bold ${
                            isPositive ? 'text-slate-900' : 'text-rose-600'
                          }`}
                        >
                          {formatMoney(sc.annualNetProfit)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 현재 계산결과 저장 폼 */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Bookmark className="w-4 h-4 text-indigo-600" /> 분석 조건 저장하기
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={saveTitleInput}
                  onChange={(e) => setSaveTitleInput(e.target.value)}
                  placeholder={`기본 이름: ${regionName} (${roomCount}실)`}
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleSaveCurrentConfig}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" /> 저장
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* BOTTOM: 1. 기본정보 저장 목록 */}
        <section className="mt-12 pt-8 border-t border-slate-200 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-indigo-600" /> 1. 기본정보 저장 목록
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                저장된 매물 카드를 클릭하면 설정했던 조건이 상단 계산기에 즉시 복원됩니다.
              </p>
            </div>
            <span className="text-xs font-medium text-slate-500">
              총 {savedConfigs.length}개 저장됨
            </span>
          </div>

          {savedConfigs.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
              저장된 기본 정보가 없습니다. 우측 분석 결과창 하단의 [저장] 버튼을 눌러 조건들을 기록해 보세요.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedConfigs.map((cfg) => (
                <div
                  key={cfg.id}
                  onClick={() => handleLoadConfig(cfg)}
                  className="group bg-white hover:bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-indigo-400 transition-all cursor-pointer shadow-sm hover:shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                        {cfg.title}
                      </h3>
                      <button
                        onClick={(e) => handleDeleteConfig(cfg.id, e)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-xs space-y-1.5 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3">
                      <div className="flex justify-between">
                        <span>지역/객실:</span>
                        <span className="text-slate-900 font-medium">{cfg.data.regionName} / {cfg.data.roomCount}실</span>
                      </div>
                      <div className="flex justify-between">
                        <span>총 사업비:</span>
                        <span className="text-slate-900 font-medium">{formatMoney(cfg.summary.totalProjectCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>100% 가동 월순수익:</span>
                        <span className="text-emerald-600 font-bold">{formatMoney(cfg.summary.monthlyNet100)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span>저장일: {cfg.date}</span>
                    <span className="text-indigo-600 font-semibold group-hover:underline flex items-center gap-0.5">
                      이 정보 불러오기 <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}