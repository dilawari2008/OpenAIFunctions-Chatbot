import { useEffect, useState } from "react";
import axios from "axios";

interface Notification {
  _id: string;
  userType: string;
  message: string;
  urgency: "HIGH" | "MEDIUM" | "LOW";
  destination: {
    type: string;
  };
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface NotificationsResponse {
  data: {
    HIGH: Notification[];
    MEDIUM: Notification[];
    LOW: Notification[];
  };
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getDate()}${getOrdinalSuffix(
    date.getDate()
  )} ${date.toLocaleString("default", { month: "long" })}, ${String(
    date.getHours()
  ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

const getOrdinalSuffix = (day: number) => {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

const Home = () => {
  const [notifications, setNotifications] =
    useState<NotificationsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:3001/api/notifications?userType=ADMIN`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      setNotifications(response.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const renderNotificationBox = (
    notification: Notification,
    bgColor: string
  ) => (
    <div
      key={notification._id}
      className={`${bgColor} p-4 rounded-lg mb-4 text-white relative`}
    >
      <p className="mb-8">{notification.message}</p>
      <p className="absolute bottom-2 right-2 text-sm">
        {formatDate(notification.createdAt)}
      </p>
    </div>
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Notifs</h1>

      {loading ? (
        <p>Loading notifications...</p>
      ) : (
        <div className="flex gap-4">
          {/* LOW priority notifications - left column */}
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-4">Low Priority</h2>
            {(notifications?.data.LOW || [])
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .map((notification) =>
                renderNotificationBox(notification, "bg-green-600")
              )}
          </div>

          {/* MEDIUM priority notifications - center column */}
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-4">Medium Priority</h2>
            {(notifications?.data.MEDIUM || [])
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .map((notification) =>
                renderNotificationBox(notification, "bg-yellow-500")
              )}
          </div>

          {/* HIGH priority notifications - right column */}
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-4">High Priority</h2>
            {(notifications?.data.HIGH || [])
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .map((notification) =>
                renderNotificationBox(notification, "bg-red-600")
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
