import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, CheckCircle, ChevronRight, Activity, Calendar, SkipForward, SkipBack, FastForward, Plus, Minus } from 'lucide-react';
import { routine, audioController } from './WorkoutEngine';
import { Timer } from './components/Timer';
import { Rating } from './components/Rating';
import { saveLog, getLogs, type WorkoutLog } from './services/storage';

type AppState = 'home' | 'workout' | 'finished';
type WorkoutPhase = 'prep' | 'work' | 'rest';

const PREP_TIME = 5;
const DEFAULT_REST_TIME = 30;

function App() {
  const [appState, setAppState] = useState<AppState>('home');
  const [logs, setLogs] = useState<WorkoutLog[]>([]);

  // Workout state
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [phase, setPhase] = useState<WorkoutPhase>('prep');
  const [timeLeft, setTimeLeft] = useState(PREP_TIME);
  const [isPaused, setIsPaused] = useState(false);
  const [completedSets, setCompletedSets] = useState<Record<number, number>>({});
  const [skippedExercises, setSkippedExercises] = useState<Record<number, boolean>>({});
  const [currentSegmentIdx, setCurrentSegmentIdx] = useState(0);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setLogs(getLogs());
  }, [appState]);

  const startWorkout = () => {
    audioController.init();
    setAppState('workout');
    setCurrentExerciseIdx(0);
    setCurrentSet(1);
    setPhase('prep');
    setTimeLeft(PREP_TIME);
    setIsPaused(false);
    setCompletedSets({});
    setSkippedExercises({});
    setCurrentSegmentIdx(0);
  };

  const endWorkout = () => {
    setAppState('finished');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const quitWorkout = () => {
    setAppState('home');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (appState !== 'workout' || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handlePhaseTransition();
          return 0; // Temporarily 0, will be updated by handlePhaseTransition
        }
        
        // Play beep on last 3 seconds
        if (prev <= 4) {
          audioController.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [appState, isPaused, phase, currentExerciseIdx, currentSet]);

  const handlePhaseTransition = () => {
    const exercise = routine[currentExerciseIdx];
    
    if (phase === 'prep') {
      audioController.playStartBell();
      setPhase('work');
      setCurrentSegmentIdx(0);
      if (exercise.segments) {
        setTimeLeft(exercise.segments[0].durationSeconds);
      } else {
        setTimeLeft(exercise.durationSeconds);
      }
    } else if (phase === 'work') {
      if (exercise.segments && currentSegmentIdx < exercise.segments.length - 1) {
        // Advance to next segment
        const nextIdx = currentSegmentIdx + 1;
        setCurrentSegmentIdx(nextIdx);
        audioController.playTick();
        setTimeLeft(exercise.segments[nextIdx].durationSeconds);
      } else {
        // All segments done (or no segments), complete this set
        audioController.playEndBell();
        setCompletedSets(prev => ({ ...prev, [currentExerciseIdx]: (prev[currentExerciseIdx] || 0) + 1 }));
        if (currentSet < exercise.sets) {
          // Next set, rest
          setCurrentSet(s => s + 1);
          setPhase('rest');
          setTimeLeft(DEFAULT_REST_TIME);
        } else {
          // Next exercise
          if (currentExerciseIdx < routine.length - 1) {
            setCurrentExerciseIdx(idx => idx + 1);
            setCurrentSet(1);
            setPhase('rest');
            setTimeLeft(DEFAULT_REST_TIME);
          } else {
            endWorkout();
          }
        }
      }
    } else if (phase === 'rest') {
      setPhase('prep');
      setTimeLeft(PREP_TIME);
    }
  };

  const handleRate = (rating: number) => {
    const exercisesLog = routine.map((ex, idx) => ({
      id: ex.id,
      name: ex.name,
      completedSets: completedSets[idx] || 0,
      totalSets: ex.sets,
      skipped: skippedExercises[idx] || false
    }));
    saveLog(rating, exercisesLog);
    setAppState('home');
  };

  const goPreviousExercise = () => {
    if (currentExerciseIdx > 0) {
      setCurrentExerciseIdx(idx => idx - 1);
      setCurrentSet(1);
      setPhase('prep');
      setTimeLeft(PREP_TIME);
      setIsPaused(false);
      setCompletedSets(prev => ({ ...prev, [currentExerciseIdx - 1]: 0 }));
      setSkippedExercises(prev => ({ ...prev, [currentExerciseIdx - 1]: false }));
    }
  };

  const skipCurrentExercise = () => {
    setSkippedExercises(prev => ({ ...prev, [currentExerciseIdx]: true }));
    if (currentExerciseIdx < routine.length - 1) {
      setCurrentExerciseIdx(idx => idx + 1);
      setCurrentSet(1);
      setPhase('prep');
      setTimeLeft(PREP_TIME);
      setIsPaused(false);
    } else {
      endWorkout();
    }
  };

  const getLogSummaryText = (log: WorkoutLog) => {
    if (!log.exercises) return `${log.rating} ⭐`;
    const skipped = log.exercises.filter(e => e.skipped).map(e => e.name);
    const completed = log.exercises.filter(e => !e.skipped);
    const doneText = completed.map(e => `${e.completedSets}/${e.totalSets} ${e.name}`).join(', ');
    const skipText = skipped.length > 0 ? ` (Skipped: ${skipped.join(', ')})` : '';
    return `${log.rating} ⭐ - ${doneText}${skipText}`;
  };

  const exercise = routine[currentExerciseIdx];
  const currentSegment = exercise.segments?.[currentSegmentIdx];
  const maxTime = phase === 'prep' ? PREP_TIME : phase === 'rest' ? Math.max(DEFAULT_REST_TIME, timeLeft) : currentSegment ? currentSegment.durationSeconds : exercise?.durationSeconds || 1;
  const progress = Math.min(1, timeLeft / maxTime);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {appState === 'home' && (
        <div style={{ padding: '2rem 0' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Activity size={48} color="var(--accent-blue)" style={{ margin: '0 auto 1rem' }} />
            <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Daily Fit</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Your premium workout companion</p>
          </div>

          <div className="glass-panel" style={{ marginBottom: '2rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <ChevronRight color="var(--accent-purple)" />
              Today's Routine
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {routine.map((ex, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--border-radius-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img src={ex.image} alt={ex.name} style={{ width: 40, height: 40, borderRadius: '8px', objectFit: 'cover' }} />
                    <span style={{ fontWeight: 600 }}>{ex.name}</span>
                  </div>
                  <span style={{ color: 'var(--text-secondary)' }}>{ex.sets} × {ex.durationSeconds}s</span>
                </div>
              ))}
            </div>
          </div>

          <button className="btn-primary" onClick={startWorkout}>
            <Play fill="currentColor" />
            Start Workout
          </button>

          {logs.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                <Calendar size={18} /> Recent Sessions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingBottom: '1rem' }}>
                {logs.slice().reverse().map((log, i) => (
                  <div key={i} style={{ background: 'var(--surface-color-light)', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <strong>{new Date(log.date).toLocaleDateString()}</strong>
                    <span style={{ color: 'var(--text-secondary)' }}>{getLogSummaryText(log)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {appState === 'workout' && exercise && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '2rem' }}>
            <button onClick={quitWorkout} style={{ color: 'var(--text-secondary)' }}><Square size={24} /></button>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{currentExerciseIdx + 1} / {routine.length}</span>
            <div style={{ width: 24 }}></div>
          </div>

          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', textAlign: 'center' }}>{exercise.name}</h2>
          {phase === 'work' && currentSegment && (
            <p style={{ color: 'var(--accent-blue)', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              {currentSegment.name}
            </p>
          )}
          <p style={{ color: 'var(--accent-purple)', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>
            Set {currentSet} of {exercise.sets}
          </p>

          <div style={{ position: 'relative', width: 200, height: 200, marginBottom: '2rem', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <img src={exercise.image} alt={exercise.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11, 15, 25, 1), transparent)' }}></div>
          </div>

          <Timer
            progress={progress}
            timeLeft={timeLeft}
            label={phase === 'prep' ? 'Get Ready' : phase === 'rest' ? 'Rest' : currentSegment ? currentSegment.name : 'Hold'}
            color={phase === 'prep' ? 'var(--warning)' : phase === 'rest' ? 'var(--success)' : 'var(--accent-blue)'}
          />

          <div style={{ marginTop: 'auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            {phase === 'rest' && (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn-secondary" onClick={() => setTimeLeft(t => Math.max(0, t - 10))} style={{ padding: '0.75rem', width: 'auto', borderRadius: '50%' }}>
                  <Minus size={24} />
                </button>
                <button className="btn-secondary" onClick={() => setTimeLeft(0)} style={{ padding: '0.75rem 1.5rem', width: 'auto' }}>
                  <SkipForward size={24} /> Skip
                </button>
                <button className="btn-secondary" onClick={() => setTimeLeft(t => t + 10)} style={{ padding: '0.75rem', width: 'auto', borderRadius: '50%' }}>
                  <Plus size={24} />
                </button>
              </div>
            )}
            <div style={{ width: '100%', display: 'flex', gap: '1rem' }}>
              <button className="btn-secondary" onClick={goPreviousExercise} disabled={currentExerciseIdx === 0} style={{ padding: '0.75rem', opacity: currentExerciseIdx === 0 ? 0.5 : 1 }}>
                <SkipBack size={20} />
              </button>
              <button className="btn-secondary" onClick={() => setIsPaused(!isPaused)} style={{ flex: 1 }}>
                {isPaused ? <Play fill="currentColor" /> : <Pause fill="currentColor" />}
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button className="btn-secondary" onClick={skipCurrentExercise} style={{ padding: '0.75rem' }}>
                <FastForward size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {appState === 'finished' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle size={80} color="var(--success)" style={{ marginBottom: '2rem' }} className="animate-slide-up" />
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>Great Job!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', textAlign: 'center' }}>How did this session feel?</p>
          
          <Rating onRate={handleRate} />
        </div>
      )}
    </div>
  );
}

export default App;
