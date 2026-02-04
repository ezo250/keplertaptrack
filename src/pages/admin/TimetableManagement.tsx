import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import Header from '@/components/layout/Header';
import DeleteConfirmModal from '@/components/modals/DeleteConfirmModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar, Clock, Plus, Edit2, Trash2, MapPin, GraduationCap, Check, ChevronsUpDown, Search, X, BarChart3, Users, BookOpen, FilterX } from 'lucide-react';
import { toast } from 'sonner';
import { TimetableEntry } from '@/types';
import { cn } from '@/lib/utils';

export default function TimetableManagement() {
  const { timetable, teachers, addTimetableEntry, updateTimetableEntry, removeTimetableEntry } = useData();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<{ id: string; course: string } | null>(null);
  const [openAddTeacherCombo, setOpenAddTeacherCombo] = useState(false);
  const [openEditTeacherCombo, setOpenEditTeacherCombo] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>('all');

  const [formData, setFormData] = useState({
    teacherId: '',
    teacherName: '',
    course: '',
    classroom: '',
    day: '' as 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday' | '',
    startTime: '',
    endTime: '',
  });

  const selectedTeacher = teachers.find(t => t.id === formData.teacherId);
  const teacherCourses = selectedTeacher?.courses || [];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;

  // Filter and search timetable entries
  const filteredTimetable = useMemo(() => {
    let filtered = timetable;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.teacherName.toLowerCase().includes(query) ||
        entry.course.toLowerCase().includes(query) ||
        (entry.classroom && entry.classroom.toLowerCase().includes(query))
      );
    }

    // Filter by selected day
    if (selectedDay !== 'all') {
      filtered = filtered.filter(entry => entry.day === selectedDay);
    }

    return filtered;
  }, [timetable, searchQuery, selectedDay]);

  // Calculate statistics
  const stats = useMemo(() => {
    const uniqueTeachers = new Set(filteredTimetable.map(e => e.teacherId)).size;
    const uniqueCourses = new Set(filteredTimetable.map(e => e.course)).size;
    const totalClasses = filteredTimetable.length;

    return { uniqueTeachers, uniqueCourses, totalClasses };
  }, [filteredTimetable]);

  const getTimetableByDay = (day: typeof days[number]) => {
    return filteredTimetable.filter(t => t.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const handleAddEntry = async () => {
    if (!formData.teacherId || !formData.course || !formData.day || !formData.startTime || !formData.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const selectedTeacher = teachers.find(t => t.id === formData.teacherId);
      if (!selectedTeacher) {
        toast.error('Selected teacher not found');
        return;
      }

      await addTimetableEntry({
        teacherId: formData.teacherId,
        teacherName: selectedTeacher.name,
        course: formData.course,
        classroom: formData.classroom || undefined,
        day: formData.day,
        startTime: formData.startTime,
        endTime: formData.endTime,
      });

      toast.success('Timetable entry added successfully');
      setFormData({
        teacherId: '',
        teacherName: '',
        course: '',
        classroom: '',
        day: '',
        startTime: '',
        endTime: '',
      });
      setIsAddDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add timetable entry');
    }
  };

  const handleEditEntry = async () => {
    if (!editingEntry || !formData.teacherId || !formData.course || !formData.day || !formData.startTime || !formData.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const selectedTeacher = teachers.find(t => t.id === formData.teacherId);
      if (!selectedTeacher) {
        toast.error('Selected teacher not found');
        return;
      }

      await updateTimetableEntry(editingEntry.id, {
        teacherId: formData.teacherId,
        teacherName: selectedTeacher.name,
        course: formData.course,
        classroom: formData.classroom || undefined,
        day: formData.day,
        startTime: formData.startTime,
        endTime: formData.endTime,
      });

      toast.success('Timetable entry updated successfully');
      setFormData({
        teacherId: '',
        teacherName: '',
        course: '',
        classroom: '',
        day: '',
        startTime: '',
        endTime: '',
      });
      setEditingEntry(null);
      setIsEditDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update timetable entry');
    }
  };

  const openEditDialog = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setFormData({
      teacherId: entry.teacherId,
      teacherName: entry.teacherName,
      course: entry.course,
      classroom: entry.classroom || '',
      day: entry.day,
      startTime: entry.startTime,
      endTime: entry.endTime,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteEntry = async () => {
    if (!deleteEntry) return;

    try {
      await removeTimetableEntry(deleteEntry.id);
      toast.success('Timetable entry deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete timetable entry');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDay('all');
  };

  const hasActiveFilters = searchQuery.trim() !== '' || selectedDay !== 'all';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header 
        title="Timetable Management" 
        subtitle="Create and manage class schedules for teachers"
      />
      
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-xl border border-primary/20 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shadow-md">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Classes</p>
                <p className="text-3xl font-bold text-foreground">{stats.totalClasses}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-secondary/10 via-secondary/5 to-transparent rounded-xl border border-secondary/20 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center shadow-md">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Teachers</p>
                <p className="text-3xl font-bold text-foreground">{stats.uniqueTeachers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-accent/10 via-accent/5 to-transparent rounded-xl border border-accent/20 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center shadow-md">
                <BookOpen className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unique Courses</p>
                <p className="text-3xl font-bold text-foreground">{stats.uniqueCourses}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search and Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-border/50 p-6 shadow-lg space-y-4"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
            <div className="flex-1 w-full space-y-2">
              <Label htmlFor="search" className="text-sm font-medium">Search Timetable</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by teacher, course, or classroom..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 h-11 shadow-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="w-full lg:w-48 space-y-2">
              <Label htmlFor="day-filter" className="text-sm font-medium">Filter by Day</Label>
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger id="day-filter" className="h-11 shadow-sm">
                  <SelectValue placeholder="All Days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Days</SelectItem>
                  {days.map(day => (
                    <SelectItem key={day} value={day}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 w-full lg:w-auto">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="flex-1 lg:flex-none gap-2 h-11 shadow-sm"
                >
                  <FilterX className="w-4 h-4" />
                  Clear
                </Button>
              )}
              
              <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                setIsAddDialogOpen(open);
                if (open) {
                  setFormData({
                    teacherId: '',
                    teacherName: '',
                    course: '',
                    classroom: '',
                    day: '',
                    startTime: '',
                    endTime: '',
                  });
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2 h-11 shadow-sm flex-1 lg:flex-none">
                    <Plus className="w-4 h-4" />
                    Add Entry
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Timetable Entry</DialogTitle>
                    <DialogDescription>
                      Create a new class schedule entry
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="teacher">Teacher *</Label>
                      <Popover open={openAddTeacherCombo} onOpenChange={setOpenAddTeacherCombo}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openAddTeacherCombo}
                            className="w-full justify-between"
                          >
                            {formData.teacherId
                              ? teachers.find((teacher) => teacher.id === formData.teacherId)?.name
                              : "Select a teacher"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search teacher..." />
                            <CommandList>
                              <CommandEmpty>No teacher found.</CommandEmpty>
                              <CommandGroup>
                                {teachers.map((teacher) => (
                                  <CommandItem
                                    key={teacher.id}
                                    value={teacher.name}
                                    onSelect={() => {
                                      setFormData(prev => ({ ...prev, teacherId: teacher.id, course: '' }));
                                      setOpenAddTeacherCombo(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        formData.teacherId === teacher.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {teacher.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="course">Course/Subject *</Label>
                      {teacherCourses.length > 0 ? (
                        <Select
                          value={formData.course}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, course: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                          <SelectContent>
                            {teacherCourses.map((course, index) => (
                              <SelectItem key={index} value={course}>
                                {course}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id="course"
                          placeholder="e.g., Programming 101"
                          value={formData.course}
                          onChange={(e) => setFormData(prev => ({ ...prev, course: e.target.value }))}
                        />
                      )}
                      {teacherCourses.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Courses taught by this teacher
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="classroom">Classroom</Label>
                      <Input
                        id="classroom"
                        placeholder="e.g., Room 301, Lab A"
                        value={formData.classroom}
                        onChange={(e) => setFormData(prev => ({ ...prev, classroom: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="day">Day *</Label>
                      <Select
                        value={formData.day}
                        onValueChange={(value: any) => setFormData(prev => ({ ...prev, day: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a day" />
                        </SelectTrigger>
                        <SelectContent>
                          {days.map(day => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startTime">Start Time *</Label>
                        <Input
                          id="startTime"
                          type="time"
                          value={formData.startTime}
                          onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endTime">End Time *</Label>
                        <Input
                          id="endTime"
                          type="time"
                          value={formData.endTime}
                          onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddEntry}>
                        Add Entry
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-border/50">
              <span className="text-xs font-medium text-muted-foreground">Active Filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1 pl-2 pr-1">
                  Search: {searchQuery}
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-1 hover:bg-secondary/20 rounded-sm p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {selectedDay !== 'all' && (
                <Badge variant="secondary" className="gap-1 pl-2 pr-1">
                  Day: {selectedDay}
                  <button
                    onClick={() => setSelectedDay('all')}
                    className="ml-1 hover:bg-secondary/20 rounded-sm p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </motion.div>

        {/* Timetable by Days */}
        {days.map((day, dayIndex) => {
          const daySchedule = getTimetableByDay(day);
          
          // Skip rendering days when a specific day filter is active and it doesn't match
          if (selectedDay !== 'all' && selectedDay !== day) {
            return null;
          }
          
          return (
            <motion.div
              key={day}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dayIndex * 0.05 }}
              className="bg-card rounded-xl border border-border/50 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="px-6 py-4 bg-gradient-to-r from-muted/50 via-muted/30 to-transparent border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center shadow-sm border border-primary/20">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground tracking-tight">{day}</h3>
                    <span className="text-sm text-muted-foreground font-medium">
                      {daySchedule.length} {daySchedule.length === 1 ? 'class' : 'classes'}
                    </span>
                  </div>
                </div>
                {daySchedule.length > 0 && (
                  <Badge variant="outline" className="bg-primary/5 border-primary/30 text-primary font-semibold">
                    {daySchedule.length}
                  </Badge>
                )}
              </div>
              
              {daySchedule.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/20 hover:bg-muted/20">
                        <TableHead className="font-semibold">Time</TableHead>
                        <TableHead className="font-semibold">Course</TableHead>
                        <TableHead className="font-semibold">Teacher</TableHead>
                        <TableHead className="font-semibold">Classroom</TableHead>
                        <TableHead className="text-right font-semibold w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {daySchedule.map((entry, index) => (
                          <motion.tr
                            key={entry.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ delay: index * 0.03 }}
                            className="border-b border-border/30 hover:bg-muted/30 transition-colors group"
                          >
                            <TableCell className="py-4">
                              <div className="flex items-center gap-2.5 text-sm font-medium">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                  <Clock className="w-4 h-4 text-primary" />
                                </div>
                                <span className="text-foreground">{entry.startTime} - {entry.endTime}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                                  <GraduationCap className="w-4 h-4 text-secondary" />
                                </div>
                                <span className="font-semibold text-foreground">{entry.course}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center border border-accent/30 shadow-sm">
                                  <span className="text-xs font-bold text-accent">
                                    {entry.teacherName.split(' ').map(n => n[0]).join('')}
                                  </span>
                                </div>
                                <span className="text-sm font-medium text-foreground">{entry.teacherName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              {entry.classroom ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                  <MapPin className="w-4 h-4" />
                                  {entry.classroom}
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right py-4">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-9 w-9 text-primary hover:text-primary hover:bg-primary/15 transition-all duration-200"
                                  onClick={() => openEditDialog(entry)}
                                  title="Edit Entry"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/15 transition-all duration-200"
                                  onClick={() => setDeleteEntry({ id: entry.id, course: entry.course })}
                                  title="Delete Entry"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground font-medium">No classes scheduled for {day}</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Add a new entry to get started</p>
                </div>
              )}
            </motion.div>
          );
        })}

        {/* No Results State */}
        {hasActiveFilters && filteredTimetable.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-border/50 p-12 text-center shadow-lg"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
              <Search className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No results found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filters
            </p>
            <Button variant="outline" onClick={clearFilters} className="gap-2">
              <FilterX className="w-4 h-4" />
              Clear all filters
            </Button>
          </motion.div>
        )}
      </div>

      {/* Edit Entry Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Timetable Entry</DialogTitle>
            <DialogDescription>
              Update class schedule details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-teacher">Teacher *</Label>
              <Popover open={openEditTeacherCombo} onOpenChange={setOpenEditTeacherCombo}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openEditTeacherCombo}
                    className="w-full justify-between"
                  >
                    {formData.teacherId
                      ? teachers.find((teacher) => teacher.id === formData.teacherId)?.name
                      : "Select a teacher"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search teacher..." />
                    <CommandList>
                      <CommandEmpty>No teacher found.</CommandEmpty>
                      <CommandGroup>
                        {teachers.map((teacher) => (
                          <CommandItem
                            key={teacher.id}
                            value={teacher.name}
                            onSelect={() => {
                              setFormData(prev => ({ ...prev, teacherId: teacher.id, course: '' }));
                              setOpenEditTeacherCombo(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.teacherId === teacher.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {teacher.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-course">Course/Subject *</Label>
              {teacherCourses.length > 0 ? (
                <Select
                  value={formData.course}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, course: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {teacherCourses.map((course, index) => (
                      <SelectItem key={index} value={course}>
                        {course}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="edit-course"
                  placeholder="e.g., Programming 101"
                  value={formData.course}
                  onChange={(e) => setFormData(prev => ({ ...prev, course: e.target.value }))}
                />
              )}
              {teacherCourses.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Courses taught by this teacher
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-classroom">Classroom</Label>
              <Input
                id="edit-classroom"
                placeholder="e.g., Room 301, Lab A"
                value={formData.classroom}
                onChange={(e) => setFormData(prev => ({ ...prev, classroom: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-day">Day *</Label>
              <Select
                value={formData.day}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, day: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a day" />
                </SelectTrigger>
                <SelectContent>
                  {days.map(day => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startTime">Start Time *</Label>
                <Input
                  id="edit-startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endTime">End Time *</Label>
                <Input
                  id="edit-endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditEntry}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteEntry}
        onClose={() => setDeleteEntry(null)}
        onConfirm={handleDeleteEntry}
        title="Delete Timetable Entry"
        description="Are you sure you want to delete this timetable entry?"
        itemName={deleteEntry?.course}
      />
    </div>
  );
}
