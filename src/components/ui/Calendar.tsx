
import React, { useMemo } from 'react';
import { WEEKDAYS } from '@/domain/event/event.constants';
import { DayInfo, PromotionEvent } from '@/domain/event/event.types';

interface CalendarProps {
  currentDate: Date;
  selectedDate: Date;
  events: PromotionEvent[];
  onDateClick: (date: Date) => void;
  onMonthChange: (increment: number) => void;
  disablePrev?: boolean;
  disableNext?: boolean;
}

const Calendar: React.FC<CalendarProps> = ({ 
  currentDate, 
  selectedDate, 
  events, 
  onDateClick, 
  onMonthChange,
  disablePrev = false,
  disableNext = false
}) => {
  
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Use 12:00 PM to avoid midnight timezone issues
    const firstDayOfMonth = new Date(year, month, 1, 12, 0, 0);
    const lastDayOfMonth = new Date(year, month + 1, 0, 12, 0, 0);
    
    const days: DayInfo[] = [];
    
    // Previous month padding
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)
    for (let i = startDayOfWeek; i > 0; i--) {
      // 12:00 PM
      const d = new Date(year, month, 1 - i, 12, 0, 0);
      days.push({ 
        date: d, 
        isCurrentMonth: false, 
        isToday: false,
        hasEvents: false 
      });
    }

    // Current month days
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      // 12:00 PM
      const d = new Date(year, month, i, 12, 0, 0);
      
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;

      const hasEvents = events.some(e => {
         return dateStr >= e.startDate && dateStr <= e.endDate;
      });

      days.push({ 
        date: d, 
        isCurrentMonth: true, 
        isToday: d.getFullYear() === today.getFullYear() && 
                 d.getMonth() === today.getMonth() && 
                 d.getDate() === today.getDate(),
        hasEvents
      });
    }

    // Next month padding
    const remainingCells = 42 - days.length; // 6 rows * 7 cols = 42
    for (let i = 1; i <= remainingCells; i++) {
      // 12:00 PM
      const d = new Date(year, month + 1, i, 12, 0, 0);
      days.push({ 
        date: d, 
        isCurrentMonth: false, 
        isToday: false,
        hasEvents: false 
      });
    }

    return days;
  }, [currentDate, events]);

  const isSelected = (d: Date) => {
    return d.getFullYear() === selectedDate.getFullYear() &&
           d.getMonth() === selectedDate.getMonth() &&
           d.getDate() === selectedDate.getDate();
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm p-4 mx-4 mt-4 mb-2">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
        </h2>
        <div className="flex space-x-2">
          {/* Prev Button */}
          <button 
            onClick={() => onMonthChange(-1)} 
            disabled={disablePrev}
            aria-disabled={disablePrev}
            className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center
              ${disablePrev 
                ? 'text-gray-200 cursor-not-allowed opacity-20 pointer-events-none bg-transparent' 
                : 'hover:bg-gray-100 text-gray-600 active:bg-gray-200'
              }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          
          <button 
            onClick={() => {
              const now = new Date();
              now.setHours(12, 0, 0, 0);
              onDateClick(now);
            }} 
            className="px-3 py-1 text-xs font-semibold text-primary bg-red-50 rounded-full border border-red-100 hover:bg-red-100 transition-colors"
          >
            오늘
          </button>
          
          {/* Next Button */}
          <button 
            onClick={() => onMonthChange(1)}
            disabled={disableNext}
            aria-disabled={disableNext}
            className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center
              ${disableNext 
                 ? 'text-gray-200 cursor-not-allowed opacity-20 pointer-events-none bg-transparent' 
                 : 'hover:bg-gray-100 text-gray-600 active:bg-gray-200'
              }`}
          >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map((day, idx) => (
          <div key={day} className={`text-center text-xs font-medium ${idx === 0 ? 'text-red-400' : 'text-gray-400'}`}>
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-y-2">
        {calendarDays.map((dayInfo, idx) => {
          const selected = isSelected(dayInfo.date);
          return (
            <div key={idx} className="flex flex-col items-center">
              <button
                onClick={() => onDateClick(dayInfo.date)}
                className={`
                  relative w-10 h-10 flex items-center justify-center rounded-full text-sm transition-all
                  ${!dayInfo.isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                  ${dayInfo.isToday && !selected ? 'bg-red-50 text-red-500 font-bold border border-red-100' : ''}
                  ${selected ? 'bg-gray-900 text-white shadow-md transform scale-105' : 'hover:bg-gray-50'}
                `}
              >
                {dayInfo.date.getDate()}
                {/* Event Dot */}
                {dayInfo.hasEvents && !selected && (
                  <span className="absolute bottom-1 w-1 h-1 bg-red-500 rounded-full"></span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
