/**
 * components/VinSearchInput.jsx
 *
 * Reusable controlled form input component for VIN searching.
 * Styled with Cyan & Electric Blue accents matching the video background.
 */

import { useState } from 'react';

export default function VinSearchInput({
  value = '',
  onChange,
  onSubmit,
  placeholder = 'ENTER 17-CHARACTER VIN (E.G. MA3FJEB1S00238456)...',
}) {
  const [validationError, setValidationError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = value ? value.trim() : '';

    if (!trimmed) {
      setValidationError('Please enter a VIN before searching.');
      return;
    }

    setValidationError('');
    if (onSubmit) {
      onSubmit(trimmed);
    }
  };

  const handleInputChange = (e) => {
    if (validationError) {
      setValidationError('');
    }
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-2">
      {/* Visually hidden label for accessibility */}
      <label htmlFor="vin-search-input" className="sr-only">
        Vehicle Identification Number (VIN)
      </label>

      <div className="relative flex items-center shadow-2xl rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-900/90 backdrop-blur-md focus-within:border-cyan-400 focus-within:ring-4 focus-within:ring-cyan-500/30 transition-all">
        {/* Search Icon */}
        <div className="pl-4 text-cyan-400 pointer-events-none">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* VIN Text Input */}
        <input
          id="vin-search-input"
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          autoFocus
          className="w-full py-4 px-3.5 bg-transparent text-white placeholder-slate-400 font-mono text-sm sm:text-base focus:outline-none tracking-wider uppercase font-medium"
        />

        {/* Electric Cyan Submit Button */}
        <button
          type="submit"
          className="m-1.5 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:from-cyan-600 active:to-blue-700 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-cyan-500/25 flex items-center space-x-2 cursor-pointer shrink-0"
        >
          <span>Search</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>

      {/* Inline Validation Error Message */}
      {validationError && (
        <p className="text-xs text-rose-400 pl-2 font-medium flex items-center space-x-1">
          <span>⚠️</span>
          <span>{validationError}</span>
        </p>
      )}
    </form>
  );
}
