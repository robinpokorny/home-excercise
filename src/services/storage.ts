export interface ExerciseLog {
  id: string;
  name: string;
  completedSets: number;
  totalSets: number;
  skipped: boolean;
}

export interface WorkoutLog {
  date: string;
  rating: number;
  exercises?: ExerciseLog[];
}

export const saveLog = (rating: number, exercises: ExerciseLog[]) => {
  const logs = getLogs();
  logs.push({
    date: new Date().toISOString(),
    rating,
    exercises,
  });
  localStorage.setItem('workoutLogs', JSON.stringify(logs));
};

export const getLogs = (): WorkoutLog[] => {
  const data = localStorage.getItem('workoutLogs');
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};
