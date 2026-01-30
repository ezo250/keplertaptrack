import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar, TrendingUp, Tablet, BarChart3 } from 'lucide-react';
import { TimetableEntry } from '@/types';
import { format, startOfWeek, endOfWeek, addWeeks, startOfDay, parseISO } from 'date-fns';

interface DeviceStatisticsCardsProps {
  timetable: TimetableEntry[];
}

export default function DeviceStatisticsCards({ timetable }: DeviceStatisticsCardsProps) {
  const [viewPeriod, setViewPeriod] = useState<'daily' | 'weekly' | 'semester'>('daily');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Calculate daily statistics
  const dailyStats = useMemo(() => {
    const date = parseISO(selectedDate);
    const dayName = format(date, 'EEEE') as 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
    
    const daySchedule = timetable.filter(entry => entry.day === dayName);
    
    // Group by teacher to count unique classes
    const teacherClasses = new Map<string, Set<string>>();
    daySchedule.forEach(entry => {
      if (!teacherClasses.has(entry.teacherId)) {
        teacherClasses.set(entry.teacherId, new Set());
      }
      teacherClasses.get(entry.teacherId)?.add(entry.course);
    });

    const breakdown = Array.from(teacherClasses.entries()).map(([teacherId, courses]) => {
      const entry = daySchedule.find(e => e.teacherId === teacherId);
      return {
        teacherId,
        teacherName: entry?.teacherName || 'Unknown',
        courses: Array.from(courses),
        devicesNeeded: courses.size,
      };
    });

    return {
      date: format(date, 'MMMM dd, yyyy'),
      dayName,
      totalDevices: breakdown.reduce((sum, item) => sum + item.devicesNeeded, 0),
      totalClasses: daySchedule.length,
      breakdown,
    };
  }, [timetable, selectedDate]);

  // Calculate weekly statistics
  const weeklyStats = useMemo(() => {
    const date = parseISO(selectedDate);
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 });

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
    const dailyBreakdown = days.map(day => {
      const daySchedule = timetable.filter(entry => entry.day === day);
      
      // Count unique teachers per day
      const uniqueTeachers = new Set(daySchedule.map(e => e.teacherId));
      
      return {
        day,
        devicesNeeded: uniqueTeachers.size,
        classCount: daySchedule.length,
      };
    });

    const totalDevices = Math.max(...dailyBreakdown.map(d => d.devicesNeeded));
    const avgDevices = Math.ceil(
      dailyBreakdown.reduce((sum, d) => sum + d.devicesNeeded, 0) / dailyBreakdown.length
    );

    return {
      weekStart: format(weekStart, 'MMM dd, yyyy'),
      weekEnd: format(weekEnd, 'MMM dd, yyyy'),
      totalDevices,
      avgDevices,
      dailyBreakdown,
    };
  }, [timetable, selectedDate]);

  // Calculate semester statistics
  const semesterStats = useMemo(() => {
    // Assume semester is 16 weeks
    const semesterWeeks = 16;
    const date = parseISO(selectedDate);
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });

    const weeklyBreakdown = Array.from({ length: semesterWeeks }, (_, i) => {
      const currentWeek = addWeeks(weekStart, i);
      
      // Find max devices needed in any day of this week
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
      const maxDevicesInWeek = Math.max(
        ...days.map(day => {
          const daySchedule = timetable.filter(entry => entry.day === day);
          return new Set(daySchedule.map(e => e.teacherId)).size;
        })
      );

      return {
        week: i + 1,
        weekStart: format(currentWeek, 'MMM dd'),
        devicesNeeded: maxDevicesInWeek,
      };
    });

    const totalDevices = Math.max(...weeklyBreakdown.map(w => w.devicesNeeded));
    const avgDevices = Math.ceil(
      weeklyBreakdown.reduce((sum, w) => sum + w.devicesNeeded, 0) / weeklyBreakdown.length
    );

    return {
      semesterName: 'Fall 2026',
      startDate: format(weekStart, 'MMM dd, yyyy'),
      endDate: format(addWeeks(weekStart, semesterWeeks - 1), 'MMM dd, yyyy'),
      totalDevices,
      avgDevices,
      weeklyBreakdown,
    };
  }, [timetable, selectedDate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-heading font-semibold text-foreground">Device Planning</h2>
            <p className="text-sm text-muted-foreground">
              Estimate device requirements based on timetable
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Select value={viewPeriod} onValueChange={(value: any) => setViewPeriod(value)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily View</SelectItem>
              <SelectItem value="weekly">Weekly View</SelectItem>
              <SelectItem value="semester">Semester View</SelectItem>
            </SelectContent>
          </Select>
          {(viewPeriod === 'daily' || viewPeriod === 'weekly') && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-border rounded-md text-sm"
            />
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      {viewPeriod === 'daily' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Daily Summary</CardTitle>
              <CardDescription>{dailyStats.date}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Devices Needed</p>
                  <p className="text-3xl font-bold text-primary">{dailyStats.totalDevices}</p>
                </div>
                <Tablet className="w-8 h-8 text-primary/50" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Day</span>
                  <span className="font-medium">{dailyStats.dayName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Classes</span>
                  <span className="font-medium">{dailyStats.totalClasses}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Teachers</span>
                  <span className="font-medium">{dailyStats.breakdown.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Breakdown Table */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Teacher Breakdown</CardTitle>
              <CardDescription>Device requirements per teacher</CardDescription>
            </CardHeader>
            <CardContent>
              {dailyStats.breakdown.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Courses</TableHead>
                      <TableHead className="text-right">Devices</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyStats.breakdown.map((item) => (
                      <TableRow key={item.teacherId}>
                        <TableCell className="font-medium">{item.teacherName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.courses.join(', ')}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {item.devicesNeeded}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No classes scheduled for this day
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {viewPeriod === 'weekly' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Weekly Summary</CardTitle>
              <CardDescription>
                {weeklyStats.weekStart} - {weeklyStats.weekEnd}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Peak Devices</p>
                  <p className="text-3xl font-bold text-primary">{weeklyStats.totalDevices}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary/50" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Average/Day</span>
                  <span className="font-medium">{weeklyStats.avgDevices}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Recommendation</span>
                  <span className="font-medium text-primary">
                    Stock {weeklyStats.totalDevices} devices
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Breakdown */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Daily Breakdown</CardTitle>
              <CardDescription>Devices needed per day</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day</TableHead>
                    <TableHead>Classes</TableHead>
                    <TableHead className="text-right">Devices Needed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weeklyStats.dailyBreakdown.map((item) => (
                    <TableRow key={item.day}>
                      <TableCell className="font-medium">{item.day}</TableCell>
                      <TableCell className="text-muted-foreground">{item.classCount}</TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                          {item.devicesNeeded}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {viewPeriod === 'semester' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Semester Summary</CardTitle>
              <CardDescription>
                {semesterStats.startDate} - {semesterStats.endDate}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Peak Devices</p>
                  <p className="text-3xl font-bold text-primary">{semesterStats.totalDevices}</p>
                </div>
                <Calendar className="w-8 h-8 text-primary/50" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Average/Week</span>
                  <span className="font-medium">{semesterStats.avgDevices}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">16 weeks</span>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium text-primary">
                    Procurement Recommendation: Order {semesterStats.totalDevices} devices
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Breakdown */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Weekly Breakdown</CardTitle>
              <CardDescription>Device requirements throughout semester</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Week</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Devices Needed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {semesterStats.weeklyBreakdown.map((item) => (
                      <TableRow key={item.week}>
                        <TableCell className="font-medium">Week {item.week}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.weekStart}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {item.devicesNeeded}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Info Note */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <p className="text-sm text-foreground">
            <strong>Note:</strong> These statistics are calculated based on the current timetable.
            The system estimates one device per teacher per class session. Update your timetable
            regularly to ensure accurate device planning and procurement.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
