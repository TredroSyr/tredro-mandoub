/** Maps a notification's event_key to the screen it should open (backend §7). Rep app has no per-item detail routes, so this always lands on the relevant list. */
export const resolveNotificationUrl = (
  eventKey: string | undefined,
): string => {
  switch (eventKey) {
    case "stock_transfer.requested":
    case "stock_transfer.dispatched":
    case "stock_transfer.modified":
    case "stock_transfer.confirmed":
    case "stock_transfer.received":
    case "stock_transfer.cancelled":
      return "/my-orders";
    case "customer_request.created":
    case "customer_request.accepted":
    case "customer_request.rejected":
      return "/orders";
    default:
      return "/notifications";
  }
};
