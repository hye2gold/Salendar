import React from 'react';
import { PromotionEvent } from '@/domain/event/event.types';
import { TYPE_BADGE_COLORS, getBrandLogo } from '@/domain/event/event.constants';

interface EventCardProps {
  event: PromotionEvent;
  brandLogos?: Record<string, string>;
}

const EventCard: React.FC<EventCardProps> = ({ event, brandLogos }) => {
  const logoUrl = getBrandLogo(event.brand, brandLogos);

  // Helper to format date as MM.DD for a cleaner look
  // Safely handles both YYYY-MM-DD strings
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parseInt(parts[1])}.${parseInt(parts[2])}`;
    }
    return dateString;
  };

  const isOneDayEvent = event.startDate === event.endDate;
  const badgeBg = TYPE_BADGE_COLORS[event.type] || '#111827';

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 flex items-start gap-4">
      {/* Left: Brand Logo Area */}
      <div className="flex-shrink-0">
        <img 
          src={logoUrl} 
          alt={`${event.brand} logo`} 
          className="w-12 h-12 rounded-full object-cover border border-gray-100 shadow-sm"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>

      {/* Right: Content Area */}
      <div className="flex-grow flex flex-col gap-1.5 min-w-0">
        {/* Top Row: Badge, Brand, Date */}
        <div className="flex items-center justify-between flex-wrap gap-1">
          <div className="flex items-center gap-2 min-w-0">
             <span
              className="flex-shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-md shadow-sm text-white"
              style={{ backgroundColor: badgeBg }}
             >
              {event.type}
            </span>
            <span className="text-xs font-bold text-gray-500 truncate">
              {event.brand}
            </span>
          </div>
           <span className="text-[10px] text-primary font-semibold bg-red-50 px-2 py-0.5 rounded-full whitespace-nowrap">
             {formatDate(event.startDate)}
             {!isOneDayEvent && ` ~ ${formatDate(event.endDate)}`}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-gray-900 leading-snug break-keep">
          {event.title}
        </h3>
      </div>
    </div>
  );
};

export default EventCard;
