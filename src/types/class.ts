export type StatusType = "AKTIF" | "EMPTY" | "UNCERTAIN";

export type Status = {
  label: StatusType;
  color: string;
  text: string;
  light: string;
};

export type ClassData = {
  id: string;
  name: string;
  wing: string;
  level: string;
  students: number;
  temp: number;
  pir: boolean;
  lastActivity: string;
};