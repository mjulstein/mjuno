// Types.ts - Type definitions for the application

/**
 * Represents a single item in a day's todo list
 */
export interface DayItem {
  id: string;
  text: string;
}

/**
 * Represents a day's data including date, name, and todo items
 */
export interface DayData {
  date: string;
  dayName: string;
  items: DayItem[];
  isToday: boolean;
}