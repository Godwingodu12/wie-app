const formattedDateRange = (eventData) => {
  const dateStringFormatter = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });

  if (!eventData) {
    return {
      dateText: "Date TBA",
      timeText: "N/A",
      event_start_date: "N/A",
      event_end_date: "N/A",
      booking_start_date: "N/A",
      booking_end_date: "N/A",
    };
  }

  const hasEventDates = eventData?.event_dates?.length > 0;

  if (!hasEventDates) {
    const bookingStartDate = eventData.booking_start_date
      ? dateStringFormatter(eventData.booking_start_date)
      : "N/A";
    const bookingEndDate = eventData.booking_end_date
      ? dateStringFormatter(eventData.booking_end_date)
      : "N/A";

    return {
      dateText: "Date TBA",
      timeText: "N/A",
      event_start_date: "N/A",
      event_end_date: "N/A",
      booking_start_date: bookingStartDate,
      booking_end_date: bookingEndDate,
    };
  }

  const firstEventDateEntry = eventData.event_dates[0];
  const lastEventDateEntry =
    eventData.event_dates[eventData.event_dates.length - 1];

  const eventFirstDate = new Date(firstEventDateEntry.start_date);
  const eventEndDate = lastEventDateEntry.end_date
    ? new Date(lastEventDateEntry.end_date)
    : eventFirstDate;

  const startTime = firstEventDateEntry.start_time
    ? new Date(
        `1970-01-01T${firstEventDateEntry.start_time}`
      ).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      })
    : eventData.gate_open_time || "N/A";

  const eventStartDateString = dateStringFormatter(eventFirstDate);
  const isSingleDayEvent =
    eventFirstDate.toDateString() === eventEndDate.toDateString();
  const eventEndDateString = isSingleDayEvent
    ? "" 
    : dateStringFormatter(eventEndDate);

  const bookingStartDateString = eventData.booking_start_date
    ? dateStringFormatter(eventData.booking_start_date)
    : eventStartDateString;

  const bookingEndDateString = eventData.booking_end_date
    ? dateStringFormatter(eventData.booking_end_date)
    : eventEndDateString;

  const displayDateText =
    eventFirstDate.toDateString() === eventEndDate.toDateString()
      ? eventStartDateString
      : `${eventFirstDate.toLocaleDateString("en-US", {
          day: "2-digit",
          month: "short",
        })} – ${eventEndDateString}`;

  return {
    dateText: displayDateText,
    timeText: startTime,
    event_start_date: eventStartDateString,
    event_end_date: eventEndDateString,
    booking_start_date: bookingStartDateString,
    booking_end_date: bookingEndDateString,
  };
};
export default formattedDateRange;
