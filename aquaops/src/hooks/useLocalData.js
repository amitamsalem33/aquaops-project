import { useState } from "react";
import {
  tasks as initialTasks,
  tickets as initialTickets,
  customers as initialCustomers,
  meterReadings as initialMeterReadings,
  users as initialUsers,
} from "../data/mockData";

const DATA_VERSION = "v3";

function usePersistedState(key, initialValue) {
  const [state, setState] = useState(() => {
    const versionKey = `${key}_ver`;
    if (localStorage.getItem(versionKey) !== DATA_VERSION) {
      localStorage.removeItem(key);
      localStorage.setItem(versionKey, DATA_VERSION);
      return initialValue;
    }
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : initialValue;
  });

  function setAndPersist(value) {
    setState(prev => {
      const next = typeof value === "function" ? value(prev) : value;
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }

  return [state, setAndPersist];
}

export function useAppData() {
  const [taskList, setTaskList] = usePersistedState("aquaops_tasks", initialTasks);
  const [ticketList, setTicketList] = usePersistedState("aquaops_tickets", initialTickets);
  const [customerList, setCustomerList] = usePersistedState("aquaops_customers", initialCustomers);
  const [readingList, setReadingList] = usePersistedState("aquaops_readings", initialMeterReadings);
  const [userList, setUserList] = usePersistedState("aquaops_users", initialUsers);

  return {
    taskList, setTaskList,
    ticketList, setTicketList,
    customerList, setCustomerList,
    readingList, setReadingList,
    userList, setUserList,
  };
}
