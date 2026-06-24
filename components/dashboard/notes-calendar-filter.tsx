"use client";

import { useEffect, useMemo } from "react";
import * as React from "react";
import { eachDayOfInterval, format, isToday, startOfDay } from "date-fns";
import { CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  DayPicker,
  MonthCaption,
  MonthGrid,
  NextMonthButton,
  PreviousMonthButton,
  type MonthProps,
} from "react-day-picker";

import {
  sidebarPanelClassName,
  sidebarPanelPadding,
  sidebarTriggerClassName,
} from "@/components/dashboard/sidebar-panel-styles";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { NoteDTO } from "@/lib/note-types";
import { cn } from "@/lib/utils";

import "react-day-picker/style.css";

const MAX_SELECTED_DATES = 31;

function localDayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth())}-${String(d.getDate())}`;
}

function normalizeSelectedDates(dates: Date[] | undefined): Date[] {
  if (!dates?.length) {
    return [];
  }
  const byKey = new Map<string, Date>();
  for (const d of dates) {
    byKey.set(localDayKey(d), startOfDay(d));
  }
  return [...byKey.values()].sort((a, b) => a.getTime() - b.getTime());
}

export function hasActiveDateFilter(dates: Date[] | undefined): boolean {
  return normalizeSelectedDates(dates).length > 0;
}

export function filterNotesBySelectedDates(
  notes: NoteDTO[],
  dates: Date[] | undefined
): NoteDTO[] {
  const selected = normalizeSelectedDates(dates);
  if (selected.length === 0) {
    return notes;
  }
  const keys = new Set(selected.map(localDayKey));
  return notes.filter((n) => keys.has(localDayKey(new Date(n.createdAt))));
}

function mergeDates(dates: Date[] | undefined, toAdd: Date[]): Date[] {
  const byKey = new Map<string, Date>();
  for (const d of normalizeSelectedDates(dates)) {
    byKey.set(localDayKey(d), d);
  }
  for (const d of toAdd) {
    byKey.set(localDayKey(d), startOfDay(d));
  }
  return [...byKey.values()].sort((a, b) => a.getTime() - b.getTime());
}

function formatDayChip(day: Date): string {
  if (isToday(day)) {
    return "Today";
  }
  return format(day, "MMM d");
}

function formatDatesHighlight(dates: Date[]): string {
  if (dates.length === 0) {
    return "";
  }
  if (dates.length === 1) {
    const d = dates[0]!;
    return isToday(d) ? "today" : format(d, "MMM d, yyyy");
  }
  if (dates.length === 2) {
    return `${formatDayChip(dates[0]!)} and ${formatDayChip(dates[1]!)}`;
  }
  return `${dates.length} dates`;
}

export function formatSelectedDatesLongText(dates: Date[] | undefined): string {
  const selected = normalizeSelectedDates(dates);
  if (selected.length === 0) {
    return "";
  }
  if (selected.length === 1) {
    const d = selected[0]!;
    return isToday(d) ? "today" : format(d, "MMMM d, yyyy");
  }
  if (selected.length <= 3) {
    return selected
      .map((d) => (isToday(d) ? "today" : format(d, "MMMM d, yyyy")))
      .join(", ");
  }
  return `${selected.length} selected dates`;
}

function CalendarFilterStatus({
  selected,
  limitReached,
}: {
  selected: Date[] | undefined;
  limitReached: boolean;
}) {
  const dates = normalizeSelectedDates(selected);
  if (dates.length === 0) {
    return <span>Showing all notes</span>;
  }
  return (
    <>
      Showing notes from{" "}
      <span className="font-medium text-primary">
        {formatDatesHighlight(dates)}
      </span>
      {limitReached ? (
        <span className="text-muted-foreground">
          {" "}
          (max {MAX_SELECTED_DATES})
        </span>
      ) : null}
    </>
  );
}

export function CalendarFilterShortStatus({
  selected,
}: {
  selected: Date[] | undefined;
}) {
  const dates = normalizeSelectedDates(selected);
  if (dates.length === 0) {
    return null;
  }
  return (
    <span className="font-medium text-primary">
      {formatDatesHighlight(dates)}
    </span>
  );
}

function NotesCalendarMonth(props: MonthProps) {
  const { calendarMonth: _calendarMonth, displayIndex: _displayIndex, children, className, ...rest } =
    props;
  const ch = React.Children.toArray(children);

  const prev = ch.find(
    (node): node is React.ReactElement =>
      React.isValidElement(node) && node.type === PreviousMonthButton
  );
  const next = ch.find(
    (node): node is React.ReactElement =>
      React.isValidElement(node) && node.type === NextMonthButton
  );
  const caption = ch.find(
    (node): node is React.ReactElement =>
      React.isValidElement(node) && node.type === MonthCaption
  );
  const grid = ch.find(
    (node): node is React.ReactElement =>
      React.isValidElement(node) && node.type === MonthGrid
  );

  if (caption && grid && (prev || next)) {
    return (
      <div className={cn(className, "w-full")} {...rest}>
        <div className="mb-3 flex h-10 w-full items-center gap-1">
          <div className="flex w-9 shrink-0 justify-start">{prev ?? <span className="w-9" aria-hidden />}</div>
          <div className="flex min-w-0 flex-1 items-center justify-center overflow-hidden">{caption}</div>
          <div className="flex w-9 shrink-0 justify-end">{next ?? <span className="w-9" aria-hidden />}</div>
        </div>
        {grid}
      </div>
    );
  }

  return (
    <div className={className} {...rest}>
      {children}
    </div>
  );
}

export function NotesCalendarFilter({
  notes,
  selected,
  onSelect,
  className,
  embedded = false,
}: {
  notes: NoteDTO[];
  selected: Date[] | undefined;
  onSelect: (dates: Date[] | undefined) => void;
  className?: string;
  embedded?: boolean;
}) {
  const selectedDates = normalizeSelectedDates(selected);
  const selectedKeys = useMemo(
    () => new Set(selectedDates.map(localDayKey)),
    [selectedDates]
  );

  const hasNoteOnDay = useMemo(() => {
    const keys = new Set<string>();
    for (const n of notes) {
      keys.add(localDayKey(new Date(n.createdAt)));
    }
    return (date: Date) => keys.has(localDayKey(date));
  }, [notes]);

  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [month, setMonth] = React.useState<Date>(
    () => selectedDates[0] ?? startOfDay(new Date())
  );
  const [rangeMode, setRangeMode] = React.useState(false);
  const [multipleMode, setMultipleMode] = React.useState(true);
  const [rangeAnchor, setRangeAnchor] = React.useState<Date | null>(null);
  const [limitReached, setLimitReached] = React.useState(false);

  const selectionKey = selectedDates.map(localDayKey).join(",");

  useEffect(() => {
    const dates = normalizeSelectedDates(selected);
    if (dates.length === 0) {
      return;
    }
    setMonth(dates[dates.length - 1]!);
    setCalendarOpen(true);
  }, [selectionKey, selected]);

  useEffect(() => {
    setLimitReached(selectedDates.length >= MAX_SELECTED_DATES);
  }, [selectedDates.length]);

  function setDates(dates: Date[]) {
    onSelect(dates.length > 0 ? dates : undefined);
  }

  function applyDates(next: Date[]) {
    if (next.length > MAX_SELECTED_DATES) {
      setDates(next.slice(0, MAX_SELECTED_DATES));
      setLimitReached(true);
      return;
    }
    setDates(next);
    setLimitReached(false);
  }

  function addDays(toAdd: Date[]) {
    applyDates(mergeDates(selectedDates, toAdd));
  }

  function toggleDay(day: Date) {
    const normalized = startOfDay(day);
    const key = localDayKey(normalized);
    if (selectedKeys.has(key)) {
      applyDates(selectedDates.filter((d) => localDayKey(d) !== key));
      return;
    }
    if (selectedDates.length >= MAX_SELECTED_DATES) {
      setLimitReached(true);
      return;
    }
    addDays([normalized]);
  }

  function handleDayClick(day: Date) {
    const normalized = startOfDay(day);
    const key = localDayKey(normalized);

    if (!rangeMode && !multipleMode) {
      return;
    }

    if (rangeMode && rangeAnchor) {
      const start =
        rangeAnchor.getTime() <= normalized.getTime() ? rangeAnchor : normalized;
      const end =
        rangeAnchor.getTime() <= normalized.getTime() ? normalized : rangeAnchor;
      addDays(eachDayOfInterval({ start, end }));
      setRangeAnchor(null);
      return;
    }

    if (rangeMode && multipleMode) {
      if (selectedKeys.has(key)) {
        toggleDay(normalized);
        return;
      }
      setRangeAnchor(normalized);
      return;
    }

    if (rangeMode) {
      setRangeAnchor(normalized);
      return;
    }

    toggleDay(normalized);
  }

  function clearAll() {
    onSelect(undefined);
    setRangeAnchor(null);
    setLimitReached(false);
    setCalendarOpen(false);
  }

  const filterActive = selectedDates.length > 0;
  const modesActive = rangeMode || multipleMode;
  const rangePending = rangeMode && rangeAnchor !== null;
  const multipleModeLocked = selectedDates.length > 1;

  useEffect(() => {
    if (multipleModeLocked) {
      setMultipleMode(true);
    }
  }, [multipleModeLocked]);

  return (
    <Card
      className={cn(
        sidebarPanelClassName(className, embedded),
        sidebarPanelPadding(calendarOpen)
      )}
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-expanded={calendarOpen}
          aria-controls="notes-calendar-panel"
          onClick={() => setCalendarOpen((open) => !open)}
          className={sidebarTriggerClassName()}
        >
          <CalendarIcon aria-hidden className="size-4 shrink-0 text-primary" />
          <span className="min-w-0 flex-1">Find by date</span>
          <ChevronDown
            aria-hidden
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
              calendarOpen && "rotate-180"
            )}
          />
        </button>
        {filterActive ? (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="h-7 shrink-0 px-2 text-xs"
            onClick={clearAll}
          >
            Clear
          </Button>
        ) : null}
      </div>
      <p className="mt-1.5 truncate text-[11px] text-muted-foreground">
        <CalendarFilterStatus selected={selectedDates} limitReached={limitReached} />
      </p>
      <div
        id="notes-calendar-panel"
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
          calendarOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
        aria-hidden={!calendarOpen}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="notes-calendar w-full pt-3">
            <div className="mb-2 flex flex-wrap gap-1.5">
              <Button
                type="button"
                variant={rangeMode ? "secondary" : "outline"}
                size="xs"
                className="h-7 px-2.5 text-xs"
                aria-pressed={rangeMode}
                onClick={() => {
                  setRangeMode((on) => !on);
                  setRangeAnchor(null);
                }}
              >
                Range
              </Button>
              <Button
                type="button"
                variant={multipleMode ? "secondary" : "outline"}
                size="xs"
                className="h-7 px-2.5 text-xs"
                aria-pressed={multipleMode}
                disabled={multipleModeLocked}
                title={
                  multipleModeLocked
                    ? "Clear down to one date to turn off Multiple"
                    : undefined
                }
                onClick={() => {
                  if (multipleModeLocked) {
                    return;
                  }
                  setMultipleMode((on) => !on);
                }}
              >
                Multiple
              </Button>
            </div>
            <p className="mb-2 text-[11px] leading-snug text-muted-foreground">
              {!modesActive
                ? "Turn on Range, Multiple, or both, then pick dates. Selections add up until you Clear."
                : rangePending
                  ? "Click an end date to add the range."
                  : rangeMode && multipleMode
                    ? "Unselected days start a range; selected days toggle off. One day: click twice."
                    : rangeMode
                      ? "Click a start date, then an end date."
                      : "Click dates to add or remove them."}
            </p>
            <DayPicker
              navLayout="around"
              month={month}
              onMonthChange={setMonth}
              onDayClick={handleDayClick}
              showOutsideDays
              modifiers={{
                inList: (date) => selectedKeys.has(localDayKey(date)),
                rangeAnchor: rangeAnchor ? [rangeAnchor] : [],
                hasNotes: hasNoteOnDay,
              }}
              modifiersClassNames={{
                inList:
                  "[&_button]:bg-primary/15 [&_button]:!text-primary [&_button]:font-semibold [&_button]:hover:bg-primary/20 [&_button]:hover:!text-primary",
                rangeAnchor:
                  "[&_button]:ring-2 [&_button]:ring-primary/50 [&_button]:ring-offset-1",
              }}
              components={{
                Month: NotesCalendarMonth,
                Chevron: ({ className, orientation, ...chevronProps }) => {
                  const iconClass = cn("size-4 shrink-0", className);
                  if (orientation === "left") {
                    return (
                      <ChevronLeft className={iconClass} {...chevronProps} />
                    );
                  }
                  if (orientation === "right") {
                    return (
                      <ChevronRight className={iconClass} {...chevronProps} />
                    );
                  }
                  return (
                    <ChevronDown className={iconClass} {...chevronProps} />
                  );
                },
              }}
              classNames={{
                root: "w-full [--rdp-nav-height:2.5rem]",
                months: "w-full max-w-none",
                month: "w-full",
                month_caption:
                  "!m-0 flex h-10 w-full min-w-0 items-center justify-center border-0 bg-transparent p-0 text-sm font-semibold leading-none text-foreground shadow-none",
                caption_label:
                  "pointer-events-none truncate text-center leading-none",
                button_previous:
                  "relative z-10 flex h-10 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background p-0 text-foreground shadow-sm hover:bg-muted",
                button_next:
                  "relative z-10 flex h-10 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background p-0 text-foreground shadow-sm hover:bg-muted",
                month_grid:
                  "w-full table-fixed border-collapse border-spacing-0",
                weekdays: "",
                weekday:
                  "w-[14.285714%] border-0 p-0 pb-2 text-center text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground",
                weeks: "",
                week: "",
                day: "h-10 p-0 text-center align-middle",
                day_button:
                  "mx-auto flex size-9 max-w-full cursor-pointer items-center justify-center rounded-md text-sm font-semibold tabular-nums hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring",
                today:
                  "[&_button]:font-bold [&_button]:text-primary [&_button]:ring-1 [&_button]:ring-primary/40",
                outside: "text-muted-foreground/55 [&_button]:opacity-80",
                disabled: "opacity-40",
              }}
              modifiersStyles={{
                hasNotes: {
                  backgroundImage:
                    "linear-gradient(var(--primary), var(--primary))",
                  backgroundSize: "40% 2px",
                  backgroundPosition: "center bottom",
                  backgroundRepeat: "no-repeat",
                },
              }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
