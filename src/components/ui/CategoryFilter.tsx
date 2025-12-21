import React from 'react';
import { Category } from '@/domain/event/event.types';
import { CATEGORY_LIST, CATEGORY_COLORS } from '@/domain/event/event.constants';

interface CategoryFilterProps {
  selectedCategory: Category;
  onSelectCategory: (category: Category) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ selectedCategory, onSelectCategory }) => {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2 sticky top-[60px] z-20 bg-[#F1F2F6]/95 backdrop-blur-sm">
      <div className="flex px-4 space-x-2 min-w-max">
        {CATEGORY_LIST.map((cat) => {
          const isSelected = selectedCategory === cat;
          const baseClasses = "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border whitespace-nowrap";
          
          // Determine styling based on selection state
          let styleClass = "";
          if (isSelected) {
            styleClass = "bg-gray-900 text-white border-gray-900 shadow-md transform scale-105";
          } else {
             // Use lighter versions for unselected
             styleClass = "bg-white text-gray-500 border-gray-200 hover:bg-gray-50";
          }

          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`${baseClasses} ${styleClass}`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryFilter;
