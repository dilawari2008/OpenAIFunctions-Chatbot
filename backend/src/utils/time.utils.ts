import moment from "moment-timezone";

export const getStartOfDayInUTC = (date: Date) => {
  return moment(date).utc().startOf('day').toDate();
};

export const getEndOfDayInUTC = (date: Date) => {
  return moment(date).utc().endOf('day').toDate();
};



