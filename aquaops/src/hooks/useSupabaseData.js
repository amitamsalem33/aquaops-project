import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import {
  tasks as mockTasks,
  tickets as mockTickets,
  customers as mockCustomers,
  meterReadings as mockReadings,
  users as mockUsers,
} from "../data/mockData";

// Fetch all rows from a table and extract the data field
async function fetchTable(table) {
  const { data, error } = await supabase.from(table).select("data");
  if (error) {
    console.error(`Error fetching ${table}:`, error);
    return null;
  }
  return data.map((row) => row.data);
}

// Diff two arrays and sync changes to Supabase
async function syncToSupabase(table, prevList, newList) {
  const prevMap = new Map(prevList.map((i) => [i.id, i]));
  const newMap = new Map(newList.map((i) => [i.id, i]));

  const toUpsert = newList.filter((item) => {
    if (!prevMap.has(item.id)) return true; // added
    return JSON.stringify(prevMap.get(item.id)) !== JSON.stringify(item); // changed
  });

  const toDelete = prevList.filter((item) => !newMap.has(item.id));

  if (toUpsert.length > 0) {
    const { error } = await supabase
      .from(table)
      .upsert(toUpsert.map((item) => ({ id: item.id, data: item })));
    if (error) console.error(`Supabase upsert error (${table}):`, error);
  }

  for (const item of toDelete) {
    const { error } = await supabase.from(table).delete().eq("id", item.id);
    if (error) console.error(`Supabase delete error (${table}):`, error);
  }
}

// Create a setter that updates local state AND syncs to Supabase
function makeSupabaseSetter(tableName, setState, getState) {
  return (updater) => {
    setState((prev) => {
      const newList =
        typeof updater === "function" ? updater(prev) : updater;
      // Sync to Supabase in background
      syncToSupabase(tableName, prev, newList);
      return newList;
    });
  };
}

export function useAppData() {
  const [taskList, setTaskListLocal] = useState([]);
  const [ticketList, setTicketListLocal] = useState([]);
  const [customerList, setCustomerListLocal] = useState([]);
  const [readingList, setReadingListLocal] = useState([]);
  const [userList, setUserListLocal] = useState([]);
  const [loading, setLoading] = useState(true);

  const taskListRef = useRef(taskList);
  const ticketListRef = useRef(ticketList);
  const customerListRef = useRef(customerList);
  const readingListRef = useRef(readingList);
  const userListRef = useRef(userList);

  // Keep refs in sync for use inside real-time handlers
  useEffect(() => { taskListRef.current = taskList; }, [taskList]);
  useEffect(() => { ticketListRef.current = ticketList; }, [ticketList]);
  useEffect(() => { customerListRef.current = customerList; }, [customerList]);
  useEffect(() => { readingListRef.current = readingList; }, [readingList]);
  useEffect(() => { userListRef.current = userList; }, [userList]);

  // Initial data fetch
  useEffect(() => {
    async function loadAll() {
      const [tasks, tickets, customers, readings, users] = await Promise.all([
        fetchTable("tasks"),
        fetchTable("tickets"),
        fetchTable("customers"),
        fetchTable("meter_readings"),
        fetchTable("users"),
      ]);

      setTaskListLocal(tasks || mockTasks);
      setTicketListLocal(tickets || mockTickets);
      setCustomerListLocal(customers || mockCustomers);
      setReadingListLocal(readings || mockReadings);
      setUserListLocal(users || mockUsers);
      setLoading(false);
    }
    loadAll();
  }, []);

  // Real-time subscriptions - every change from any device updates instantly
  useEffect(() => {
    const channel = supabase
      .channel("aquaops-realtime")
      // Tasks
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "tasks" }, (payload) => {
        setTaskListLocal((prev) =>
          prev.map((t) => (t.id === payload.new.id ? payload.new.data : t))
        );
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "tasks" }, (payload) => {
        setTaskListLocal((prev) => {
          if (prev.find((t) => t.id === payload.new.id)) return prev;
          return [...prev, payload.new.data];
        });
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "tasks" }, (payload) => {
        setTaskListLocal((prev) => prev.filter((t) => t.id !== payload.old.id));
      })
      // Tickets
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "tickets" }, (payload) => {
        setTicketListLocal((prev) =>
          prev.map((t) => (t.id === payload.new.id ? payload.new.data : t))
        );
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "tickets" }, (payload) => {
        setTicketListLocal((prev) => {
          if (prev.find((t) => t.id === payload.new.id)) return prev;
          return [...prev, payload.new.data];
        });
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "tickets" }, (payload) => {
        setTicketListLocal((prev) => prev.filter((t) => t.id !== payload.old.id));
      })
      // Customers
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "customers" }, (payload) => {
        setCustomerListLocal((prev) =>
          prev.map((c) => (c.id === payload.new.id ? payload.new.data : c))
        );
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "customers" }, (payload) => {
        setCustomerListLocal((prev) => {
          if (prev.find((c) => c.id === payload.new.id)) return prev;
          return [...prev, payload.new.data];
        });
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "customers" }, (payload) => {
        setCustomerListLocal((prev) => prev.filter((c) => c.id !== payload.old.id));
      })
      // Meter readings
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "meter_readings" }, (payload) => {
        setReadingListLocal((prev) =>
          prev.map((r) => (r.id === payload.new.id ? payload.new.data : r))
        );
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "meter_readings" }, (payload) => {
        setReadingListLocal((prev) => {
          if (prev.find((r) => r.id === payload.new.id)) return prev;
          return [...prev, payload.new.data];
        });
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "meter_readings" }, (payload) => {
        setReadingListLocal((prev) => prev.filter((r) => r.id !== payload.old.id));
      })
      // Users
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "users" }, (payload) => {
        setUserListLocal((prev) =>
          prev.map((u) => (u.id === payload.new.id ? payload.new.data : u))
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const setTaskList = makeSupabaseSetter("tasks", setTaskListLocal, () => taskListRef.current);
  const setTicketList = makeSupabaseSetter("tickets", setTicketListLocal, () => ticketListRef.current);
  const setCustomerList = makeSupabaseSetter("customers", setCustomerListLocal, () => customerListRef.current);
  const setReadingList = makeSupabaseSetter("meter_readings", setReadingListLocal, () => readingListRef.current);
  const setUserList = makeSupabaseSetter("users", setUserListLocal, () => userListRef.current);

  return {
    taskList, setTaskList,
    ticketList, setTicketList,
    customerList, setCustomerList,
    readingList, setReadingList,
    userList, setUserList,
    loading,
  };
}
