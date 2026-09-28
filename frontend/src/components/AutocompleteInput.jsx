import React, { useState, useRef, useEffect } from 'react';
import './AutocompleteInput.css';

function AutocompleteInput({
  name,
  value,
  onChange,
  options = [],
  placeholder = '',
  required = false,
  label = '',
  disabled = false
}) {
  const [inputValue, setInputValue] = useState(value);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value.toUpperCase();
    setInputValue(val);

    // Filter options
    const filtered = options.filter(option =>
      option.toUpperCase().includes(val)
    );
    setFilteredOptions(filtered);
    setShowDropdown(filtered.length > 0);
    setHighlightedIndex(-1);

    // Call parent onChange
    onChange({ target: { name, value: val } });
  };

  const handleOptionClick = (option) => {
    setInputValue(option);
    setShowDropdown(false);
    setHighlightedIndex(-1);
    onChange({ target: { name, value: option } });
    inputRef.current.blur();
  };

  const handleFocus = () => {
    if (inputValue) {
      const filtered = options.filter(option =>
        option.toUpperCase().includes(inputValue.toUpperCase())
      );
      setFilteredOptions(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      setFilteredOptions(options);
      setShowDropdown(options.length > 0);
    }
  };

  const handleKeyDown = (e) => {
    if (!showDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleOptionClick(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  };

  return (
    <div className="autocomplete-wrapper" ref={wrapperRef}>
      {label && (
        <label className="autocomplete-label">
          {label}
          {required && <span className="required-star">*</span>}
        </label>
      )}
      <input
        ref={inputRef}
        type="text"
        name={name}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="autocomplete-input"
        autoComplete="off"
      />
      {showDropdown && filteredOptions.length > 0 && (
        <div className="autocomplete-dropdown">
          {filteredOptions.map((option, index) => (
            <div
              key={option}
              className={`autocomplete-option ${
                index === highlightedIndex ? 'highlighted' : ''
              }`}
              onClick={() => handleOptionClick(option)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AutocompleteInput;
