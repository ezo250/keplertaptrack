import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Upload, FileText, CheckCircle, XCircle, Download } from 'lucide-react';
import { toast } from 'sonner';
import { TimetableEntry } from '@/types';

interface ParsedTimetableEntry {
  teacherId?: string;
  teacherName: string;
  course: string;
  classroom?: string;
  day: string;
  startTime: string;
  endTime: string;
  isValid: boolean;
  errors: string[];
}

interface TimetableUploadProps {
  teachers: Array<{ id: string; name: string }>;
  onUploadComplete?: (entries: ParsedTimetableEntry[]) => Promise<void>;
}

export default function TimetableUpload({ teachers, onUploadComplete }: TimetableUploadProps) {
  const [parsedData, setParsedData] = useState<ParsedTimetableEntry[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const validateEntry = (entry: any): ParsedTimetableEntry => {
    const errors: string[] = [];
    let isValid = true;

    // Validate teacher name
    if (!entry.teacherName && !entry.teacher) {
      errors.push('Teacher name is required');
      isValid = false;
    }

    // Validate course
    if (!entry.course && !entry.subject) {
      errors.push('Course/Subject is required');
      isValid = false;
    }

    // Validate day
    const dayValue = entry.day?.toString().trim();
    if (!dayValue || !days.some(d => d.toLowerCase() === dayValue.toLowerCase())) {
      errors.push('Valid day is required (Monday-Friday)');
      isValid = false;
    }

    // Validate times
    if (!entry.startTime) {
      errors.push('Start time is required');
      isValid = false;
    }
    if (!entry.endTime) {
      errors.push('End time is required');
      isValid = false;
    }

    // Match teacher from list
    const teacherName = entry.teacherName || entry.teacher || '';
    const matchedTeacher = teachers.find(t => 
      t.name.toLowerCase() === teacherName.toLowerCase()
    );

    if (!matchedTeacher && teacherName) {
      errors.push('Teacher not found in system');
      isValid = false;
    }

    return {
      teacherId: matchedTeacher?.id,
      teacherName: teacherName,
      course: entry.course || entry.subject || '',
      classroom: entry.classroom || entry.room || '',
      day: dayValue ? dayValue.charAt(0).toUpperCase() + dayValue.slice(1).toLowerCase() : '',
      startTime: entry.startTime || '',
      endTime: entry.endTime || '',
      isValid,
      errors,
    };
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validated = results.data.map(validateEntry);
        setParsedData(validated);
        
        const validCount = validated.filter(e => e.isValid).length;
        toast.success(`Parsed ${validCount} valid entries from ${validated.length} total`);
      },
      error: (error) => {
        toast.error(`Failed to parse CSV: ${error.message}`);
      },
    });
  };

  const parseGridTimetable = (workbook: XLSX.WorkBook): ParsedTimetableEntry[] => {
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const range = XLSX.utils.decode_range(firstSheet['!ref'] || 'A1');
    
    // Try to find teacher name (usually in the first few rows)
    let teacherName = '';
    for (let row = 0; row < Math.min(5, range.e.r); row++) {
      const cell = firstSheet[XLSX.utils.encode_cell({ r: row, c: 0 })];
      if (cell && cell.v && typeof cell.v === 'string') {
        const cellValue = cell.v.toString().trim();
        // Check if this looks like a name (contains spaces, no numbers at start)
        if (cellValue.includes(' ') && !/^\d/.test(cellValue) && cellValue.length < 50) {
          teacherName = cellValue;
          break;
        }
      }
    }

    const entries: ParsedTimetableEntry[] = [];
    
    // Map day abbreviations to full names
    const dayMap: Record<string, string> = {
      'mo': 'Monday', 'mon': 'Monday', 'monday': 'Monday',
      'tu': 'Tuesday', 'tue': 'Tuesday', 'tuesday': 'Tuesday',
      'we': 'Wednesday', 'wed': 'Wednesday', 'wednesday': 'Wednesday',
      'th': 'Thursday', 'thu': 'Thursday', 'thursday': 'Thursday',
      'fr': 'Friday', 'fri': 'Friday', 'friday': 'Friday',
    };

    // Find day columns
    const dayColumns: Array<{ col: number; day: string }> = [];
    for (let col = 0; col <= range.e.c; col++) {
      for (let row = 0; row < Math.min(10, range.e.r); row++) {
        const cell = firstSheet[XLSX.utils.encode_cell({ r: row, c: col })];
        if (cell && cell.v) {
          const cellValue = cell.v.toString().trim().toLowerCase();
          const matchedDay = dayMap[cellValue];
          if (matchedDay) {
            dayColumns.push({ col, day: matchedDay });
            break;
          }
        }
      }
    }

    // Find session rows (rows with time information)
    const sessionRows: Array<{ row: number; startTime: string; endTime: string }> = [];
    for (let row = 0; row <= range.e.r; row++) {
      for (let col = 0; col <= Math.min(2, range.e.c); col++) {
        const cell = firstSheet[XLSX.utils.encode_cell({ r: row, c: col })];
        if (cell && cell.v) {
          const cellValue = cell.v.toString().trim();
          // Look for time patterns like "8:00 - 9:00" or "8:00-9:00" or in separate cells
          const timeMatch = cellValue.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
          if (timeMatch) {
            sessionRows.push({
              row,
              startTime: timeMatch[1],
              endTime: timeMatch[2],
            });
            break;
          }
        }
      }
    }

    // Parse course information from grid cells
    dayColumns.forEach(({ col, day }) => {
      sessionRows.forEach(({ row, startTime, endTime }) => {
        const cell = firstSheet[XLSX.utils.encode_cell({ r: row, c: col })];
        if (cell && cell.v) {
          const cellValue = cell.v.toString().trim();
          
          // Skip empty cells, breaks, or cells that only contain day names
          if (!cellValue || 
              cellValue.toLowerCase().includes('break') || 
              cellValue.toLowerCase() === day.toLowerCase()) {
            return;
          }

          // Parse multi-line cell content
          const lines = cellValue.split('\n').map(l => l.trim()).filter(l => l);
          
          if (lines.length > 0) {
            // First line is usually the course name
            let course = lines[0];
            let classroom = '';

            // Look for classroom in the last line (usually contains "Classroom" or "Room")
            for (let i = lines.length - 1; i >= 1; i--) {
              if (lines[i].toLowerCase().includes('classroom') || 
                  lines[i].toLowerCase().includes('room')) {
                classroom = lines[i];
                break;
              }
            }

            entries.push({
              teacherName: teacherName,
              course: course,
              classroom: classroom,
              day: day,
              startTime: startTime,
              endTime: endTime,
              isValid: true,
              errors: [],
            });
          }
        }
      });
    });

    return entries;
  };

  const parseExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Try to detect format - check if it's a grid format or simple list
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
        
        // Check if first row has day names (grid format) or column headers (list format)
        const firstRow = jsonData[0] || [];
        const hasGridFormat = firstRow.some((cell: any) => {
          if (!cell) return false;
          const cellStr = cell.toString().toLowerCase().trim();
          return ['mo', 'tu', 'we', 'th', 'fr', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday']
            .some(day => cellStr.includes(day));
        });

        let validated: ParsedTimetableEntry[];
        
        if (hasGridFormat) {
          // Parse as grid timetable (like the uploaded image)
          const parsedEntries = parseGridTimetable(workbook);
          validated = parsedEntries.map(validateEntry);
          toast.success(`Parsed ${validated.length} entries from grid timetable`);
        } else {
          // Parse as simple list format
          const listData = XLSX.utils.sheet_to_json(firstSheet);
          validated = listData.map(validateEntry);
          const validCount = validated.filter(e => e.isValid).length;
          toast.success(`Parsed ${validCount} valid entries from ${validated.length} total`);
        }
        
        setParsedData(validated);
      } catch (error: any) {
        toast.error(`Failed to parse Excel: ${error.message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'csv') {
      parseCSV(file);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      parseExcel(file);
    } else {
      toast.error('Please upload a CSV or Excel file');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadToSystem = async () => {
    const validEntries = parsedData.filter(e => e.isValid);
    
    if (validEntries.length === 0) {
      toast.error('No valid entries to upload');
      return;
    }

    setIsUploading(true);
    try {
      if (onUploadComplete) {
        await onUploadComplete(validEntries);
      }
      toast.success(`Successfully uploaded ${validEntries.length} timetable entries`);
      setParsedData([]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload timetable');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        teacherName: 'John Doe',
        course: 'Programming 101',
        classroom: 'Lab A',
        day: 'Monday',
        startTime: '09:00',
        endTime: '10:30',
      },
      {
        teacherName: 'Jane Smith',
        course: 'Mathematics',
        classroom: 'Room 301',
        day: 'Tuesday',
        startTime: '11:00',
        endTime: '12:30',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Timetable');
    XLSX.writeFile(wb, 'timetable-template.xlsx');
    toast.success('Template downloaded successfully');
  };

  const validCount = parsedData.filter(e => e.isValid).length;
  const invalidCount = parsedData.length - validCount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Upload className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Timetable Upload</CardTitle>
                <CardDescription>
                  Upload timetable from CSV or Excel file. The system will automatically match teachers and validate entries.
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
              <Download className="w-4 h-4" />
              Download Template
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Section */}
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              id="timetable-upload"
            />
            <label htmlFor="timetable-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    CSV or Excel files only
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm">
                  Select File
                </Button>
              </div>
            </label>
          </div>

          {/* File Format Info */}
          <div className="p-4 bg-muted/30 border border-border/50 rounded-lg space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Supported Formats:</h4>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="font-medium">1. Simple List Format (CSV/Excel):</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pl-4">
                  <div>• teacherName (required)</div>
                  <div>• course (required)</div>
                  <div>• day (required)</div>
                  <div>• startTime (required)</div>
                  <div>• endTime (required)</div>
                  <div>• classroom (optional)</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                <div className="font-medium">2. Grid Format (Excel):</div>
                <div className="pl-4">
                  • Teacher name at the top
                  <br />
                  • Days as column headers (Mo, Tu, We, Th, Fr)
                  <br />
                  • Sessions with time slots as rows
                  <br />
                  • Course information in grid cells
                </div>
              </div>
            </div>
          </div>

          {/* Parsed Data Preview */}
          {parsedData.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="font-medium">{validCount} valid</span>
                  </div>
                  {invalidCount > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <XCircle className="w-4 h-4 text-destructive" />
                      <span className="font-medium">{invalidCount} invalid</span>
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleUploadToSystem}
                  disabled={validCount === 0 || isUploading}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {isUploading ? 'Uploading...' : `Upload ${validCount} Entries`}
                </Button>
              </div>

              <div className="border border-border/50 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Status</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Classroom</TableHead>
                      <TableHead>Issues</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((entry, index) => (
                      <TableRow key={index} className={!entry.isValid ? 'bg-destructive/5' : ''}>
                        <TableCell>
                          {entry.isValid ? (
                            <CheckCircle className="w-4 h-4 text-success" />
                          ) : (
                            <XCircle className="w-4 h-4 text-destructive" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{entry.teacherName}</TableCell>
                        <TableCell>{entry.course}</TableCell>
                        <TableCell>{entry.day}</TableCell>
                        <TableCell className="text-sm">
                          {entry.startTime} - {entry.endTime}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {entry.classroom || '-'}
                        </TableCell>
                        <TableCell>
                          {entry.errors.length > 0 ? (
                            <div className="text-xs text-destructive">
                              {entry.errors.join(', ')}
                            </div>
                          ) : (
                            <span className="text-xs text-success">Valid</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
