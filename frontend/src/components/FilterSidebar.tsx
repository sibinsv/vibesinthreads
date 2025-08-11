'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { Category, ProductFilters } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface FilterSidebarProps {
  categories: Category[];
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const FABRIC_OPTIONS = [
  'Cotton', 'Silk', 'Georgette', 'Chiffon', 'Crepe', 'Velvet', 'Net', 'Satin', 'Brocade'
];

const OCCASION_OPTIONS = [
  'Wedding', 'Festival', 'Party', 'Casual', 'Office', 'Bridal', 'Cocktail', 'Evening'
];

const CRAFT_OPTIONS = [
  'Chikankari', 'Zari Work', 'Embroidery', 'Block Print', 'Mirror Work', 'Thread Work', 'Sequins'
];

const REGION_OPTIONS = [
  'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'Tamil Nadu', 'West Bengal', 'Karnataka', 'Delhi'
];

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function FilterSection({ title, children, defaultOpen = false }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-rose-100 pb-6">
      <button
        className="flex items-center justify-between w-full text-left mb-4"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="font-medium text-gray-900">{title}</h3>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>
      {isOpen && <div className="space-y-3">{children}</div>}
    </div>
  );
}

interface CheckboxFilterProps {
  options: string[];
  selectedValue?: string;
  onChange: (value: string) => void;
}

function CheckboxFilter({ options, selectedValue, onChange }: CheckboxFilterProps) {
  return (
    <div className="space-y-2">
      {options.map((option) => (
        <label key={option} className="flex items-center">
          <input
            type="checkbox"
            checked={selectedValue === option}
            onChange={(e) => onChange(e.target.checked ? option : '')}
            className="rounded border-gray-300 text-rose-600 focus:ring-rose-500"
          />
          <span className="ml-2 text-sm text-gray-700">{option}</span>
        </label>
      ))}
    </div>
  );
}

export default function FilterSidebar({
  categories,
  filters,
  onFiltersChange,
  className,
  isOpen = true,
  onClose
}: FilterSidebarProps) {
  const updateFilter = (key: keyof ProductFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== undefined && v !== '').length;

  return (
    <div className={cn(
      "bg-white border-r border-rose-100",
      "lg:block",
      isOpen ? "block" : "hidden",
      className
    )}>
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-rose-100">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-6">
        {/* Filter Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Filter Products</h2>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-rose-600 hover:text-rose-700"
            >
              Clear All ({activeFiltersCount})
            </Button>
          )}
        </div>

        <div className="space-y-6">
          {/* Categories */}
          <FilterSection title="Categories" defaultOpen={true}>
            <div className="space-y-2">
              {categories.map((category) => (
                <label key={category.id} className="flex items-center">
                  <input
                    type="radio"
                    name="category"
                    checked={filters.category === category.slug}
                    onChange={() => updateFilter('category', 
                      filters.category === category.slug ? '' : category.slug
                    )}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {category.name}
                    {category.productCount !== undefined && (
                      <span className="text-gray-400 ml-1">({category.productCount})</span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Price Range */}
          <FilterSection title="Price Range">
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Min Price (₹)</label>
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice || ''}
                  onChange={(e) => updateFilter('minPrice', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Max Price (₹)</label>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice || ''}
                  onChange={(e) => updateFilter('maxPrice', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>
            </div>
          </FilterSection>

          {/* Fabric */}
          <FilterSection title="Fabric">
            <CheckboxFilter
              options={FABRIC_OPTIONS}
              selectedValue={filters.fabric}
              onChange={(value) => updateFilter('fabric', value)}
            />
          </FilterSection>

          {/* Occasion */}
          <FilterSection title="Occasion">
            <CheckboxFilter
              options={OCCASION_OPTIONS}
              selectedValue={filters.occasion}
              onChange={(value) => updateFilter('occasion', value)}
            />
          </FilterSection>

          {/* Craft Type */}
          <FilterSection title="Craft Type">
            <CheckboxFilter
              options={CRAFT_OPTIONS}
              selectedValue={filters.craftType}
              onChange={(value) => updateFilter('craftType', value)}
            />
          </FilterSection>

          {/* Region */}
          <FilterSection title="Region">
            <CheckboxFilter
              options={REGION_OPTIONS}
              selectedValue={filters.region}
              onChange={(value) => updateFilter('region', value)}
            />
          </FilterSection>
        </div>
      </div>
    </div>
  );
}