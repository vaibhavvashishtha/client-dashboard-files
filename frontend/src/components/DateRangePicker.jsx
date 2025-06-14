import React, { useState } from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function DateRangePicker({ startDate, endDate, setStartDate, setEndDate }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">
            Start Date
          </label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CalendarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="date"
              name="start-date"
              id="start-date"
              className="block w-full rounded-md border-gray-300 pl-10 py-2 pr-2 sm:text-sm focus:border-primary-500 focus:ring-primary-500"
              value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
              onChange={(e) => setStartDate(new Date(e.target.value))}
              min="2000-01-01"
              max="2099-12-31"
            />
          </div>
        </div>

        <div>
          <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">
            End Date
          </label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CalendarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="date"
              name="end-date"
              id="end-date"
              className="block w-full rounded-md border-gray-300 pl-10 py-2 pr-2 sm:text-sm focus:border-primary-500 focus:ring-primary-500"
              value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
              onChange={(e) => setEndDate(new Date(e.target.value))}
              min="2000-01-01"
              max="2099-12-31"
            />
          </div>
        </div>
      </div>
    </div>
  );
}