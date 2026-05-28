"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetch(`/api/parent/notifications`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setNotifications(d.notifications);
      });
  }, []);

  return (
    <div className="p-4 space-y-4">
      <Link href="/parent-portal">
        <button className="border px-4 py-1 rounded">← Back</button>
      </Link>

      <h1 className="text-xl font-bold">Notifications</h1>

      {notifications.map((n: any) => (
        <div key={n._id} className="border p-4 rounded shadow bg-yellow-50">
          <p className="font-bold">{n.title}</p>
          <p>{n.message}</p>
          <p className="text-sm text-gray-600">
            {new Date(n.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
