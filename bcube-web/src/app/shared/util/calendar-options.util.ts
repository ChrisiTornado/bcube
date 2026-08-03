// @fullcalendar/core@7.x ships a broken (empty) index.d.ts upstream - confirmed across every
// published 7.x release. Falling back to `any` here too until that's fixed upstream; the
// runtime behavior of these options is unaffected and matches FullCalendar's documented API.

/** The FullCalendar options shared by every calendar view in the app (month grid, toolbar,
 *  locale, "more" link rendering). Callers spread this and layer their own event handlers
 *  (dayCellClassNames, dateClick, moreLinkClick, datesSet, validRange) on top. */
export function buildBaseCalendarOptions(plugins: any[], events: any[]): any {
  return {
    plugins,
    initialView: 'dayGridMonth',
    events,
    locale: 'de',
    dayMaxEvents: 2,
    fixedWeekCount: false,
    showNonCurrentDates: true,
    headerToolbar: {
      left: 'title',
      center: '',
      right: 'prev,next'
    },
    weekends: true,
    moreLinkContent: (arg: any) => ({ html: `+${arg.num} Mehr` })
  };
}
