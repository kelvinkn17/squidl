import { useEffect, useCallback } from "react";

class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(eventId, listener) {
    if (!this.events[eventId]) {
      this.events[eventId] = [];
    }
    this.events[eventId].push(listener);
  }

  emit(eventId, data) {
    if (this.events[eventId]) {
      this.events[eventId].forEach((listener) => listener(data));
    }
  }

  off(eventId, listener) {
    if (this.events[eventId]) {
      this.events[eventId] = this.events[eventId].filter((l) => l !== listener);
    }
  }
}

const eventEmitter = new EventEmitter();

export const useEmitEvent = (eventId) => {
  return useCallback(
    (data) => {
      eventEmitter.emit(eventId, data);
    },
    [eventId]
  );
};

export const useListenEvent = (eventId, callback) => {
  useEffect(() => {
    eventEmitter.on(eventId, callback);
    return () => {
      eventEmitter.off(eventId, callback);
    };
  }, [eventId, callback]);
};
