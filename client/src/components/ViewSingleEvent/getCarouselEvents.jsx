const getCarouselEvents = (eventData, formatImagePath) => {
  if (
    !eventData ||
    eventData.event_date_type !== "multi-day" ||
    !eventData.sub_events?.length
  ) {
    return [];
  }

  return eventData.sub_events
    .map((subEvent) => {
      const subEventPrimaryDateObj = subEvent.event_dates?.[0];

      let formattedDate = "No Date";
      if (subEventPrimaryDateObj?.start_date) {
        const dateParts = subEventPrimaryDateObj.start_date
          .split("T")[0]
          .split("-");
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const day = parseInt(dateParts[2], 10);

        const date = new Date(year, month, day);

        formattedDate = date
          .toLocaleDateString("en-US", { day: "2-digit", month: "short" })
          .toUpperCase();
      }

      const bannerPath = subEvent?.event_banner || subEvent?.event_logo;

      return {
        date: formattedDate,
        name: subEvent?.event_name || "TBD Event",
        logo: bannerPath ? formatImagePath(bannerPath) : "",
      };
    })
    .filter(
      (event) =>
        event.name && event.name !== "TBD Event" && event.date !== "No Date"
    );
};
export default getCarouselEvents;