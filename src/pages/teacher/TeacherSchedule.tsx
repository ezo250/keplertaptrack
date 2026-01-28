import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import Header from '@/components/layout/Header';
import { Calendar, Clock, BookOpen } from 'lucide-react';

export default function TeacherSchedule() {
  const { user } = useAuth();
  const { timetable } = useData();

  const mySchedule = timetable.filter(t => t.teacherId === user?.id);
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;

  const getScheduleByDay = (day: typeof days[number]) => {
    return mySchedule.filter(t => t.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  return (
    <div className="min-h-screen">
      <Header 
        title="My Schedule"
        subtitle="Your weekly class schedule"
      />
      
      <div className="p-6 space-y-6">
        {days.map((day, dayIndex) => {
          const daySchedule = getScheduleByDay(day);
          
          return (
            <motion.div
              key={day}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dayIndex * 0.1 }}
              className="bg-card rounded-xl border border-border/50 overflow-hidden"
            >
              <div className="px-6 py-4 bg-muted/30 border-b border-border/50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{day}</h3>
                  <p className="text-sm text-muted-foreground">
                    {daySchedule.length === 0 
                      ? 'No classes' 
                      : `${daySchedule.length} class${daySchedule.length > 1 ? 'es' : ''}`}
                  </p>
                </div>
              </div>
              
              {daySchedule.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {daySchedule.map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: dayIndex * 0.1 + index * 0.05 }}
                      className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="w-16 text-center">
                        <div className="flex items-center justify-center gap-1 text-sm font-medium text-foreground">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          {entry.startTime}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          to {entry.endTime}
                        </div>
                      </div>
                      
                      <div className="h-12 w-px bg-border" />
                      
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-secondary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{entry.course}</p>
                          <p className="text-sm text-muted-foreground">
                            Don't forget to pick up a device!
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No classes scheduled for this day
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
