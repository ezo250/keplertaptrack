import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import Header from '@/components/layout/Header';
import DeleteConfirmModal from '@/components/modals/DeleteConfirmModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
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
import { Calendar, Clock, Plus, Edit2, Trash2, MapPin, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { TimetableEntry } from '@/types';

export default function TimetableManagement() {
  const { timetable, teachers, addTimetableEntry, updateTimetableEntry, removeTimetableEntry } = useData();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<{ id: string; course: string } | null>(null);

  const [formData, setFormData] = useState({
    teacherId: '',
    teacherName: '',
    course: '',
    classroom: '',
    day: '' as 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | '',
    startTime: '',
    endTime: '',
  });

  const selectedTeacher = teachers.find(t => t.id === formData.teacherId);
  const teacherCourses = selectedTeacher?.courses || [];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;

  const getTimetableByDay = (day: typeof days[number]) => {
    return timetable.filter(t => t.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
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

  return (
    <div className="min-h-screen">
      <Header 
        title="Timetable Management" 
        subtitle="Create and manage class schedules for teachers"
      />
      
      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end"
        >
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
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Timetable Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Timetable Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="teacher">Teacher *</Label>
                  <Select
                    value={formData.teacherId}
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, teacherId: value, course: '' }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map(teacher => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
        </motion.div>

        {/* Timetable by Days */}
        {days.map((day, dayIndex) => {
          const daySchedule = getTimetableByDay(day);
          
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
                <h3 className="text-lg font-semibold text-foreground">{day}</h3>
                <span className="text-sm text-muted-foreground">
                  {daySchedule.length} {daySchedule.length === 1 ? 'class' : 'classes'}
                </span>
              </div>
              
              {daySchedule.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Classroom</TableHead>
                      <TableHead className="text-right w-[120px]">Actions</TableHead>
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
                          transition={{ delay: dayIndex * 0.1 + index * 0.05 }}
                          className="border-b border-border/50"
                        >
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              {entry.startTime} - {entry.endTime}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <GraduationCap className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium text-foreground">{entry.course}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                                <span className="text-xs font-semibold text-secondary">
                                  {entry.teacherName.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <span className="text-sm">{entry.teacherName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {entry.classroom ? (
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <MapPin className="w-3.5 h-3.5" />
                                {entry.classroom}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                onClick={() => openEditDialog(entry)}
                                title="Edit Entry"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
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
              ) : (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">No classes scheduled for {day}</p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Edit Entry Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Timetable Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-teacher">Teacher *</Label>
              <Select
                value={formData.teacherId}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, teacherId: value, course: '' }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
