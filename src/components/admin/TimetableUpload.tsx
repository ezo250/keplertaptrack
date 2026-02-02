import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
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
import { Upload, FileText, CheckCircle, XCircle, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { TimetableEntry } from '@/types';

// Set up PDF.js worker from public directory
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState('');
  const [isDragging, setIsDragging] = useState(false);
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

  const parseOCRText = (text: string): ParsedTimetableEntry[] => {
    const entries: ParsedTimetableEntry[] = [];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    // Map day abbreviations to full names
    const dayMap: Record<string, string> = {
      'mo': 'Monday', 'mon': 'Monday', 'monday': 'Monday',
      'tu': 'Tuesday', 'tue': 'Tuesday', 'tuesday': 'Tuesday',
      'we': 'Wednesday', 'wed': 'Wednesday', 'wednesday': 'Wednesday',
      'th': 'Thursday', 'thu': 'Thursday', 'thursday': 'Thursday',
      'fr': 'Friday', 'fri': 'Friday', 'friday': 'Friday',
    };

    let teacherName = '';
    
    // Try to find teacher name (usually in first few lines, contains full name pattern)
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      // Look for name pattern (First Last) or (Title First Last)
      if (line.match(/^[A-Z][a-z]+\s+[A-Z][a-z]+/) && line.length < 50 && !line.match(/\d/)) {
        teacherName = line;
        break;
      }
    }

    // Look for timetable entries in the text
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Try to match time patterns
      const timeMatch = line.match(/(\d{1,2}:\d{2})\s*[-–to]+\s*(\d{1,2}:\d{2})/);
      
      if (timeMatch) {
        const startTime = timeMatch[1];
        const endTime = timeMatch[2];
        
        // Look for day in current or nearby lines
        let day = '';
        for (let j = Math.max(0, i - 2); j < Math.min(lines.length, i + 3); j++) {
          const nearbyLine = lines[j].toLowerCase();
          for (const [key, value] of Object.entries(dayMap)) {
            if (nearbyLine.includes(key)) {
              day = value;
              break;
            }
          }
          if (day) break;
        }

        // Look for course name (usually before or after time)
        let course = '';
        let classroom = '';
        
        // Check line before time
        if (i > 0 && !lines[i - 1].match(/\d{1,2}:\d{2}/) && lines[i - 1].length > 3) {
          course = lines[i - 1];
        }
        // Check line after time
        else if (i < lines.length - 1 && !lines[i + 1].match(/\d{1,2}:\d{2}/) && lines[i + 1].length > 3) {
          course = lines[i + 1];
        }
        // Check same line (remove time part)
        else {
          const courseMatch = line.replace(/\d{1,2}:\d{2}\s*[-–to]+\s*\d{1,2}:\d{2}/, '').trim();
          if (courseMatch.length > 3) {
            course = courseMatch;
          }
        }

        // Look for classroom info nearby
        for (let j = Math.max(0, i - 2); j < Math.min(lines.length, i + 3); j++) {
          const nearbyLine = lines[j];
          if (nearbyLine.toLowerCase().includes('room') || nearbyLine.toLowerCase().includes('classroom')) {
            classroom = nearbyLine;
            break;
          }
        }

        if (day && course) {
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
    }

    return entries;
  };

  const parsePDF = async (file: File) => {
    setIsProcessing(true);
    setProcessingProgress('Loading PDF...');
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      setProcessingProgress(`Processing ${pdf.numPages} page(s)...`);
      
      const allEntries: ParsedTimetableEntry[] = [];
      
      // Process each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        setProcessingProgress(`Processing page ${pageNum} of ${pdf.numPages}...`);
        
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });
        
        // Create canvas to render PDF page
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        if (context) {
          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          } as any;
          await page.render(renderContext).promise;
          
          // Convert canvas to blob for OCR
          const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => resolve(blob!), 'image/png');
          });
          
          setProcessingProgress(`Running OCR on page ${pageNum}...`);
          
          // Run OCR on the page
          const result = await Tesseract.recognize(blob, 'eng', {
            logger: (m) => {
              if (m.status === 'recognizing text') {
                setProcessingProgress(
                  `OCR progress on page ${pageNum}: ${Math.round(m.progress * 100)}%`
                );
              }
            },
          });
          
          // Parse the extracted text
          const pageEntries = parseOCRText(result.data.text);
          allEntries.push(...pageEntries);
        }
      }
      
      // Validate all entries
      const validated = allEntries.map(validateEntry);
      setParsedData(validated);
      
      const validCount = validated.filter(e => e.isValid).length;
      toast.success(`Extracted ${validCount} valid entries from ${validated.length} total from PDF`);
      
    } catch (error: any) {
      toast.error(`Failed to process PDF: ${error.message}`);
      console.error('PDF processing error:', error);
    } finally {
      setIsProcessing(false);
      setProcessingProgress('');
    }
  };

  const processFile = async (file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'csv') {
      parseCSV(file);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      parseExcel(file);
    } else if (fileExtension === 'pdf') {
      await parsePDF(file);
    } else {
      toast.error('Please upload a CSV, Excel, or PDF file');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await processFile(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
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
                  Upload timetable from CSV, Excel, or PDF file. The system will automatically match teachers and validate entries.
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
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-border'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="timetable-upload"
              disabled={isProcessing}
            />
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                {isProcessing ? (
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                ) : (
                  <FileText className="w-8 h-8 text-primary" />
                )}
              </div>
              <div>
                {isProcessing ? (
                  <>
                    <p className="text-sm font-medium text-foreground">
                      Processing...
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {processingProgress}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground">
                      {isDragging ? 'Drop file here' : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      CSV, Excel, or PDF files
                    </p>
                  </>
                )}
              </div>
              {!isProcessing && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={handleButtonClick}
                >
                  Select File
                </Button>
              )}
            </div>
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
              <div className="mt-2 text-xs text-muted-foreground">
                <div className="font-medium">3. PDF Format (with OCR):</div>
                <div className="pl-4">
                  • Scanned or digital timetables
                  <br />
                  • System will extract text using OCR
                  <br />
                  • Looks for teacher names, days, times, and courses
                  <br />
                  • Processing may take longer for multiple pages
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
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {isUploading ? 'Uploading...' : `Upload ${validCount} Entries`}
                </Button>
              </div>

              <div className="border border-border/50 rounded-lg overflow-hidden">
                <div className="max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
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
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
