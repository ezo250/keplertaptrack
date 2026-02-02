import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import Header from '@/components/layout/Header';
import DeleteConfirmModal from '@/components/modals/DeleteConfirmModal';
import PasswordGeneratedModal from '@/components/modals/PasswordGeneratedModal';
import ResetPasswordModal from '@/components/modals/ResetPasswordModal';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Edit2, Trash2, Mail, GraduationCap, Key, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { teachersAPI } from '@/services/api';

export default function TeachersManagement() {
  const { teachers, addTeacher, removeTeacher, updateTeacher } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any | null>(null);
  const [deleteTeacher, setDeleteTeacher] = useState<{ id: string; name: string } | null>(null);
  const [resetPasswordTeacher, setResetPasswordTeacher] = useState<{ id: string; name: string; email: string } | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<{
    teacherName: string;
    email: string;
    password: string;
  } | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    courses: '',
  });

  const filteredTeachers = teachers.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddTeacher = async () => {
    if (!formData.name || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const result = await addTeacher({
        name: formData.name,
        email: formData.email,
        department: formData.department,
        courses: formData.courses.split(',').map(c => c.trim()).filter(Boolean),
      });

      toast.success('Teacher added successfully');
      
      // Show generated password modal
      if (result && result.generatedPassword) {
        setGeneratedPassword({
          teacherName: formData.name,
          email: formData.email,
          password: result.generatedPassword,
        });
      }

      setFormData({ name: '', email: '', department: '', courses: '' });
      setIsAddDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add teacher');
    }
  };

  const handleEditTeacher = async () => {
    if (!editingTeacher || !formData.name || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await updateTeacher(editingTeacher.id, {
        name: formData.name,
        email: formData.email,
        department: formData.department,
        courses: formData.courses.split(',').map(c => c.trim()).filter(Boolean),
      });

      toast.success('Teacher updated successfully');
      setFormData({ name: '', email: '', department: '', courses: '' });
      setEditingTeacher(null);
      setIsEditDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update teacher');
    }
  };

  const openEditDialog = (teacher: any) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name,
      email: teacher.email,
      department: teacher.department || '',
      courses: teacher.courses?.join(', ') || '',
    });
    setIsEditDialogOpen(true);
  };

  const openViewPasswordDialog = (teacher: any) => {
    setResetPasswordTeacher({ id: teacher.id, name: teacher.name, email: teacher.email });
  };

  const handleDeleteTeacher = async () => {
    if (!deleteTeacher) return;

    try {
      await removeTeacher(deleteTeacher.id);
      toast.success('Teacher removed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove teacher');
    }
  };

  const handleResetPassword = async (): Promise<string | null> => {
    if (!resetPasswordTeacher) return null;

    try {
      const result = await teachersAPI.resetPassword(resetPasswordTeacher.id);
      toast.success('Password reset successfully');
      return result.generatedPassword;
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password');
      return null;
    }
  };

  return (
    <div className="min-h-screen">
      <Header 
        title="Teachers Management" 
        subtitle="Add, edit, and manage teacher accounts"
      />
      
      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 justify-between"
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search teachers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (open) {
              // Clear form when opening dialog
              setFormData({ name: '', email: '', department: '', courses: '' });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Teacher
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Teacher</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Prof. James Mugabo"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="e.g., james.mugabo@kepler.edu"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    placeholder="e.g., Computer Science"
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courses">Courses (comma-separated)</Label>
                  <Input
                    id="courses"
                    placeholder="e.g., Programming 101, Data Structures"
                    value={formData.courses}
                    onChange={(e) => setFormData(prev => ({ ...prev, courses: e.target.value }))}
                  />
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm text-muted-foreground">
                  ℹ️ The default password "Teacher@123" will be assigned to this teacher.
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddTeacher}>
                    Add Teacher
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Teachers Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border/50 overflow-hidden"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Courses</TableHead>
                <TableHead className="text-right w-[180px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {filteredTeachers.map((teacher, index) => (
                  <motion.tr
                    key={teacher.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-border/50"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {teacher.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{teacher.name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {teacher.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-sm">
                        <GraduationCap className="w-3.5 h-3.5" />
                        {teacher.department || 'Not specified'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {teacher.courses?.slice(0, 2).map((course, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-secondary/10 text-secondary">
                            {course}
                          </span>
                        ))}
                        {(teacher.courses?.length || 0) > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{(teacher.courses?.length || 0) - 2} more
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => openViewPasswordDialog(teacher)}
                          title="View/Reset Password"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => openEditDialog(teacher)}
                          title="Edit Teacher"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTeacher({ id: teacher.id, name: teacher.name })}
                          title="Delete Teacher"
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
          
          {filteredTeachers.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">No teachers found</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Edit Teacher Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input
                id="edit-name"
                placeholder="e.g., Prof. James Mugabo"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email Address *</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="e.g., james.mugabo@kepler.edu"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-department">Department</Label>
              <Input
                id="edit-department"
                placeholder="e.g., Computer Science"
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-courses">Courses (comma-separated)</Label>
              <Input
                id="edit-courses"
                placeholder="e.g., Programming 101, Data Structures"
                value={formData.courses}
                onChange={(e) => setFormData(prev => ({ ...prev, courses: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditTeacher}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTeacher}
        onClose={() => setDeleteTeacher(null)}
        onConfirm={handleDeleteTeacher}
        title="Delete Teacher"
        description="Are you sure you want to delete this teacher?"
        itemName={deleteTeacher?.name}
      />

      {/* Password Generated Modal */}
      {generatedPassword && (
        <PasswordGeneratedModal
          isOpen={!!generatedPassword}
          onClose={() => setGeneratedPassword(null)}
          teacherName={generatedPassword.teacherName}
          email={generatedPassword.email}
          password={generatedPassword.password}
        />
      )}

      {/* Reset Password Modal */}
      {resetPasswordTeacher && (
        <ResetPasswordModal
          isOpen={!!resetPasswordTeacher}
          onClose={() => setResetPasswordTeacher(null)}
          onConfirm={handleResetPassword}
          teacherName={resetPasswordTeacher.name}
          teacherEmail={resetPasswordTeacher.email}
        />
      )}
    </div>
  );
}
